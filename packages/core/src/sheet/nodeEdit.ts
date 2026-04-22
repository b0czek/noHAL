import { err, ok } from "neverthrow";
import { resolveComponentPinsForInstance } from "../component/instance";
import {
  collectDuplicateExportedInstancePaths,
  componentHasFixedExportNamespace,
  componentUsesLockedCanonicalInstanceNames,
  hasComponentExportPathConflict,
  nextComponentInstanceName,
  resolveNodeExportNamespace,
} from "../component/naming";
import {
  fixedExportStageForComponent,
  fixedInstanceNameForComponent,
} from "../component/system";
import { isComponentPlaceable } from "../component/visibility";
import { getSheetReferenceLocations, isNodePinConnected } from "../graph";
import { isValidHalName } from "../halNames";
import { createId } from "../id";
import { normalizeComponentPinOrder } from "../pinOrder";
import type {
  ChangeResult,
  ConflictFailure,
  ForbiddenFailure,
  InvalidInputFailure,
  NotFoundFailure,
} from "../result";
import type {
  ComponentNode,
  NoHALProject,
  SheetNode,
  SheetNodeInstance,
  XY,
} from "../types";
import { defaultNodePositionForIndex } from "./layout";

function normalizeInstanceConfigValues(
  node: SheetNodeInstance & { kind: "component" },
  configKey: string,
  value: string,
  defaultValue: string | undefined,
): void {
  const nextValues = { ...(node.instanceConfigValues ?? {}) };
  const normalizedValue = value.trim();
  if (
    !normalizedValue ||
    (defaultValue !== undefined && normalizedValue === defaultValue)
  ) {
    delete nextValues[configKey];
  } else {
    nextValues[configKey] = normalizedValue;
  }

  if (Object.keys(nextValues).length > 0) {
    node.instanceConfigValues = nextValues;
  } else {
    delete node.instanceConfigValues;
  }
}

function pruneNodePinInitialValues(
  node: SheetNodeInstance & { kind: "component" },
  validPinKeys: ReadonlySet<string>,
): void {
  const currentPinInitialValues = node.pinInitialValues ?? {};
  const nextPinInitialValues: Record<string, string> = {};
  for (const [key, pinValue] of Object.entries(currentPinInitialValues)) {
    if (!validPinKeys.has(key) || !pinValue.trim()) continue;
    nextPinInitialValues[key] = pinValue;
  }
  if (Object.keys(nextPinInitialValues).length > 0) {
    node.pinInitialValues = nextPinInitialValues;
  } else {
    delete node.pinInitialValues;
  }
}

function pruneHiddenPinKeys(
  node: SheetNodeInstance & { kind: "component" },
  validPinKeys: ReadonlySet<string>,
): void {
  const nextHiddenPinKeys = (node.hiddenPinKeys ?? []).filter((key) =>
    validPinKeys.has(key),
  );
  if (nextHiddenPinKeys.length > 0) {
    node.hiddenPinKeys = [...new Set(nextHiddenPinKeys)];
  } else {
    delete node.hiddenPinKeys;
  }
}

function pruneNodePinOrder(
  node: SheetNodeInstance & { kind: "component" },
  validPinKeys: readonly string[],
): void {
  const nextPinOrder = normalizeComponentPinOrder(node.pinOrder, validPinKeys);
  if (nextPinOrder) {
    node.pinOrder = nextPinOrder;
  } else {
    delete node.pinOrder;
  }
}

function setNodeExportNamespace(
  node: SheetNodeInstance & { kind: "component" },
  global: boolean,
): void {
  if (global) {
    node.exportNamespace = "global";
  } else {
    delete node.exportNamespace;
  }
}

export type AddComponentNodeFailure =
  | NotFoundFailure
  | (ForbiddenFailure<"component-placement-disabled"> & {
      componentName: string;
    })
  | (ConflictFailure<"no-available-instance-name"> & {
      componentName: string;
    });

export type AddComponentNodeResult = ChangeResult<
  ComponentNode,
  AddComponentNodeFailure
>;

