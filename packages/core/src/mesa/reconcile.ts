import {
  createMesaSystemComponentDefinition,
  MESA_SYSTEM_MANAGER,
} from "../componentStore/catalog/system/mesa";
import { isManagedBySystemManager } from "../componentSystem";
import { createId } from "../id";
import { ensureSystemSheet, findSystemSheet } from "../sheet";
import { sameComponentDefinition } from "../systemReconcile/shared";
import type { ComponentNode, NoHALProject, XY } from "../types";
import { deriveMesaTopology } from "./derive";
import { createDefaultMesaConfig, normalizeProjectMesaConfig } from "./shared";
import type { ProjectMesaConfig } from "./types";

export interface MesaReconcileEnsureComponentAction {
  componentId: string;
}

export interface MesaReconcileAddNodeAction {
  componentId: string;
  instanceName: string;
}

export interface MesaReconcileRemoveNodeAction {
  nodeId: string;
  componentId: string;
}

export interface MesaReconcileUpdateNodeAction {
  nodeId: string;
  instanceName: string;
}

export interface MesaReconcilePlan {
  inSync: boolean;
  mesaWillNormalize: boolean;
  normalizedMesa: ProjectMesaConfig;
  ensureComponents: MesaReconcileEnsureComponentAction[];
  addNodes: MesaReconcileAddNodeAction[];
  removeNodes: MesaReconcileRemoveNodeAction[];
  updateNodes: MesaReconcileUpdateNodeAction[];
}

function isSameMesaConfig(
  a: ProjectMesaConfig | undefined,
  b: ProjectMesaConfig,
): boolean {
  return JSON.stringify(a ?? createDefaultMesaConfig()) === JSON.stringify(b);
}

function isMesaManagedNode(
  project: NoHALProject,
  node: ComponentNode,
): boolean {
  const component = project.library.components[node.componentId];
  if (isManagedBySystemManager(component, MESA_SYSTEM_MANAGER)) return true;
  return node.componentId.startsWith("system:mesa:");
}

function chooseFreePosition(
  sheet: NoHALProject["sheets"][string],
  preferred: XY,
): XY {
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

export function planMesaReconcile(project: NoHALProject): MesaReconcilePlan {
  const targetSheet = findSystemSheet(project);
  const normalizedMesa = normalizeProjectMesaConfig(project.mesa);
  const topology = deriveMesaTopology(normalizedMesa);
  const plan: MesaReconcilePlan = {
    inSync: true,
    mesaWillNormalize: !isSameMesaConfig(project.mesa, normalizedMesa),
    normalizedMesa,
    ensureComponents: [],
    addNodes: [],
    removeNodes: [],
    updateNodes: [],
  };
  if (!targetSheet) {
    plan.inSync = topology.nodes.length === 0 && !plan.mesaWillNormalize;
    return plan;
  }

  const expectedNodesByComponentId = new Map(
    topology.nodes.map((node) => [node.componentId, node] as const),
  );

  for (const node of topology.nodes) {
    const existing = project.library.components[node.componentId];
    const expected = createMesaSystemComponentDefinition(node);
    if (!sameComponentDefinition(existing, expected)) {
      plan.ensureComponents.push({ componentId: node.componentId });
    }
  }

  const seenComponentIds = new Set<string>();
  for (const node of targetSheet.nodes) {
    if (node.kind !== "component") continue;
    if (!isMesaManagedNode(project, node)) continue;
    const expected = expectedNodesByComponentId.get(node.componentId);
    if (!expected) {
      plan.removeNodes.push({ nodeId: node.id, componentId: node.componentId });
      continue;
    }
    seenComponentIds.add(node.componentId);
    if (node.instanceName !== expected.instanceName) {
      plan.updateNodes.push({
        nodeId: node.id,
        instanceName: expected.instanceName,
      });
    }
  }

  for (const node of topology.nodes) {
    if (seenComponentIds.has(node.componentId)) continue;
    plan.addNodes.push({
      componentId: node.componentId,
      instanceName: node.instanceName,
    });
  }

  plan.inSync =
    !plan.mesaWillNormalize &&
    plan.ensureComponents.length === 0 &&
    plan.addNodes.length === 0 &&
    plan.removeNodes.length === 0 &&
    plan.updateNodes.length === 0;
  return plan;
}

function pruneUnusedMesaComponents(project: NoHALProject): void {
  const referencedComponentIds = new Set<string>();
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      referencedComponentIds.add(node.componentId);
    }
  }
  for (const componentId of Object.keys(project.library.components)) {
    if (!componentId.startsWith("system:mesa:")) continue;
    if (referencedComponentIds.has(componentId)) continue;
    delete project.library.components[componentId];
  }
}

export function reconcileMesaManagedNodes(project: NoHALProject): NoHALProject {
  const { systemSheet } = ensureSystemSheet(project);
  const plan = planMesaReconcile(project);
  const topology = deriveMesaTopology(plan.normalizedMesa);
  const expectedByComponentId = new Map(
    topology.nodes.map((node) => [node.componentId, node] as const),
  );
  project.mesa = plan.normalizedMesa;

  for (const node of topology.nodes) {
    project.library.components[node.componentId] =
      createMesaSystemComponentDefinition(node);
  }

  const removeIds = new Set(plan.removeNodes.map((item) => item.nodeId));
  if (removeIds.size > 0) {
    systemSheet.nodes = systemSheet.nodes.filter(
      (node) => !removeIds.has(node.id),
    );
  }

  const updateByNodeId = new Map(
    plan.updateNodes.map((item) => [item.nodeId, item.instanceName] as const),
  );
  for (const node of systemSheet.nodes) {
    if (node.kind !== "component") continue;
    const nextInstanceName = updateByNodeId.get(node.id);
    if (nextInstanceName) node.instanceName = nextInstanceName;
  }

  for (const action of plan.addNodes) {
    const derivedNode = expectedByComponentId.get(action.componentId);
    if (!derivedNode) continue;
    const position = chooseFreePosition(
      systemSheet,
      derivedNode.preferredPosition,
    );
    systemSheet.nodes.push({
      id: createId("node"),
      kind: "component",
      componentId: derivedNode.componentId,
      instanceName: derivedNode.instanceName,
      position,
      paramValues: {},
    });
  }

  pruneUnusedMesaComponents(project);
  return project;
}
