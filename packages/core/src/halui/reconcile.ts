import { isManagedBySystemManager } from "../component/system";
import {
  createHaluiSystemComponentDefinition,
  defaultPositionForHalui,
  HALUI_SYSTEM_COMPONENT_ID,
  HALUI_SYSTEM_FAMILY,
  HALUI_SYSTEM_MANAGER,
} from "../componentStore/catalog/system/halui";
import { reconcileSystemSingleton } from "../systemReconcile/singleton";
import type { ComponentNode, NoHALProject } from "../types";

const HALUI_CUSTOM_OVERRIDE_MANAGER = "halui-custom";

function isHaluiLikeNode(project: NoHALProject, node: ComponentNode): boolean {
  const component = project.library.components[node.componentId];
  if (!component) return false;
  if (
    isManagedBySystemManager(component, HALUI_SYSTEM_MANAGER) &&
    component.system?.family === HALUI_SYSTEM_FAMILY
  ) {
    return true;
  }
  return component.halComponentName === "halui";
}

function pruneUnusedImportedHaluiComponents(project: NoHALProject): void {
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
    if (component.halComponentName !== "halui") continue;
    delete project.library.components[componentId];
  }
}

export function reconcileHaluiManagedNodes(
  project: NoHALProject,
): NoHALProject {
  return reconcileSystemSingleton({
    project,
    systemComponentId: HALUI_SYSTEM_COMPONENT_ID,
    expectedDefinition: createHaluiSystemComponentDefinition(
      project.target.linuxcncVersion,
    ),
    customOverrideManager: HALUI_CUSTOM_OVERRIDE_MANAGER,
    customOverrideFamily: HALUI_SYSTEM_FAMILY,
    defaultPosition: defaultPositionForHalui(),
    isLikeNode: isHaluiLikeNode,
    pruneUnusedImportedComponents: pruneUnusedImportedHaluiComponents,
  });
}
