import { describe, expect, it } from "vitest";
import { createId } from "../id";
import { createEmptyProject, REQUIRED_HAL_THREAD_NAME } from "../project";
import { expectErr, expectOk } from "../testUtils/result";
import { removeHalThread } from "./edit";

describe("halThread edits", () => {
  it("removes non-required HAL threads and clears sheet bindings", () => {
    const project = createEmptyProject("Thread Edit");
    const root = project.sheets[project.rootSheetId];
    const threadId = createId("thread");
    const extraThreadId = createId("thread");

    project.halThreads?.push({
      id: threadId,
      name: "fast-thread",
      periodNs: 500_000,
      floatMode: "fp",
    });
    project.halThreads?.push({
      id: extraThreadId,
      name: "slow-thread",
      periodNs: 2_000_000,
      floatMode: "fp",
    });
    if (root.hal?.threadOutputs?.[0]) {
      root.hal.threadOutputs[0].halThreadId = threadId;
    }

    const removed = expectOk(removeHalThread(project, threadId));
    expect(removed.data.id).toBe(threadId);
    expect(root.hal?.threadOutputs?.[0]?.halThreadId).toBeUndefined();

    const requiredThreadId = project.halThreads?.find(
      (thread) => thread.name === REQUIRED_HAL_THREAD_NAME,
    )?.id;
    expect(requiredThreadId).toBeDefined();
    if (requiredThreadId) {
      const blocked = expectErr(removeHalThread(project, requiredThreadId));
      expect(blocked).toEqual({
        code: "forbidden",
        cause: "hal-thread",
        detail: "required-thread",
        meta: { name: "servo-thread" },
      });
    }
  });
});
