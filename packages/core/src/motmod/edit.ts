import { err, ok, type Result } from "neverthrow";
import type { Change, Failure } from "../result";
import type { NoHALProject, ProjectMotmodConfig } from "../types";
import { DEFAULT_MOTMOD_CONFIG } from "./config";
import {
  type MotmodReconcilePlan,
  planMotmodReconcile,
  reconcileMotmodManagedNodes,
} from "./reconcile";

function ensureProjectMotmod(project: NoHALProject): ProjectMotmodConfig {
  const motmod = project.motmod ?? { ...DEFAULT_MOTMOD_CONFIG };
  project.motmod = motmod;
  return motmod;
}

export function updateMotmodNumericConfig(
  project: NoHALProject,
  key: keyof ProjectMotmodConfig,
  value: number,
): Result<Change<number>, Failure<"invalid-input", "invalid-value">> {
  if (!Number.isFinite(value)) {
    return err({ code: "invalid-input", detail: "invalid-value" });
  }
  const rounded = Math.round(value);
  const normalized =
    key === "numJoints" || key === "numSpindles"
      ? Math.max(1, rounded)
      : Math.max(0, rounded);
  const motmod = ensureProjectMotmod(project);
  if (motmod[key] === normalized)
    return ok({ data: normalized, changed: false });
  motmod[key] = normalized;
  return ok({ data: normalized, changed: true });
}

export function syncMotmodManagedProjection(
  project: NoHALProject,
): Result<Change<MotmodReconcilePlan>, never> {
  const plan = planMotmodReconcile(project);
  if (plan.inSync) return ok({ data: plan, changed: false });
  reconcileMotmodManagedNodes(project);
  return ok({ data: plan, changed: true });
}
