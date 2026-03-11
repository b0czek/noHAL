import type { NoHALProject, ProjectMotmodConfig } from "../types";
import {
  type MotmodReconcilePlan,
  planMotmodReconcile,
  reconcileMotmodManagedNodes,
} from "./reconcile";

const DEFAULT_MOTMOD_CONFIG: ProjectMotmodConfig = {
  numJoints: 3,
  numDio: 4,
  numAio: 4,
  numSpindles: 1,
  numMiscError: 0,
  trajPeriodNs: 0,
};

function ensureProjectMotmod(project: NoHALProject): ProjectMotmodConfig {
  const motmod = project.motmod ?? { ...DEFAULT_MOTMOD_CONFIG };
  project.motmod = motmod;
  return motmod;
}

export function updateMotmodNumericConfig(
  project: NoHALProject,
  key: keyof ProjectMotmodConfig,
  value: number,
): boolean {
  if (!Number.isFinite(value)) return false;
  const rounded = Math.round(value);
  const normalized =
    key === "numJoints" || key === "numSpindles"
      ? Math.max(1, rounded)
      : Math.max(0, rounded);
  const motmod = ensureProjectMotmod(project);
  if (motmod[key] === normalized) return false;
  motmod[key] = normalized;
  return true;
}

export function syncMotmodManagedProjection(project: NoHALProject): {
  changed: boolean;
  plan: MotmodReconcilePlan;
} {
  const plan = planMotmodReconcile(project);
  if (plan.inSync) {
    return { changed: false, plan };
  }
  reconcileMotmodManagedNodes(project);
  return { changed: true, plan };
}