function addComponentNode(
  project: NoHALProject,
  sheetId: string,
  componentId: string,
  position?: XY,
): AddComponentNodeResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });

  const component = project.library.components[componentId];
  if (!component) return err({ code: "not-found" });
  if (!isComponentPlaceable(component)) {
    return err({
      code: "forbidden",
      detail: "component-placement-disabled",
      componentName: component.halComponentName,
    });
  }

  const instanceName = nextComponentInstanceName(project, sheet, component);
  if (!instanceName) {
    return err({
      code: "conflict",
      detail: "no-available-instance-name",
      componentName: component.halComponentName,
    });
  }

  const node: ComponentNode = {
    id: createId("node"),
    kind: "component",
    componentId,
    instanceName,
    position: position ?? defaultNodePositionForIndex(sheet.nodes.length),
    paramValues: Object.fromEntries(
      component.params
        .filter((param) => param.defaultValue !== undefined)
        .map((param) => [param.key, param.defaultValue ?? ""]),
    ),
    instanceConfigValues: Object.fromEntries(
      (component.runtime?.instanceConfig?.fields ?? [])
        .filter((field) => field.defaultValue !== undefined)
        .map((field) => [field.key, `${field.defaultValue ?? ""}`]),
    ),
  };
  if (
    node.instanceConfigValues &&
    Object.keys(node.instanceConfigValues).length === 0
  ) {
    delete node.instanceConfigValues;
  }

  sheet.nodes.push(node);
  return ok({ data: node, changed: true });
}

export type UpdateNodeInstanceNameResult = ChangeResult<
  { sheetId: string; nodeId: string; instanceName: string },
  | NotFoundFailure
  | InvalidInputFailure<"empty-name" | "invalid-hal-name">
  | ConflictFailure<"duplicate-name" | "duplicate-exported-instance-path">
  | ForbiddenFailure<"fixed-instance-name">
>;

function updateNodeInstanceName(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  instanceName: string,
): UpdateNodeInstanceNameResult {
  const trimmed = instanceName.trim();
  if (!trimmed) return err({ code: "invalid-input", detail: "empty-name" });
  if (!isValidHalName(trimmed)) {
    return err({ code: "invalid-input", detail: "invalid-hal-name" });
  }

  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find((entry) => entry.id === nodeId);
  if (!node) return err({ code: "not-found" });
  if (node.instanceName === trimmed) {
    return ok({
      data: { sheetId, nodeId, instanceName: node.instanceName },
      changed: false,
    });
  }

  if (node.kind === "component") {
    const component = project.library.components[node.componentId];
    if (
      fixedInstanceNameForComponent(component) ||
      componentUsesLockedCanonicalInstanceNames(component)
    ) {
      return err({ code: "forbidden", detail: "fixed-instance-name" });
    }

    if (
      hasComponentExportPathConflict({
        project,
        sheetId,
        component,
        candidateNode: {
          instanceName: trimmed,
          exportNamespace: node.exportNamespace,
        },
        excludeNodeId: nodeId,
      })
    ) {
      return err({
        code: "conflict",
        detail: "duplicate-exported-instance-path",
      });
    }
  } else if (
    sheet.nodes.some(
      (entry) => entry.id !== nodeId && entry.instanceName === trimmed,
    )
  ) {
    return err({ code: "conflict", detail: "duplicate-name" });
  }

  node.instanceName = trimmed;
  return ok({
    data: { sheetId, nodeId, instanceName: node.instanceName },
    changed: true,
  });
}

function updateSheetInstanceName(
  project: NoHALProject,
  sheetId: string,
  instanceName: string,
): UpdateNodeInstanceNameResult {
  const [reference] = getSheetReferenceLocations(project, sheetId);
  if (!reference) return err({ code: "not-found" });

  return updateNodeInstanceName(
    project,
    reference.parentSheetId,
    reference.nodeId,
    instanceName,
  );
}

export type UpdateSheetNodeThreadMapResult = ChangeResult<
  {
    sheetId: string;
    nodeId: string;
    childThreadOutputId: string;
    parentThreadOutputId: string | null;
  },
  NotFoundFailure
