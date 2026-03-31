import { createEmptyProject, createSheet } from "@nohal/core/project";
import { describe, expect, it } from "vitest";
import { buildCanvasSearchResults } from "./componentSearch";

function createProjectFixture() {
  const project = createEmptyProject("Search Fixture");
  const rootSheet = project.sheets[project.rootSheetId];
  const childSheet = createSheet("Child Sheet");
  const componentId = "comp:test-and2";

  project.library.components[componentId] = {
    id: componentId,
    name: "Test AND",
    halComponentName: "and2",
    source: "comp",
    sourcePath: "tests/and2.comp",
    runtime: { kind: "rt" },
    pins: [],
    params: [],
  };

  rootSheet.nodes.push({
    id: "node_root_and2",
    kind: "component",
    componentId,
    instanceName: "logic.0",
    position: { x: 10, y: 20 },
    paramValues: {},
  });
  rootSheet.nodes.push({
    id: "node_root_child_sheet",
    kind: "sheet",
    sheetId: childSheet.id,
    instanceName: "panel",
    position: { x: 120, y: 40 },
  });
  rootSheet.labels.push({
    id: "label_root_estop",
    name: "ESTOP_OK",
    scope: "global",
    position: { x: 20, y: 40 },
  });
  rootSheet.ports.push({
    id: "port_root_spindle_enable",
    name: "spindle_enable",
    type: "bit",
    direction: "out",
    side: "right",
    position: { x: 80, y: 20 },
  });
  rootSheet.comments.push({
    id: "comment_root_notes",
    text: "Spindle enable comes from panel input",
    position: { x: 40, y: 60 },
  });

  childSheet.comments.push({
    id: "comment_child_notes",
    text: "Child sheet calibration note",
    position: { x: 12, y: 18 },
  });

  project.sheets[childSheet.id] = childSheet;

  return { project, childSheetId: childSheet.id };
}

describe("buildCanvasSearchResults", () => {
  it("includes components, subsheets, labels, ports, and text comments", () => {
    const { project } = createProjectFixture();

    const results = buildCanvasSearchResults(
      project,
      "sheet",
      project.rootSheetId,
    );

    expect(results.map((result) => result.key)).toEqual(
      expect.arrayContaining([
        "label:label_root_estop",
        "node:node_root_and2",
        "node:node_root_child_sheet",
        "port:port_root_spindle_enable",
        "comment:comment_root_notes",
      ]),
    );
    expect(
      results.find((result) => result.key === "node:node_root_child_sheet"),
    ).toMatchObject({
      kind: "subsheet",
      title: "panel : [Child Sheet]",
      searchText: expect.stringContaining("subsheet"),
    });
    expect(
      results.find((result) => result.key === "label:label_root_estop"),
    ).toMatchObject({
      kind: "label",
      title: "ESTOP_OK",
      searchText: expect.stringContaining("global"),
    });
    expect(
      results.find((result) => result.key === "port:port_root_spindle_enable"),
    ).toMatchObject({
      kind: "port",
      title: "spindle_enable",
      searchText: expect.stringContaining("right"),
    });
    expect(
      results.find((result) => result.key === "comment:comment_root_notes"),
    ).toMatchObject({
      kind: "comment",
      title: "Spindle enable comes from panel input",
      searchText: expect.stringContaining("panel input"),
    });
  });

  it("limits sheet scope to the active sheet", () => {
    const { project, childSheetId } = createProjectFixture();

    const results = buildCanvasSearchResults(project, "sheet", childSheetId);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      key: "comment:comment_child_notes",
      sheetId: childSheetId,
    });
  });
});
