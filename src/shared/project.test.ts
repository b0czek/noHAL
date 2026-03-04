import { describe, expect, it } from "vitest";
import { createEmptyProject, REQUIRED_HAL_THREAD_NAME } from "./project";

describe("project defaults", () => {
  it("binds the top sheet default output to servo-thread", () => {
    const project = createEmptyProject("Thread Default Test");
    const topSheet = project.sheets[project.rootSheetId];
    const servoThread = (project.halThreads ?? []).find(
      (thread) => thread.name === REQUIRED_HAL_THREAD_NAME,
    );

    expect(servoThread).toBeDefined();
    expect(topSheet.hal?.threadOutputs?.[0]?.halThreadId).toBe(servoThread?.id);
  });
});