>;

function updateSheetNodeThreadMap(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  childThreadOutputId: string,
  parentThreadOutputId: string | null,
): UpdateSheetNodeThreadMapResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNode =>
      entry.id === nodeId && entry.kind === "sheet",
  );
  if (!node) return err({ code: "not-found" });

  const normalizedParentThreadOutputId = parentThreadOutputId?.trim() || null;
  const currentParentThreadOutputId =
    node.hal?.threadMap?.[childThreadOutputId] ?? null;
  if (currentParentThreadOutputId === normalizedParentThreadOutputId) {
    return ok({
      data: {
        sheetId,
        nodeId,
        childThreadOutputId,
        parentThreadOutputId: currentParentThreadOutputId,
      },
      changed: false,
    });
  }

  if (normalizedParentThreadOutputId) {
    if (!node.hal) node.hal = {};
    if (!node.hal.threadMap) node.hal.threadMap = {};
    node.hal.threadMap[childThreadOutputId] = normalizedParentThreadOutputId;
  } else if (node.hal?.threadMap) {
    delete node.hal.threadMap[childThreadOutputId];
    if (Object.keys(node.hal.threadMap).length === 0) delete node.hal.threadMap;
    if (node.hal && Object.keys(node.hal).length === 0) delete node.hal;
  }

  return ok({
    data: {
      sheetId,
      nodeId,
      childThreadOutputId,
      parentThreadOutputId: normalizedParentThreadOutputId,
    },
    changed: true,
  });
}

export type UpdateComponentNodeParamResult = ChangeResult<
  { sheetId: string; nodeId: string; paramKey: string; value: string },
  NotFoundFailure
>;

function updateComponentNodeParam(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  paramKey: string,
  value: string,
): UpdateComponentNodeParamResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!node) return err({ code: "not-found" });

  const currentValue = node.paramValues[paramKey];
  if (currentValue === value) {
    return ok({
      data: { sheetId, nodeId, paramKey, value },
      changed: false,
    });
  }

  node.paramValues[paramKey] = value;
  return ok({
    data: { sheetId, nodeId, paramKey, value },
    changed: true,
  });
}

export type UpdateComponentNodeInstanceConfigResult = ChangeResult<
  {
    sheetId: string;
    nodeId: string;
    configKey: string;
    value: string | null;
  },
  NotFoundFailure
>;

function updateComponentNodeInstanceConfig(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  configKey: string,
  value: string,
): UpdateComponentNodeInstanceConfigResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!node) return err({ code: "not-found" });

  const component = project.library.components[node.componentId];
  if (!component) return err({ code: "not-found" });
  const field = component.runtime?.instanceConfig?.fields.find(
    (item) => item.key === configKey,
  );
  if (!field) return err({ code: "not-found" });

  const before = JSON.stringify({
    instanceConfigValues: node.instanceConfigValues ?? null,
    pinInitialValues: node.pinInitialValues ?? null,
    hiddenPinKeys: node.hiddenPinKeys ?? null,
    pinOrder: node.pinOrder ?? null,
  });

  const defaultValue =
    field.defaultValue === undefined ? undefined : `${field.defaultValue}`;
  normalizeInstanceConfigValues(node, configKey, value, defaultValue);

  const resolvedPins = resolveComponentPinsForInstance(
    component,
    node.instanceConfigValues,
  );
  const validPinKeys = new Set(resolvedPins.map((pin) => pin.key));
  pruneNodePinInitialValues(node, validPinKeys);
  pruneHiddenPinKeys(node, validPinKeys);
  pruneNodePinOrder(
    node,
    resolvedPins.map((pin) => pin.key),
  );

  const after = JSON.stringify({
    instanceConfigValues: node.instanceConfigValues ?? null,
    pinInitialValues: node.pinInitialValues ?? null,
    hiddenPinKeys: node.hiddenPinKeys ?? null,
    pinOrder: node.pinOrder ?? null,
  });

  return ok({
    data: {
      sheetId,
      nodeId,
      configKey,
      value: node.instanceConfigValues?.[configKey] ?? null,
    },
    changed: before !== after,
  });
}

