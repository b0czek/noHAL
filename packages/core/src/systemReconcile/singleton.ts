import { fixedInstanceNameForComponent } from "../componentSystem";
import { createId } from "../id";
import { ensureSystemSheet } from "../sheet";
import type {
  ComponentDefinition,
  ComponentNode,
  NoHALProject,
} from "../types";
import {
  buildSystemOverrideDefinition,
  sameComponentDefinition,
  sameInstanceConfigValues,
  sameSystemComponentDefinition,
} from "./shared";

export interface ReconcileSystemSingletonOptions {
  project: NoHALProject;
  systemComponentId: string;
  expectedDefinition: ComponentDefinition;
  customOverrideManager: string;
  customOverrideFamily: string;
  defaultPosition: { x: number; y: number };
  isLikeNode: (project: NoHALProject, node: ComponentNode) => boolean;
  pruneUnusedImportedComponents?: (project: NoHALProject) => void;
  syncInstanceConfig?: boolean;
  expectedInstanceConfigValues?: Record<string, string>;
  fixedExportStage?: "main" | "postgui";
}

function chooseFreePosition(
  sheet: NoHALProject["sheets"][string],
  preferred: { x: number; y: number },
): { x: number; y: number } {
  const used = new Set(
    sheet.nodes.map(
      (node) => `${Math.round(node.position.x)}:${Math.round(node.position.y)}`,
    ),
  );
  let candidate = { ...preferred };
  while (used.has(`${Math.round(candidate.x)}:${Math.round(candidate.y)}`)) {
    candidate = { x: candidate.x + 24, y: candidate.y + 24 };
  }
  return candidate;
}

export function reconcileSystemSingleton(
  options: ReconcileSystemSingletonOptions,
): NoHALProject {
  const {
    project,
    systemComponentId,
    expectedDefinition,
    customOverrideManager,
    customOverrideFamily,
    defaultPosition,
    isLikeNode,
    pruneUnusedImportedComponents,
    syncInstanceConfig = false,
    expectedInstanceConfigValues,
    fixedExportStage,
  } = options;
  const { systemSheet } = ensureSystemSheet(project);

  const requiredInstanceName =
    fixedInstanceNameForComponent(expectedDefinition) ??
    expectedDefinition.halComponentName;
  const existingDefinition = project.library.components[systemComponentId];
  if (!sameSystemComponentDefinition(existingDefinition, expectedDefinition)) {
    project.library.components[systemComponentId] = expectedDefinition;
  }

  let managedNodeSeen = false;
  const removeNodeIds = new Set<string>();

  function syncManagedNodeState(
    node: ComponentNode,
    keepCustomOverride: boolean,
  ): void {
    if (!keepCustomOverride) {
      node.componentId = systemComponentId;
    }

    if (
      syncInstanceConfig &&
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

    if (fixedExportStage && node.exportStage !== fixedExportStage) {
      node.exportStage = fixedExportStage;
    }
  }

  for (const node of systemSheet.nodes) {
    if (node.kind !== "component") continue;
    if (!isLikeNode(project, node)) continue;

    const component = project.library.components[node.componentId];
    const customOverride = buildSystemOverrideDefinition(
      component,
      expectedDefinition,
      customOverrideManager,
      customOverrideFamily,
      expectedInstanceConfigValues,
    );
    if (customOverride && !sameComponentDefinition(component, customOverride)) {
      project.library.components[node.componentId] = customOverride;
    }
    const keepCustomOverride =
      project.library.components[node.componentId]?.system?.manager ===
      customOverrideManager;

    if (node.instanceName !== requiredInstanceName) {
      removeNodeIds.add(node.id);
      continue;
    }

    if (managedNodeSeen) {
      removeNodeIds.add(node.id);
      continue;
    }
    managedNodeSeen = true;
    syncManagedNodeState(node, keepCustomOverride);
  }

  if (removeNodeIds.size > 0) {
    systemSheet.nodes = systemSheet.nodes.filter(
      (node) => !removeNodeIds.has(node.id),
    );
  }

  if (!managedNodeSeen) {
    const position = chooseFreePosition(systemSheet, defaultPosition);
    systemSheet.nodes.push({
      id: createId("node"),
      kind: "component",
      componentId: systemComponentId,
      instanceName: requiredInstanceName,
      position,
      paramValues: {},
      ...(syncInstanceConfig && expectedInstanceConfigValues
        ? { instanceConfigValues: { ...expectedInstanceConfigValues } }
        : {}),
      ...(fixedExportStage ? { exportStage: fixedExportStage } : {}),
    });
  }

  pruneUnusedImportedComponents?.(project);
  return project;
}
