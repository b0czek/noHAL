import { createEmptyProject, createSheet } from "@nohal/core/src/project";
import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store";

const TEST_COMPONENT_ID = "comp:test-and2";

function createProjectFixture() {
  const project = createEmptyProject("Sheet Move Fixture");
  project.library.components[TEST_COMPONENT_ID] = {
    id: TEST_COMPONENT_ID,
    name: "Test AND",
    halComponentName: "and2",
    source: "comp",
    sourcePath: "tests/and2.comp",
    runtime: { kind: "rt" },
    pins: [],
    params: [],
  };

  const rootSheet = project.sheets[project.rootSheetId];
  rootSheet.nodes.push({
    id: "node_component",
    kind: "component",
    componentId: TEST_COMPONENT_ID,
    instanceName: "and2.0",
    position: { x: 40, y: 60 },
    paramValues: {},
  });

  return { project, rootSheet };
}

describe("sheet actions", () => {
  it("moves a singly selected node into a new subsheet", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "node", id: "node_component" });
    store.actions.putSelectionIntoSubsheet();

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(rootSheet.nodes.some((node) => node.id === "node_component")).toBe(
      false,
    );

    const selection = store.state.selection;
    expect(selection?.kind).toBe("node");
    const createdSheetNode =
      selection?.kind === "node"
        ? rootSheet.nodes.find((node) => node.id === selection.id)
        : undefined;
    expect(createdSheetNode?.kind).toBe("sheet");
    if (!createdSheetNode || createdSheetNode.kind !== "sheet") {
      throw new Error("expected created subsheet node");
    }

    const childSheet = store.state.project.sheets[createdSheetNode.sheetId];
    expect(childSheet.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "node_component",
          kind: "component",
        }),
      ]),
    );
  });

  it("moves a singly selected node into an existing subsheet", () => {
    const { project, rootSheet } = createProjectFixture();
    const childSheet = createSheet("Existing Sheet", project.rootSheetId);
    project.sheets[childSheet.id] = childSheet;
    rootSheet.nodes.push({
      id: "node_existing_subsheet",
      kind: "sheet",
      sheetId: childSheet.id,
      instanceName: "existing_sheet",
      position: { x: 180, y: 60 },
    });

    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "node", id: "node_component" });
    store.actions.moveSelectionIntoSubsheetNode("node_existing_subsheet");

    const nextRootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(
      nextRootSheet.nodes.some((node) => node.id === "node_component"),
    ).toBe(false);
    expect(
      nextRootSheet.nodes.some((node) => node.id === "node_existing_subsheet"),
    ).toBe(true);
    expect(store.state.selection).toEqual({
      kind: "node",
      id: "node_existing_subsheet",
    });

    const movedChildSheet = store.state.project.sheets[childSheet.id];
    expect(movedChildSheet.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "node_component",
          kind: "component",
        }),
      ]),
    );
  });
});
