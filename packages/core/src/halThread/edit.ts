import { err, ok, type Result } from "neverthrow";
import { createId } from "../id";
import { isRequiredHalThreadName } from "../project";
import type { Change, Failure } from "../result";
import type { HalThreadDefinition, NoHALProject } from "../types";

function nextUniqueThreadName(
  base: string,
  existing: readonly string[],
): string {
  const normalized = base.trim() || "thread";
  if (!existing.includes(normalized)) return normalized;
  let index = 1;
  while (existing.includes(`${normalized}-${index}`)) index += 1;
  return `${normalized}-${index}`;
}

export function addHalThread(project: NoHALProject): HalThreadDefinition {
  const threads = project.halThreads ?? [];
  project.halThreads = threads;
  const thread: HalThreadDefinition = {
    id: createId("thread"),
    name: nextUniqueThreadName(
      "servo-thread",
      threads.map((candidate) => candidate.name),
    ),
    periodNs: 1_000_000,
    floatMode: "fp",
  };
  threads.push(thread);
  return thread;
}

export type RemoveHalThreadResult = Result<
  Change<HalThreadDefinition>,
  | Failure<"not-found">
  | Failure<"forbidden", "last-thread">
  | Failure<"forbidden", "required-thread">
>;

export function removeHalThread(
  project: NoHALProject,
  threadId: string,
): RemoveHalThreadResult {
  const threads = project.halThreads ?? [];
  if (threads.length <= 1) {
    return err({ code: "forbidden", detail: "last-thread" });
  }
  const index = threads.findIndex((thread) => thread.id === threadId);
  if (index < 0) return err({ code: "not-found" });
  const thread = threads[index];
  if (isRequiredHalThreadName(thread.name))
    return err({ code: "forbidden", detail: "required-thread" });
  threads.splice(index, 1);
  for (const sheet of Object.values(project.sheets)) {
    const outputs = sheet.hal?.threadOutputs;
    if (!outputs) continue;
    for (const output of outputs) {
      if (output.halThreadId === threadId) delete output.halThreadId;
    }
  }
  return ok({ data: thread, changed: true });
}

export type UpdateHalThreadNameResult = Result<
  Change<HalThreadDefinition>,
  | Failure<"not-found">
  | Failure<"forbidden", "required-thread">
  | Failure<"conflict", "duplicate-name">
>;

export function updateHalThreadName(
  project: NoHALProject,
  threadId: string,
  name: string,
): UpdateHalThreadNameResult {
  const trimmed = name.trim();
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return err({ code: "not-found" });
  if (isRequiredHalThreadName(thread.name) && trimmed !== thread.name)
    return err({ code: "forbidden", detail: "required-thread" });
  if (!trimmed || trimmed === thread.name)
    return ok({ data: thread, changed: false });
  if (
    project.halThreads?.some(
      (candidate) => candidate.id !== threadId && candidate.name === trimmed,
    )
  ) {
    return err({ code: "conflict", detail: "duplicate-name" });
  }
  thread.name = trimmed;
  return ok({ data: thread, changed: true });
}

export function updateHalThreadPeriodNs(
  project: NoHALProject,
  threadId: string,
  periodNs: number,
): Result<
  Change<HalThreadDefinition>,
  Failure<"invalid-input", "invalid-period"> | Failure<"not-found">
> {
  if (!Number.isFinite(periodNs)) {
    return err({ code: "invalid-input", detail: "invalid-period" });
  }
  const normalized = Math.max(1, Math.round(periodNs));
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return err({ code: "not-found" });
  if (thread.periodNs === normalized)
    return ok({ data: thread, changed: false });
  thread.periodNs = normalized;
  return ok({ data: thread, changed: true });
}

export type UpdateHalThreadFloatModeResult = Result<
  Change<HalThreadDefinition>,
  Failure<"not-found"> | Failure<"forbidden", "forced-fp">
>;

export function updateHalThreadFloatMode(
  project: NoHALProject,
  threadId: string,
  floatMode: "fp" | "nofp",
): UpdateHalThreadFloatModeResult {
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return err({ code: "not-found" });
  if (isRequiredHalThreadName(thread.name) && floatMode === "nofp")
    return err({ code: "forbidden", detail: "forced-fp" });
  if ((thread.floatMode ?? "fp") === floatMode)
    return ok({ data: thread, changed: false });
  thread.floatMode = floatMode;
  return ok({ data: thread, changed: true });
}
