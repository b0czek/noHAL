import { createId, safeKey, slugify } from "../id";
import { createEmptyProject } from "../project";
import type {
  ComponentDefinition,
  ComponentPinDefinition,
  HalImportBuildOptions,
  HalImportBuildResult,
  HalImportComponentGroup,
  HalImportLinkSelection,
  HalImportNet,
  HalValueType,
  PinDirection,
} from "../types";

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

export function buildProjectFromHalImport(
  options: HalImportBuildOptions,
): HalImportBuildResult {
  const { draft, componentStore, linkSelections } = options;
  const warnings = [...draft.warnings];
  const fileBase =
    options.projectName?.trim() ||
    (draft.sourceFileName
      ? stripExtension(draft.sourceFileName)
      : "Imported HAL");
  const project = createEmptyProject(fileBase || "Imported HAL");
  project.name = fileBase || "Imported HAL";

  const rootSheet = project.sheets[project.rootSheetId];
  rootSheet.name = "Top";
  rootSheet.nodes = [];
  rootSheet.labels = [];
  rootSheet.labelAnchors = [];
  rootSheet.directConnections = [];
  rootSheet.ports = [];
  delete rootSheet.hal;

  const _groupById = new Map(
    draft.componentGroups.map((group) => [group.id, group]),
  );
  const groupByInstance = new Map<string, HalImportComponentGroup>();
  for (const group of draft.componentGroups) {
    for (const instance of group.instances) {
      groupByInstance.set(instance.instanceName, group);
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

  const mappedStorePinTypes = new Map<string, HalValueType[]>();
  for (const net of draft.nets) {
    const knownTypes: HalValueType[] = [];
    for (const endpoint of net.endpoints) {
      const group = groupByInstance.get(endpoint.instanceName);
      if (!group) continue;
      const sel = selections.get(group.id);
      if (!sel || sel.mode !== "store") continue;
      const comp = storeComponentsById.get(sel.componentId);
      const pin = comp?.pins.find((item) => item.name === endpoint.pinName);
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

  const usedProjectComponentIds = new Set<string>(
    Object.keys(project.library.components),
  );
  const resolvedComponentByGroupId = new Map<string, ComponentDefinition>();
  const resolvedComponentIdByGroupId = new Map<string, string>();

  for (const group of draft.componentGroups) {
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
      const typeHints =
        mappedStorePinTypes.get(`${group.id}::${pin.name}`) ?? [];
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
    const generated: ComponentDefinition = {
      id: localId,
      name: group.inferredHalComponentName,
      halComponentName: group.inferredHalComponentName,
      source: "manual",
      runtime: { kind: group.runtimeHint },
      pins,
      params,
      docs: {
        description:
          "Generated from imported HAL file (project-local component)",
      },
    };
    project.library.components[localId] = generated;
    resolvedComponentByGroupId.set(group.id, generated);
    resolvedComponentIdByGroupId.set(group.id, localId);
  }

  const nodeIdByInstanceName = new Map<string, string>();
  const pinKeyByInstanceAndPinName = new Map<string, string>();
  const pinDirectionByInstanceAndPinName = new Map<string, PinDirection>();
  const nodeRefById = new Map<string, (typeof rootSheet.nodes)[number]>();
  const componentByNodeId = new Map<string, ComponentDefinition>();

  const allInstances = draft.componentGroups
    .flatMap((group) =>
      group.instances.map((instance) => ({ group, instance })),
    )
    .sort((a, b) =>
      a.instance.instanceName.localeCompare(b.instance.instanceName),
    );

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

  const computeEstimatedBodySize = (component: ComponentDefinition) => {
    const leftNames = component.pins
      .filter((pin) => pin.direction === "in")
      .map((pin) => pin.name);
    const rightNames = component.pins
      .filter((pin) => pin.direction === "out")
      .map((pin) => pin.name);
    const bottomNames = component.pins
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
    canUseDirectConnection: boolean;
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
    const componentId = resolvedComponentIdByGroupId.get(group.id);
    const component = resolvedComponentByGroupId.get(group.id);
    if (!componentId || !component) {
      warnings.push(
        `Missing resolved component for instance '${instance.instanceName}'`,
      );
      return;
    }

    const paramNameToDef = new Map(
      component.params.map((param) => [param.name, param]),
    );
    const pinNameToDef = new Map(component.pins.map((pin) => [pin.name, pin]));
    const paramValues: Record<string, string> = {};
    const pinInitialValues: Record<string, string> = {};
    for (const [name, value] of Object.entries(instance.paramValues)) {
      const param = paramNameToDef.get(name);
      if (param) {
        paramValues[param.key] = value;
        continue;
      }
      const pin = pinNameToDef.get(name);
      if (pin) {
        pinInitialValues[pin.key] = value;
        continue;
      }
      warnings.push(
        `Ignoring setp '${instance.instanceName}.${name}' because '${component.halComponentName}' has no matching param or pin '${name}'`,
      );
    }

    const nodeId = createId("node");
    rootSheet.nodes.push({
      id: nodeId,
      kind: "component",
      componentId,
      instanceName: instance.instanceName,
      position: { x: 0, y: 0 },
      paramValues,
      ...(Object.keys(pinInitialValues).length > 0 ? { pinInitialValues } : {}),
    });
    nodeRefById.set(nodeId, rootSheet.nodes[rootSheet.nodes.length - 1]);
    componentByNodeId.set(nodeId, component);
    nodeIdByInstanceName.set(instance.instanceName, nodeId);

    for (const pin of component.pins) {
      const pinRefKey = `${instance.instanceName}::${pin.name}`;
      pinKeyByInstanceAndPinName.set(pinRefKey, pin.key);
      pinDirectionByInstanceAndPinName.set(pinRefKey, pin.direction);
    }
  });

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
      const nodeId = nodeIdByInstanceName.get(endpoint.instanceName);
      if (!nodeId) {
        warnings.push(
          `Line ${net.line}: missing node for endpoint '${endpoint.rawPath}'`,
        );
        continue;
      }
      const pinKey = pinKeyByInstanceAndPinName.get(
        `${endpoint.instanceName}::${endpoint.pinName}`,
      );
      if (!pinKey) {
        warnings.push(
          `Line ${net.line}: component pin '${endpoint.pinName}' not found on '${endpoint.instanceName}'`,
        );
        continue;
      }
      const pinRefKey = `${endpoint.instanceName}::${endpoint.pinName}`;
      if (
        !resolvedEndpoints.some(
          (item) => item.nodeId === nodeId && item.pinKey === pinKey,
        )
      ) {
        resolvedEndpoints.push({
          nodeId,
          pinKey,
          pinRefKey,
          direction: pinDirectionByInstanceAndPinName.get(pinRefKey),
        });
      }
    }
    return resolvedEndpoints;
  };

  const preparedNets: ImportPreparedNet[] = draft.nets.map((net) => {
    const resolvedEndpoints = resolveNetEndpointsForImport(net);
    const singleLineNet = (netNameUsageCount.get(net.name) ?? 0) === 1;
    const canUseDirectConnection =
      singleLineNet &&
      resolvedEndpoints.length === 2 &&
      directionsCompatibleForDirectImport(
        resolvedEndpoints[0]?.direction,
        resolvedEndpoints[1]?.direction,
      );
    return { net, resolvedEndpoints, canUseDirectConnection };
  });

  const labelDemandByNodeId = new Map<string, ImportLabelDemand>();
  const plannedImportedLabels: ImportPlannedLabel[] = [];
  const countedDemandAnchors = new Set<string>();
  for (const prepared of preparedNets) {
    if (prepared.canUseDirectConnection) continue;
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
  const nodeIdsInOrder = rootSheet.nodes
    .filter((node) => node.kind === "component")
    .map((node) => node.id);

  for (const nodeId of nodeIdsInOrder) {
    const component = componentByNodeId.get(nodeId);
    if (!component) continue;
    let leftIdx = 0;
    let rightIdx = 0;
    let bottomIdx = 0;
    for (const pin of component.pins) {
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
      labelPlacementByAnchorKey.set(item.anchorKey, {
        slot,
        pinSideIndex: pinSideIndexByNodePin.get(
          `${item.nodeId}::${item.pinKey}`,
        ),
        peerIndexOnPin: Math.max(0, peerIndex),
        peerCountOnPin: siblings.length,
      });
    });

    if (groupSide === "bottom") {
      // Bottom placement uses slot order; side labels additionally use pin-aligned Y.
    }
  }

  for (const nodeId of nodeIdsInOrder) {
    const component = componentByNodeId.get(nodeId);
    if (!component) continue;
    const demand = labelDemandByNodeId.get(nodeId) ?? {
      left: [],
      right: [],
      bottom: [],
    };
    const { bodyWidth, bodyHeight } = computeEstimatedBodySize(component);
    const leftLabelWidths = demand.left.map(estimateImportedLabelWidth);
    const rightLabelWidths = demand.right.map(estimateImportedLabelWidth);
    const bottomLabelWidths = demand.bottom.map(estimateImportedLabelWidth);

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
    for (const [idx, width] of bottomLabelWidths.entries()) {
      const xStart =
        IMPORT_LAYOUT.bottomLabelStartX +
        (idx % IMPORT_LAYOUT.bottomLabelsPerRow) *
          IMPORT_LAYOUT.bottomLabelStepX;
      bottomExtraRight = Math.max(bottomExtraRight, xStart + width - bodyWidth);
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

    const bottomRows = Math.ceil(
      demand.bottom.length / IMPORT_LAYOUT.bottomLabelsPerRow,
    );
    const bottomLabelBottomY =
      bottomRows > 0
        ? bodyHeight +
          IMPORT_LAYOUT.bottomLabelGapY +
          (bottomRows - 1) * IMPORT_LAYOUT.bottomLabelStepY +
          IMPORT_LAYOUT.bottomLabelHalfHeight
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
      cellWidth,
      cellHeight,
    });
  }

  const computedColumns = Math.max(
    1,
    Math.min(
      IMPORT_LAYOUT.maxColumns,
      Math.ceil(Math.sqrt(Math.max(1, nodeIdsInOrder.length))),
    ),
  );
  const colWidths = Array.from({ length: computedColumns }, () => 0);
  const rowHeights = Array.from(
    { length: Math.ceil(nodeIdsInOrder.length / computedColumns) },
    () => 0,
  );

  nodeIdsInOrder.forEach((nodeId, index) => {
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

  nodeIdsInOrder.forEach((nodeId, index) => {
    const layout = importNodeLayoutById.get(nodeId);
    const node = nodeRefById.get(nodeId);
    if (!layout || !node) return;
    const col = index % computedColumns;
    const row = Math.floor(index / computedColumns);
    node.position = {
      x: IMPORT_LAYOUT.originX + (colStarts[col] ?? 0) + layout.leftLaneWidth,
      y: IMPORT_LAYOUT.originY + (rowStarts[row] ?? 0),
    };
  });

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
        layout.bottomLabelStartX +
        (slot % layout.bottomLabelsPerRow) * layout.bottomLabelStepX,
      y:
        pos.y +
        layout.bodyHeight +
        layout.bottomLabelGapY +
        Math.floor(slot / layout.bottomLabelsPerRow) * layout.bottomLabelStepY,
    };
  };

  preparedNets.forEach(
    ({ net, resolvedEndpoints, canUseDirectConnection }, index) => {
      if (canUseDirectConnection) {
        const a = resolvedEndpoints[0];
        const b = resolvedEndpoints[1];
        if (!a || !b) return;
        const pairKeyA = `${a.nodeId}:${a.pinKey}`;
        const pairKeyB = `${b.nodeId}:${b.pinKey}`;
        const pairKey =
          pairKeyA < pairKeyB
            ? `${pairKeyA}|${pairKeyB}`
            : `${pairKeyB}|${pairKeyA}`;
        if (!directConnectionPairs.has(pairKey)) {
          directConnectionPairs.add(pairKey);
          rootSheet.directConnections.push({
            id: createId("conn"),
            a: { kind: "node-pin", nodeId: a.nodeId, pinKey: a.pinKey },
            b: { kind: "node-pin", nodeId: b.nodeId, pinKey: b.pinKey },
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

  const addfQueue: string[] = [];
  const seenQueueNodes = new Set<string>();
  for (const addf of draft.addfs) {
    const nodeId = nodeIdByInstanceName.get(addf.functionName);
    if (!nodeId) continue;
    if (seenQueueNodes.has(nodeId)) continue;
    seenQueueNodes.add(nodeId);
    addfQueue.push(nodeId);
  }
  if (addfQueue.length > 0) {
    rootSheet.hal = { ...(rootSheet.hal ?? {}), addfQueue };
  }

  return { project, warnings };
}
