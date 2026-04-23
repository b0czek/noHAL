import { err, ok } from "neverthrow";
import { createId } from "../id";
import { isRequiredHalThreadName } from "../project";
import type {
  ChangeResult,
  DuplicateNameFailure,
  ForbiddenFailure,
  InvalidInputFailure,
  NotFoundFailure,
} from "../result";
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

export type RemoveHalThreadResult = ChangeResult<
  HalThreadDefinition,
  | NotFoundFailure<"hal-thread">
  | ForbiddenFailure<"hal-thread", "last-thread">
  | ForbiddenFailure<"hal-thread", "required-thread", { name: string }>
>;

export function removeHalThread(
  project: NoHALProject,
  threadId: string,
): RemoveHalThreadResult {
  const threads = project.halThreads ?? [];
  if (threads.length <= 1) {
    return err({
      code: "forbidden",
      cause: "hal-thread",
      detail: "last-thread",
    });
  }
  const index = threads.findIndex((thread) => thread.id === threadId);
  if (index < 0) return err({ code: "not-found", cause: "hal-thread" });
  const thread = threads[index];
  if (isRequiredHalThreadName(thread.name))
    return err({
      code: "forbidden",
      cause: "hal-thread",
      detail: "required-thread",
      meta: { name: thread.name },
    });
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

export type UpdateHalThreadNameResult = ChangeResult<
  HalThreadDefinition,
  | NotFoundFailure<"hal-thread">
  | ForbiddenFailure<"hal-thread-name", "required-thread", { name: string }>
  | DuplicateNameFailure<"hal-thread-name", { name: string }>
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
  if (!thread) return err({ code: "not-found", cause: "hal-thread" });
  if (isRequiredHalThreadName(thread.name) && trimmed !== thread.name)
    return err({
      code: "forbidden",
      cause: "hal-thread-name",
      detail: "required-thread",
      meta: { name: thread.name },
    });
  if (!trimmed || trimmed === thread.name)
    return ok({ data: thread, changed: false });
  if (
    project.halThreads?.some(
      (candidate) => candidate.id !== threadId && candidate.name === trimmed,
    )
  ) {
    return err({
      code: "conflict",
      cause: "hal-thread-name",
      detail: "duplicate-name",
      meta: { name: trimmed },
    });
  }
  thread.name = trimmed;
  return ok({ data: thread, changed: true });
}

export function updateHalThreadPeriodNs(
  project: NoHALProject,
  threadId: string,
  periodNs: number,
): ChangeResult<
  HalThreadDefinition,
  | InvalidInputFailure<"hal-thread-period", "invalid-period">
  | NotFoundFailure<"hal-thread">
> {
  if (!Number.isFinite(periodNs)) {
    return err({
      code: "invalid-input",
      cause: "hal-thread-period",
      detail: "invalid-period",
    });
  }
  const normalized = Math.max(1, Math.round(periodNs));
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return err({ code: "not-found", cause: "hal-thread" });
  if (thread.periodNs === normalized)
    return ok({ data: thread, changed: false });
  thread.periodNs = normalized;
  return ok({ data: thread, changed: true });
}

export type UpdateHalThreadFloatModeResult = ChangeResult<
  HalThreadDefinition,
  | NotFoundFailure<"hal-thread">
  | ForbiddenFailure<"hal-thread-float-mode", "forced-fp", { name: string }>
>;

export function updateHalThreadFloatMode(
  project: NoHALProject,
  threadId: string,
  floatMode: "fp" | "nofp",
): UpdateHalThreadFloatModeResult {
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return err({ code: "not-found", cause: "hal-thread" });
  if (isRequiredHalThreadName(thread.name) && floatMode === "nofp")
    return err({
      code: "forbidden",
      cause: "hal-thread-float-mode",
      detail: "forced-fp",
      meta: { name: thread.name },
    });
  if ((thread.floatMode ?? "fp") === floatMode)
    return ok({ data: thread, changed: false });
  thread.floatMode = floatMode;
  return ok({ data: thread, changed: true });
}

export const halThreadEdits = {
  add: addHalThread,
  remove: removeHalThread,
  name: {
    update: updateHalThreadName,
  },
  periodNs: {
    update: updateHalThreadPeriodNs,
  },
  floatMode: {
    update: updateHalThreadFloatMode,
  },
};
