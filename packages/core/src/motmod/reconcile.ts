import {
  createMotmodSystemComponentDefinition,
  defaultPositionForMotmodFamily,
  MOTMOD_MANAGED_FAMILIES,
  MOTMOD_SYSTEM_COMPONENT_IDS,
  type MotmodManagedFamily,
  managedInstanceConfigValuesForFamily,
  requiredMotmodInstancesByFamily,
} from "../componentStore/catalog/system/motmod";
import { isManagedBySystemManager } from "../componentSystem";
import { createId } from "../id";
import {
  buildSystemOverrideDefinition,
  sameComponentDefinition,
  sameInstanceConfigValues,
  sameSystemComponentDefinition,
} from "../systemReconcile/shared";
import { ensureSystemSheet, findSystemSheet } from "../systemSheet";
import type {
  ComponentDefinition,
  ComponentNode,
  NoHALProject,
  ProjectMotmodConfig,
} from "../types";

const MOTMOD_MANAGED_FAMILY_SET = new Set<MotmodManagedFamily>(
  MOTMOD_MANAGED_FAMILIES,
);
const MOTMOD_CUSTOM_OVERRIDE_MANAGER = "motmod-custom";
const MOTMOD_FAMILY_BY_SYSTEM_COMPONENT_ID = Object.fromEntries(
  Object.entries(MOTMOD_SYSTEM_COMPONENT_IDS).map(([family, componentId]) => [
    componentId,
    family as MotmodManagedFamily,
  ]),
) as Record<string, MotmodManagedFamily>;

const DEFAULT_MOTMOD_CONFIG: ProjectMotmodConfig = {
  numJoints: 3,
  numDio: 4,
  numAio: 4,
  numSpindles: 1,
  numMiscError: 0,
  trajPeriodNs: 0,
};

export interface MotmodReconcileEnsureComponentAction {
  family: MotmodManagedFamily;
  componentId: string;
}

export interface MotmodReconcileAddNodeAction {
  family: MotmodManagedFamily;
  instanceName: string;
}

export interface MotmodReconcileRemoveNodeAction {
  nodeId: string;
  family: MotmodManagedFamily;
  instanceName: string;
}

export interface MotmodReconcileAdoptNodeAction {
  nodeId: string;
  family: MotmodManagedFamily;
  instanceName: string;
}

export interface MotmodReconcileUpdateNodeConfigAction {
  nodeId: string;
  family: MotmodManagedFamily;
  instanceName: string;
  instanceConfigValues?: Record<string, string>;
}

export interface MotmodReconcileUpgradeComponentAction {
  componentId: string;
  family: MotmodManagedFamily;
}

export interface MotmodReconcilePlan {
  inSync: boolean;
  motmodWillNormalize: boolean;
  normalizedMotmod: ProjectMotmodConfig;
  ensureComponents: MotmodReconcileEnsureComponentAction[];
  upgradeComponents: MotmodReconcileUpgradeComponentAction[];
  addNodes: MotmodReconcileAddNodeAction[];
  removeNodes: MotmodReconcileRemoveNodeAction[];
  adoptNodes: MotmodReconcileAdoptNodeAction[];
  updateNodeConfigs: MotmodReconcileUpdateNodeConfigAction[];
}

function clampInt(
  n: unknown,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n as number)));
}

function normalizeMotmodConfig(
  value: Partial<ProjectMotmodConfig> | undefined,
): ProjectMotmodConfig {
  return {
    numJoints: clampInt(
      value?.numJoints,
      DEFAULT_MOTMOD_CONFIG.numJoints,
      1,
      64,
    ),
    numDio: clampInt(value?.numDio, DEFAULT_MOTMOD_CONFIG.numDio, 0, 256),
    numAio: clampInt(value?.numAio, DEFAULT_MOTMOD_CONFIG.numAio, 0, 256),
    numSpindles: clampInt(
      value?.numSpindles,
      DEFAULT_MOTMOD_CONFIG.numSpindles,
      1,
      16,
    ),
    numMiscError: clampInt(
      value?.numMiscError,
      DEFAULT_MOTMOD_CONFIG.numMiscError,
      0,
      256,
    ),
    trajPeriodNs: clampInt(
      value?.trajPeriodNs,
      DEFAULT_MOTMOD_CONFIG.trajPeriodNs,
      0,
      100_000_000,
    ),
  };
}

