import {
  createIniSystemComponentDefinition,
  defaultPositionForIni,
  INI_SYSTEM_COMPONENT_ID,
  INI_SYSTEM_FAMILY,
  INI_SYSTEM_MANAGER,
  iniManagedInstanceConfigValues,
} from "../componentStore/catalog/system/ini";
import { isManagedBySystemManager } from "../componentSystem";
import { reconcileSystemSingleton } from "../systemReconcile/singleton";
import type { ComponentNode, NoHALProject } from "../types";

const INI_CUSTOM_OVERRIDE_MANAGER = "ini-custom";

function isIniLikeNode(project: NoHALProject, node: ComponentNode): boolean {
  const component = project.library.components[node.componentId];
  if (!component) return false;
  if (
    isManagedBySystemManager(component, INI_SYSTEM_MANAGER) &&
    component.system?.family === INI_SYSTEM_FAMILY
  ) {
    return true;
  }
  return component.halComponentName === "ini";
}

function pruneUnusedImportedIniComponents(project: NoHALProject): void {
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
    if (component.halComponentName !== "ini") continue;
    delete project.library.components[componentId];
  }
}

export function reconcileIniManagedNodes(project: NoHALProject): NoHALProject {
  const expectedDefinition = createIniSystemComponentDefinition(
    project.target.linuxcncVersion,
  );
  const expectedInstanceConfigValues = iniManagedInstanceConfigValues(
    project.target.linuxcncVersion,
    project.motmod,
  );

  return reconcileSystemSingleton({
    project,
    systemComponentId: INI_SYSTEM_COMPONENT_ID,
    expectedDefinition,
    customOverrideManager: INI_CUSTOM_OVERRIDE_MANAGER,
    customOverrideFamily: INI_SYSTEM_FAMILY,
    defaultPosition: defaultPositionForIni(),
    isLikeNode: isIniLikeNode,
    pruneUnusedImportedComponents: pruneUnusedImportedIniComponents,
    syncInstanceConfig: true,
    expectedInstanceConfigValues,
    fixedExportStage: "postgui",
  });
}
