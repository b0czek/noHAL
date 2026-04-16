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

  it("upgrades v3 Mesa connector-scoped process data mode to smart-serial assignments", () => {
    const project = createEmptyProject("Legacy Mesa Process Data Mode");

    const migrated = migrateProjectDocumentToCurrentVersion({
      ...project,
      version: 3,
      mesa: {
        hosts: [
          {
            id: "mesa_host_legacy",
            kind: "7i92t",
            ip: "10.10.10.10",
            connectors: [
              {
                connectorKey: "p1",
                cardKind: "7i77",
                processDataMode: 2,
              },
            ],
            smartSerial: [],
          },
        ],
      },
    }) as ReturnType<typeof createEmptyProject>;

    expect(migrated.version).toBe(NOHAL_PROJECT_VERSION);
    expect(migrated.mesa?.hosts[0]?.connectors?.[0]).toEqual({
      connectorKey: "p1",
      cardKind: "7i77",
    });
    expect(migrated.mesa?.hosts[0]?.smartSerial).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          connectorKey: "p1",
          portKey: "io",
          channel: 0,
          cardKind: "7i77-io",
          processDataMode: 2,
        }),
        expect.objectContaining({
          connectorKey: "p1",
          portKey: "analog",
          channel: 0,
          cardKind: "7i77-analog",
        }),
      ]),
    );
  });

  it("remaps legacy v3 Mesa DB25 component IDs to their v4 smart-serial counterparts", () => {
    const project = createEmptyProject("Legacy Mesa DB25 Remap");
    const rootSheet = project.sheets[project.rootSheetId];
    if (!rootSheet) throw new Error("expected root sheet");

    const legacyIoComponentId = "system:mesa:db25:mesa_host_legacy:p1:io";
    const legacyAnalogComponentId =
      "system:mesa:db25:mesa_host_legacy:p1:analog";

    const migrated = migrateProjectDocumentToCurrentVersion({
      ...project,
      version: 3,
      mesa: {
        hosts: [
          {
            id: "mesa_host_legacy",
            kind: "7i92t",
            ip: "10.10.10.10",
            connectors: [{ connectorKey: "p1", cardKind: "7i77" }],
            smartSerial: [],
          },
        ],
      },
      library: {
        components: {
          [legacyIoComponentId]: { id: legacyIoComponentId },
          [legacyAnalogComponentId]: { id: legacyAnalogComponentId },
        },
      },
      sheets: {
        ...project.sheets,
        [rootSheet.id]: {
          ...rootSheet,
          nodes: [
            {
              id: "node_io",
              kind: "component",
              componentId: legacyIoComponentId,
              instanceName: "io_legacy",
              position: { x: 0, y: 0 },
              paramValues: {},
            },
            {
              id: "node_analog",
              kind: "component",
              componentId: legacyAnalogComponentId,
              instanceName: "analog_legacy",
              position: { x: 0, y: 0 },
              paramValues: {},
            },
          ],
        },
      },
    }) as ReturnType<typeof createEmptyProject>;

    expect(migrated.version).toBe(NOHAL_PROJECT_VERSION);
    expect(
      Object.keys(migrated.library.components).some((id) =>
        id.startsWith("system:mesa:db25:"),
      ),
    ).toBe(false);
    const rootNodes = migrated.sheets[rootSheet.id]?.nodes ?? [];
    const findComponentNode = (id: string) =>
      rootNodes.find(
        (
          node,
        ): node is Extract<(typeof rootNodes)[number], { kind: "component" }> =>
          node.id === id && node.kind === "component",
      );
    expect(findComponentNode("node_io")?.componentId).toBe(
      "system:mesa:sserial:mesa_host_legacy:p1_io:0",
    );
    expect(findComponentNode("node_analog")?.componentId).toBe(
      "system:mesa:sserial:mesa_host_legacy:p1_analog:0",
    );
  });
});
