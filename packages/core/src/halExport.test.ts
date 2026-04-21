import { describe, expect, it } from "vitest";
import {
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
} from "./addfQueue";
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

function makeSinglePinProject(label?: {
  name: string;
  scope: "global" | "local";
}) {
  const project = createEmptyProject("Single Pin Label Test");
  const sheet = project.sheets[project.rootSheetId];
  project.library.components["comp:test-sink"] = {
    id: "comp:test-sink",
    name: "sink",
    halComponentName: "sink",
    source: "comp",
    sourcePath: "tests/components/sink.comp",
    runtime: { kind: "rt" },
    pins: [{ key: "in0", name: "in0", direction: "in", type: "bit" }],
    params: [],
  };
  sheet.nodes.push({
    id: "node_sink",
    kind: "component",
    componentId: "comp:test-sink",
    instanceName: "sink",
    position: { x: 0, y: 0 },
    paramValues: {},
  });
  if (!label) return project;

  sheet.labels.push({
    id: "label_1",
    name: label.name,
    scope: label.scope,
    position: { x: 40, y: 0 },
  });
  sheet.labelAnchors.push({
    id: "anchor_1",
    labelId: "label_1",
    endpoint: { kind: "node-pin", nodeId: "node_sink", pinKey: "in0" },
  });
  return project;
}

