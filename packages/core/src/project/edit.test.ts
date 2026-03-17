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

    expect(updateProjectWireLayerPosition(project, "above-components")).toBe(
      true,
    );
    expect(project.ui.wireLayerPosition).toBe("above-components");
    expect(updateProjectWireLayerPosition(project, "above-components")).toBe(
      false,
    );
  });

  it("updates the project wire style", () => {
    const project = createEmptyProject("Wire Style Edit");

    expect(updateProjectWireStyle(project, "straight")).toBe(true);
    expect(project.ui.wireStyle).toBe("straight");
    expect(updateProjectWireStyle(project, "straight")).toBe(false);
  });

  it("updates the project shutdown HAL text", () => {
    const project = createEmptyProject("Shutdown Edit");

    expect(updateProjectShutdown(project, "setp estop-clear true")).toBe(true);
    expect(project.shutdown).toBe("setp estop-clear true");
    expect(updateProjectShutdown(project, "setp estop-clear true")).toBe(false);
  });
});
