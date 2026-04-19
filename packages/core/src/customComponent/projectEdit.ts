import { err, ok, type Result } from "neverthrow";
import { createId } from "../id";
import type { Change, Failure } from "../result";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentNode,
  ComponentParamDefinition,
  ComponentPinDefinition,
  ComponentStore,
  NoHALProject,
} from "../types";
import { customComponentDefinitionEdits } from "./definitionEdit";
import { reconcileComponentNodesForDefinition } from "./reconcile";
import {
  createCustomComponentDefinition,
  findManualComponent,
  projectUsesComponentDefinition,
} from "./shared";
import { findHalComponentNameConflict } from "./validation";

function add(
  project: NoHALProject,
  options?: { halComponentName?: string },
): ComponentDefinition {
  const existingNames = Object.values(project.library.components).map(
    (component) => component.halComponentName,
  );
  const component = createCustomComponentDefinition({
    componentId: `manual:${createId("component")}`,
    existingHalComponentNames: existingNames,
    baseHalComponentName: options?.halComponentName,
  });
  project.library.components[component.id] = component;
  return component;
}

export type RemoveCustomComponentError =
  | Failure<"not-found", "custom-component">
  | (Failure<"in-use", "placed-component"> & {
      componentName: string;
      usageCount: number;
    });

export type RemoveCustomComponentResult = Result<
  Change<{ componentName: string }>,
  RemoveCustomComponentError
>;

function remove(
  project: NoHALProject,
  componentId: string,
): RemoveCustomComponentResult {
  const component = findManualComponent(project, componentId);
  if (!component) {
    return err({ code: "not-found", detail: "custom-component" });
  }
  const usageCount = projectUsesComponentDefinition(project, componentId);
  if (usageCount > 0) {
    return err({
      code: "in-use",
      detail: "placed-component",
      componentName: component.halComponentName,
      usageCount,
    });
  }
  delete project.library.components[componentId];
  return ok({
    data: { componentName: component.halComponentName },
    changed: true,
  });
}

function updateProjectCustomComponent(
  project: NoHALProject,
  componentId: string,
  mutate: (component: ComponentDefinition) => boolean,
): Result<
  Change<ComponentDefinition>,
  Failure<"not-found", "custom-component">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  return ok({ data: component, changed: mutate(component) });
}

export type UpdateHalComponentNameError =
  | Failure<"not-found", "custom-component">
  | Failure<"invalid-input", "empty-name">
  | Failure<"conflict", "duplicate-name">;

function updateHalComponentName(
  project: NoHALProject,
  componentId: string,
  halComponentName: string,
  options?: { componentStore?: ComponentStore },
): Result<Change<ComponentDefinition>, UpdateHalComponentNameError> {
  const component = findManualComponent(project, componentId);
  if (!component) {
    return err({ code: "not-found", detail: "custom-component" });
  }

  const normalized = halComponentName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (component.halComponentName === normalized)
    return ok({ data: component, changed: false });

  const conflict = findHalComponentNameConflict({
    halComponentName: normalized,
    project,
    componentStore: options?.componentStore,
    excludeComponentIds: [componentId],
  });
  if (conflict) return err({ code: "conflict", detail: "duplicate-name" });

  customComponentDefinitionEdits.halComponentName.update(component, normalized);
  return ok({ data: component, changed: true });
}

function updateRuntimeKind(
  project: NoHALProject,
  componentId: string,
  runtimeKind: "rt" | "userspace" | "unknown",
): Result<
  Change<ComponentDefinition>,
  Failure<"not-found", "custom-component">
> {
  return updateProjectCustomComponent(project, componentId, (component) =>
    customComponentDefinitionEdits.runtimeKind.update(component, runtimeKind),
  );
}

function updateLoadCommand(
  project: NoHALProject,
  componentId: string,
  loadCommand: string,
): Result<
  Change<ComponentDefinition>,
  Failure<"not-found", "custom-component">
> {
  return updateProjectCustomComponent(project, componentId, (component) =>
    customComponentDefinitionEdits.loadCommand.update(component, loadCommand),
  );
}

function updateMaxInstances(
  project: NoHALProject,
  componentId: string,
  maxInstances: number | undefined,
): Result<
  Change<ComponentDefinition>,
  Failure<"not-found", "custom-component">
> {
  return updateProjectCustomComponent(project, componentId, (component) =>
    customComponentDefinitionEdits.maxInstances.update(component, maxInstances),
  );
}

function addPin(
  project: NoHALProject,
  componentId: string,
): Result<
  Change<{ component: ComponentDefinition; pin: ComponentPinDefinition }>,
  Failure<"not-found", "custom-component">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const pin = customComponentDefinitionEdits.pin.add(component);
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({ data: { component, pin }, changed: true });
}

