import {
  addfQueueEntryKey,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
  normalizeAddfQueueEntries,
} from "../addfQueue";
import { resolveAddfFunctionTarget } from "../componentFunctions";
import { resolveComponentPinsForInstance } from "../componentInstance";
import { createId, safeKey, slugify } from "../id";
import { normalizeLinuxCncVersion } from "../linuxcncVersion";
import {
  createDefaultMotmodConfig,
  createEmptyProject,
  reconcileProject,
} from "../project";
import {
  findSystemSheet,
  getSheetThreadOutputs,
  moveRootSystemComponentsToSystemSheet,
} from "../sheet";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentPinDefinition,
  HalImportBuildOptions,
  HalImportBuildResult,
  HalImportComponentGroup,
  HalImportLinkSelection,
  HalImportNet,
  HalImportPlacementHeuristic,
  HalValueType,
  PinDirection,
  SheetAddfQueueStoredEntry,
} from "../types";
import {
  buildMesaImportPlan,
  resolveMesaImportTarget,
  shouldIgnoreMesaImportSetp,
} from "./mesa";

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function parseValueType(value: string): HalValueType {
  const v = value.trim().toLowerCase();
  if (!v) return "float";
  if (v === "true" || v === "false") return "bit";
  if (/^[+-]?\d+$/.test(v)) {
    const n = Number.parseInt(v, 10);
    if (n >= 0) return "u32";
    return "s32";
  }
  if (
    /^[+-]?\d*\.\d+([eE][+-]?\d+)?$/.test(v) ||
    /^[+-]?\d+[eE][+-]?\d+$/.test(v)
  ) {
    return "float";
  }
  return "float";
}

function mergeDirections(values: Array<PinDirection>): PinDirection {
  const set = new Set(values);
  if (set.size === 0) return "io";
  if (set.size === 1) return values[0] ?? "io";
  if (set.has("io")) return "io";
  return "io";
}

function observedNameCandidates(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const segments = trimmed.split(".").filter(Boolean);
  const out = new Set<string>([trimmed]);
  for (let idx = 1; idx < segments.length; idx += 1) {
    out.add(segments.slice(idx).join("."));
  }
  return [...out];
}

function findMatchingComponentPin(
  component: ComponentDefinition | undefined,
  observedName: string,
  instanceConfigValues?: Record<string, string>,
): ComponentPinDefinition | undefined {
  if (!component) return undefined;
  const resolvedPins = resolveComponentPinsForInstance(
    component,
    instanceConfigValues,
  );
  for (const candidate of observedNameCandidates(observedName)) {
    const pin = resolvedPins.find((item) => item.name === candidate);
    if (pin) return pin;
  }
  return undefined;
}

function findMatchingComponentParam(
  component: ComponentDefinition | undefined,
  observedName: string,
) {
  if (!component) return undefined;
  for (const candidate of observedNameCandidates(observedName)) {
    const param = component.params.find((item) => item.name === candidate);
    if (param) return param;
  }
  return undefined;
}

function uniqueKeyForNames(
  names: string[],
  fallbackPrefix: string,
): Record<string, string> {
  const used = new Set<string>();
  const out: Record<string, string> = {};
  for (const name of names) {
    let key = safeKey(name);
    if (!key) key = fallbackPrefix;
    let candidate = key;
    let idx = 2;
    while (used.has(candidate)) {
      candidate = `${key}_${idx}`;
      idx += 1;
    }
    used.add(candidate);
    out[name] = candidate;
  }
  return out;
}

function chooseLocalComponentId(
  preferredName: string,
  used: Set<string>,
): string {
  let id = `halimport:${slugify(preferredName)}`;
  let idx = 2;
  while (used.has(id)) {
    id = `halimport:${slugify(preferredName)}-${idx}`;
    idx += 1;
  }
  used.add(id);
  return id;
}

function buildObservedFunctionsForImportedGroup(
  group: HalImportComponentGroup,
  draft: HalImportBuildOptions["draft"],
): ComponentFunctionDefinition[] {
  const instanceNames = new Set(
    group.instances.map((item) => item.instanceName),
  );
  const out: ComponentFunctionDefinition[] = [];
  const usedKeys = new Set<string>();

  for (const addf of draft.addfs) {
    if (!addf.instanceName || !instanceNames.has(addf.instanceName)) continue;
    const halSuffix = addf.functionSuffix ?? "";
    if (out.some((item) => item.halSuffix === halSuffix)) continue;

    let baseKey = safeKey(halSuffix || "default");
    if (!baseKey) baseKey = "default";
    let key = baseKey;
    let idx = 2;
    while (usedKeys.has(key)) {
      key = `${baseKey}_${idx}`;
      idx += 1;
    }
    usedKeys.add(key);

    out.push({
      key,
      declaredName: halSuffix || "_",
      halSuffix,
      floatMode: "unknown",
    });
  }

  return out;
}

function buildMappedStorePinTypes(
  draft: HalImportBuildOptions["draft"],
  componentStore: HalImportBuildOptions["componentStore"],
  selections: Map<string, HalImportLinkSelection>,
): Map<string, HalValueType[]> {
  const groupByInstance = new Map<string, HalImportComponentGroup>();
  const instanceByName = new Map<
    string,
    HalImportComponentGroup["instances"][number]
  >();
  for (const group of draft.componentGroups) {
    for (const instance of group.instances) {
      groupByInstance.set(instance.instanceName, group);
      instanceByName.set(instance.instanceName, instance);
    }
  }

  const storeComponentsById = new Map(
    Object.values(componentStore.components).map((entry) => [
      entry.componentId,
      entry.parsed,
    ]),
  );

  const mappedStorePinTypes = new Map<string, HalValueType[]>();
  for (const net of draft.nets) {
    const knownTypes: HalValueType[] = [];
    for (const endpoint of net.endpoints) {
      const group = groupByInstance.get(endpoint.instanceName);
      if (!group) continue;
      const sel = selections.get(group.id);
      if (!sel || sel.mode !== "store") continue;
      const comp = storeComponentsById.get(sel.componentId);
      const pin = findMatchingComponentPin(
        comp,
        endpoint.pinName,
        instanceByName.get(endpoint.instanceName)?.instanceConfigValues,
      );
      if (pin) knownTypes.push(pin.type);
    }
    if (knownTypes.length === 0) continue;
    for (const endpoint of net.endpoints) {
      const group = groupByInstance.get(endpoint.instanceName);
      if (!group) continue;
      const sel = selections.get(group.id);
      if (sel?.mode === "store") continue;
      const key = `${group.id}::${endpoint.pinName}`;
      const list = mappedStorePinTypes.get(key);
      if (list) list.push(...knownTypes);
      else mappedStorePinTypes.set(key, [...knownTypes]);
    }
  }

  return mappedStorePinTypes;
}

function buildGeneratedProjectLocalComponent(
  group: HalImportComponentGroup,
  draft: HalImportBuildOptions["draft"],
  mappedStorePinTypes: Map<string, HalValueType[]>,
  warnings: string[],
  usedProjectComponentIds: Set<string>,
): ComponentDefinition {
  const pinNames = group.pins.map((pin) => pin.name);
  const pinNameSet = new Set(pinNames);
  const pinKeys = uniqueKeyForNames(pinNames, "pin");
  const filteredGroupParams = group.params.filter((param) => {
    if (!pinNameSet.has(param.name)) return true;
    warnings.push(
      `Treating '${group.inferredHalComponentName}.${param.name}' as pin-initial-value target during import (not generating duplicate param)`,
    );
    return false;
  });
  const paramNames = filteredGroupParams.map((param) => param.name);
  const paramKeys = uniqueKeyForNames(paramNames, "param");

  const pins: ComponentPinDefinition[] = group.pins.map((pin) => {
    const typeHints = mappedStorePinTypes.get(`${group.id}::${pin.name}`) ?? [];
    const uniqueTypes = Array.from(new Set(typeHints));
    let type: HalValueType = "bit";
    if (uniqueTypes.length === 1) type = uniqueTypes[0] ?? "bit";
    else if (uniqueTypes.length > 1) {
      warnings.push(
        `Type inference conflict for ${group.inferredHalComponentName}.${pin.name}: ${uniqueTypes.join(", ")} (defaulting to bit)`,
      );
    }
    return {
      key: pinKeys[pin.name] ?? safeKey(pin.name),
      name: pin.name,
      direction: mergeDirections(pin.observedDirections),
      type,
    };
  });

  const params = filteredGroupParams.map((param) => {
    const inferredType =
      param.sampleValues.length > 0
        ? parseValueType(
            param.sampleValues[param.sampleValues.length - 1] ?? "",
          )
        : "float";
    return {
      key: paramKeys[param.name] ?? safeKey(param.name),
      name: param.name,
      direction: "rw" as const,
      type: inferredType,
      ...(param.sampleValues.length > 0
        ? {
            defaultValue:
              param.sampleValues[param.sampleValues.length - 1] ?? "",
          }
        : {}),
    };
  });

  const localId = chooseLocalComponentId(
    group.inferredHalComponentName,
    usedProjectComponentIds,
  );
  const observedFunctions = buildObservedFunctionsForImportedGroup(
    group,
    draft,
  );
  return {
    id: localId,
    name: group.inferredHalComponentName,
    halComponentName: group.inferredHalComponentName,
    source: "manual",
    ...(group.loadCommand?.trim()
      ? { loadCommand: group.loadCommand.trim() }
      : {}),
    runtime: { kind: group.runtimeHint },
    pins,
    params,
    ...(observedFunctions.length > 0 ? { functions: observedFunctions } : {}),
    docs: {
      description: "Generated from imported HAL file (project-local component)",
    },
  };
}

