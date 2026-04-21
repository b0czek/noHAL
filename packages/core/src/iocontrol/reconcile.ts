import { isManagedBySystemManager } from "../component/system";
import {
  createIocontrolSystemComponentDefinition,
  defaultPositionForIocontrol,
  IOCONTROL_SYSTEM_COMPONENT_ID,
  IOCONTROL_SYSTEM_FAMILY,
  IOCONTROL_SYSTEM_MANAGER,
} from "../componentStore/catalog/system/iocontrol";
import { reconcileSystemSingleton } from "../systemReconcile/singleton";
import type { ComponentNode, NoHALProject } from "../types";

const IOCONTROL_CUSTOM_OVERRIDE_MANAGER = "iocontrol-custom";

function isIocontrolLikeNode(
  project: NoHALProject,
  node: ComponentNode,
): boolean {
  const component = project.library.components[node.componentId];
  if (!component) return false;
  if (
    isManagedBySystemManager(component, IOCONTROL_SYSTEM_MANAGER) &&
    component.system?.family === IOCONTROL_SYSTEM_FAMILY
  ) {
    return true;
  }
  return component.halComponentName === "iocontrol";
}

function pruneUnusedImportedIocontrolComponents(project: NoHALProject): void {
  const referencedComponentIds = new Set<string>();
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      referencedComponentIds.add(node.componentId);
    }
  }
  for (const [componentId, component] of Object.entries(
    project.library.components,
  )) {
    if (referencedComponentIds.has(componentId)) continue;
    if (!componentId.startsWith("halimport:")) continue;
    if (component.halComponentName !== "iocontrol") continue;
    delete project.library.components[componentId];
  }
}

export function reconcileIocontrolManagedNodes(
  project: NoHALProject,
): NoHALProject {
  return reconcileSystemSingleton({
    project,
    systemComponentId: IOCONTROL_SYSTEM_COMPONENT_ID,
    expectedDefinition: createIocontrolSystemComponentDefinition(),
    customOverrideManager: IOCONTROL_CUSTOM_OVERRIDE_MANAGER,
    customOverrideFamily: IOCONTROL_SYSTEM_FAMILY,
    defaultPosition: defaultPositionForIocontrol(),
    isLikeNode: isIocontrolLikeNode,
    pruneUnusedImportedComponents: pruneUnusedImportedIocontrolComponents,
  });
}