function removePinStateFromNode(node: ComponentNode, pinKey: string): void {
  if (node.pinInitialValues) {
    delete node.pinInitialValues[pinKey];
    if (Object.keys(node.pinInitialValues).length === 0) {
      delete node.pinInitialValues;
    }
  }
  if (node.hiddenPinKeys) {
    node.hiddenPinKeys = node.hiddenPinKeys.filter((key) => key !== pinKey);
    if (node.hiddenPinKeys.length === 0) {
      delete node.hiddenPinKeys;
    }
  }
  if (node.pinOrder) {
    node.pinOrder = node.pinOrder.filter((key) => key !== pinKey);
    if (node.pinOrder.length === 0) {
      delete node.pinOrder;
    }
  }
}

function removePin(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
): Result<
  Change<{ component: ComponentDefinition; pinName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "pin">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const pin = customComponentDefinitionEdits.pin.remove(component, pinKey);
  if (!pin) return err({ code: "not-found", detail: "pin" });
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId)
        continue;
      removePinStateFromNode(node, pinKey);
    }
  }
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({ data: { component, pinName: pin.name }, changed: true });
}

function updatePinName(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  pinName: string,
): Result<
  Change<{ component: ComponentDefinition; pinName: string }>,
  | Failure<"not-found", "custom-component">
  | Failure<"not-found", "pin">
  | Failure<"invalid-input", "empty-name">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.pins.find((candidate) => candidate.key === pinKey);
  if (!existing) return err({ code: "not-found", detail: "pin" });
  const normalized = pinName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (existing.name === normalized) {
    return ok({
      data: { component, pinName: existing.name },
      changed: false,
    });
  }
  const pin = customComponentDefinitionEdits.pin.name.update(
    component,
    pinKey,
    normalized,
  );
  if (!pin) return err({ code: "not-found", detail: "pin" });
  return ok({ data: { component, pinName: pin.name }, changed: true });
}

function updatePinType(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  pinType: ComponentPinDefinition["type"],
): Result<
  Change<{ component: ComponentDefinition; pinName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "pin">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.pins.find((candidate) => candidate.key === pinKey);
  if (!existing) return err({ code: "not-found", detail: "pin" });
  if (existing.type === pinType) {
    return ok({
      data: { component, pinName: existing.name },
      changed: false,
    });
  }
  const pin = customComponentDefinitionEdits.pin.type.update(
    component,
    pinKey,
    pinType,
  );
  if (!pin) return err({ code: "not-found", detail: "pin" });
  return ok({ data: { component, pinName: pin.name }, changed: true });
}

function updatePinDirection(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  direction: ComponentPinDefinition["direction"],
): Result<
  Change<{ component: ComponentDefinition; pinName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "pin">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.pins.find((candidate) => candidate.key === pinKey);
  if (!existing) return err({ code: "not-found", detail: "pin" });
  if (existing.direction === direction) {
    return ok({
      data: { component, pinName: existing.name },
      changed: false,
    });
  }
  const pin = customComponentDefinitionEdits.pin.direction.update(
    component,
    pinKey,
    direction,
  );
  if (!pin) return err({ code: "not-found", detail: "pin" });
  return ok({ data: { component, pinName: pin.name }, changed: true });
}

function addParam(
  project: NoHALProject,
  componentId: string,
): Result<
  Change<{ component: ComponentDefinition; param: ComponentParamDefinition }>,
  Failure<"not-found", "custom-component">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const param = customComponentDefinitionEdits.param.add(component);
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({ data: { component, param }, changed: true });
}

function addFunction(
  project: NoHALProject,
  componentId: string,
): Result<
  Change<{ component: ComponentDefinition; fn: ComponentFunctionDefinition }>,
  | Failure<"not-found", "custom-component">
  | Failure<"unsupported", "invalid-runtime">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const fn = customComponentDefinitionEdits.function.add(component);
  if (!fn) return err({ code: "unsupported", detail: "invalid-runtime" });
  return ok({ data: { component, fn }, changed: true });
}

function removeFunction(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
): Result<
  Change<{ component: ComponentDefinition; functionName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "function">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const fn = customComponentDefinitionEdits.function.remove(
    component,
    functionKey,
  );
  if (!fn) return err({ code: "not-found", detail: "function" });
  return ok({
    data: { component, functionName: fn.declaredName },
    changed: true,
  });
}

function updateFunctionName(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
  functionName: string,
): Result<
  Change<{ component: ComponentDefinition; functionName: string }>,
  | Failure<"not-found", "custom-component">
  | Failure<"not-found", "function">
  | Failure<"invalid-input", "empty-name">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.functions?.find(
    (candidate) => candidate.key === functionKey,
  );
  if (!existing) return err({ code: "not-found", detail: "function" });
  const normalized = functionName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (existing.declaredName === normalized) {
    return ok({
      data: { component, functionName: existing.declaredName },
      changed: false,
    });
  }
  const fn = customComponentDefinitionEdits.function.name.update(
    component,
    functionKey,
    normalized,
  );
  if (!fn) return err({ code: "not-found", detail: "function" });
  return ok({
    data: { component, functionName: fn.declaredName },
    changed: true,
  });
}

