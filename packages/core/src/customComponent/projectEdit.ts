import { err, ok, type Result } from "neverthrow";
import { createId } from "../id";
import type {
  Change,
  ChangeResult,
  DuplicateNameFailure,
  EmptyNameFailure,
  InUseFailure,
} from "../result";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentNode,
  ComponentParamDefinition,
  ComponentPinDefinition,
  ComponentStore,
  HalValueType,
  NoHALProject,
} from "../types";
import { customComponentDefinitionEdits } from "./definitionEdit";
import {
  type CustomComponentFailure,
  type FunctionFailure,
  type InvalidRuntimeFailure,
  type ParamFailure,
  type PinFailure,
  requireCustomComponent,
} from "./editShared";
import { reconcileComponentNodesForDefinition } from "./reconcile";
import {
  createCustomComponentDefinition,
  projectUsesComponentDefinition,
} from "./shared";
import { findHalComponentNameConflict } from "./validation";

type CustomComponentChangeResult<T, E = never> = ChangeResult<
  T,
  CustomComponentFailure | E
>;

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

export type RemoveCustomComponentFailure =
  | CustomComponentFailure
  | (InUseFailure<"placed-component"> & {
      componentName: string;
      usageCount: number;
    });

export type RemoveCustomComponentResult = Result<
  Change<{ componentName: string }>,
  RemoveCustomComponentFailure
>;

function remove(
  project: NoHALProject,
  componentId: string,
): RemoveCustomComponentResult {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
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
  mutate: (component: ComponentDefinition) => ChangeResult<unknown>,
): CustomComponentChangeResult<ComponentDefinition> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const mutateResult = mutate(component);
  if (mutateResult.isErr()) throw new Error("unreachable");
  return ok({ data: component, changed: mutateResult.value.changed });
}

export type UpdateHalComponentNameFailure =
  | CustomComponentFailure
  | EmptyNameFailure
  | DuplicateNameFailure;

function updateHalComponentName(
  project: NoHALProject,
  componentId: string,
  halComponentName: string,
  options?: { componentStore?: ComponentStore },
): CustomComponentChangeResult<
  ComponentDefinition,
  EmptyNameFailure | DuplicateNameFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;

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

  const updateResult = customComponentDefinitionEdits.halComponentName.update(
    component,
    normalized,
  );
  if (updateResult.isErr()) return err(updateResult.error);
  return ok({ data: component, changed: updateResult.value.changed });
}

function updateRuntimeKind(
  project: NoHALProject,
  componentId: string,
  runtimeKind: "rt" | "userspace" | "unknown",
): CustomComponentChangeResult<ComponentDefinition> {
  return updateProjectCustomComponent(project, componentId, (component) =>
    customComponentDefinitionEdits.runtimeKind.update(component, runtimeKind),
  );
}

function updateLoadCommand(
  project: NoHALProject,
  componentId: string,
  loadCommand: string,
): CustomComponentChangeResult<ComponentDefinition> {
  return updateProjectCustomComponent(project, componentId, (component) =>
    customComponentDefinitionEdits.loadCommand.update(component, loadCommand),
  );
}

function updateMaxInstances(
  project: NoHALProject,
  componentId: string,
  maxInstances: number | undefined,
): CustomComponentChangeResult<ComponentDefinition> {
  return updateProjectCustomComponent(project, componentId, (component) =>
    customComponentDefinitionEdits.maxInstances.update(component, maxInstances),
  );
}

function addPin(
  project: NoHALProject,
  componentId: string,
): CustomComponentChangeResult<{
  component: ComponentDefinition;
  pin: ComponentPinDefinition;
}> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const pinResult = customComponentDefinitionEdits.pin.add(component);
  if (pinResult.isErr()) throw new Error("unreachable");
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({
    data: { component, pin: pinResult.value.data },
    changed: pinResult.value.changed,
  });
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
): CustomComponentChangeResult<
  { component: ComponentDefinition; pinName: string },
  PinFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const pinResult = customComponentDefinitionEdits.pin.remove(
    component,
    pinKey,
  );
  if (pinResult.isErr()) return err(pinResult.error);
  const pin = pinResult.value.data;
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId)
        continue;
      removePinStateFromNode(node, pinKey);
    }
  }
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({
    data: { component, pinName: pin.name },
    changed: pinResult.value.changed,
  });
}

function updatePinName(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  pinName: string,
): CustomComponentChangeResult<
  { component: ComponentDefinition; pinName: string },
  PinFailure | EmptyNameFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const pinResult = customComponentDefinitionEdits.pin.name.update(
    component,
    pinKey,
    pinName,
  );
  if (pinResult.isErr()) return err(pinResult.error);
  return ok({
    data: { component, pinName: pinResult.value.data.name },
    changed: pinResult.value.changed,
  });
}

function updatePinType(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  pinType: HalValueType,
): CustomComponentChangeResult<
  { component: ComponentDefinition; pinName: string },
  PinFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const pinResult = customComponentDefinitionEdits.pin.type.update(
    component,
    pinKey,
    pinType,
  );
  if (pinResult.isErr()) return err(pinResult.error);
  return ok({
    data: { component, pinName: pinResult.value.data.name },
    changed: pinResult.value.changed,
  });
}

