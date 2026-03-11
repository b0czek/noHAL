import { describe, expect, it } from "vitest";
import { makeAddfQueueFunctionEntry } from "./addfQueue";
import { exportProjectToHal } from "./halExport";
import { createEmptyProject } from "./project";
import { findSystemSheet, findSystemSheetNode } from "./sheet";

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

  it("falls back to auto_net when an explicit signal name is invalid", () => {
    const project = makeConnectedProject("bad signal name");

    const { text, warnings } = exportProjectToHal(project);

    expect(text).toContain("net auto_net_1 src.out sink.in0");
    expect(warnings.some((w) => w.includes("Invalid HAL signal name"))).toBe(
      true,
    );
  });

  it("aborts exporting when a net mixes OUT and IO pins", () => {
    const project = createEmptyProject("OutIo");
    const sheet = project.sheets[project.rootSheetId];
    project.library.components["comp:test-out"] = {
      id: "comp:test-out",
      name: "out",
      halComponentName: "out",
      source: "manual",
      sourcePath: "tests/components/out.comp",
      runtime: { kind: "rt" },
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };
    project.library.components["comp:test-io"] = {
      id: "comp:test-io",
      name: "io",
      halComponentName: "io",
      source: "manual",
      sourcePath: "tests/components/io.comp",
      runtime: { kind: "rt" },
      pins: [{ key: "io", name: "io", direction: "io", type: "bit" }],
      params: [],
    };
    sheet.nodes.push(
      {
        id: "node_out",
        kind: "component",
        componentId: "comp:test-out",
        instanceName: "src",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "node_io",
        kind: "component",
        componentId: "comp:test-io",
        instanceName: "shared",
        position: { x: 200, y: 0 },
        paramValues: {},
      },
      {
        id: "node_sink",
        kind: "component",
        componentId: "comp:test-not",
        instanceName: "sink",
        position: { x: 380, y: 0 },
        paramValues: {},
      },
    );
    project.library.components["comp:test-not"] = {
      id: "comp:test-not",
      name: "not",
      halComponentName: "not",
      source: "comp",
      sourcePath: "tests/components/not.comp",
      runtime: { kind: "rt" },
      pins: [{ key: "in", name: "in", direction: "in", type: "bit" }],
      params: [],
    };
    sheet.directConnections.push(
      {
        id: "conn_out_to_in",
        a: { kind: "node-pin", nodeId: "node_out", pinKey: "out" },
        b: { kind: "node-pin", nodeId: "node_sink", pinKey: "in" },
      },
      {
        id: "conn_io_to_in",
        a: { kind: "node-pin", nodeId: "node_io", pinKey: "io" },
        b: { kind: "node-pin", nodeId: "node_sink", pinKey: "in" },
      },
    );

    const { text, warnings } = exportProjectToHal(project);

    expect(text).toBe("");
    expect(warnings.some((w) => w.includes("mixes OUT and IO"))).toBe(true);
    expect(warnings.some((w) => w.includes("Export aborted"))).toBe(true);
  });

  it("emits custom component load strings and skips generated loadrt for those components", () => {
    const project = createEmptyProject("Custom Load Test");
    const sheet = project.sheets[project.rootSheetId];
    project.library.components["custom:manual-loader"] = {
      id: "custom:manual-loader",
      name: "manual-loader",
      halComponentName: "manual_loader",
      source: "manual",
      runtime: { kind: "rt" },
      loadCommand: "loadrt manual_loader cfg=demo",
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };
    sheet.nodes.push({
      id: "node_custom",
      kind: "component",
      componentId: "custom:manual-loader",
      instanceName: "manual_loader.0",
      position: { x: 0, y: 0 },
      paramValues: {},
    });

    const { text } = exportProjectToHal(project);

    expect(text).toContain("loadrt manual_loader cfg=demo");
    expect(text).not.toContain("loadrt manual_loader names=");
  });

  it("emits nets for postgui-marked component instances into postgui output", () => {
    const project = makeConnectedProject("ui_sig");
    const sheet = project.sheets[project.rootSheetId];
    const sink = sheet.nodes.find((node) => node.id === "node_b");
    if (!sink || sink.kind !== "component")
      throw new Error("expected component node");
    sink.exportStage = "postgui";

    const { text, postguiText } = exportProjectToHal(project);

    expect(text).toContain("loadrt not names=src");
    expect(text).toContain("loadrt and2 names=sink");
    expect(text).not.toContain("net ui_sig src.out sink.in0");
    expect(postguiText).toBeDefined();
    expect(postguiText).toContain("net ui_sig src.out sink.in0");
  });

  it("emits motmod functions in addf and allows thread assignment from root sheet queue", () => {
    const project = createEmptyProject("Motmod Addf Functions");
    const rootSheet = project.sheets[project.rootSheetId];
    const systemSheet = findSystemSheet(project);
    const systemSheetNode = findSystemSheetNode(project);
    const motionNode = systemSheet?.nodes.find(
      (node) => node.kind === "component" && node.instanceName === "motion",
    );
    if (
      !motionNode ||
      motionNode.kind !== "component" ||
      !systemSheet ||
      !systemSheetNode
    )
      throw new Error("expected managed motion node");
    const fastThreadId = "thread_fast";
    const fastOutputId = "sheetthread_fast";
    const systemFastOutputId = "sheetthread_system_fast";
    project.halThreads?.push({
      id: fastThreadId,
      name: "fast-thread",
      periodNs: 500_000,
      floatMode: "fp",
    });
    rootSheet.hal = {
      ...(rootSheet.hal ?? {}),
      threadOutputs: [
        ...(rootSheet.hal?.threadOutputs ?? []),
        { id: fastOutputId, name: "fast", halThreadId: fastThreadId },
      ],
    };
    systemSheet.hal = {
      ...(systemSheet.hal ?? {}),
      threadOutputs: [
        ...(systemSheet.hal?.threadOutputs ?? []),
        { id: systemFastOutputId, name: "fast" },
      ],
      addfQueue: [
        makeAddfQueueFunctionEntry(
          motionNode.id,
          "motion_command_handler",
          systemFastOutputId,
        ),
        makeAddfQueueFunctionEntry(motionNode.id, "motion_controller"),
      ],
    };
    systemSheetNode.hal = {
      ...(systemSheetNode.hal ?? {}),
      threadMap: {
        ...(systemSheetNode.hal?.threadMap ?? {}),
        [systemFastOutputId]: fastOutputId,
      },
    };

    const { text } = exportProjectToHal(project);
    const commandHandlerLines = text
      .split("\n")
      .filter((line) => line.includes("addf motion-command-handler "));
    const controllerLines = text
      .split("\n")
      .filter((line) => line.includes("addf motion-controller "));

    expect(commandHandlerLines).toHaveLength(1);
    expect(controllerLines).toHaveLength(1);
    expect(commandHandlerLines[0]).toContain("fast-thread");
    expect(controllerLines[0]).toContain("servo-thread");
  });
});
