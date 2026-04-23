import { createEmptyProject } from "@nohal/core/project";
import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../store";

const TEST_COMPONENT_ID = "comp:test-and2";
const ROTATION_QUARTER_TURN = 90;
const ROTATION_HALF_TURN = 180;
const ROTATION_THREE_QUARTER_TURN = 270;

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
      { key: "value_out", name: "value-out", direction: "out", type: "float" },
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

  it("shows a status when trying to hide a connected pin", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.updateNodePinVisibility("node_component", "in0", false);

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const node = rootSheet.nodes.find((entry) => entry.id === "node_component");

    expect(node).toEqual(
      expect.objectContaining({
        kind: "component",
      }),
    );
    expect(
      node?.kind === "component" ? node.hiddenPinKeys : undefined,
    ).toBeUndefined();
    expect(store.state.status).toBe("store.status.cannotHideConnectedPin");
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
        pinOrder: ["unused", "in0", "out", "value_out"],
      }),
    );

    store.actions.updateNodePinOrder("node_component", [
      "in0",
      "out",
      "value_out",
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

  it("updates a component export namespace override from the instance tab action", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.updateNodeGlobalNamespace("node_component", true);

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const node = rootSheet.nodes.find((entry) => entry.id === "node_component");
    expect(node).toEqual(
      expect.objectContaining({
        kind: "component",
        exportNamespace: "global",
      }),
    );

    store.actions.updateNodeGlobalNamespace("node_component", false);

    const updatedRootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const updatedNode = updatedRootSheet.nodes.find(
      (entry) => entry.id === "node_component",
    );
    expect(
      updatedNode?.kind === "component"
        ? updatedNode.exportNamespace
        : undefined,
    ).toBeUndefined();
  });

  it("blocks namespace changes that would introduce exported path collisions", () => {
    const { project } = createProjectFixture();
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheetId = "sheet_logic";
    project.sheets[childSheetId] = {
      id: childSheetId,
      name: "Logic",
      nodes: [
        {
          id: "node_child_component",
          kind: "component",
          componentId: TEST_COMPONENT_ID,
          instanceName: "and2.0",
          position: { x: 20, y: 20 },
          paramValues: {},
        },
      ],
      ports: [],
      labels: [],
      comments: [],
      directConnections: [],
      labelAnchors: [],
    };
    rootSheet.nodes.push({
      id: "sheet_node_logic",
      kind: "sheet",
      sheetId: childSheetId,
      instanceName: "logic",
      position: { x: 360, y: 40 },
    });

    const store = createEditorStore(project, (key) => key);
    store.setState("activeSheetId", childSheetId);
    store.actions.updateNodeGlobalNamespace("node_child_component", true);

    const node = store.state.project.sheets[childSheetId]?.nodes.find(
      (entry) => entry.id === "node_child_component",
    );
    expect(
      node?.kind === "component" ? node.exportNamespace : undefined,
    ).toBeUndefined();
    expect(store.state.status).toBe(
      "store.status.exportNamespaceChangeWouldCollide",
    );
  });

  it("refuses namespace changes when the component is globally namespaced by definition", () => {
    const { project } = createProjectFixture();
    const component = project.library.components[TEST_COMPONENT_ID];
    expect(component).toBeDefined();
    if (!component) {
      throw new Error("Test fixture component is missing");
    }
    project.library.components[TEST_COMPONENT_ID] = {
      ...component,
      runtime: {
        kind: "rt",
        instanceNaming: {
          strategy: "canonical_indexed",
          lockToCanonical: true,
          maxInstances: 8,
        },
      },
      constraints: {
        exportNamespace: "global",
      },
    };

    const store = createEditorStore(project, (key) => key);
    store.actions.updateNodeGlobalNamespace("node_component", false);

    expect(
      store.state.project.library.components[TEST_COMPONENT_ID]?.constraints,
    ).toEqual({
      exportNamespace: "global",
    });
    expect(store.state.status).toBe(
      "store.status.exportNamespaceFixedForComponent",
    );
  });

  it("converts a singly-anchored label into a sheet port with inferred direction and type", () => {
    const { project } = createProjectFixture();
    const rootSheet = project.sheets[project.rootSheetId];
    rootSheet.labels.push({
      id: "label_value_out",
      name: "servo.out",
      scope: "local",
      position: { x: 180, y: 180 },
      rotation: 0,
    });
    rootSheet.labelAnchors.push({
      id: "anchor_value_out",
      labelId: "label_value_out",
      endpoint: {
        kind: "node-pin",
        nodeId: "node_component",
        pinKey: "value_out",
      },
    });

    const store = createEditorStore(project, (key) => key);
    store.actions.convertLabelToSheetPort("label_value_out");

    const nextRootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(nextRootSheet.labels).toEqual([]);
    expect(nextRootSheet.labelAnchors).toEqual([]);

    const createdPort = nextRootSheet.ports.find(
      (entry) => entry.id !== "port_in",
    );
    expect(createdPort).toEqual(
      expect.objectContaining({
        name: "servo.out",
        direction: "out",
        type: "float",
        position: { x: 180, y: 180 },
      }),
    );
    expect(nextRootSheet.directConnections).toContainEqual(
      expect.objectContaining({
        a: {
          kind: "node-pin",
          nodeId: "node_component",
          pinKey: "value_out",
        },
        b: {
          kind: "sheet-port",
          portId: createdPort?.id,
        },
      }),
    );
    expect(store.state.selection).toEqual({
      kind: "sheet-port",
      id: createdPort?.id,
    });
  });

  it("refuses to convert labels that are not attached to exactly one component pin", () => {
    const { project } = createProjectFixture();
    const rootSheet = project.sheets[project.rootSheetId];
    rootSheet.labels.push({
      id: "label_shared",
      name: "shared",
      scope: "local",
      position: { x: 160, y: 140 },
      rotation: 0,
    });
    rootSheet.labelAnchors.push(
      {
        id: "anchor_shared_a",
        labelId: "label_shared",
        endpoint: {
          kind: "node-pin",
          nodeId: "node_component",
          pinKey: "out",
        },
      },
      {
        id: "anchor_shared_b",
        labelId: "label_shared",
        endpoint: {
          kind: "node-pin",
          nodeId: "node_sink",
          pinKey: "in0",
        },
      },
    );

    const store = createEditorStore(project, (key) => key);
    store.actions.convertLabelToSheetPort("label_shared");

    const nextRootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(nextRootSheet.labels).toHaveLength(1);
    expect(nextRootSheet.labelAnchors).toHaveLength(2);
    expect(nextRootSheet.ports).toHaveLength(1);
    expect(store.state.status).toBe(
      "store.status.cannotConvertLabelToSheetPort",
    );
  });

  it("rotates selected labels, comments, and sheet ports in a single undo step", () => {
    const { project } = createProjectFixture();
    const rootSheet = project.sheets[project.rootSheetId];
    rootSheet.labels.push({
      id: "label_rotated",
      name: "servo.enable",
      scope: "local",
      position: { x: 140, y: 140 },
      rotation: 0,
    });
    rootSheet.comments.push({
      id: "comment_rotated",
      text: "Check interlock",
      position: { x: 180, y: 160 },
      rotation: ROTATION_QUARTER_TURN,
    });
    rootSheet.ports[0] = {
      ...rootSheet.ports[0],
      rotation: ROTATION_THREE_QUARTER_TURN,
    };

    const store = createEditorStore(project, (key) => key);
    store.setState("selection", {
      kind: "multi",
      nodeIds: ["node_component"],
      labelIds: ["label_rotated"],
      commentIds: ["comment_rotated"],
      portIds: ["port_in"],
    });

    expect(store.actions.rotateSelectionClockwise()).toBe(true);

    let nextRootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(
      nextRootSheet.labels.find((entry) => entry.id === "label_rotated")
        ?.rotation,
    ).toBe(ROTATION_QUARTER_TURN);
    expect(
      nextRootSheet.comments.find((entry) => entry.id === "comment_rotated")
        ?.rotation,
    ).toBe(ROTATION_HALF_TURN);
    expect(
      nextRootSheet.ports.find((entry) => entry.id === "port_in")?.rotation,
    ).toBe(0);

    expect(store.actions.undo()).toBe(true);

    nextRootSheet = store.state.project.sheets[store.state.project.rootSheetId];
    expect(
      nextRootSheet.labels.find((entry) => entry.id === "label_rotated")
        ?.rotation,
    ).toBe(0);
    expect(
      nextRootSheet.comments.find((entry) => entry.id === "comment_rotated")
        ?.rotation,
    ).toBe(ROTATION_QUARTER_TURN);
    expect(
      nextRootSheet.ports.find((entry) => entry.id === "port_in")?.rotation,
    ).toBe(ROTATION_THREE_QUARTER_TURN);
  });
});