function expectContainsNetLine(text: string | undefined, line: string) {
  expect(text ?? "").toContain(line);
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

  it("emits a net for a globally labeled single pin", () => {
    const project = makeSinglePinProject({
      name: "global_sig",
      scope: "global",
    });

    const { text } = exportProjectToHal(project);

    expect(text).toContain("net global_sig sink.in0");
  });

  it("emits a net for a locally labeled single pin", () => {
    const project = makeSinglePinProject({
      name: "local_sig",
      scope: "local",
    });

    const { text } = exportProjectToHal(project);

    expect(text).toContain("net local_sig sink.in0");
  });

  it("keeps unlabeled single pins out of the export", () => {
    const project = makeSinglePinProject();

    const { text } = exportProjectToHal(project);

    expect(text).toContain("# (no nets exported)");
    expect(text).not.toContain("sink.in0");
  });

  it("warns when exported HAL names or signal names exceed the configured limit", () => {
    const project = makeConnectedProject("signal_name_too_long");
    const sheet = project.sheets[project.rootSheetId];
    const source = sheet.nodes.find((node) => node.id === "node_a");
    if (!source || source.kind !== "component")
      throw new Error("expected component node");
    source.instanceName = "very_long_source";
    project.halExport = { halNameLen: 10 };

    const { warnings } = exportProjectToHal(project);

    expect(
      warnings.some((warning) =>
        warning.includes("HAL signal name 'signal_name_too_long'"),
      ),
    ).toBe(true);
    expect(
      warnings.some((warning) =>
        warning.includes("HAL name 'very_long_source.out'"),
      ),
    ).toBe(true);
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

  it("interpolates custom component load strings and skips generated loadrt for those components", () => {
    const project = createEmptyProject("Custom Load Test");
    const sheet = project.sheets[project.rootSheetId];
    project.library.components["custom:manual-loader"] = {
      id: "custom:manual-loader",
      name: "manual-loader",
      halComponentName: "manual_loader",
      source: "manual",
      runtime: {
        kind: "rt",
        instanceNaming: { strategy: "free", maxInstances: 2 },
      },
      loadCommand: "loadrt %{component} custom_names=%n count=%{count}",
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

    expect(text).toContain(
      "loadrt manual_loader custom_names=manual_loader.0 count=1",
    );
    expect(text).not.toContain("loadrt manual_loader names=");
  });

  it("does not infer addf targets for realtime components without functions", () => {
    const project = createEmptyProject("No Function Addf Export");
    const sheet = project.sheets[project.rootSheetId];
    project.library.components["comp:no-function-implicit"] = {
      id: "comp:no-function-implicit",
      name: "homecomp",
      halComponentName: "homecomp",
      source: "comp",
      runtime: {
        kind: "rt",
        instanceNaming: { strategy: "canonical_indexed" },
      },
      pins: [
        { key: "is_module", name: "is-module", direction: "out", type: "bit" },
      ],
      params: [],
      functions: [],
    };
    project.library.components["comp:no-function-explicit"] = {
      id: "comp:no-function-explicit",
      name: "matrixkins",
      halComponentName: "matrixkins",
      source: "comp",
      runtime: {
        kind: "rt",
        instanceNaming: { strategy: "canonical_indexed" },
      },
      pins: [{ key: "dummy", name: "dummy", direction: "out", type: "bit" }],
      params: [],
    };
    sheet.nodes.push(
      {
        id: "node_implicit",
        kind: "component",
        componentId: "comp:no-function-implicit",
        instanceName: "homecomp.0",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "node_explicit",
        kind: "component",
        componentId: "comp:no-function-explicit",
        instanceName: "matrixkins.0",
        position: { x: 180, y: 0 },
        paramValues: {},
      },
    );
    sheet.hal = {
      ...(sheet.hal ?? {}),
      addfQueue: [makeAddfQueueNodeEntry("node_explicit")],
    };

    const { text } = exportProjectToHal(project);

    expect(text).toContain("loadrt homecomp");
    expect(text).toContain("loadrt matrixkins");
    expect(text).not.toContain("addf homecomp.0");
    expect(text).not.toContain("addf matrixkins.0");
  });

  it("preserves raw ini reference tokens in exported setp values", () => {
    const project = createEmptyProject("INI Setp Export");
    const sheet = project.sheets[project.rootSheetId];
    project.library.components["comp:test-ini-ref"] = {
      id: "comp:test-ini-ref",
      name: "ini-ref",
      halComponentName: "ini_ref",
      source: "manual",
      runtime: { kind: "rt" },
      pins: [{ key: "gain", name: "gain", direction: "in", type: "float" }],
      params: [
        {
          key: "offset",
          name: "offset",
          direction: "rw",
          type: "float",
        },
      ],
    };
    sheet.nodes.push({
      id: "node_ini_ref",
      kind: "component",
      componentId: "comp:test-ini-ref",
      instanceName: "ini_ref.0",
      position: { x: 0, y: 0 },
      paramValues: { offset: "[DISPLAY]MAX_FEED_OVERRIDE" },
      pinInitialValues: { gain: "[TRAJ]DEFAULT_LINEAR_VELOCITY" },
    });

    const { text } = exportProjectToHal(project);

    expect(text).toContain("setp ini_ref.0.gain [TRAJ]DEFAULT_LINEAR_VELOCITY");
    expect(text).toContain("setp ini_ref.0.offset [DISPLAY]MAX_FEED_OVERRIDE");
  });

  it("warns when exported setp targets exceed the configured limit", () => {
    const project = createEmptyProject("Setp Length Warning");
    const sheet = project.sheets[project.rootSheetId];
    project.library.components["comp:test-long-setp"] = {
      id: "comp:test-long-setp",
      name: "long-setp",
      halComponentName: "long_setp",
      source: "manual",
      sourcePath: "tests/components/long-setp.comp",
      runtime: { kind: "rt" },
      pins: [{ key: "gain", name: "gain", direction: "in", type: "float" }],
      params: [
        {
          key: "offset",
          name: "offset",
          direction: "rw",
          type: "float",
        },
      ],
    };
    sheet.nodes.push({
      id: "node_long_setp",
      kind: "component",
      componentId: "comp:test-long-setp",
      instanceName: "very_long_setp",
      position: { x: 0, y: 0 },
      pinInitialValues: { gain: "1.0" },
      paramValues: { offset: "2.0" },
    });
    project.halExport = { halNameLen: 10 };

    const { warnings } = exportProjectToHal(project);

    expect(
      warnings.some((warning) =>
        warning.includes("HAL name 'very_long_setp.gain'"),
      ),
    ).toBe(true);
    expect(
      warnings.some((warning) =>
        warning.includes("HAL name 'very_long_setp.offset'"),
      ),
    ).toBe(true);
  });

  it("applies custom-component max instance limits to custom loadusr exports", () => {
    const project = createEmptyProject("Custom Loadusr Max");
    const sheet = project.sheets[project.rootSheetId];
    project.library.components["custom:manual-userspace"] = {
      id: "custom:manual-userspace",
      name: "manual-userspace",
      halComponentName: "manual_userspace",
      source: "manual",
      runtime: {
        kind: "userspace",
        instanceNaming: { strategy: "free", maxInstances: 1 },
      },
      loadCommand: "loadusr -Wn %{first_instance} manual_userspace",
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };
    sheet.nodes.push(
      {
        id: "node_userspace_0",
        kind: "component",
        componentId: "custom:manual-userspace",
        instanceName: "manual_userspace_0",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "node_userspace_1",
        kind: "component",
        componentId: "custom:manual-userspace",
        instanceName: "manual_userspace_1",
        position: { x: 20, y: 20 },
        paramValues: {},
      },
    );

    const { text, warnings } = exportProjectToHal(project);

    expect(text).toBe("");
    expect(
      warnings.some((warning) =>
        warning.includes("supports at most 1 instances, but 2 are present"),
      ),
    ).toBe(true);
  });

  it("emits nets for postgui-marked component instances into postgui output", () => {
    const project = makeConnectedProject("ui_sig");
    const sheet = project.sheets[project.rootSheetId];
    const source = sheet.nodes.find((node) => node.id === "node_a");
    const sink = sheet.nodes.find((node) => node.id === "node_b");
    if (!source || source.kind !== "component")
      throw new Error("expected component node");
    if (!sink || sink.kind !== "component")
      throw new Error("expected component node");
    source.exportStage = "postgui";
    sink.exportStage = "postgui";

    const { text, postguiText } = exportProjectToHal(project);

    expect(text).toContain("loadrt not names=src");
    expect(text).toContain("loadrt and2 names=sink");
    expect(text).not.toContain("net ui_sig src.out sink.in0");
    expect(postguiText).toBeDefined();
    expect(postguiText).toContain("net ui_sig src.out sink.in0");
  });

  it("splits mixed-stage nets across main and postgui outputs with the same net name", () => {
    const project = makeConnectedProject("ui_sig");
    const sheet = project.sheets[project.rootSheetId];
    const sink = sheet.nodes.find((node) => node.id === "node_b");
    if (!sink || sink.kind !== "component")
      throw new Error("expected component node");
    sink.exportStage = "postgui";

    const { text, postguiText } = exportProjectToHal(project);

    expectContainsNetLine(text, "net ui_sig src.out");
    expect(text).not.toContain("net ui_sig src.out sink.in0");
    expectContainsNetLine(postguiText, "net ui_sig sink.in0");
    expect(postguiText).not.toContain("net ui_sig src.out sink.in0");
  });

  it("keeps the same net name when a postgui output drives a main-stage consumer", () => {
    const project = makeConnectedProject("ui_sig");
    const sheet = project.sheets[project.rootSheetId];
    const source = sheet.nodes.find((node) => node.id === "node_a");
    if (!source || source.kind !== "component")
      throw new Error("expected component node");
    source.exportStage = "postgui";

    const { text, postguiText } = exportProjectToHal(project);

    expectContainsNetLine(text, "net ui_sig sink.in0");
    expect(text).not.toContain("net ui_sig src.out sink.in0");
    expectContainsNetLine(postguiText, "net ui_sig src.out");
    expect(postguiText).not.toContain("net ui_sig src.out sink.in0");
  });

  it("emits a separate shutdown HAL output when configured", () => {
    const project = createEmptyProject("Shutdown Export");
    project.shutdown = "setp machine-off true\n# keep final newline normalized";

    const { text, shutdownText } = exportProjectToHal(project);

    expect(text).toContain("# NoHAL HAL export");
    expect(shutdownText).toBe(
      "setp machine-off true\n# keep final newline normalized\n",
    );
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