export function buildGeneratedLocalComponentsFromHalImport(
  options: Pick<
    HalImportBuildOptions,
    "draft" | "componentStore" | "linkSelections"
  >,
): Record<string, ComponentDefinition> {
  const selections = new Map<string, HalImportLinkSelection>();
  for (const group of options.draft.componentGroups) {
    const selection = options.linkSelections[group.id];
    selections.set(
      group.id,
      selection ?? { groupId: group.id, mode: "project-local" },
    );
  }

  const warnings: string[] = [];
  const mappedStorePinTypes = buildMappedStorePinTypes(
    options.draft,
    options.componentStore,
    selections,
  );
  const usedProjectComponentIds = new Set<string>();
  const generatedByGroupId: Record<string, ComponentDefinition> = {};

  for (const group of options.draft.componentGroups) {
    if (selections.get(group.id)?.mode === "store") continue;
    generatedByGroupId[group.id] = buildGeneratedProjectLocalComponent(
      group,
      options.draft,
      mappedStorePinTypes,
      warnings,
      usedProjectComponentIds,
    );
  }

  return generatedByGroupId;
}

export function buildProjectFromHalImport(
  options: HalImportBuildOptions,
): HalImportBuildResult {
  const {
    draft,
    componentStore,
    linkSelections,
    placementHeuristic = "alphabetical",
  } = options;
  const warnings = [...draft.warnings];
  const fileBase =
    options.projectName?.trim() ||
    (draft.sourceFileName
      ? stripExtension(draft.sourceFileName)
      : "Imported HAL");
  const project = createEmptyProject(fileBase || "Imported HAL");
  project.name = fileBase || "Imported HAL";
  if (options.linuxcncVersion) {
    project.target.linuxcncVersion = normalizeLinuxCncVersion(
      options.linuxcncVersion,
    );
  }
  if (draft.motmod) {
    project.motmod = {
      ...createDefaultMotmodConfig(),
      ...draft.motmod,
    };
  }
  const mesaImportPlan = options.mesa
    ? buildMesaImportPlan(draft, options.mesa)
    : null;
  if (mesaImportPlan) {
    project.mesa = structuredClone(mesaImportPlan.mesa);
    for (const binding of mesaImportPlan.nodeBindings) {
      project.library.components[binding.componentId] = structuredClone(
        binding.component,
      );
    }
  }

  const rootSheet = project.sheets[project.rootSheetId];
  const systemSheet = findSystemSheet(project);
  rootSheet.name = "Top";
  rootSheet.nodes = [];
  rootSheet.labels = [];
  rootSheet.labelAnchors = [];
  rootSheet.directConnections = [];
  rootSheet.ports = [];
  delete rootSheet.hal;
  if (systemSheet) {
    systemSheet.nodes = [];
    systemSheet.ports = [];
    systemSheet.labels = [];
    systemSheet.labelAnchors = [];
    systemSheet.directConnections = [];
    if (systemSheet.hal?.addfQueue) delete systemSheet.hal.addfQueue;
  }

  const _groupById = new Map(
    draft.componentGroups.map((group) => [group.id, group]),
  );
  const groupByInstance = new Map<string, HalImportComponentGroup>();
  const instanceByName = new Map<
    string,
    HalImportComponentGroup["instances"][number]
  >();
  for (const group of draft.componentGroups) {
    for (const instance of group.instances) {
      groupByInstance.set(instance.instanceName, group);
      instanceByName.set(instance.instanceName, instance);
    }
  }

  const storeComponentsById = new Map(
    Object.values(componentStore.components).map((entry) => [
      entry.componentId,
      entry.parsed,
    ]),
  );

  const selections = new Map<string, HalImportLinkSelection>();
  for (const group of draft.componentGroups) {
    const selection = linkSelections[group.id];
    selections.set(
      group.id,
      selection ?? { groupId: group.id, mode: "project-local" },
    );
  }

  const mappedStorePinTypes = buildMappedStorePinTypes(
    draft,
    componentStore,
    selections,
  );

  const usedProjectComponentIds = new Set<string>(
    Object.keys(project.library.components),
  );
  const generatedProjectLocalComponents =
    buildGeneratedLocalComponentsFromHalImport({
      draft,
      componentStore,
      linkSelections,
    });
  const resolvedComponentByGroupId = new Map<string, ComponentDefinition>();
  const resolvedComponentIdByGroupId = new Map<string, string>();

  for (const group of draft.componentGroups) {
    if (mesaImportPlan?.handledGroupIds.has(group.id)) continue;
    const selection = selections.get(group.id);
    if (selection?.mode === "store") {
      const comp = storeComponentsById.get(selection.componentId);
      if (comp) {
        resolvedComponentByGroupId.set(group.id, comp);
        resolvedComponentIdByGroupId.set(group.id, selection.componentId);
        project.library.components[selection.componentId] = comp;
        continue;
      }
      warnings.push(
        `Selected store component '${selection.componentId}' for '${group.inferredHalComponentName}' was not found; generating project-local component`,
      );
    }

    const generated =
      options.projectLocalComponentOverrides?.[group.id] ??
      generatedProjectLocalComponents[group.id] ??
      buildGeneratedProjectLocalComponent(
        group,
        draft,
        mappedStorePinTypes,
        warnings,
        usedProjectComponentIds,
      );
    usedProjectComponentIds.add(generated.id);
    project.library.components[generated.id] = structuredClone(generated);
    resolvedComponentByGroupId.set(group.id, generated);
    resolvedComponentIdByGroupId.set(group.id, generated.id);
  }

  const nodeIdByInstanceName = new Map<string, string>();
  const pinKeyByInstanceAndPinName = new Map<string, string>();
  const pinDirectionByInstanceAndPinName = new Map<string, PinDirection>();
  const nodeRefById = new Map<string, (typeof rootSheet.nodes)[number]>();
  const componentByNodeId = new Map<string, ComponentDefinition>();
  const nodeInstanceNameById = new Map<string, string>();
  const nodeInstanceConfigById = new Map<
    string,
    Record<string, string> | undefined
  >();
  const resolvedPinsByNodeId = new Map<string, ComponentPinDefinition[]>();

  if (mesaImportPlan) {
    for (const binding of mesaImportPlan.nodeBindings) {
      const nodeId = createId("node");
      rootSheet.nodes.push({
        id: nodeId,
        kind: "component",
        componentId: binding.componentId,
        instanceName: binding.instanceName,
        position: { x: 0, y: 0 },
        paramValues: {},
      });
      const node = rootSheet.nodes[rootSheet.nodes.length - 1];
      nodeRefById.set(nodeId, node);
      nodeIdByInstanceName.set(binding.instanceName, nodeId);
      componentByNodeId.set(nodeId, binding.component);
      nodeInstanceNameById.set(nodeId, binding.instanceName);
      nodeInstanceConfigById.set(nodeId, undefined);
      const resolvedPins = resolveComponentPinsForInstance(binding.component);
      resolvedPinsByNodeId.set(nodeId, resolvedPins);
      for (const pin of resolvedPins) {
        const pinRefKey = `${binding.instanceName}::${pin.name}`;
        pinKeyByInstanceAndPinName.set(pinRefKey, pin.key);
        pinDirectionByInstanceAndPinName.set(pinRefKey, pin.direction);
      }
    }
  }

  const allInstances = draft.componentGroups
    .flatMap((group) =>
      group.instances.map((instance) => ({ group, instance })),
    )
    .sort((a, b) =>
      a.instance.instanceName.localeCompare(b.instance.instanceName),
    );
  const postguiOnlyInstanceNames = new Set(draft.postguiOnlyInstances ?? []);

  const IMPORT_LAYOUT = {
    maxColumns: 4,
    originX: 120,
    originY: 120,
    columnGap: 70,
    rowGap: 70,
    sideLabelGapX: 14,
    sideLabelStartY: 44,
    sideLabelStepY: 28,
    sideLabelHalfHeight: 11,
    bottomLabelStartX: 20,
    bottomLabelStepX: 58,
    bottomLabelsPerRow: 4,
    bottomLabelGapY: 14,
    bottomLabelStepY: 28,
    bottomLabelHalfHeight: 11,
    fallbackLabelOriginX: 90,
    fallbackLabelOriginY: 80,
    fallbackLabelColumnPitch: 280,
    fallbackLabelRowPitch: 70,
  } as const;
  const IMPORT_GROUP_LAYOUT = {
    groupGapX: 150,
    groupGapY: 130,
    groupRowWidthMin: 1100,
    groupRowWidthBias: 1.3,
    maxNetFanoutForGrouping: 6,
  } as const;
  const IMPORT_NODE_BASE_W = 240;
  const IMPORT_NODE_HEADER_H = 28;
  const IMPORT_NODE_SIDE_ROW_H = 24;
  const IMPORT_NODE_BOTTOM_H = 26;
  const IMPORT_NODE_PIN_R = 6;
  const IMPORT_NODE_BOTTOM_PIN_COLUMN_STEP = 30;
  const IMPORT_NODE_BOTTOM_PIN_PILL_W = 22;
  const IMPORT_NODE_BOTTOM_PIN_TEXT_PAD = 10;
  const IMPORT_NODE_BOTTOM_PIN_DOT_GAP = 6;
  const IMPORT_MONO_CHAR_W_AT_12 = 7.2;
  const IMPORT_SANS_CHAR_W_AT_10 = 5.8;
  const IMPORT_SIDE_LABEL_CLEARANCE = 50;
  const IMPORT_SIDE_LABEL_GAP = 16;

  const estimateMonoTextWidth = (text: string, fontSize: number) =>
    Math.ceil(text.length * IMPORT_MONO_CHAR_W_AT_12 * (fontSize / 12));
  const estimateSansTextWidth = (text: string, fontSize: number) =>
    Math.ceil(text.length * IMPORT_SANS_CHAR_W_AT_10 * (fontSize / 10));
  const estimateImportedLabelWidth = (name: string) =>
    16 +
    estimateSansTextWidth("global", 10) +
    8 +
    estimateMonoTextWidth(name, 12) +
    10;

  const computeEstimatedBodySize = (pins: ComponentPinDefinition[]) => {
    const leftNames = pins
      .filter((pin) => pin.direction === "in")
      .map((pin) => pin.name);
    const rightNames = pins
      .filter((pin) => pin.direction === "out")
      .map((pin) => pin.name);
    const bottomNames = pins
      .filter((pin) => pin.direction === "io")
      .map((pin) => pin.name);

    const leftMax = Math.max(
      0,
      ...leftNames.map((name) => estimateMonoTextWidth(name, 12)),
    );
    const rightMax = Math.max(
      0,
      ...rightNames.map((name) => estimateMonoTextWidth(name, 12)),
    );
    const sideWidth =
      leftMax + rightMax + IMPORT_SIDE_LABEL_CLEARANCE + IMPORT_SIDE_LABEL_GAP;

    const rows = Math.max(leftNames.length, rightNames.length, 1);
    const sideHeight = rows * IMPORT_NODE_SIDE_ROW_H;

    let bottomWidth = 0;
    let bottomBandHeight = 0;
    if (bottomNames.length > 0) {
      const verticalWidth = Math.ceil(
        IMPORT_NODE_BOTTOM_PIN_COLUMN_STEP * (bottomNames.length + 1),
      );

      const horizontalPillWidths = bottomNames.map(
        (name) => estimateMonoTextWidth(name, 11) + 16,
      );
      let horizontalWidth = 0;
      if (horizontalPillWidths.length === 1) {
        horizontalWidth = (horizontalPillWidths[0] ?? 0) + 20;
      } else if (horizontalPillWidths.length > 1) {
        const maxPill = Math.max(...horizontalPillWidths);
        let requiredStep = maxPill / 2 + 6;
        for (let i = 0; i < horizontalPillWidths.length - 1; i += 1) {
          requiredStep = Math.max(
            requiredStep,
            ((horizontalPillWidths[i] ?? 0) +
              (horizontalPillWidths[i + 1] ?? 0)) /
              2 +
              8,
          );
        }
        horizontalWidth = Math.ceil(
          requiredStep * (horizontalPillWidths.length + 1),
        );
      }

      const verticalBandHeight =
        Math.max(
          IMPORT_NODE_BOTTOM_PIN_PILL_W,
          Math.max(
            0,
            ...bottomNames.map((name) => estimateMonoTextWidth(name, 11)),
          ) + IMPORT_NODE_BOTTOM_PIN_TEXT_PAD,
        ) +
        IMPORT_NODE_BOTTOM_PIN_DOT_GAP +
        IMPORT_NODE_PIN_R;

      const horizontalBandHeight =
        IMPORT_NODE_BOTTOM_H -
        4 +
        IMPORT_NODE_BOTTOM_PIN_DOT_GAP +
        IMPORT_NODE_PIN_R;

      const verticalCandidate = {
        width: Math.max(IMPORT_NODE_BASE_W, sideWidth, verticalWidth),
        height:
          IMPORT_NODE_HEADER_H + sideHeight + verticalBandHeight + 10 + 12,
        bandHeight: verticalBandHeight,
      };
      const horizontalCandidate = {
        width: Math.max(IMPORT_NODE_BASE_W, sideWidth, horizontalWidth),
        height:
          IMPORT_NODE_HEADER_H + sideHeight + horizontalBandHeight + 10 + 12,
        bandHeight: horizontalBandHeight,
      };
      const best =
        horizontalCandidate.width * horizontalCandidate.height <=
        verticalCandidate.width * verticalCandidate.height
          ? horizontalCandidate
          : verticalCandidate;
      bottomWidth = Math.max(
        0,
        best.width - Math.max(IMPORT_NODE_BASE_W, sideWidth),
      );
      bottomBandHeight = best.bandHeight;
    }

    const bodyWidth = Math.max(
      IMPORT_NODE_BASE_W,
      sideWidth,
      IMPORT_NODE_BASE_W + bottomWidth,
    );
    const bottomHeight = bottomNames.length > 0 ? bottomBandHeight + 10 : 0;
    const bodyHeight = IMPORT_NODE_HEADER_H + sideHeight + bottomHeight + 12;
    return { bodyWidth, bodyHeight };
  };

  type ImportPreparedEndpoint = {
    nodeId: string;
    pinKey: string;
    pinRefKey: string;
    direction: PinDirection | undefined;
  };
  type ImportPreparedNet = {
    net: HalImportNet;
    resolvedEndpoints: ImportPreparedEndpoint[];
    directConnectionEdges: Array<{
      a: ImportPreparedEndpoint;
      b: ImportPreparedEndpoint;
    }>;
  };
  type ImportNodeSide = "left" | "right" | "bottom";
  type ImportLabelDemand = {
    left: string[];
    right: string[];
    bottom: string[];
  };
  type ImportPlannedLabel = {
    anchorKey: string;
    netName: string;
    netLine: number;
    nodeId: string;
    pinKey: string;
    side: ImportNodeSide;
  };
  type ImportLabelPlacementInfo = {
    slot: number;
    pinSideIndex?: number;
    peerIndexOnPin: number;
    peerCountOnPin: number;
    bottomStackOffsetY?: number;
  };
  type ImportNodeLayoutMetrics = {
    bodyWidth: number;
    bodyHeight: number;
    leftLaneWidth: number;
    rightLaneWidth: number;
    sideRightOffsetX: number;
    sideLabelGapX: number;
    sideLabelStartY: number;
    sideLabelStepY: number;
    bottomLabelStartX: number;
    bottomLabelGapY: number;
    bottomLabelStepX: number;
    bottomLabelStepY: number;
    bottomLabelsPerRow: number;
    bottomPinCount: number;
    cellWidth: number;
    cellHeight: number;
  };

  const directionsCompatibleForDirectImport = (
    a: PinDirection | undefined,
    b: PinDirection | undefined,
  ) => {
    if (!a || !b) return false;
    if (a === "in" && b === "in") return false;
    if (a === "out" && b === "out") return false;
    return true;
  };

  allInstances.forEach(({ group, instance }, _index) => {
    const existingNodeId = nodeIdByInstanceName.get(instance.instanceName);
    if (existingNodeId) {
      if (
        instance.instanceConfigValues &&
        Object.keys(instance.instanceConfigValues).length > 0
      ) {
        warnings.push(
          `Ignoring imported instance config for managed Mesa node '${instance.instanceName}'`,
        );
      }
      return;
    }
    const componentId = resolvedComponentIdByGroupId.get(group.id);
    const component = resolvedComponentByGroupId.get(group.id);
    if (!componentId || !component) {
      if (!mesaImportPlan?.handledGroupIds.has(group.id)) {
        warnings.push(
          `Missing resolved component for instance '${instance.instanceName}'`,
        );
      }
      return;
    }

    const nodeId = createId("node");
    rootSheet.nodes.push({
      id: nodeId,
      kind: "component",
      componentId,
      instanceName: instance.instanceName,
      position: { x: 0, y: 0 },
      paramValues: {},
      ...(instance.instanceConfigValues &&
      Object.keys(instance.instanceConfigValues).length > 0
        ? { instanceConfigValues: { ...instance.instanceConfigValues } }
        : {}),
      ...(postguiOnlyInstanceNames.has(instance.instanceName)
        ? { exportStage: "postgui" as const }
        : {}),
    });
    nodeRefById.set(nodeId, rootSheet.nodes[rootSheet.nodes.length - 1]);
    componentByNodeId.set(nodeId, component);
    nodeInstanceNameById.set(nodeId, instance.instanceName);
    nodeIdByInstanceName.set(instance.instanceName, nodeId);
    nodeInstanceConfigById.set(nodeId, instance.instanceConfigValues);

    const resolvedPins = resolveComponentPinsForInstance(
      component,
      instance.instanceConfigValues,
    );
    resolvedPinsByNodeId.set(nodeId, resolvedPins);
    for (const pin of resolvedPins) {
      const pinRefKey = `${instance.instanceName}::${pin.name}`;
      pinKeyByInstanceAndPinName.set(pinRefKey, pin.key);
      pinDirectionByInstanceAndPinName.set(pinRefKey, pin.direction);
    }
  });

  for (const setp of draft.setps) {
    if (
      shouldIgnoreMesaImportSetp(
        mesaImportPlan,
        setp.instanceName,
        setp.fieldName,
      )
    ) {
      continue;
    }
    const mesaTarget = resolveMesaImportTarget(
      mesaImportPlan,
      setp.instanceName,
      setp.fieldName,
    );
    const targetInstanceName = mesaTarget?.instanceName ?? setp.instanceName;
    const targetFieldName = mesaTarget?.fieldName ?? setp.fieldName;
    const nodeId = nodeIdByInstanceName.get(targetInstanceName);
    if (!nodeId) {
      warnings.push(
        `Ignoring setp '${setp.rawPath}' because instance '${targetInstanceName}' was not imported`,
      );
      continue;
    }
    const node = nodeRefById.get(nodeId);
    const component = componentByNodeId.get(nodeId);
    if (!node || node.kind !== "component" || !component) continue;
    const param = findMatchingComponentParam(component, targetFieldName);
    if (param) {
      node.paramValues[param.key] = setp.value;
      continue;
    }
    const pin = findMatchingComponentPin(
      component,
      targetFieldName,
      nodeInstanceConfigById.get(nodeId),
    );
    if (pin) {
      node.pinInitialValues = {
        ...(node.pinInitialValues ?? {}),
        [pin.key]: setp.value,
      };
      continue;
    }
    warnings.push(
      `Ignoring setp '${setp.rawPath}' because '${component.halComponentName}' has no matching param or pin '${targetFieldName}'`,
    );
  }

  const anchoredNetEndpoints = new Set<string>();
  const directConnectionPairs = new Set<string>();
  const netNameUsageCount = new Map<string, number>();
  for (const net of draft.nets) {
    netNameUsageCount.set(net.name, (netNameUsageCount.get(net.name) ?? 0) + 1);
  }

  const resolveNetEndpointsForImport = (
    net: HalImportNet,
  ): ImportPreparedEndpoint[] => {
    if (net.endpoints.length === 0) {
      warnings.push(
        `Line ${net.line}: net '${net.name}' has no parsed endpoints`,
      );
      return [];
    }
    const resolvedEndpoints: ImportPreparedEndpoint[] = [];

    for (const endpoint of net.endpoints) {
      const mesaTarget = resolveMesaImportTarget(
        mesaImportPlan,
        endpoint.instanceName,
        endpoint.pinName,
      );
      const targetInstanceName =
        mesaTarget?.instanceName ?? endpoint.instanceName;
      const targetPinName = mesaTarget?.fieldName ?? endpoint.pinName;
      const nodeId = nodeIdByInstanceName.get(targetInstanceName);
      if (!nodeId) {
        warnings.push(
          `Line ${net.line}: missing node for endpoint '${endpoint.rawPath}'`,
        );
        continue;
      }
      const pinKey = pinKeyByInstanceAndPinName.get(
        `${targetInstanceName}::${targetPinName}`,
      );
      let resolvedPinKey = pinKey;
      let resolvedDirection = pinDirectionByInstanceAndPinName.get(
        `${targetInstanceName}::${targetPinName}`,
      );
      if (!resolvedPinKey) {
        const component = componentByNodeId.get(nodeId);
        const matched = findMatchingComponentPin(
          component,
          targetPinName,
          nodeInstanceConfigById.get(nodeId),
        );
        if (matched) {
          resolvedPinKey = matched.key;
          resolvedDirection = matched.direction;
          pinKeyByInstanceAndPinName.set(
            `${targetInstanceName}::${targetPinName}`,
            matched.key,
          );
          pinDirectionByInstanceAndPinName.set(
            `${targetInstanceName}::${targetPinName}`,
            matched.direction,
          );
        }
      }
      if (!resolvedPinKey) {
        warnings.push(
          `Line ${net.line}: component pin '${targetPinName}' not found on '${targetInstanceName}'`,
        );
        continue;
      }
      const pinRefKey = `${targetInstanceName}::${targetPinName}`;
      if (
        !resolvedEndpoints.some(
          (item) => item.nodeId === nodeId && item.pinKey === resolvedPinKey,
        )
      ) {
        resolvedEndpoints.push({
          nodeId,
          pinKey: resolvedPinKey,
          pinRefKey,
          direction: resolvedDirection,
        });
      }
    }
    return resolvedEndpoints;
  };

  const preparedNets: ImportPreparedNet[] = draft.nets.map((net) => {
    const resolvedEndpoints = resolveNetEndpointsForImport(net);
    return { net, resolvedEndpoints, directConnectionEdges: [] };
  });

  const compareNodeInstanceNames = (a: string, b: string) =>
    (nodeInstanceNameById.get(a) ?? a).localeCompare(
      nodeInstanceNameById.get(b) ?? b,
    );
  const alphabeticalNodeIds = rootSheet.nodes
    .filter((node) => node.kind === "component")
    .map((node) => node.id)
    .sort(compareNodeInstanceNames);

  const buildPlacementNodeGroups = (
    heuristic: HalImportPlacementHeuristic,
  ): string[][] => {
    if (alphabeticalNodeIds.length <= 1 || heuristic === "alphabetical") {
      return [alphabeticalNodeIds];
    }

    const adjacency = new Map<string, Map<string, number>>();
    const weightedDegreeByNodeId = new Map<string, number>();
    for (const nodeId of alphabeticalNodeIds) {
      adjacency.set(nodeId, new Map());
      weightedDegreeByNodeId.set(nodeId, 0);
    }

    const addEdge = (a: string, b: string, weight: number) => {
      if (a === b || weight <= 0) return;
      const aMap = adjacency.get(a);
      const bMap = adjacency.get(b);
      if (!aMap || !bMap) return;
      aMap.set(b, (aMap.get(b) ?? 0) + weight);
      bMap.set(a, (bMap.get(a) ?? 0) + weight);
      weightedDegreeByNodeId.set(
        a,
        (weightedDegreeByNodeId.get(a) ?? 0) + weight,
      );
      weightedDegreeByNodeId.set(
        b,
        (weightedDegreeByNodeId.get(b) ?? 0) + weight,
      );
    };

    for (const prepared of preparedNets) {
      const uniqueNodeIds = Array.from(
        new Set(prepared.resolvedEndpoints.map((endpoint) => endpoint.nodeId)),
      );
      if (uniqueNodeIds.length < 2) continue;
      if (uniqueNodeIds.length > IMPORT_GROUP_LAYOUT.maxNetFanoutForGrouping) {
        continue;
      }
      const edgeWeight = 1 / Math.max(1, uniqueNodeIds.length - 1);
      for (let i = 0; i < uniqueNodeIds.length; i += 1) {
        const a = uniqueNodeIds[i];
        if (!a) continue;
        for (let j = i + 1; j < uniqueNodeIds.length; j += 1) {
          const b = uniqueNodeIds[j];
          if (!b) continue;
          addEdge(a, b, edgeWeight);
        }
      }
    }

    const getEdgeWeight = (a: string, b: string) =>
      adjacency.get(a)?.get(b) ?? 0;

    const connectedComponents: string[][] = [];
    const seen = new Set<string>();
    for (const start of alphabeticalNodeIds) {
      if (seen.has(start)) continue;
      const queue = [start];
      seen.add(start);
      const componentNodeIds: string[] = [];
      while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId) continue;
        componentNodeIds.push(nodeId);
        const neighbors = adjacency.get(nodeId);
        if (!neighbors) continue;
        for (const neighborId of neighbors.keys()) {
          if (seen.has(neighborId)) continue;
          seen.add(neighborId);
          queue.push(neighborId);
        }
      }

      componentNodeIds.sort(compareNodeInstanceNames);
      if (componentNodeIds.length <= 2) {
        connectedComponents.push(componentNodeIds);
        continue;
      }

      const remaining = new Set(componentNodeIds);
      const ordered: string[] = [];
      let lastPlacedId: string | undefined;

      const pickBestCandidate = (candidates: string[]) =>
        [...candidates].sort((a, b) => {
          const sumToPlaced = (candidate: string) => {
            let sum = 0;
            for (const placed of ordered)
              sum += getEdgeWeight(candidate, placed);
            return sum;
          };
          const aSum = sumToPlaced(a);
          const bSum = sumToPlaced(b);
          if (aSum !== bSum) return bSum - aSum;
          const aLast = lastPlacedId ? getEdgeWeight(a, lastPlacedId) : 0;
          const bLast = lastPlacedId ? getEdgeWeight(b, lastPlacedId) : 0;
          if (aLast !== bLast) return bLast - aLast;
          const aDeg = weightedDegreeByNodeId.get(a) ?? 0;
          const bDeg = weightedDegreeByNodeId.get(b) ?? 0;
          if (aDeg !== bDeg) return bDeg - aDeg;
          return compareNodeInstanceNames(a, b);
        })[0];

      const seed = [...remaining].sort((a, b) => {
        const aDeg = weightedDegreeByNodeId.get(a) ?? 0;
        const bDeg = weightedDegreeByNodeId.get(b) ?? 0;
        if (aDeg !== bDeg) return bDeg - aDeg;
        return compareNodeInstanceNames(a, b);
      })[0];
      if (seed) {
        ordered.push(seed);
        remaining.delete(seed);
        lastPlacedId = seed;
      }

      while (remaining.size > 0) {
        const allCandidates = [...remaining];
        const frontierCandidates = allCandidates.filter((candidate) => {
          for (const placed of ordered) {
            if (getEdgeWeight(candidate, placed) > 0) return true;
          }
          return false;
        });
        const next =
          pickBestCandidate(
            frontierCandidates.length > 0 ? frontierCandidates : allCandidates,
          ) ?? allCandidates.sort(compareNodeInstanceNames)[0];
        if (!next) break;
        ordered.push(next);
        remaining.delete(next);
        lastPlacedId = next;
      }

      connectedComponents.push(ordered);
    }

    connectedComponents.sort((a, b) => {
      if (a.length !== b.length) return b.length - a.length;
      const aScore = a.reduce(
        (sum, nodeId) => sum + (weightedDegreeByNodeId.get(nodeId) ?? 0),
        0,
      );
      const bScore = b.reduce(
        (sum, nodeId) => sum + (weightedDegreeByNodeId.get(nodeId) ?? 0),
        0,
      );
      if (aScore !== bScore) return bScore - aScore;
      return compareNodeInstanceNames(a[0] ?? "", b[0] ?? "");
    });

    const isolatedGroups = connectedComponents.filter(
      (group) => group.length <= 1,
    );
    const connectedGroups = connectedComponents.filter(
      (group) => group.length > 1,
    );
    if (isolatedGroups.length > 1) {
      connectedGroups.push(
        isolatedGroups.flat().sort(compareNodeInstanceNames),
      );
    } else if (isolatedGroups.length === 1) {
      connectedGroups.push(isolatedGroups[0] ?? []);
    }
    return connectedGroups.filter((group) => group.length > 0);
  };

  const placementNodeGroups = buildPlacementNodeGroups(placementHeuristic);
  const placementClusterIndexByNodeId = new Map<string, number>();
  placementNodeGroups.forEach((groupNodeIds, groupIndex) => {
    for (const nodeId of groupNodeIds) {
      placementClusterIndexByNodeId.set(nodeId, groupIndex);
    }
  });

  const planDirectConnectionEdgesForNet = (
    prepared: ImportPreparedNet,
  ): Array<{ a: ImportPreparedEndpoint; b: ImportPreparedEndpoint }> => {
    const endpoints = prepared.resolvedEndpoints;
    if (endpoints.length < 2) return [];

    const singleLineNet = (netNameUsageCount.get(prepared.net.name) ?? 0) === 1;
    if (endpoints.length === 2) {
      const [a, b] = endpoints;
      if (
        singleLineNet &&
        directionsCompatibleForDirectImport(a?.direction, b?.direction)
      ) {
        return a && b ? [{ a, b }] : [];
      }
    }

    if (placementHeuristic !== "related-groups") return [];

    const uniqueNodeIds = Array.from(
      new Set(endpoints.map((item) => item.nodeId)),
    );
    if (uniqueNodeIds.length < 2) return [];
    const clusterId = placementClusterIndexByNodeId.get(uniqueNodeIds[0] ?? "");
    if (clusterId === undefined) return [];
    if (
      uniqueNodeIds.some(
        (nodeId) => placementClusterIndexByNodeId.get(nodeId) !== clusterId,
      )
    ) {
      return [];
    }

    const outEndpoints = endpoints.filter((item) => item.direction === "out");
    const ioEndpoints = endpoints.filter((item) => item.direction === "io");
    const inEndpoints = endpoints.filter((item) => item.direction === "in");

    if (ioEndpoints.length === 0 && outEndpoints.length === 0) {
      return [];
    }
    if (ioEndpoints.length === 0 && outEndpoints.length > 1) {
      return [];
    }

    const root =
      (outEndpoints.length === 1 ? outEndpoints[0] : undefined) ??
      ioEndpoints[0] ??
      outEndpoints[0];
    if (!root) return [];

    const edges: Array<{
      a: ImportPreparedEndpoint;
      b: ImportPreparedEndpoint;
    }> = [];
    for (const endpoint of [...ioEndpoints, ...outEndpoints, ...inEndpoints]) {
      if (endpoint === root) continue;
      if (
        !directionsCompatibleForDirectImport(root.direction, endpoint.direction)
      ) {
        return [];
      }
      edges.push({ a: root, b: endpoint });
    }
    return edges;
  };

  for (const prepared of preparedNets) {
    prepared.directConnectionEdges = planDirectConnectionEdgesForNet(prepared);
  }

  const labelDemandByNodeId = new Map<string, ImportLabelDemand>();
  const plannedImportedLabels: ImportPlannedLabel[] = [];
  const countedDemandAnchors = new Set<string>();
  for (const prepared of preparedNets) {
    if (prepared.directConnectionEdges.length > 0) continue;
    for (const item of prepared.resolvedEndpoints) {
      const dedupeKey = `${prepared.net.name}::${item.nodeId}::${item.pinKey}`;
      if (countedDemandAnchors.has(dedupeKey)) continue;
      countedDemandAnchors.add(dedupeKey);
      const side =
        item.direction === "out"
          ? "right"
          : item.direction === "in"
            ? "left"
            : "bottom";
      plannedImportedLabels.push({
        anchorKey: dedupeKey,
        netName: prepared.net.name,
        netLine: prepared.net.line,
        nodeId: item.nodeId,
        pinKey: item.pinKey,
        side,
      });
      let demand = labelDemandByNodeId.get(item.nodeId);
      if (!demand) {
        demand = { left: [], right: [], bottom: [] };
        labelDemandByNodeId.set(item.nodeId, demand);
      }
      demand[side].push(prepared.net.name);
    }
  }

  const importNodeLayoutById = new Map<string, ImportNodeLayoutMetrics>();
  const pinSideIndexByNodePin = new Map<string, number>();
  const nodeIdsInOrder = alphabeticalNodeIds;

  for (const nodeId of nodeIdsInOrder) {
    const pins = resolvedPinsByNodeId.get(nodeId);
    if (!pins) continue;
    let leftIdx = 0;
    let rightIdx = 0;
    let bottomIdx = 0;
    for (const pin of pins) {
      const key = `${nodeId}::${pin.key}`;
      if (pin.direction === "in") {
        pinSideIndexByNodePin.set(key, leftIdx);
        leftIdx += 1;
      } else if (pin.direction === "out") {
        pinSideIndexByNodePin.set(key, rightIdx);
        rightIdx += 1;
      } else {
        pinSideIndexByNodePin.set(key, bottomIdx);
        bottomIdx += 1;
      }
    }
  }

  const labelPlacementByAnchorKey = new Map<string, ImportLabelPlacementInfo>();
  const plannedLabelsByNodeSide = new Map<string, ImportPlannedLabel[]>();
  for (const planned of plannedImportedLabels) {
    const groupKey = `${planned.nodeId}:${planned.side}`;
    const list = plannedLabelsByNodeSide.get(groupKey);
    if (list) list.push(planned);
    else plannedLabelsByNodeSide.set(groupKey, [planned]);
  }

  for (const [groupKey, list] of plannedLabelsByNodeSide.entries()) {
    list.sort((a, b) => {
      const aPinIdx =
        pinSideIndexByNodePin.get(`${a.nodeId}::${a.pinKey}`) ?? 9999;
      const bPinIdx =
        pinSideIndexByNodePin.get(`${b.nodeId}::${b.pinKey}`) ?? 9999;
      if (aPinIdx !== bPinIdx) return aPinIdx - bPinIdx;
      const pinCmp = a.pinKey.localeCompare(b.pinKey);
      if (pinCmp !== 0) return pinCmp;
      const netCmp = a.netName.localeCompare(b.netName);
      if (netCmp !== 0) return netCmp;
      return a.netLine - b.netLine;
    });

    const groupSide = groupKey.slice(
      groupKey.lastIndexOf(":") + 1,
    ) as ImportNodeSide;
    const byPin = new Map<string, ImportPlannedLabel[]>();
    for (const item of list) {
      const k = item.pinKey;
      const pinList = byPin.get(k);
      if (pinList) pinList.push(item);
      else byPin.set(k, [item]);
    }

    list.forEach((item, slot) => {
      const siblings = byPin.get(item.pinKey) ?? [item];
      const peerIndex = siblings.findIndex(
        (s) => s.anchorKey === item.anchorKey,
      );
      let bottomStackOffsetY: number | undefined;
      if (item.side === "bottom") {
        bottomStackOffsetY = 0;
        for (let i = 0; i < peerIndex; i += 1) {
          const prev = siblings[i];
          if (!prev) continue;
          bottomStackOffsetY += estimateImportedLabelWidth(prev.netName);
          bottomStackOffsetY += IMPORT_LAYOUT.bottomLabelGapY;
        }
      }
      labelPlacementByAnchorKey.set(item.anchorKey, {
        slot,
        pinSideIndex: pinSideIndexByNodePin.get(
          `${item.nodeId}::${item.pinKey}`,
        ),
        peerIndexOnPin: Math.max(0, peerIndex),
        peerCountOnPin: siblings.length,
        ...(bottomStackOffsetY !== undefined ? { bottomStackOffsetY } : {}),
      });
    });

    if (groupSide === "bottom") {
      // Bottom placement uses slot order; side labels additionally use pin-aligned Y.
    }
  }

  for (const nodeId of nodeIdsInOrder) {
    const pins = resolvedPinsByNodeId.get(nodeId);
    if (!pins) continue;
    const demand = labelDemandByNodeId.get(nodeId) ?? {
      left: [],
      right: [],
      bottom: [],
    };
    const { bodyWidth, bodyHeight } = computeEstimatedBodySize(pins);
    const leftLabelWidths = demand.left.map(estimateImportedLabelWidth);
    const rightLabelWidths = demand.right.map(estimateImportedLabelWidth);
    const bottomPlannedLabels =
      plannedLabelsByNodeSide.get(`${nodeId}:bottom`) ?? [];
    const bottomPinCount = pins.filter((pin) => pin.direction === "io").length;

    const leftLaneWidth =
      leftLabelWidths.length > 0
        ? Math.max(...leftLabelWidths) + IMPORT_LAYOUT.sideLabelGapX
        : 0;
    const sideRightOffsetX = bodyWidth + IMPORT_LAYOUT.sideLabelGapX;
    const rightLaneWidth =
      rightLabelWidths.length > 0
        ? Math.max(...rightLabelWidths) + IMPORT_LAYOUT.sideLabelGapX
        : 0;

    let bottomExtraRight = 0;
    for (const item of bottomPlannedLabels) {
      const placement = labelPlacementByAnchorKey.get(item.anchorKey);
      const pinIndex = placement?.pinSideIndex;
      const xStart =
        pinIndex !== undefined && bottomPinCount > 0
          ? (bodyWidth / (bottomPinCount + 1)) * (pinIndex + 1)
          : IMPORT_LAYOUT.bottomLabelStartX +
            ((placement?.slot ?? 0) % IMPORT_LAYOUT.bottomLabelsPerRow) *
              IMPORT_LAYOUT.bottomLabelStepX;
      bottomExtraRight = Math.max(
        bottomExtraRight,
        xStart + IMPORT_LAYOUT.bottomLabelHalfHeight - bodyWidth,
      );
    }

    const leftStackHeight =
      demand.left.length > 0
        ? IMPORT_LAYOUT.sideLabelStartY +
          (demand.left.length - 1) * IMPORT_LAYOUT.sideLabelStepY +
          IMPORT_LAYOUT.sideLabelHalfHeight
        : 0;
    const rightStackHeight =
      demand.right.length > 0
        ? IMPORT_LAYOUT.sideLabelStartY +
          (demand.right.length - 1) * IMPORT_LAYOUT.sideLabelStepY +
          IMPORT_LAYOUT.sideLabelHalfHeight
        : 0;
    const sideStackHeight = Math.max(leftStackHeight, rightStackHeight);

    let bottomStackMaxHeight = 0;
    for (const item of bottomPlannedLabels) {
      const placement = labelPlacementByAnchorKey.get(item.anchorKey);
      const stackOffsetY = placement?.bottomStackOffsetY ?? 0;
      bottomStackMaxHeight = Math.max(
        bottomStackMaxHeight,
        stackOffsetY + estimateImportedLabelWidth(item.netName),
      );
    }
    const bottomLabelBottomY =
      bottomStackMaxHeight > 0
        ? bodyHeight + IMPORT_LAYOUT.bottomLabelGapY + bottomStackMaxHeight
        : 0;

    const rightExtent = Math.max(rightLaneWidth, bottomExtraRight, 0);
    const cellWidth = leftLaneWidth + bodyWidth + rightExtent;
    const cellHeight = Math.max(
      bodyHeight,
      sideStackHeight,
      bottomLabelBottomY,
    );

    importNodeLayoutById.set(nodeId, {
      bodyWidth,
      bodyHeight,
      leftLaneWidth,
      rightLaneWidth: rightExtent,
      sideRightOffsetX,
      sideLabelGapX: IMPORT_LAYOUT.sideLabelGapX,
      sideLabelStartY: IMPORT_LAYOUT.sideLabelStartY,
      sideLabelStepY: IMPORT_LAYOUT.sideLabelStepY,
      bottomLabelStartX: IMPORT_LAYOUT.bottomLabelStartX,
      bottomLabelGapY: IMPORT_LAYOUT.bottomLabelGapY,
      bottomLabelStepX: IMPORT_LAYOUT.bottomLabelStepX,
      bottomLabelStepY: IMPORT_LAYOUT.bottomLabelStepY,
      bottomLabelsPerRow: IMPORT_LAYOUT.bottomLabelsPerRow,
      bottomPinCount,
      cellWidth,
      cellHeight,
    });
  }

  const planNodeGrid = (orderedNodeIds: string[]) => {
    const computedColumns = Math.max(
      1,
      Math.min(
        IMPORT_LAYOUT.maxColumns,
        Math.ceil(Math.sqrt(Math.max(1, orderedNodeIds.length))),
      ),
    );
    const colWidths = Array.from({ length: computedColumns }, () => 0);
    const rowHeights = Array.from(
      { length: Math.ceil(orderedNodeIds.length / computedColumns) },
      () => 0,
    );

    orderedNodeIds.forEach((nodeId, index) => {
      const layout = importNodeLayoutById.get(nodeId);
      if (!layout) return;
      const col = index % computedColumns;
      const row = Math.floor(index / computedColumns);
      colWidths[col] = Math.max(colWidths[col] ?? 0, layout.cellWidth);
      rowHeights[row] = Math.max(rowHeights[row] ?? 0, layout.cellHeight);
    });

    const colStarts: number[] = [];
    let runningX = 0;
    for (const width of colWidths) {
      colStarts.push(runningX);
      runningX += width + IMPORT_LAYOUT.columnGap;
    }
    const rowStarts: number[] = [];
    let runningY = 0;
    for (const height of rowHeights) {
      rowStarts.push(runningY);
      runningY += height + IMPORT_LAYOUT.rowGap;
    }

    const localPosByNodeId = new Map<string, { x: number; y: number }>();
    orderedNodeIds.forEach((nodeId, index) => {
      const layout = importNodeLayoutById.get(nodeId);
      if (!layout) return;
      const col = index % computedColumns;
      const row = Math.floor(index / computedColumns);
      localPosByNodeId.set(nodeId, {
        x: (colStarts[col] ?? 0) + layout.leftLaneWidth,
        y: rowStarts[row] ?? 0,
      });
    });

    const width =
      colWidths.reduce((sum, value) => sum + value, 0) +
      Math.max(0, colWidths.length - 1) * IMPORT_LAYOUT.columnGap;
    const height =
      rowHeights.reduce((sum, value) => sum + value, 0) +
      Math.max(0, rowHeights.length - 1) * IMPORT_LAYOUT.rowGap;

    return {
      localPosByNodeId,
      width,
      height,
    };
  };

  if (placementHeuristic === "related-groups") {
    const groupPlans = placementNodeGroups.map((groupNodeIds) => ({
      nodeIds: groupNodeIds,
      ...planNodeGrid(groupNodeIds),
    }));
    const totalArea = groupPlans.reduce(
      (sum, group) =>
        sum + Math.max(1, group.width) * Math.max(1, group.height),
      0,
    );
    const targetRowWidth = Math.max(
      IMPORT_GROUP_LAYOUT.groupRowWidthMin,
      Math.ceil(
        Math.sqrt(Math.max(1, totalArea)) *
          IMPORT_GROUP_LAYOUT.groupRowWidthBias,
      ),
    );

    let cursorX = 0;
    let cursorY = 0;
    let rowHeight = 0;
    for (const group of groupPlans) {
      if (
        cursorX > 0 &&
        cursorX + group.width > targetRowWidth &&
        rowHeight > 0
      ) {
        cursorX = 0;
        cursorY += rowHeight + IMPORT_GROUP_LAYOUT.groupGapY;
        rowHeight = 0;
      }

      for (const nodeId of group.nodeIds) {
        const node = nodeRefById.get(nodeId);
        const localPos = group.localPosByNodeId.get(nodeId);
        if (!node || !localPos) continue;
        node.position = {
          x: IMPORT_LAYOUT.originX + cursorX + localPos.x,
          y: IMPORT_LAYOUT.originY + cursorY + localPos.y,
        };
      }

      cursorX += group.width + IMPORT_GROUP_LAYOUT.groupGapX;
      rowHeight = Math.max(rowHeight, group.height);
    }
  } else {
    const gridPlan = planNodeGrid(nodeIdsInOrder);
    nodeIdsInOrder.forEach((nodeId) => {
      const node = nodeRefById.get(nodeId);
      const localPos = gridPlan.localPosByNodeId.get(nodeId);
      if (!node || !localPos) return;
      node.position = {
        x: IMPORT_LAYOUT.originX + localPos.x,
        y: IMPORT_LAYOUT.originY + localPos.y,
      };
    });
  }

  const nodePosById = new Map(
    rootSheet.nodes
      .filter((node) => node.kind === "component")
      .map((node) => [node.id, node.position]),
  );

  const nextImportedLabelPosition = (
    nodeId: string,
    direction: PinDirection | undefined,
    labelName: string,
    pinKey: string,
    netIndex: number,
    endpointIndex: number,
  ) => {
    const pos = nodePosById.get(nodeId);
    const layout = importNodeLayoutById.get(nodeId);
    if (!pos || !layout) {
      return {
        x:
          IMPORT_LAYOUT.fallbackLabelOriginX +
          (netIndex % 6) * IMPORT_LAYOUT.fallbackLabelColumnPitch,
        y:
          IMPORT_LAYOUT.fallbackLabelOriginY +
          Math.floor(netIndex / 6) * IMPORT_LAYOUT.fallbackLabelRowPitch +
          endpointIndex * 4,
      };
    }
    const side =
      direction === "out" ? "right" : direction === "in" ? "left" : "bottom";
    const anchorKey = `${labelName}::${nodeId}::${pinKey}`;
    const placement = labelPlacementByAnchorKey.get(anchorKey);
    const slot = placement?.slot ?? endpointIndex;
    if (side === "left") {
      const pinCenterY =
        placement?.pinSideIndex !== undefined
          ? pos.y +
            IMPORT_NODE_HEADER_H +
            placement.pinSideIndex * IMPORT_NODE_SIDE_ROW_H +
            IMPORT_NODE_SIDE_ROW_H / 2
          : pos.y + layout.sideLabelStartY + slot * layout.sideLabelStepY;
      const dupOffset =
        placement && placement.peerCountOnPin > 1
          ? (placement.peerIndexOnPin - (placement.peerCountOnPin - 1) / 2) * 12
          : 0;
      return {
        x: pos.x - layout.sideLabelGapX - estimateImportedLabelWidth(labelName),
        y: pinCenterY + dupOffset,
      };
    }
    if (side === "right") {
      const pinCenterY =
        placement?.pinSideIndex !== undefined
          ? pos.y +
            IMPORT_NODE_HEADER_H +
            placement.pinSideIndex * IMPORT_NODE_SIDE_ROW_H +
            IMPORT_NODE_SIDE_ROW_H / 2
          : pos.y + layout.sideLabelStartY + slot * layout.sideLabelStepY;
      const dupOffset =
        placement && placement.peerCountOnPin > 1
          ? (placement.peerIndexOnPin - (placement.peerCountOnPin - 1) / 2) * 12
          : 0;
      return {
        x: pos.x + layout.sideRightOffsetX,
        y: pinCenterY + dupOffset,
      };
    }
    return {
      x:
        pos.x +
        (placement?.pinSideIndex !== undefined && layout.bottomPinCount > 0
          ? (layout.bodyWidth / (layout.bottomPinCount + 1)) *
            (placement.pinSideIndex + 1)
          : layout.bottomLabelStartX +
            (slot % layout.bottomLabelsPerRow) * layout.bottomLabelStepX),
      y:
        pos.y +
        layout.bodyHeight +
        layout.bottomLabelGapY +
        (placement?.bottomStackOffsetY ??
          Math.floor(slot / layout.bottomLabelsPerRow) *
            layout.bottomLabelStepY),
    };
  };

  preparedNets.forEach(
    ({ net, resolvedEndpoints, directConnectionEdges }, index) => {
      if (directConnectionEdges.length > 0) {
        for (const edge of directConnectionEdges) {
          const pairKeyA = `${edge.a.nodeId}:${edge.a.pinKey}`;
          const pairKeyB = `${edge.b.nodeId}:${edge.b.pinKey}`;
          const pairKey =
            pairKeyA < pairKeyB
              ? `${pairKeyA}|${pairKeyB}`
              : `${pairKeyB}|${pairKeyA}`;
          if (directConnectionPairs.has(pairKey)) continue;
          directConnectionPairs.add(pairKey);
          rootSheet.directConnections.push({
            id: createId("conn"),
            a: {
              kind: "node-pin",
              nodeId: edge.a.nodeId,
              pinKey: edge.a.pinKey,
            },
            b: {
              kind: "node-pin",
              nodeId: edge.b.nodeId,
              pinKey: edge.b.pinKey,
            },
            signalName: net.name,
          });
        }
        return;
      }

      for (const [endpointIndex, item] of resolvedEndpoints.entries()) {
        const dedupeKey = `${net.name}::${item.nodeId}::${item.pinKey}`;
        if (anchoredNetEndpoints.has(dedupeKey)) continue;
        anchoredNetEndpoints.add(dedupeKey);
        const labelId = createId("label");
        rootSheet.labels.push({
          id: labelId,
          name: net.name,
          scope: "global",
          rotation: item.direction === "io" ? 90 : 0,
          position: nextImportedLabelPosition(
            item.nodeId,
            item.direction,
            net.name,
            item.pinKey,
            index,
            endpointIndex,
          ),
        });
        rootSheet.labelAnchors.push({
          id: createId("anchor"),
          labelId,
          endpoint: {
            kind: "node-pin",
            nodeId: item.nodeId,
            pinKey: item.pinKey,
          },
        });
      }
    },
  );

  const addfQueue: SheetAddfQueueStoredEntry[] = [];
  const seenQueueItems = new Set<string>();
  const warnedCollapsedAddfInstances = new Set<string>();
  const hasImportedThreadNames = draft.addfs.some((addf) =>
    Boolean(addf.thread?.trim()),
  );
  const sheetThreadOutputs = hasImportedThreadNames
    ? []
    : getSheetThreadOutputs(rootSheet);
  if (!rootSheet.hal) rootSheet.hal = {};
  rootSheet.hal.threadOutputs = [...sheetThreadOutputs];
  const halThreads = project.halThreads ?? [];
  project.halThreads = halThreads;
  const halThreadIdByName = new Map(
    halThreads.map((thread) => [thread.name, thread.id]),
  );
  const ensureHalThreadId = (threadName: string): string => {
    const trimmed = threadName.trim();
    const existing = halThreadIdByName.get(trimmed);
    if (existing) return existing;
    const nextId = createId("thread");
    halThreads.push({
      id: nextId,
      name: trimmed,
      periodNs: 1_000_000,
      floatMode: "fp",
    });
    halThreadIdByName.set(trimmed, nextId);
    return nextId;
  };
  const rootThreadOutputIdByName = new Map(
    rootSheet.hal.threadOutputs.map((item) => [item.name, item.id]),
  );
  for (const output of rootSheet.hal.threadOutputs) {
    const halThreadId = halThreadIdByName.get(output.name);
    if (halThreadId) output.halThreadId = halThreadId;
  }
  for (const addf of draft.addfs) {
    const threadName = addf.thread?.trim();
    if (!threadName || rootThreadOutputIdByName.has(threadName)) continue;
    const halThreadId = ensureHalThreadId(threadName);
    const outputId = createId("sheetthread");
    rootThreadOutputIdByName.set(threadName, outputId);
    rootSheet.hal.threadOutputs.push({
      id: outputId,
      name: threadName,
      halThreadId,
    });
  }
  for (const addf of draft.addfs) {
    const threadName = addf.thread?.trim();
    if (!threadName) continue;
    const outputId = rootThreadOutputIdByName.get(threadName);
    const halThreadId = ensureHalThreadId(threadName);
    const output = rootSheet.hal.threadOutputs.find(
      (item) => item.id === outputId,
    );
    if (output && output.halThreadId !== halThreadId)
      output.halThreadId = halThreadId;
  }
  const defaultRootThreadOutputId = rootSheet.hal.threadOutputs[0]?.id;
  const resolveGlobalFunctionTarget = (
    functionName: string,
  ): { nodeId: string; functionKey: string } | null => {
    const target = functionName.trim();
    if (!target) return null;
    const matches: Array<{ nodeId: string; functionKey: string }> = [];
    for (const [nodeId, component] of componentByNodeId.entries()) {
      const instanceName = nodeInstanceNameById.get(nodeId);
      if (!instanceName) continue;
      for (const fn of component.functions ?? []) {
        if (resolveAddfFunctionTarget(instanceName, fn) !== target) continue;
        matches.push({ nodeId, functionKey: fn.key });
      }
    }
    if (matches.length === 1) return matches[0] ?? null;
    if (matches.length > 1) {
      warnings.push(
        `Imported addf target '${functionName}' matches multiple component functions; skipping explicit queue mapping`,
      );
    }
    return null;
  };
  for (const addf of draft.addfs) {
    const threadOutputId =
      (addf.thread?.trim() &&
        rootThreadOutputIdByName.get(addf.thread.trim())) ||
      defaultRootThreadOutputId;
    let queueEntry: SheetAddfQueueStoredEntry | null = null;
    if (!addf.instanceName && addf.functionName.trim()) {
      const match = resolveGlobalFunctionTarget(addf.functionName);
      if (match) {
        queueEntry = makeAddfQueueFunctionEntry(
          match.nodeId,
          match.functionKey,
          threadOutputId,
        );
      }
    }
    if (!queueEntry) {
      const addfInstanceName = addf.instanceName ?? addf.functionName;
      const nodeId = nodeIdByInstanceName.get(addfInstanceName);
      if (!nodeId) continue;
      const component = componentByNodeId.get(nodeId);

      queueEntry = makeAddfQueueNodeEntry(nodeId, threadOutputId);
      if (addf.functionSuffix !== undefined) {
        const fn = component?.functions?.find(
          (item) => item.halSuffix === addf.functionSuffix,
        );
        if (fn) {
          queueEntry = makeAddfQueueFunctionEntry(
            nodeId,
            fn.key,
            threadOutputId,
          );
        } else if (!warnedCollapsedAddfInstances.has(addfInstanceName)) {
          warnedCollapsedAddfInstances.add(addfInstanceName);
          warnings.push(
            `Imported addf target '${addf.functionName}' could not be matched to component function metadata on '${addfInstanceName}'; queue entry kept at instance level`,
          );
        }
      } else if (
        addf.isDefaultFunction === false &&
        !warnedCollapsedAddfInstances.has(addfInstanceName)
      ) {
        warnedCollapsedAddfInstances.add(addfInstanceName);
        warnings.push(
          `Imported addf target '${addf.functionName}' uses a non-default function but no function suffix metadata was parsed; queue entry kept at instance level`,
        );
      }
    }
    if (!queueEntry) continue;

    const key = addfQueueEntryKey(queueEntry) ?? addf.functionName;
    if (seenQueueItems.has(key)) continue;
    seenQueueItems.add(key);
    addfQueue.push(queueEntry);
  }
  if (addfQueue.length > 0) {
    rootSheet.hal = {
      ...(rootSheet.hal ?? {}),
      addfQueue: normalizeAddfQueueEntries(addfQueue),
    };
  }

  moveRootSystemComponentsToSystemSheet(project);
  reconcileProject(project);
  return { project, warnings };
}
