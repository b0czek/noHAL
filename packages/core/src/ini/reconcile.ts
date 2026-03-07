import {
  createIniSystemComponentDefinition,
  defaultPositionForIni,
  INI_SYSTEM_COMPONENT_ID,
  INI_SYSTEM_FAMILY,
  INI_SYSTEM_MANAGER,
  iniManagedInstanceConfigValues,
} from "../componentStore/catalog/system/ini";
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

function normalizeInstanceConfigValues(
  value: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!value) return undefined;
  const entries = Object.entries(value)
    .map(([key, item]) => [key.trim(), `${item}`.trim()] as const)
    .filter(([key, item]) => key.length > 0 && item.length > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

function sameInstanceConfigValues(
  a: Record<string, string> | undefined,
  b: Record<string, string> | undefined,
): boolean {
  const left = normalizeInstanceConfigValues(a);
  const right = normalizeInstanceConfigValues(b);
  if (!left && !right) return true;
  if (!left || !right) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (!(key in right)) return false;
    if (left[key] !== right[key]) return false;
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
    JSON.stringify(existing.runtime?.instanceConfig ?? null) !==
    JSON.stringify(expected.runtime?.instanceConfig ?? null)
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
  const rootSheet = project.sheets[project.rootSheetId];
  if (!rootSheet) return project;

  const expectedDefinition = createIniSystemComponentDefinition(
    project.target.linuxcncVersion,
  );
  const requiredInstanceName =
    fixedInstanceNameForComponent(expectedDefinition) ?? "ini";
  const existingDefinition =
    project.library.components[INI_SYSTEM_COMPONENT_ID];
  if (
    !isSameSystemComponentDefinition(existingDefinition, expectedDefinition)
  ) {
    project.library.components[INI_SYSTEM_COMPONENT_ID] = expectedDefinition;
  }

  const expectedInstanceConfigValues = iniManagedInstanceConfigValues(
    project.target.linuxcncVersion,
    project.motmod,
  );

  let managedIniNodeSeen = false;
  const removeNodeIds = new Set<string>();

  for (const node of rootSheet.nodes) {
    if (node.kind !== "component") continue;
    if (!isIniLikeNode(project, node)) continue;

    if (node.instanceName !== requiredInstanceName) {
      removeNodeIds.add(node.id);
      continue;
    }

    if (managedIniNodeSeen) {
      removeNodeIds.add(node.id);
      continue;
    }
    managedIniNodeSeen = true;

    node.componentId = INI_SYSTEM_COMPONENT_ID;
    if (
      !sameInstanceConfigValues(
        node.instanceConfigValues,
        expectedInstanceConfigValues,
      )
    ) {
      if (expectedInstanceConfigValues) {
        node.instanceConfigValues = { ...expectedInstanceConfigValues };
      } else {
        delete node.instanceConfigValues;
      }
    }
    if (node.exportStage !== "postgui") {
      node.exportStage = "postgui";
    }
  }

  if (removeNodeIds.size > 0) {
    rootSheet.nodes = rootSheet.nodes.filter(
      (node) => !removeNodeIds.has(node.id),
    );
  }

  if (!managedIniNodeSeen) {
    const position = chooseFreePosition(rootSheet, defaultPositionForIni());
    rootSheet.nodes.push({
      id: createId("node"),
      kind: "component",
      componentId: INI_SYSTEM_COMPONENT_ID,
      instanceName: requiredInstanceName,
      position,
      paramValues: {},
      ...(expectedInstanceConfigValues
        ? { instanceConfigValues: { ...expectedInstanceConfigValues } }
        : {}),
      exportStage: "postgui",
    });
  }

  pruneUnusedImportedIniComponents(project);
  return project;
}
