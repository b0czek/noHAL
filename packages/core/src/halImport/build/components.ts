import { safeKey, slugify } from "../../id";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentPinDefinition,
  HalImportBuildOptions,
  HalImportComponentGroup,
  HalImportLinkSelection,
  HalImportNet,
  HalValueType,
  PinDirection,
} from "../../types";
import { createGroupInstanceIndex, findMatchingComponentPin } from "./matching";

export type HalImportSelectionMap = Map<string, HalImportLinkSelection>;

function parseValueType(value: string): HalValueType {
  const v = value.trim().toLowerCase();
  if (!v) return "float";
  if (v === "true" || v === "false") return "bit";
  if (/^[+-]?\d+$/.test(v)) {
    const n = Number.parseInt(v, 10);
    return n >= 0 ? "u32" : "s32";
  }
  if (
    /^[+-]?\d*\.\d+([eE][+-]?\d+)?$/.test(v) ||
    /^[+-]?\d+[eE][+-]?\d+$/.test(v)
  ) {
    return "float";
  }
  return "float";
}

function mergeDirections(values: PinDirection[]): PinDirection {
  const set = new Set(values);
  if (set.size === 0) return "io";
  if (set.size === 1) return values[0] ?? "io";
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
    let index = 2;
    while (used.has(candidate)) {
      candidate = `${key}_${index}`;
      index += 1;
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
  let index = 2;
  while (used.has(id)) {
    id = `halimport:${slugify(preferredName)}-${index}`;
    index += 1;
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
    let index = 2;
    while (usedKeys.has(key)) {
      key = `${baseKey}_${index}`;
      index += 1;
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

function createStoreComponentMap(
  componentStore: HalImportBuildOptions["componentStore"],
): Map<string, ComponentDefinition> {
  return new Map(
    Object.values(componentStore.components).map((entry) => [
      entry.componentId,
      entry.parsed,
    ]),
  );
}

export function createHalImportSelectionMap(
  componentGroups: HalImportComponentGroup[],
  linkSelections: HalImportBuildOptions["linkSelections"],
): HalImportSelectionMap {
  const selections = new Map<string, HalImportLinkSelection>();
  for (const group of componentGroups) {
    const selection = linkSelections[group.id];
    selections.set(
      group.id,
      selection ?? { groupId: group.id, mode: "project-local" },
    );
  }
  return selections;
}

function buildMappedStorePinTypes(
  draft: HalImportBuildOptions["draft"],
  componentStore: HalImportBuildOptions["componentStore"],
  selections: HalImportSelectionMap,
): Map<string, HalValueType[]> {
  const { groupByInstance, instanceByName } = createGroupInstanceIndex(
    draft.componentGroups,
  );
  const storeComponentsById = createStoreComponentMap(componentStore);
  const mappedStorePinTypes = new Map<string, HalValueType[]>();
  const collectKnownStorePinTypes = (net: HalImportNet) => {
    const knownTypes: HalValueType[] = [];
    for (const endpoint of net.endpoints) {
      const group = groupByInstance.get(endpoint.instanceName);
      if (!group) continue;
      const selection = selections.get(group.id);
      if (!selection || selection.mode !== "store") continue;
      const component = storeComponentsById.get(selection.componentId);
      const pin = findMatchingComponentPin(
        component,
        endpoint.pinName,
        instanceByName.get(endpoint.instanceName)?.instanceConfigValues,
      );
      if (pin) knownTypes.push(pin.type);
    }
    return knownTypes;
  };

  for (const net of draft.nets) {
    const knownTypes = collectKnownStorePinTypes(net);
    if (knownTypes.length === 0) continue;

    for (const endpoint of net.endpoints) {
      const group = groupByInstance.get(endpoint.instanceName);
      if (!group) continue;
      const selection = selections.get(group.id);
      if (selection?.mode === "store") continue;
      const key = `${group.id}::${endpoint.pinName}`;
      const existing = mappedStorePinTypes.get(key);
      if (existing) existing.push(...knownTypes);
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
    if (uniqueTypes.length === 1) {
      type = uniqueTypes[0] ?? "bit";
    } else if (uniqueTypes.length > 1) {
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
  const selections = createHalImportSelectionMap(
    options.draft.componentGroups,
    options.linkSelections,
  );
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

export function resolveImportedComponentsForProject(options: {
  draft: HalImportBuildOptions["draft"];
  componentStore: HalImportBuildOptions["componentStore"];
  linkSelections: HalImportBuildOptions["linkSelections"];
  projectComponents: Record<string, ComponentDefinition>;
  warnings: string[];
  handledGroupIds?: Set<string>;
  projectLocalComponentOverrides?: HalImportBuildOptions["projectLocalComponentOverrides"];
}): {
  selections: HalImportSelectionMap;
  resolvedComponentByGroupId: Map<string, ComponentDefinition>;
  resolvedComponentIdByGroupId: Map<string, string>;
} {
  const selections = createHalImportSelectionMap(
    options.draft.componentGroups,
    options.linkSelections,
  );
  const storeComponentsById = createStoreComponentMap(options.componentStore);
  const mappedStorePinTypes = buildMappedStorePinTypes(
    options.draft,
    options.componentStore,
    selections,
  );
  const usedProjectComponentIds = new Set<string>(
    Object.keys(options.projectComponents),
  );
  const generatedProjectLocalComponents =
    buildGeneratedLocalComponentsFromHalImport({
      draft: options.draft,
      componentStore: options.componentStore,
      linkSelections: options.linkSelections,
    });
  const resolvedComponentByGroupId = new Map<string, ComponentDefinition>();
  const resolvedComponentIdByGroupId = new Map<string, string>();

  for (const group of options.draft.componentGroups) {
    if (options.handledGroupIds?.has(group.id)) continue;

    const selection = selections.get(group.id);
    if (selection?.mode === "store") {
      const component = storeComponentsById.get(selection.componentId);
      if (component) {
        resolvedComponentByGroupId.set(group.id, component);
        resolvedComponentIdByGroupId.set(group.id, selection.componentId);
        options.projectComponents[selection.componentId] = component;
        continue;
      }

      options.warnings.push(
        `Selected store component '${selection.componentId}' for '${group.inferredHalComponentName}' was not found; generating project-local component`,
      );
    }

    const generated =
      options.projectLocalComponentOverrides?.[group.id] ??
      generatedProjectLocalComponents[group.id] ??
      buildGeneratedProjectLocalComponent(
        group,
        options.draft,
        mappedStorePinTypes,
        options.warnings,
        usedProjectComponentIds,
      );

    usedProjectComponentIds.add(generated.id);
    options.projectComponents[generated.id] = structuredClone(generated);
    resolvedComponentByGroupId.set(group.id, generated);
    resolvedComponentIdByGroupId.set(group.id, generated.id);
  }

  return {
    selections,
    resolvedComponentByGroupId,
    resolvedComponentIdByGroupId,
  };
}
