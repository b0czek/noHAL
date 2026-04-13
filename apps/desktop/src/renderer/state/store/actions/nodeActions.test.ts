import { createEmptyProject } from "@nohal/core/project";
import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store";

const TEST_COMPONENT_ID = "comp:test-and2";

function createProjectFixture() {
  const project = createEmptyProject("Node Action Fixture");
  project.library.components[TEST_COMPONENT_ID] = {
    id: TEST_COMPONENT_ID,
    name: "Test AND",
    halComponentName: "and2",
    source: "comp",
    sourcePath: "tests/and2.comp",
    runtime: { kind: "rt" },
    pins: [
      { key: "in0", name: "in0", direction: "in", type: "bit" },
      { key: "out", name: "out", direction: "out", type: "bit" },
      { key: "unused", name: "unused", direction: "out", type: "bit" },
    ],
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
  rootSheet.nodes.push({
    id: "node_sink",
    kind: "component",
    componentId: TEST_COMPONENT_ID,
    instanceName: "and2.1",
    position: { x: 220, y: 60 },
    paramValues: {},
  });
  rootSheet.ports.push({
    id: "port_in",
    name: "source",
    direction: "out",
    type: "bit",
    side: "left",
    position: { x: 10, y: 10 },
  });
  rootSheet.directConnections.push({
    id: "conn_in0",
    a: { kind: "sheet-port", portId: "port_in" },
    b: { kind: "node-pin", nodeId: "node_component", pinKey: "in0" },
  });
  rootSheet.directConnections.push({
    id: "conn_between_nodes",
    a: { kind: "node-pin", nodeId: "node_component", pinKey: "out" },
    b: { kind: "node-pin", nodeId: "node_sink", pinKey: "in0" },
    waypoints: [{ x: 150, y: 120 }],
  });

  return { project };
}

describe("node actions", () => {
  it("persists hidden pins only for unconnected pins", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.updateNodePinVisibility("node_component", "unused", false);
    store.actions.updateNodePinVisibility("node_component", "in0", false);

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const node = rootSheet.nodes.find((entry) => entry.id === "node_component");

    expect(node).toEqual(
      expect.objectContaining({
        kind: "component",
        hiddenPinKeys: ["unused"],
      }),
    );
  });

  it("stores per-instance pin order overrides and clears them at default order", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.updateNodePinOrder("node_component", [
      "unused",
      "in0",
      "out",
    ]);

    let rootSheet = store.state.project.sheets[store.state.project.rootSheetId];
    let node = rootSheet.nodes.find((entry) => entry.id === "node_component");

    expect(node).toEqual(
      expect.objectContaining({
        kind: "component",
        pinOrder: ["unused", "in0", "out"],
      }),
    );

    store.actions.updateNodePinOrder("node_component", [
      "in0",
      "out",
      "unused",
    ]);

    rootSheet = store.state.project.sheets[store.state.project.rootSheetId];
    node = rootSheet.nodes.find((entry) => entry.id === "node_component");

    expect(node).toEqual(
      expect.objectContaining({
        kind: "component",
      }),
    );
    expect(
      node?.kind === "component" ? node.pinOrder : undefined,
    ).toBeUndefined();
  });

  it("moves connection waypoints when a dragged selection owns both endpoints", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.moveSelectionGroup({
      nodePositions: [
        { id: "node_component", x: 80, y: 100 },
        { id: "node_sink", x: 260, y: 100 },
      ],
      labelPositions: [],
      commentPositions: [],
      portPositions: [],
    });

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const connection = rootSheet.directConnections.find(
      (entry) => entry.id === "conn_between_nodes",
    );

    expect(connection?.waypoints).toEqual([{ x: 190, y: 160 }]);
  });
});
