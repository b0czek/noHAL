import { describe, expect, it } from "vitest";
import { createId } from "./id";
import {
  createEmptyProject,
  REQUIRED_HAL_THREAD_NAME,
  reconcileProject,
} from "./project";

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

  it("enforces fixed export stage from component definition constraints", () => {
    const project = createEmptyProject("Export Stage Binding");
    const topSheet = project.sheets[project.rootSheetId];
    const componentId = "manual:stage-bound";
    project.library.components[componentId] = {
      id: componentId,
      name: "stage-bound",
      halComponentName: "stage-bound",
      source: "manual",
      pins: [],
      params: [],
      constraints: {
        fixedExportStage: "postgui",
      },
    };
    topSheet.nodes.push({
      id: createId("node"),
      kind: "component",
      componentId,
      instanceName: "stage_bound",
      position: { x: 100, y: 100 },
      paramValues: {},
    });

    reconcileProject(project);

    const node = topSheet.nodes.find(
      (item) => item.kind === "component" && item.componentId === componentId,
    );
    expect(node?.kind).toBe("component");
    if (node?.kind === "component") {
      expect(node.exportStage).toBe("postgui");
    }
  });
});
