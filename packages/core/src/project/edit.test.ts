import { describe, expect, it } from "vitest";
import {
  addMachineIniField,
  addMachineIniSection,
  createEmptyProject,
  updateProjectShutdown,
  updateProjectWireLayerPosition,
  updateProjectWireStyle,
} from "./index";

describe("project edit helpers", () => {
  it("creates machine config sections and fields", () => {
    const project = createEmptyProject("Machine Config Edit");

    const section = addMachineIniSection(project);
    const field = addMachineIniField(project, 0);

    expect(project.machineConfig?.userIni.sections).toHaveLength(1);
    expect(section.name).toBe("SECTION");
    expect(field?.key).toBe("KEY");
    expect(project.machineConfig?.userIni.lineCount).toBe(2);
  });

  it("updates the project wire layer position", () => {
    const project = createEmptyProject("Wire Layer Edit");

    const changed = updateProjectWireLayerPosition(project, "above-components");
    expect(changed.isOk()).toBe(true);
    if (changed.isErr()) throw new Error("expected ok result");
    expect(changed.value).toEqual({
      changed: true,
      data: "above-components",
    });
    expect(project.ui.wireLayerPosition).toBe("above-components");
    const unchanged = updateProjectWireLayerPosition(
      project,
      "above-components",
    );
    expect(unchanged.isOk()).toBe(true);
    if (unchanged.isErr()) throw new Error("expected ok result");
    expect(unchanged.value).toEqual({
      changed: false,
      data: "above-components",
    });
  });

  it("updates the project wire style", () => {
    const project = createEmptyProject("Wire Style Edit");

    const changed = updateProjectWireStyle(project, "straight");
    expect(changed.isOk()).toBe(true);
    if (changed.isErr()) throw new Error("expected ok result");
    expect(changed.value).toEqual({
      changed: true,
      data: "straight",
    });
    expect(project.ui.wireStyle).toBe("straight");
    const unchanged = updateProjectWireStyle(project, "straight");
    expect(unchanged.isOk()).toBe(true);
    if (unchanged.isErr()) throw new Error("expected ok result");
    expect(unchanged.value).toEqual({
      changed: false,
      data: "straight",
    });
  });

  it("updates the project shutdown HAL text", () => {
    const project = createEmptyProject("Shutdown Edit");

    const changed = updateProjectShutdown(project, "setp estop-clear true");
    expect(changed.isOk()).toBe(true);
    if (changed.isErr()) throw new Error("expected ok result");
    expect(changed.value).toEqual({
      changed: true,
      data: "setp estop-clear true",
    });
    expect(project.shutdown).toBe("setp estop-clear true");
    const unchanged = updateProjectShutdown(project, "setp estop-clear true");
    expect(unchanged.isOk()).toBe(true);
    if (unchanged.isErr()) throw new Error("expected ok result");
    expect(unchanged.value).toEqual({
      changed: false,
      data: "setp estop-clear true",
    });
  });
});
