import { describe, expect, it } from "vitest";
import { migrateProjectDocumentToCurrentVersion } from "./migrations";
import { createEmptyProject } from "./project";

describe("project migrations", () => {
  it("upgrades v1 machine config ini to v2 userIni", () => {
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

    expect(migrated.version).toBe(2);
    expect(migrated.machineConfig?.userIni.sections).toEqual([
      {
        name: "HAL",
        line: 1,
        entries: [{ key: "TWOPASS", value: "on", line: 5 }],
      },
    ]);
  });
});