function isSameMotmodConfig(
  a: Partial<ProjectMotmodConfig> | undefined,
  b: ProjectMotmodConfig,
): boolean {
  if (!a) return false;
  return (
    a.numJoints === b.numJoints &&
    a.numDio === b.numDio &&
    a.numAio === b.numAio &&
    a.numSpindles === b.numSpindles &&
    a.numMiscError === b.numMiscError &&
    a.trajPeriodNs === b.trajPeriodNs
  );
}

function familyFromNode(
  project: NoHALProject,
  node: ComponentNode,
): MotmodManagedFamily | null {
  const familyFromSystemComponentId =
    MOTMOD_FAMILY_BY_SYSTEM_COMPONENT_ID[node.componentId];
  if (familyFromSystemComponentId) {
    return familyFromSystemComponentId;
  }
  const component = project.library.components[node.componentId];
  const managedFamily = isManagedBySystemManager(component, "motmod")
    ? component.system?.family
    : undefined;
  if (
    managedFamily &&
    MOTMOD_MANAGED_FAMILY_SET.has(managedFamily as MotmodManagedFamily)
  ) {
    return managedFamily as MotmodManagedFamily;
  }
  const halName = component?.halComponentName;
  if (!halName) return null;
  if (!MOTMOD_MANAGED_FAMILY_SET.has(halName as MotmodManagedFamily)) {
    return null;
  }
  return halName as MotmodManagedFamily;
}

function isManagedAsFamily(
  project: NoHALProject,
  node: ComponentNode,
  family: MotmodManagedFamily,
): boolean {
  const component = project.library.components[node.componentId];
  return (
    isManagedBySystemManager(component, "motmod") &&
    component?.system?.family === family
  );
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

function buildMotmodCustomOverrideDefinition(
  component: ComponentDefinition | undefined,
  family: MotmodManagedFamily,
  linuxcncVersion: NoHALProject["target"]["linuxcncVersion"],
  motmod: ProjectMotmodConfig,
): ComponentDefinition | null {
  if (!component) return null;
  const expected = createMotmodSystemComponentDefinition(
    family,
    linuxcncVersion,
  );
  return buildSystemOverrideDefinition(
    component,
    expected,
    MOTMOD_CUSTOM_OVERRIDE_MANAGER,
    family,
    managedInstanceConfigValuesForFamily(family, linuxcncVersion, motmod),
  );
}

function pruneUnusedImportedMotmodFamilyComponents(
  project: NoHALProject,
): void {
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
    if (
      !MOTMOD_MANAGED_FAMILY_SET.has(
        component.halComponentName as MotmodManagedFamily,
      )
    ) {
      continue;
    }
    delete project.library.components[componentId];
  }
}

