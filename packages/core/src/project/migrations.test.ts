import { describe, expect, it } from "vitest";
import { NOHAL_PROJECT_VERSION } from "./formats";
import { migrateProjectDocumentToCurrentVersion } from "./migrations";
import { createEmptyProject } from "./project";

describe("project migrations", () => {
  it("upgrades v1 machine config ini to the current version", () => {
    const project = createEmptyProject("Legacy INI Split");
    const migrated = migrateProjectDocumentToCurrentVersion({
      ...project,
      version: 1,
      machineConfig: {
        source: "imported-linuxcnc-config",
        ini: {
          parser: "nohal-ini-v1",
          sourcePath: "/machines/demo/demo.ini",
          sourceFileName: "demo.ini",
          lineCount: 6,
          warnings: [],
          sections: [
            {
              name: "HAL",
              line: 1,
              entries: [
                { key: "HALFILE", value: "core.hal", line: 2 },
                { key: "POSTGUI_HALFILE", value: "postgui.hal", line: 3 },
                { key: "SHUTDOWN", value: "shutdown.hal", line: 4 },
                { key: "TWOPASS", value: "on", line: 5 },
              ],
            },
          ],
        },
        halSources: [],
      },
    }) as ReturnType<typeof createEmptyProject>;

    expect(migrated.version).toBe(NOHAL_PROJECT_VERSION);
    expect(migrated.machineConfig?.userIni.sections).toEqual([
      {
        name: "HAL",
        line: 1,
        entries: [{ key: "TWOPASS", value: "on", line: 5 }],
      },
    ]);
  });

  it("upgrades v2 root and system sheet roles to v3", () => {
    const project = createEmptyProject("Legacy Sheet Roles");
    const rootSheet = project.sheets[project.rootSheetId];
    const systemSheet = Object.values(project.sheets).find(
      (sheet) => sheet.role === "system",
    );
    if (!systemSheet) throw new Error("expected system sheet");

    const migrated = migrateProjectDocumentToCurrentVersion({
      ...project,
      version: 2,
      sheets: {
        ...project.sheets,
        [rootSheet.id]: {
          ...rootSheet,
          role: "root",
        },
        [systemSheet.id]: {
          ...systemSheet,
          role: "system",
        },
      },
    }) as ReturnType<typeof createEmptyProject>;

    expect(migrated.version).toBe(NOHAL_PROJECT_VERSION);
    expect(migrated.sheets[migrated.rootSheetId]?.role).toBeUndefined();
    expect(migrated.sheets[systemSheet.id]?.role).toBe("system");
  });
});
