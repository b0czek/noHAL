import { createEmptyProject } from "@nohal/core/src/project";
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

  return { project };
}

describe("node actions", () => {
  it("persists hidden pins only for unconnected pins", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.updateNodePinVisibility("node_component", "out", false);
    store.actions.updateNodePinVisibility("node_component", "in0", false);

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const node = rootSheet.nodes.find((entry) => entry.id === "node_component");

    expect(node).toEqual(
      expect.objectContaining({
        kind: "component",
        hiddenPinKeys: ["out"],
      }),
    );
  });
});