export function planMotmodReconcile(
  project: NoHALProject,
): MotmodReconcilePlan {
  // Planning must stay read-only; if the canonical System sheet is missing,
  // treat the project as out of sync and let reconcile recreate it.
  const targetSheet = findSystemSheet(project);
  const normalizedMotmod = normalizeMotmodConfig(project.motmod);
  const plan: MotmodReconcilePlan = {
    inSync: true,
    motmodWillNormalize: !isSameMotmodConfig(project.motmod, normalizedMotmod),
    normalizedMotmod,
    ensureComponents: [],
    upgradeComponents: [],
    addNodes: [],
    removeNodes: [],
    adoptNodes: [],
    updateNodeConfigs: [],
  };
  if (!targetSheet) {
    plan.inSync = false;
    return plan;
  }

  const requiredByFamily = requiredMotmodInstancesByFamily(
    project.target.linuxcncVersion,
    normalizedMotmod,
  );

  for (const family of MOTMOD_MANAGED_FAMILIES) {
    if (requiredByFamily[family].length === 0) continue;
    const componentId = MOTMOD_SYSTEM_COMPONENT_IDS[family];
    const existing = project.library.components[componentId];
    const expected = createMotmodSystemComponentDefinition(
      family,
      project.target.linuxcncVersion,
    );
    if (!sameSystemComponentDefinition(existing, expected)) {
      plan.ensureComponents.push({ family, componentId });
    }
  }

  for (const family of MOTMOD_MANAGED_FAMILIES) {
    const requiredInstances = requiredByFamily[family];
    const requiredSet = new Set(requiredInstances);
    const seenManagedRequired = new Set<string>();
    const queuedUpgradeComponentIds = new Set<string>();
    const expectedInstanceConfigValues = managedInstanceConfigValuesForFamily(
      family,
      project.target.linuxcncVersion,
      normalizedMotmod,
    );

    for (const node of targetSheet.nodes) {
      if (node.kind !== "component") continue;
      const nodeFamily = familyFromNode(project, node);
      if (nodeFamily !== family) continue;

      const wasManaged = isManagedAsFamily(project, node, family);
      const component = project.library.components[node.componentId];
      const customOverride = buildMotmodCustomOverrideDefinition(
        component,
        family,
        project.target.linuxcncVersion,
        normalizedMotmod,
      );
      if (
        customOverride &&
        !sameComponentDefinition(component, customOverride) &&
        !queuedUpgradeComponentIds.has(node.componentId)
      ) {
        plan.upgradeComponents.push({
          componentId: node.componentId,
          family,
        });
        queuedUpgradeComponentIds.add(node.componentId);
      }
      const isCustomOverride =
        component?.system?.manager === MOTMOD_CUSTOM_OVERRIDE_MANAGER ||
        !!customOverride;
      const canAdopt =
        !wasManaged &&
        requiredSet.has(node.instanceName) &&
        (component?.runtime?.kind !== "rt" ||
          component?.system?.manager === MOTMOD_CUSTOM_OVERRIDE_MANAGER) &&
        !customOverride;

      if (canAdopt) {
        plan.adoptNodes.push({
          nodeId: node.id,
          family,
          instanceName: node.instanceName,
        });
      }

      if (!wasManaged && !canAdopt && !isCustomOverride) continue;

      if (!requiredSet.has(node.instanceName)) {
        plan.removeNodes.push({
          nodeId: node.id,
          family,
          instanceName: node.instanceName,
        });
        continue;
      }

      if (seenManagedRequired.has(node.instanceName)) {
        plan.removeNodes.push({
          nodeId: node.id,
          family,
          instanceName: node.instanceName,
        });
        continue;
      }
      seenManagedRequired.add(node.instanceName);

      if (
        !sameInstanceConfigValues(
          node.instanceConfigValues,
          expectedInstanceConfigValues,
        )
      ) {
        plan.updateNodeConfigs.push({
          nodeId: node.id,
          family,
          instanceName: node.instanceName,
          ...(expectedInstanceConfigValues
            ? { instanceConfigValues: { ...expectedInstanceConfigValues } }
            : {}),
        });
      }
    }

    const removedNodeIds = new Set(plan.removeNodes.map((item) => item.nodeId));
    for (const instanceName of requiredInstances) {
      const exists = targetSheet.nodes.some((node) => {
        if (removedNodeIds.has(node.id)) return false;
        if (node.kind !== "component") return false;
        if (node.instanceName !== instanceName) return false;
        return familyFromNode(project, node) === family;
      });
      if (exists) continue;
      plan.addNodes.push({ family, instanceName });
    }
  }

  plan.inSync =
    !plan.motmodWillNormalize &&
    plan.ensureComponents.length === 0 &&
    plan.upgradeComponents.length === 0 &&
    plan.addNodes.length === 0 &&
    plan.removeNodes.length === 0 &&
    plan.adoptNodes.length === 0 &&
    plan.updateNodeConfigs.length === 0;

  return plan;
}

