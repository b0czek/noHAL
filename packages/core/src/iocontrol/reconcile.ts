import {
  createIocontrolSystemComponentDefinition,
  defaultPositionForIocontrol,
  IOCONTROL_INSTANCE_NAME,
  IOCONTROL_SYSTEM_COMPONENT_ID,
  IOCONTROL_SYSTEM_FAMILY,
  IOCONTROL_SYSTEM_MANAGER,
} from "../componentStore/catalog/system/iocontrol";
import {
  fixedInstanceNameForComponent,
  isManagedBySystemManager,
} from "../componentSystem";
import { createId } from "../id";
import type {
  ComponentDefinition,
  ComponentNode,
  NoHALProject,
} from "../types";

function chooseFreePosition(
  rootSheet: NoHALProject["sheets"][string],
  preferred: { x: number; y: number },
): { x: number; y: number } {
  const used = new Set(
    rootSheet.nodes.map(
      (node) => `${Math.round(node.position.x)}:${Math.round(node.position.y)}`,
    ),
  );
  let candidate = { ...preferred };
  while (used.has(`${Math.round(candidate.x)}:${Math.round(candidate.y)}`)) {
    candidate = { x: candidate.x + 24, y: candidate.y + 24 };
  }
  return candidate;
}

function samePinSchema(
  a: ComponentDefinition["pins"],
  b: ComponentDefinition["pins"],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) return false;
    if (
      left.key !== right.key ||
      left.name !== right.name ||
      left.direction !== right.direction ||
      left.type !== right.type
    ) {
      return false;
    }
  }
  return true;
}

function isSameSystemComponentDefinition(
  existing: ComponentDefinition | undefined,
  expected: ComponentDefinition,
): boolean {
  if (!existing) return false;
  if (existing.halComponentName !== expected.halComponentName) return false;
  if (existing.source !== expected.source) return false;
  if (
    (existing.runtime?.kind ?? "unknown") !==
    (expected.runtime?.kind ?? "unknown")
  ) {
    return false;
  }
  if (
    existing.system?.manager !== expected.system?.manager ||
    existing.system?.family !== expected.system?.family
  ) {
    return false;
  }
  if (
    JSON.stringify(existing.constraints ?? null) !==
    JSON.stringify(expected.constraints ?? null)
  ) {
    return false;
  }
  return samePinSchema(existing.pins, expected.pins);
}

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
  const rootSheet = project.sheets[project.rootSheetId];
  if (!rootSheet) return project;

  const expectedDefinition = createIocontrolSystemComponentDefinition();
  const requiredInstanceName =
    fixedInstanceNameForComponent(expectedDefinition) ??
    IOCONTROL_INSTANCE_NAME;
  const existingDefinition =
    project.library.components[IOCONTROL_SYSTEM_COMPONENT_ID];
  if (
    !isSameSystemComponentDefinition(existingDefinition, expectedDefinition)
  ) {
    project.library.components[IOCONTROL_SYSTEM_COMPONENT_ID] =
      expectedDefinition;
  }

  let managedIocontrolNodeSeen = false;
  const removeNodeIds = new Set<string>();

  for (const node of rootSheet.nodes) {
    if (node.kind !== "component") continue;
    if (!isIocontrolLikeNode(project, node)) continue;

    if (node.instanceName !== requiredInstanceName) {
      removeNodeIds.add(node.id);
      continue;
    }

    if (managedIocontrolNodeSeen) {
      removeNodeIds.add(node.id);
      continue;
    }
    managedIocontrolNodeSeen = true;
    node.componentId = IOCONTROL_SYSTEM_COMPONENT_ID;
  }

  if (removeNodeIds.size > 0) {
    rootSheet.nodes = rootSheet.nodes.filter(
      (node) => !removeNodeIds.has(node.id),
    );
  }

  if (!managedIocontrolNodeSeen) {
    const position = chooseFreePosition(
      rootSheet,
      defaultPositionForIocontrol(),
    );
    rootSheet.nodes.push({
      id: createId("node"),
      kind: "component",
      componentId: IOCONTROL_SYSTEM_COMPONENT_ID,
      instanceName: requiredInstanceName,
      position,
      paramValues: {},
    });
  }

  pruneUnusedImportedIocontrolComponents(project);
  return project;
}
