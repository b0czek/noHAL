import { createId } from "../id";
import { isRequiredHalThreadName } from "../project";
import type { HalThreadDefinition, NoHALProject } from "../types";

function nextUniqueThreadName(
  base: string,
  existing: ReadonlyArray<string>,
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

export type RemoveHalThreadResult =
  | { ok: true; thread: HalThreadDefinition }
  | { ok: false; reason: "not-found" | "last-thread" }
  | { ok: false; reason: "required-thread"; thread: HalThreadDefinition };

export function removeHalThread(
  project: NoHALProject,
  threadId: string,
): RemoveHalThreadResult {
  const threads = project.halThreads ?? [];
  if (threads.length <= 1) return { ok: false, reason: "last-thread" };
  const index = threads.findIndex((thread) => thread.id === threadId);
  if (index < 0) return { ok: false, reason: "not-found" };
  const thread = threads[index];
  if (isRequiredHalThreadName(thread.name)) {
    return { ok: false, reason: "required-thread", thread };
  }
  threads.splice(index, 1);
  for (const sheet of Object.values(project.sheets)) {
    const outputs = sheet.hal?.threadOutputs;
    if (!outputs) continue;
    for (const output of outputs) {
      if (output.halThreadId === threadId) delete output.halThreadId;
    }
  }
  return { ok: true, thread };
}

export type UpdateHalThreadNameResult =
  | { ok: true; thread: HalThreadDefinition; changed: boolean }
  | {
      ok: false;
      reason: "not-found" | "required-thread" | "duplicate-name";
      thread?: HalThreadDefinition;
    };

export function updateHalThreadName(
  project: NoHALProject,
  threadId: string,
  name: string,
): UpdateHalThreadNameResult {
  const trimmed = name.trim();
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return { ok: false, reason: "not-found" };
  if (isRequiredHalThreadName(thread.name) && trimmed !== thread.name) {
    return { ok: false, reason: "required-thread", thread };
  }
  if (!trimmed || trimmed === thread.name) {
    return { ok: true, thread, changed: false };
  }
  if (
    project.halThreads?.some(
      (candidate) => candidate.id !== threadId && candidate.name === trimmed,
    )
  ) {
    return { ok: false, reason: "duplicate-name", thread };
  }
  thread.name = trimmed;
  return { ok: true, thread, changed: true };
}

export type UpdateHalThreadFloatModeResult =
  | { ok: true; thread: HalThreadDefinition; changed: boolean }
  | { ok: false; reason: "not-found" }
  | {
      ok: false;
      reason: "required-thread-forced-fp";
      thread: HalThreadDefinition;
    };

export function updateHalThreadPeriodNs(
  project: NoHALProject,
  threadId: string,
  periodNs: number,
): { thread: HalThreadDefinition; changed: boolean } | null {
  if (!Number.isFinite(periodNs)) return null;
  const normalized = Math.max(1, Math.round(periodNs));
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return null;
  if (thread.periodNs === normalized) return { thread, changed: false };
  thread.periodNs = normalized;
  return { thread, changed: true };
}

export function updateHalThreadFloatMode(
  project: NoHALProject,
  threadId: string,
  floatMode: "fp" | "nofp",
): UpdateHalThreadFloatModeResult {
  const thread = project.halThreads?.find(
    (candidate) => candidate.id === threadId,
  );
  if (!thread) return { ok: false, reason: "not-found" };
  if (isRequiredHalThreadName(thread.name) && floatMode === "nofp") {
    thread.floatMode = "fp";
    return { ok: false, reason: "required-thread-forced-fp", thread };
  }
  if ((thread.floatMode ?? "fp") === floatMode) {
    return { ok: true, thread, changed: false };
  }
  thread.floatMode = floatMode;
  return { ok: true, thread, changed: true };
}
