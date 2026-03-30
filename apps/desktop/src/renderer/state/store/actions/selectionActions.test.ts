import { createEmptyProject } from "@nohal/core/project";
import { describe, expect, it } from "vitest";
import type { NoHALApi } from "../../../../preload/api";
import { createEditorStore } from "../../store";

const TEST_COMPONENT_ID = "comp:test-and2";
const SYSTEM_COMPONENT_ID = "system:test:motion";
const EXPECTED_DIRECT_CONNECTION_COUNT_AFTER_PASTE = 3;

function createProjectFixture() {
  const project = createEmptyProject("Selection Action Fixture");
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
  project.library.components[SYSTEM_COMPONENT_ID] = {
    id: SYSTEM_COMPONENT_ID,
    name: "System Motion",
    halComponentName: "motion",
    source: "comp",
    sourcePath: "tests/motion.comp",
    runtime: { kind: "rt" },
    system: { manager: "test", family: "test" },
    pins: [
      { key: "enable", name: "enable", direction: "in", type: "bit" },
      { key: "ready", name: "ready", direction: "out", type: "bit" },
    ],
    params: [],
  };

  const rootSheet = project.sheets[project.rootSheetId];
  rootSheet.nodes.push(
    {
      id: "node_component",
      kind: "component",
      componentId: TEST_COMPONENT_ID,
      instanceName: "and2.0",
      position: { x: 40, y: 60 },
      paramValues: {},
    },
    {
      id: "node_system_component",
      kind: "component",
      componentId: SYSTEM_COMPONENT_ID,
      instanceName: "motion.0",
      position: { x: 360, y: 60 },
      paramValues: {},
    },
  );
  rootSheet.labels.push({
    id: "label_signal",
    name: "sig_a",
    scope: "local",
    position: { x: 80, y: 180 },
  });
  rootSheet.comments.push({
    id: "comment_note",
    text: "Test note",
    position: { x: 140, y: 220 },
  });
  rootSheet.ports.push({
    id: "port_source",
    name: "source",
    direction: "out",
    type: "bit",
    side: "left",
    position: { x: 10, y: 10 },
  });
  rootSheet.directConnections.push(
    {
      id: "conn_component",
      a: { kind: "sheet-port", portId: "port_source" },
      b: { kind: "node-pin", nodeId: "node_component", pinKey: "in0" },
    },
    {
      id: "conn_system",
      a: { kind: "sheet-port", portId: "port_source" },
      b: {
        kind: "node-pin",
        nodeId: "node_system_component",
        pinKey: "enable",
      },
    },
  );
  rootSheet.labelAnchors.push({
    id: "anchor_signal",
    labelId: "label_signal",
    endpoint: { kind: "node-pin", nodeId: "node_component", pinKey: "out" },
  });

  return { project };
}

function installClipboardMock() {
  let clipboardText = "";
  (globalThis as { window?: { nohal: NoHALApi } }).window = {
    nohal: {
      readClipboardText: () => clipboardText,
      writeClipboardText: (text: string) => {
        clipboardText = text;
      },
    } as NoHALApi,
  };
  return {
    read: () => clipboardText,
    write: (text: string) => {
      clipboardText = text;
    },
  };
}

