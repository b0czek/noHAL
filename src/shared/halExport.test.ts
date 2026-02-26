import { describe, expect, it } from "vitest";
import { exportProjectToHal } from "./halExport";
import { createEmptyProject } from "./project";

function makeConnectedProject(signalName?: string) {
  const project = createEmptyProject("Signal Name Test");
  const sheet = project.sheets[project.rootSheetId];
  project.library.components["comp:test-not"] = {
    id: "comp:test-not",
    name: "not",
    halComponentName: "not",
    source: "comp",
    sourcePath: "tests/components/not.comp",
    runtime: { kind: "rt" },
    pins: [
      { key: "in", name: "in", direction: "in", type: "bit" },
      { key: "out", name: "out", direction: "out", type: "bit" },
    ],
    params: [],
  };
  project.library.components["comp:test-and2"] = {
    id: "comp:test-and2",
    name: "and2",
    halComponentName: "and2",
    source: "comp",
    sourcePath: "tests/components/and2.comp",
    runtime: { kind: "rt" },
    pins: [
      { key: "in0", name: "in0", direction: "in", type: "bit" },
      { key: "in1", name: "in1", direction: "in", type: "bit" },
      { key: "out", name: "out", direction: "out", type: "bit" },
    ],
    params: [],
  };
  sheet.nodes.push(
    {
      id: "node_a",
      kind: "component",
      componentId: "comp:test-not",
      instanceName: "src",
      position: { x: 0, y: 0 },
      paramValues: {},
    },
    {
      id: "node_b",
      kind: "component",
      componentId: "comp:test-and2",
      instanceName: "sink",
      position: { x: 180, y: 0 },
      paramValues: {},
    },
  );
  sheet.directConnections.push({
    id: "conn_1",
    a: { kind: "node-pin", nodeId: "node_a", pinKey: "out" },
    b: { kind: "node-pin", nodeId: "node_b", pinKey: "in0" },
    ...(signalName !== undefined ? { signalName } : {}),
  });
  return project;
}

describe("exportProjectToHal connection signal names", () => {
  it("uses a direct connection signalName for exported net naming", () => {
    const project = makeConnectedProject(" machine_enable ");

    const { text } = exportProjectToHal(project);

    expect(text).toContain("net machine_enable src.out sink.in0");
    expect(text).not.toContain("auto_net_1");
  });

  it("falls back to auto_net names when no explicit signalName is set", () => {
    const project = makeConnectedProject();

    const { text } = exportProjectToHal(project);

    expect(text).toContain("net auto_net_1 src.out sink.in0");
  });
});