function updatePinDirection(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  direction: ComponentPinDefinition["direction"],
): CustomComponentChangeResult<
  { component: ComponentDefinition; pinName: string },
  PinFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const pinResult = customComponentDefinitionEdits.pin.direction.update(
    component,
    pinKey,
    direction,
  );
  if (pinResult.isErr()) return err(pinResult.error);
  return ok({
    data: { component, pinName: pinResult.value.data.name },
    changed: pinResult.value.changed,
  });
}

function addParam(
  project: NoHALProject,
  componentId: string,
): CustomComponentChangeResult<{
  component: ComponentDefinition;
  param: ComponentParamDefinition;
}> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const paramResult = customComponentDefinitionEdits.param.add(component);
  if (paramResult.isErr()) throw new Error("unreachable");
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({
    data: { component, param: paramResult.value.data },
    changed: paramResult.value.changed,
  });
}

function addFunction(
  project: NoHALProject,
  componentId: string,
): CustomComponentChangeResult<
  { component: ComponentDefinition; fn: ComponentFunctionDefinition },
  InvalidRuntimeFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const fnResult = customComponentDefinitionEdits.function.add(component);
  if (fnResult.isErr()) return err(fnResult.error);
  return ok({
    data: { component, fn: fnResult.value.data },
    changed: fnResult.value.changed,
  });
}

function removeFunction(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
): CustomComponentChangeResult<
  { component: ComponentDefinition; functionName: string },
  FunctionFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const fnResult = customComponentDefinitionEdits.function.remove(
    component,
    functionKey,
  );
  if (fnResult.isErr()) return err(fnResult.error);
  return ok({
    data: { component, functionName: fnResult.value.data.declaredName },
    changed: fnResult.value.changed,
  });
}

function updateFunctionName(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
  functionName: string,
): CustomComponentChangeResult<
  { component: ComponentDefinition; functionName: string },
  FunctionFailure | EmptyNameFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const fnResult = customComponentDefinitionEdits.function.name.update(
    component,
    functionKey,
    functionName,
  );
  if (fnResult.isErr()) return err(fnResult.error);
  return ok({
    data: { component, functionName: fnResult.value.data.declaredName },
    changed: fnResult.value.changed,
  });
}

function updateFunctionFloatMode(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
  floatMode: ComponentFunctionDefinition["floatMode"],
): CustomComponentChangeResult<
  { component: ComponentDefinition; functionName: string },
  FunctionFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const fnResult = customComponentDefinitionEdits.function.floatMode.update(
    component,
    functionKey,
    floatMode,
  );
  if (fnResult.isErr()) return err(fnResult.error);
  return ok({
    data: { component, functionName: fnResult.value.data.declaredName },
    changed: fnResult.value.changed,
  });
}

function removeParam(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
): CustomComponentChangeResult<
  { component: ComponentDefinition; paramName: string },
  ParamFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const paramResult = customComponentDefinitionEdits.param.remove(
    component,
    paramKey,
  );
  if (paramResult.isErr()) return err(paramResult.error);
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId)
        continue;
      delete node.paramValues[paramKey];
    }
  }
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({
    data: { component, paramName: paramResult.value.data.name },
    changed: paramResult.value.changed,
  });
}

function updateParamName(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramName: string,
): CustomComponentChangeResult<
  { component: ComponentDefinition; paramName: string },
  ParamFailure | EmptyNameFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const paramResult = customComponentDefinitionEdits.param.name.update(
    component,
    paramKey,
    paramName,
  );
  if (paramResult.isErr()) return err(paramResult.error);
  return ok({
    data: { component, paramName: paramResult.value.data.name },
    changed: paramResult.value.changed,
  });
}

function updateParamType(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramType: ComponentParamDefinition["type"],
): CustomComponentChangeResult<
  { component: ComponentDefinition; paramName: string },
  ParamFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const paramResult = customComponentDefinitionEdits.param.type.update(
    component,
    paramKey,
    paramType,
  );
  if (paramResult.isErr()) return err(paramResult.error);
  return ok({
    data: { component, paramName: paramResult.value.data.name },
    changed: paramResult.value.changed,
  });
}

function updateParamDirection(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramDirection: ComponentParamDefinition["direction"],
): CustomComponentChangeResult<
  { component: ComponentDefinition; paramName: string },
  ParamFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const paramResult = customComponentDefinitionEdits.param.direction.update(
    component,
    paramKey,
    paramDirection,
  );
  if (paramResult.isErr()) return err(paramResult.error);
  return ok({
    data: { component, paramName: paramResult.value.data.name },
    changed: paramResult.value.changed,
  });
}

function updateParamDefaultValue(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  defaultValue: string,
): CustomComponentChangeResult<
  { component: ComponentDefinition; paramName: string },
  ParamFailure
> {
  const componentResult = requireCustomComponent(project, componentId);
  if (componentResult.isErr()) return err(componentResult.error);
  const component = componentResult.value;
  const paramResult = customComponentDefinitionEdits.param.defaultValue.update(
    component,
    paramKey,
    defaultValue,
  );
  if (paramResult.isErr()) return err(paramResult.error);
  reconcileComponentNodesForDefinition(project, componentId, component);
  return ok({
    data: { component, paramName: paramResult.value.data.name },
    changed: paramResult.value.changed,
  });
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