export type UpdateComponentNodePinInitialValueResult = ChangeResult<
  {
    sheetId: string;
    nodeId: string;
    pinKey: string;
    value: string | null;
  },
  NotFoundFailure
>;

function updateComponentNodePinInitialValue(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  pinKey: string,
  value: string,
): UpdateComponentNodePinInitialValueResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!node) return err({ code: "not-found" });

  const currentValue = node.pinInitialValues?.[pinKey] ?? null;
  const nextValue = value.trim() ? value : null;
  if (currentValue === nextValue) {
    return ok({
      data: { sheetId, nodeId, pinKey, value: currentValue },
      changed: false,
    });
  }

  const next = { ...(node.pinInitialValues ?? {}) };
  if (nextValue !== null) next[pinKey] = value;
  else delete next[pinKey];
  if (Object.keys(next).length > 0) node.pinInitialValues = next;
  else delete node.pinInitialValues;

  return ok({
    data: { sheetId, nodeId, pinKey, value: nextValue },
    changed: true,
  });
}

export type UpdateComponentNodePinVisibilityResult = ChangeResult<
  {
    sheetId: string;
    nodeId: string;
    pinKey: string;
    visible: boolean;
  },
  NotFoundFailure | ForbiddenFailure<"connected-pin">
>;

function updateComponentNodePinVisibility(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  pinKey: string,
  visible: boolean,
): UpdateComponentNodePinVisibilityResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!node) return err({ code: "not-found" });
  if (!visible && isNodePinConnected(sheet, nodeId, pinKey)) {
    return err({ code: "forbidden", detail: "connected-pin" });
  }

  const isCurrentlyVisible = !node.hiddenPinKeys?.includes(pinKey);
  if (isCurrentlyVisible === visible) {
    return ok({
      data: { sheetId, nodeId, pinKey, visible },
      changed: false,
    });
  }

  const nextHiddenPinKeys = new Set(node.hiddenPinKeys ?? []);
  if (visible) nextHiddenPinKeys.delete(pinKey);
  else nextHiddenPinKeys.add(pinKey);

  if (nextHiddenPinKeys.size > 0) {
    node.hiddenPinKeys = [...nextHiddenPinKeys].sort();
  } else {
    delete node.hiddenPinKeys;
  }

  return ok({
    data: { sheetId, nodeId, pinKey, visible },
    changed: true,
  });
}

export type UpdateComponentNodePinOrderResult = ChangeResult<
  { sheetId: string; nodeId: string; pinOrder: string[] | null },
  NotFoundFailure
>;

function updateComponentNodePinOrder(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  pinOrder: readonly string[],
): UpdateComponentNodePinOrderResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!node) return err({ code: "not-found" });

  const component = project.library.components[node.componentId];
  if (!component) return err({ code: "not-found" });
  const validPinKeys = resolveComponentPinsForInstance(
    component,
    node.instanceConfigValues,
  ).map((pin) => pin.key);
  const normalizedPinOrder = normalizeComponentPinOrder(pinOrder, validPinKeys);
  const currentPinOrder = normalizeComponentPinOrder(
    node.pinOrder,
    validPinKeys,
  );
  if (
    normalizedPinOrder &&
    currentPinOrder &&
    normalizedPinOrder.length === currentPinOrder.length &&
    normalizedPinOrder.every((key, index) => key === currentPinOrder[index])
  ) {
    return ok({
      data: { sheetId, nodeId, pinOrder: currentPinOrder },
      changed: false,
    });
  }
  if (!normalizedPinOrder && !currentPinOrder) {
    return ok({
      data: { sheetId, nodeId, pinOrder: null },
      changed: false,
    });
  }

  if (normalizedPinOrder) {
    node.pinOrder = normalizedPinOrder;
  } else {
    delete node.pinOrder;
  }

  return ok({
    data: { sheetId, nodeId, pinOrder: normalizedPinOrder ?? null },
    changed: true,
  });
}