describe("selection actions", () => {
  it("extends the selection when shift-clicking additional items", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "node", id: "node_component" });
    store.actions.extendSelection({ kind: "label", id: "label_signal" });
    store.actions.extendSelection({ kind: "comment", id: "comment_note" });
    store.actions.extendSelection({ kind: "sheet-port", id: "port_source" });

    expect(store.state.selection).toEqual({
      kind: "multi",
      nodeIds: ["node_component"],
      labelIds: ["label_signal"],
      commentIds: ["comment_note"],
      portIds: ["port_source"],
    });
  });

  it("keeps the existing selection when extendSelection receives null", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "node", id: "node_component" });
    store.actions.extendSelection(null);

    expect(store.state.selection).toEqual({
      kind: "node",
      id: "node_component",
    });
  });

  it("toggles off a selected item when shift-clicking it again", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({
      kind: "multi",
      nodeIds: ["node_component"],
      labelIds: ["label_signal"],
      commentIds: [],
      portIds: [],
    });
    store.actions.toggleSelection({ kind: "label", id: "label_signal" });

    expect(store.state.selection).toEqual({
      kind: "node",
      id: "node_component",
    });
  });

  it("clears the selection when toggling the only selected item", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "node", id: "node_component" });
    store.actions.toggleSelection({ kind: "node", id: "node_component" });

    expect(store.state.selection).toBe(null);
  });

  it("treats label-anchor selection as a standalone selection", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "node", id: "node_component" });
    store.actions.extendSelection({
      kind: "label-anchor",
      id: "anchor_signal",
    });

    expect(store.state.selection).toEqual({
      kind: "label-anchor",
      id: "anchor_signal",
    });
  });

  it("removes a selected label anchor", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "label-anchor", id: "anchor_signal" });
    store.actions.removeSelection();

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(rootSheet.labelAnchors).toHaveLength(0);
    expect(store.state.selection).toBe(null);
    expect(store.state.status).toBe("store.status.removedLabelAnchor");
  });

  it("copies and pastes selected items while skipping protected system nodes", () => {
    const { project } = createProjectFixture();
    const clipboard = installClipboardMock();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({
      kind: "multi",
      nodeIds: ["node_component", "node_system_component"],
      labelIds: ["label_signal"],
      commentIds: ["comment_note"],
      portIds: ["port_source"],
    });

    expect(store.actions.copySelection()).toBe(true);
    expect(clipboard.read()).toContain("__NOHAL_SELECTION_V1__");
    expect(store.actions.pasteClipboard()).toBe(true);

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const componentNodes = rootSheet.nodes.filter(
      (node) =>
        node.kind === "component" && node.componentId === TEST_COMPONENT_ID,
    );
    const systemNodes = rootSheet.nodes.filter(
      (node) =>
        node.kind === "component" && node.componentId === SYSTEM_COMPONENT_ID,
    );

    expect(componentNodes).toHaveLength(2);
    expect(systemNodes).toHaveLength(1);
    expect(rootSheet.labels).toHaveLength(2);
    expect(rootSheet.comments).toHaveLength(2);
    expect(rootSheet.ports).toHaveLength(2);
    expect(rootSheet.directConnections).toHaveLength(
      EXPECTED_DIRECT_CONNECTION_COUNT_AFTER_PASTE,
    );
    expect(rootSheet.labelAnchors).toHaveLength(2);

    const pastedNode = componentNodes.find(
      (node) => node.id !== "node_component",
    );
    const pastedLabel = rootSheet.labels.find(
      (label) => label.id !== "label_signal",
    );
    const pastedPort = rootSheet.ports.find(
      (port) => port.id !== "port_source",
    );
    const pastedComment = rootSheet.comments.find(
      (comment) => comment.id !== "comment_note",
    );

    expect(pastedNode).toEqual(
      expect.objectContaining({
        kind: "component",
        instanceName: "and2",
        position: { x: 80, y: 100 },
      }),
    );
    expect(pastedLabel).toEqual(
      expect.objectContaining({
        name: "sig_a",
        position: { x: 120, y: 220 },
      }),
    );
    expect(pastedComment).toEqual(
      expect.objectContaining({
        text: "Test note",
        position: { x: 180, y: 260 },
      }),
    );
    expect(pastedPort).toEqual(
      expect.objectContaining({
        name: "source2",
        position: { x: 50, y: 50 },
      }),
    );

    expect(rootSheet.directConnections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          a: { kind: "sheet-port", portId: pastedPort?.id },
          b: {
            kind: "node-pin",
            nodeId: pastedNode?.id,
            pinKey: "in0",
          },
        }),
      ]),
    );
    expect(rootSheet.labelAnchors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          labelId: pastedLabel?.id,
          endpoint: {
            kind: "node-pin",
            nodeId: pastedNode?.id,
            pinKey: "out",
          },
        }),
      ]),
    );
    expect(store.state.selection).toEqual({
      kind: "multi",
      nodeIds: [pastedNode?.id],
      labelIds: [pastedLabel?.id],
      commentIds: [pastedComment?.id],
      portIds: [pastedPort?.id],
    });
  });

  it("does not copy selections that only contain protected system nodes", () => {
    const { project } = createProjectFixture();
    const clipboard = installClipboardMock();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({ kind: "node", id: "node_system_component" });

    expect(store.actions.copySelection()).toBe(false);
    expect(store.actions.pasteClipboard()).toBe(false);
    expect(store.state.status).toBe(
      "store.status.nothingToPasteInSelectionClipboard",
    );

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(
      rootSheet.nodes.filter(
        (node) =>
          node.kind === "component" && node.componentId === SYSTEM_COMPONENT_ID,
      ),
    ).toHaveLength(1);

    clipboard.write("plain text from another app");
    expect(store.actions.pasteClipboard()).toBe(false);
    expect(store.state.status).toBe(
      "store.status.nothingToPasteInSelectionClipboard",
    );
  });

  it("pastes copied items under the requested cursor position", () => {
    const { project } = createProjectFixture();
    installClipboardMock();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({
      kind: "multi",
      nodeIds: ["node_component"],
      labelIds: ["label_signal"],
      commentIds: ["comment_note"],
      portIds: ["port_source"],
    });

    expect(store.actions.copySelection()).toBe(true);
    expect(store.actions.pasteClipboard({ x: 400, y: 500 })).toBe(true);

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    const pastedNode = rootSheet.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.componentId === TEST_COMPONENT_ID &&
        node.id !== "node_component",
    );
    const pastedLabel = rootSheet.labels.find(
      (label) => label.id !== "label_signal",
    );
    const pastedPort = rootSheet.ports.find(
      (port) => port.id !== "port_source",
    );
    const pastedComment = rootSheet.comments.find(
      (comment) => comment.id !== "comment_note",
    );

    expect(pastedNode).toEqual(
      expect.objectContaining({
        position: { x: 430, y: 550 },
      }),
    );
    expect(pastedLabel).toEqual(
      expect.objectContaining({
        position: { x: 470, y: 670 },
      }),
    );
    expect(pastedComment).toEqual(
      expect.objectContaining({
        position: { x: 530, y: 710 },
      }),
    );
    expect(pastedPort).toEqual(
      expect.objectContaining({
        position: { x: 400, y: 500 },
      }),
    );
  });

  it("removes selected sheet items and skips protected system nodes", () => {
    const { project } = createProjectFixture();
    const store = createEditorStore(project, (key) => key);

    store.actions.select({
      kind: "multi",
      nodeIds: ["node_component", "node_system_component"],
      labelIds: ["label_signal"],
      commentIds: ["comment_note"],
      portIds: ["port_source"],
    });

    store.actions.removeSelection();

    const rootSheet =
      store.state.project.sheets[store.state.project.rootSheetId];
    expect(rootSheet.nodes.filter((node) => node.kind === "component")).toEqual(
      [expect.objectContaining({ id: "node_system_component" })],
    );
    expect(rootSheet.labels).toHaveLength(0);
    expect(rootSheet.comments).toHaveLength(0);
    expect(rootSheet.ports).toHaveLength(0);
    expect(rootSheet.directConnections).toHaveLength(0);
    expect(rootSheet.labelAnchors).toHaveLength(0);
    expect(store.state.selection).toBe(null);
    expect(store.state.status).toBe(
      "store.status.removedSelectionSkippedSystemManaged",
    );
  });
});