export function reconcileMotmodManagedNodes(
  project: NoHALProject,
): NoHALProject {
  const { systemSheet } = ensureSystemSheet(project);
  const plan = planMotmodReconcile(project);
  project.motmod = plan.normalizedMotmod;
  if (!systemSheet) return project;

  for (const action of plan.ensureComponents) {
    project.library.components[action.componentId] =
      createMotmodSystemComponentDefinition(
        action.family,
        project.target.linuxcncVersion,
      );
  }

  for (const action of plan.upgradeComponents) {
    const upgraded = buildMotmodCustomOverrideDefinition(
      project.library.components[action.componentId],
      action.family,
      project.target.linuxcncVersion,
      plan.normalizedMotmod,
    );
    if (!upgraded) continue;
    project.library.components[action.componentId] = upgraded;
  }

  const adoptNodeIdSet = new Set(plan.adoptNodes.map((item) => item.nodeId));
  for (const node of systemSheet.nodes) {
    if (node.kind !== "component") continue;
    if (!adoptNodeIdSet.has(node.id)) continue;
    const family = familyFromNode(project, node);
    if (!family) continue;
    node.componentId = MOTMOD_SYSTEM_COMPONENT_IDS[family];
  }

  for (const node of systemSheet.nodes) {
    if (node.kind !== "component") continue;
    const family = familyFromNode(project, node);
    if (!family) continue;
    const component = project.library.components[node.componentId];
    if (!isManagedBySystemManager(component, "motmod")) continue;
    node.componentId = MOTMOD_SYSTEM_COMPONENT_IDS[family];
  }

  const removeNodeIdSet = new Set(plan.removeNodes.map((item) => item.nodeId));
  if (removeNodeIdSet.size > 0) {
    systemSheet.nodes = systemSheet.nodes.filter(
      (node) => !removeNodeIdSet.has(node.id),
    );
  }

  const updateNodeConfigById = new Map(
    plan.updateNodeConfigs.map((item) => [
      item.nodeId,
      item.instanceConfigValues ? { ...item.instanceConfigValues } : undefined,
    ]),
  );
  for (const node of systemSheet.nodes) {
    if (node.kind !== "component") continue;
    if (!updateNodeConfigById.has(node.id)) continue;
    const instanceConfigValues = updateNodeConfigById.get(node.id);
    if (instanceConfigValues) {
      node.instanceConfigValues = instanceConfigValues;
      continue;
    }
    delete node.instanceConfigValues;
  }

  const addCountByFamily = new Map<MotmodManagedFamily, number>();
  for (const action of plan.addNodes) {
    const index = addCountByFamily.get(action.family) ?? 0;
    addCountByFamily.set(action.family, index + 1);
    const instanceConfigValues = managedInstanceConfigValuesForFamily(
      action.family,
      project.target.linuxcncVersion,
      plan.normalizedMotmod,
    );
    const position = chooseFreePosition(
      systemSheet,
      defaultPositionForMotmodFamily(action.family, index),
    );
    systemSheet.nodes.push({
      id: createId("node"),
      kind: "component",
      componentId: MOTMOD_SYSTEM_COMPONENT_IDS[action.family],
      instanceName: action.instanceName,
      position,
      paramValues: {},
      ...(instanceConfigValues
        ? { instanceConfigValues: { ...instanceConfigValues } }
        : {}),
    });
  }

  pruneUnusedImportedMotmodFamilyComponents(project);
  return project;
}