export type UpdateComponentNodeExportStageResult = ChangeResult<
  {
    sheetId: string;
    nodeId: string;
    exportStage: "main" | "postgui" | null;
  },
  NotFoundFailure
>;

function updateComponentNodeExportStage(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  stage: "main" | "postgui",
): UpdateComponentNodeExportStageResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!node) return err({ code: "not-found" });

  const component = project.library.components[node.componentId];
  if (!component) return err({ code: "not-found" });
  const nextExportStage =
    fixedExportStageForComponent(component) ??
    (stage === "postgui" ? "postgui" : null);
  const currentExportStage = node.exportStage ?? null;
  if (currentExportStage === nextExportStage) {
    return ok({
      data: { sheetId, nodeId, exportStage: currentExportStage },
      changed: false,
    });
  }

  if (nextExportStage === null) {
    delete node.exportStage;
  } else {
    node.exportStage = nextExportStage;
  }

  return ok({
    data: { sheetId, nodeId, exportStage: nextExportStage },
    changed: true,
  });
}

export type UpdateComponentNodeExportNamespaceFailure =
  | NotFoundFailure
  | (ForbiddenFailure<"fixed-export-namespace"> & {
      componentName: string;
    })
  | (ConflictFailure<"duplicate-exported-instance-path"> & {
      instancePath: string;
    });

export type UpdateComponentNodeExportNamespaceResult = ChangeResult<
  {
    sheetId: string;
    nodeId: string;
    exportNamespace: "sheet_scoped" | "global";
  },
  UpdateComponentNodeExportNamespaceFailure
>;

function updateComponentNodeExportNamespace(
  project: NoHALProject,
  sheetId: string,
  nodeId: string,
  global: boolean,
): UpdateComponentNodeExportNamespaceResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found" });
  const node = sheet.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!node) return err({ code: "not-found" });

  const component = project.library.components[node.componentId];
  if (!component) return err({ code: "not-found" });
  if (componentHasFixedExportNamespace(component)) {
    return err({
      code: "forbidden",
      detail: "fixed-export-namespace",
      componentName: component.halComponentName,
    });
  }

  const nextExportNamespace = global ? "global" : "sheet_scoped";
  if (resolveNodeExportNamespace(node, component) === nextExportNamespace) {
    return ok({
      data: { sheetId, nodeId, exportNamespace: nextExportNamespace },
      changed: false,
    });
  }

  const currentDuplicates = new Set(
    collectDuplicateExportedInstancePaths(project),
  );
  const nextProject = structuredClone(project) as NoHALProject;
  const nextNode = nextProject.sheets[sheetId]?.nodes.find(
    (entry): entry is SheetNodeInstance & { kind: "component" } =>
      entry.id === nodeId && entry.kind === "component",
  );
  if (!nextNode) return err({ code: "not-found" });
  setNodeExportNamespace(nextNode, global);
  const introducedDuplicate = collectDuplicateExportedInstancePaths(
    nextProject,
  ).find((path) => !currentDuplicates.has(path));

  if (introducedDuplicate) {
    return err({
      code: "conflict",
      detail: "duplicate-exported-instance-path",
      instancePath: introducedDuplicate,
    });
  }

  setNodeExportNamespace(node, global);
  return ok({
    data: { sheetId, nodeId, exportNamespace: nextExportNamespace },
    changed: true,
  });
}

export const nodeModelEdits = {
  component: {
    add: addComponentNode,
  },
  instanceName: {
    update: updateNodeInstanceName,
    updateSheet: updateSheetInstanceName,
  },
  threadMap: {
    update: updateSheetNodeThreadMap,
  },
  param: {
    update: updateComponentNodeParam,
  },
  instanceConfig: {
    update: updateComponentNodeInstanceConfig,
  },
  pinInitialValue: {
    update: updateComponentNodePinInitialValue,
  },
  pinVisibility: {
    update: updateComponentNodePinVisibility,
  },
  pinOrder: {
    update: updateComponentNodePinOrder,
  },
  exportStage: {
    update: updateComponentNodeExportStage,
  },
  exportNamespace: {
    update: updateComponentNodeExportNamespace,
  },
} as const;