function updateFunctionFloatMode(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
  floatMode: ComponentFunctionDefinition["floatMode"],
): Result<
  Change<{ component: ComponentDefinition; functionName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "function">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.functions?.find(
    (candidate) => candidate.key === functionKey,
  );
  if (!existing) return err({ code: "not-found", detail: "function" });
  if (existing.floatMode === floatMode) {
    return ok({
      data: { component, functionName: existing.declaredName },
      changed: false,
    });
  }
  const fn = customComponentDefinitionEdits.function.floatMode.update(
    component,
    functionKey,
    floatMode,
  );
  if (!fn) return err({ code: "not-found", detail: "function" });
  return ok({
    data: { component, functionName: fn.declaredName },
    changed: true,
  });
}

function removeParam(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
): Result<
  Change<{ component: ComponentDefinition; paramName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "param">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const param = customComponentDefinitionEdits.param.remove(
    component,
    paramKey,
  );
  if (!param) return err({ code: "not-found", detail: "param" });
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId)
        continue;
      delete node.paramValues[paramKey];
    }
  }
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({ data: { component, paramName: param.name }, changed: true });
}

function updateParamName(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramName: string,
): Result<
  Change<{ component: ComponentDefinition; paramName: string }>,
  | Failure<"not-found", "custom-component">
  | Failure<"not-found", "param">
  | Failure<"invalid-input", "empty-name">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!existing) return err({ code: "not-found", detail: "param" });
  const normalized = paramName.trim();
  if (!normalized) {
    return err({ code: "invalid-input", detail: "empty-name" });
  }
  if (existing.name === normalized) {
    return ok({
      data: { component, paramName: existing.name },
      changed: false,
    });
  }
  const param = customComponentDefinitionEdits.param.name.update(
    component,
    paramKey,
    normalized,
  );
  if (!param) return err({ code: "not-found", detail: "param" });
  return ok({ data: { component, paramName: param.name }, changed: true });
}

function updateParamType(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramType: ComponentParamDefinition["type"],
): Result<
  Change<{ component: ComponentDefinition; paramName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "param">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!existing) return err({ code: "not-found", detail: "param" });
  if (existing.type === paramType) {
    return ok({
      data: { component, paramName: existing.name },
      changed: false,
    });
  }
  const param = customComponentDefinitionEdits.param.type.update(
    component,
    paramKey,
    paramType,
  );
  if (!param) return err({ code: "not-found", detail: "param" });
  return ok({ data: { component, paramName: param.name }, changed: true });
}

function updateParamDirection(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramDirection: ComponentParamDefinition["direction"],
): Result<
  Change<{ component: ComponentDefinition; paramName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "param">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!existing) return err({ code: "not-found", detail: "param" });
  if (existing.direction === paramDirection) {
    return ok({
      data: { component, paramName: existing.name },
      changed: false,
    });
  }
  const param = customComponentDefinitionEdits.param.direction.update(
    component,
    paramKey,
    paramDirection,
  );
  if (!param) return err({ code: "not-found", detail: "param" });
  return ok({ data: { component, paramName: param.name }, changed: true });
}

function updateParamDefaultValue(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  defaultValue: string,
): Result<
  Change<{ component: ComponentDefinition; paramName: string }>,
  Failure<"not-found", "custom-component"> | Failure<"not-found", "param">
> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-found", detail: "custom-component" });
  const existing = component.params.find(
    (candidate) => candidate.key === paramKey,
  );
  if (!existing) return err({ code: "not-found", detail: "param" });
  if ((existing.defaultValue ?? "") === defaultValue) {
    return ok({
      data: { component, paramName: existing.name },
      changed: false,
    });
  }
  const param = customComponentDefinitionEdits.param.defaultValue.update(
    component,
    paramKey,
    defaultValue,
  );
  if (!param) return err({ code: "not-found", detail: "param" });
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({ data: { component, paramName: param.name }, changed: true });
}

export const customComponentEdits = {
  add,
  remove,
  reconcileNodesForDefinition: reconcileComponentNodesForDefinition,
  halComponentName: {
    update: updateHalComponentName,
  },
  runtimeKind: {
    update: updateRuntimeKind,
  },
  loadCommand: {
    update: updateLoadCommand,
  },
  maxInstances: {
    update: updateMaxInstances,
  },
  pin: {
    add: addPin,
    remove: removePin,
    name: {
      update: updatePinName,
    },
    type: {
      update: updatePinType,
    },
    direction: {
      update: updatePinDirection,
    },
  },
  param: {
    add: addParam,
    remove: removeParam,
    name: {
      update: updateParamName,
    },
    type: {
      update: updateParamType,
    },
    direction: {
      update: updateParamDirection,
    },
    defaultValue: {
      update: updateParamDefaultValue,
    },
  },
  function: {
    add: addFunction,
    remove: removeFunction,
    name: {
      update: updateFunctionName,
    },
    floatMode: {
      update: updateFunctionFloatMode,
    },
  },
} as const;
