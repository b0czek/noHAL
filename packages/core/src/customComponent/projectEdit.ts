import { err, ok, type Result } from "neverthrow";
import { createId } from "../id";
import type {
  Change,
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentNode,
  ComponentParamDefinition,
  ComponentPinDefinition,
  ComponentStore,
  Failure,
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
  | Failure<"not-custom">
  | (Failure<"in-use"> & {
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
  if (!component) return err({ code: "not-custom" });
  const usageCount = projectUsesComponentDefinition(project, componentId);
  if (usageCount > 0) {
    return err({
      code: "in-use",
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
  mutate: (component: ComponentDefinition) => void,
): ComponentDefinition | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  mutate(component);
  return component;
}

export type UpdateHalComponentNameError =
  | Failure<"not-custom">
  | Failure<"empty-name">
  | Failure<"duplicate-name">;

function updateHalComponentName(
  project: NoHALProject,
  componentId: string,
  halComponentName: string,
  options?: { componentStore?: ComponentStore },
): Result<Change<ComponentDefinition>, UpdateHalComponentNameError> {
  const component = findManualComponent(project, componentId);
  if (!component) return err({ code: "not-custom" });

  const normalized = halComponentName.trim();
  if (!normalized) return err({ code: "empty-name" });
  if (component.halComponentName === normalized)
    return ok({ data: component, changed: false });

  const conflict = findHalComponentNameConflict({
    halComponentName: normalized,
    project,
    componentStore: options?.componentStore,
    excludeComponentIds: [componentId],
  });
  if (conflict) return err({ code: "duplicate-name" });

  customComponentDefinitionEdits.halComponentName.update(component, normalized);
  return ok({ data: component, changed: true });
}

function updateRuntimeKind(
  project: NoHALProject,
  componentId: string,
  runtimeKind: "rt" | "userspace" | "unknown",
): ComponentDefinition | null {
  return updateProjectCustomComponent(project, componentId, (component) => {
    customComponentDefinitionEdits.runtimeKind.update(component, runtimeKind);
  });
}

function updateLoadCommand(
  project: NoHALProject,
  componentId: string,
  loadCommand: string,
): ComponentDefinition | null {
  return updateProjectCustomComponent(project, componentId, (component) => {
    customComponentDefinitionEdits.loadCommand.update(component, loadCommand);
  });
}

function updateMaxInstances(
  project: NoHALProject,
  componentId: string,
  maxInstances: number | undefined,
): ComponentDefinition | null {
  return updateProjectCustomComponent(project, componentId, (component) => {
    customComponentDefinitionEdits.maxInstances.update(component, maxInstances);
  });
}

function addPin(
  project: NoHALProject,
  componentId: string,
): { component: ComponentDefinition; pin: ComponentPinDefinition } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const pin = customComponentDefinitionEdits.pin.add(component);
  reconcileComponentNodesForDefinition(project, componentId, component);
  return { component, pin };
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
): { component: ComponentDefinition; pinName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const pin = customComponentDefinitionEdits.pin.remove(component, pinKey);
  if (!pin) return null;
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId)
        continue;
      removePinStateFromNode(node, pinKey);
    }
  }
  reconcileComponentNodesForDefinition(project, componentId, component);
  return { component, pinName: pin.name };
}

function updatePinName(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  pinName: string,
): { component: ComponentDefinition; pinName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const pin = customComponentDefinitionEdits.pin.name.update(
    component,
    pinKey,
    pinName,
  );
  if (!pin) return null;
  return { component, pinName: pin.name };
}

function updatePinType(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  pinType: ComponentPinDefinition["type"],
): { component: ComponentDefinition; pinName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const pin = customComponentDefinitionEdits.pin.type.update(
    component,
    pinKey,
    pinType,
  );
  if (!pin) return null;
  return { component, pinName: pin.name };
}

function updatePinDirection(
  project: NoHALProject,
  componentId: string,
  pinKey: string,
  direction: ComponentPinDefinition["direction"],
): { component: ComponentDefinition; pinName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const pin = customComponentDefinitionEdits.pin.direction.update(
    component,
    pinKey,
    direction,
  );
  if (!pin) return null;
  return { component, pinName: pin.name };
}

function addParam(
  project: NoHALProject,
  componentId: string,
): { component: ComponentDefinition; param: ComponentParamDefinition } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const param = customComponentDefinitionEdits.param.add(component);
  reconcileComponentNodesForDefinition(project, componentId, component);
  return { component, param };
}

function addFunction(
  project: NoHALProject,
  componentId: string,
): { component: ComponentDefinition; fn: ComponentFunctionDefinition } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const fn = customComponentDefinitionEdits.function.add(component);
  if (!fn) return null;
  return { component, fn };
}

function removeFunction(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
): { component: ComponentDefinition; functionName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const fn = customComponentDefinitionEdits.function.remove(
    component,
    functionKey,
  );
  if (!fn) return null;
  return { component, functionName: fn.declaredName };
}

function updateFunctionName(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
  functionName: string,
): { component: ComponentDefinition; functionName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const fn = customComponentDefinitionEdits.function.name.update(
    component,
    functionKey,
    functionName,
  );
  if (!fn) return null;
  return { component, functionName: fn.declaredName };
}

function updateFunctionFloatMode(
  project: NoHALProject,
  componentId: string,
  functionKey: string,
  floatMode: ComponentFunctionDefinition["floatMode"],
): { component: ComponentDefinition; functionName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const fn = customComponentDefinitionEdits.function.floatMode.update(
    component,
    functionKey,
    floatMode,
  );
  if (!fn) return null;
  return { component, functionName: fn.declaredName };
}

function removeParam(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
): { component: ComponentDefinition; paramName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const param = customComponentDefinitionEdits.param.remove(
    component,
    paramKey,
  );
  if (!param) return null;
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId)
        continue;
      delete node.paramValues[paramKey];
    }
  }
  reconcileComponentNodesForDefinition(project, componentId, component);
  return { component, paramName: param.name };
}

function updateParamName(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramName: string,
): { component: ComponentDefinition; paramName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const param = customComponentDefinitionEdits.param.name.update(
    component,
    paramKey,
    paramName,
  );
  if (!param) return null;
  return { component, paramName: param.name };
}

function updateParamType(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramType: ComponentParamDefinition["type"],
): { component: ComponentDefinition; paramName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const param = customComponentDefinitionEdits.param.type.update(
    component,
    paramKey,
    paramType,
  );
  if (!param) return null;
  return { component, paramName: param.name };
}

function updateParamDirection(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  paramDirection: ComponentParamDefinition["direction"],
): { component: ComponentDefinition; paramName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const param = customComponentDefinitionEdits.param.direction.update(
    component,
    paramKey,
    paramDirection,
  );
  if (!param) return null;
  return { component, paramName: param.name };
}

function updateParamDefaultValue(
  project: NoHALProject,
  componentId: string,
  paramKey: string,
  defaultValue: string,
): { component: ComponentDefinition; paramName: string } | null {
  const component = findManualComponent(project, componentId);
  if (!component) return null;
  const param = customComponentDefinitionEdits.param.defaultValue.update(
    component,
    paramKey,
    defaultValue,
  );
  if (!param) return null;
  reconcileComponentNodesForDefinition(project, componentId, component);
  return { component, paramName: param.name };
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
