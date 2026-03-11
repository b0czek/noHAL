import { describe, expect, it } from "vitest";
import {
  addMachineIniField,
  addMachineIniSection,
  createEmptyProject,
} from "./index";

describe("project edit helpers", () => {
  it("creates machine config sections and fields", () => {
    const project = createEmptyProject("Machine Config Edit");

    const section = addMachineIniSection(project);
    const field = addMachineIniField(project, 0);

    expect(project.machineConfig?.ini.sections).toHaveLength(1);
    expect(section.name).toBe("SECTION");
    expect(field?.key).toBe("KEY");
    expect(project.machineConfig?.ini.lineCount).toBe(2);
  });
});
