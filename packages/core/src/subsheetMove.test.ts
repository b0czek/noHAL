import { describe, expect, it } from "vitest";
import { createId } from "./id";
import {
  createEmptyProject,
  createSheet,
  REQUIRED_HAL_THREAD_NAME,
} from "./project";
import { moveSelectionIntoSubsheet } from "./subsheetMove";
import type { SheetNode } from "./types";

describe("moveSelectionIntoSubsheet", () => {
  it("rewires parent/child connections and remaps addf queue entries", () => {
    const project = createEmptyProject("Subsheet Move");
    const root = project.sheets[project.rootSheetId];

    root.nodes = [];
    root.directConnections = [];
    root.labels = [];
    root.labelAnchors = [];
    root.comments = [];
    root.ports = [];
    for (const sheetId of Object.keys(project.sheets)) {
      if (sheetId === project.rootSheetId) continue;
      delete project.sheets[sheetId];
    }

    project.library.components["test:src"] = {
      id: "test:src",
      name: "src",
      halComponentName: "src",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };
    project.library.components["test:sink"] = {
      id: "test:sink",
      name: "sink",
      halComponentName: "sink",
      source: "manual",
      runtime: { kind: "rt" },
      pins: [{ key: "in", name: "in", direction: "in", type: "bit" }],
      params: [],
    };

    const srcNode = {
      id: "node_src",
      kind: "component" as const,
      componentId: "test:src",
      instanceName: "src",
      position: { x: 120, y: 100 },
      paramValues: {},
    };
    const sinkNode = {
      id: "node_sink",
      kind: "component" as const,
      componentId: "test:sink",
      instanceName: "sink",
      position: { x: 420, y: 100 },
      paramValues: {},
    };
    root.nodes.push(srcNode, sinkNode);
    root.directConnections.push({
      id: "conn_src_sink",
      a: { kind: "node-pin", nodeId: srcNode.id, pinKey: "out" },
      b: { kind: "node-pin", nodeId: sinkNode.id, pinKey: "in" },
      signalName: "sig_in",
    });

    const servoThreadId = project.halThreads?.find(
      (thread) => thread.name === REQUIRED_HAL_THREAD_NAME,
    )?.id;
    const fastThreadId = createId("thread");
    const fastOutputId = createId("sheetthread");
    project.halThreads?.push({
      id: fastThreadId,
      name: "fast-thread",
      periodNs: 500_000,
      floatMode: "fp",
    });
    root.hal = {
      ...(root.hal ?? {}),
      threadOutputs: [
        {
          id: root.hal?.threadOutputs?.[0]?.id ?? createId("sheetthread"),
          name: "main",
          ...(servoThreadId ? { halThreadId: servoThreadId } : {}),
        },
        { id: fastOutputId, name: "fast", halThreadId: fastThreadId },
      ],
      addfQueue: [
        {
          kind: "node",
          nodeId: sinkNode.id,
          sheetThreadOutputId: fastOutputId,
        },
      ],
    };

    const child = createSheet("Child", root.id);
    project.sheets[child.id] = child;
    const subsheetNode: SheetNode = {
      id: "node_child",
      kind: "sheet",
      sheetId: child.id,
      instanceName: "child",
      position: { x: 420, y: 100 },
    };

    const result = moveSelectionIntoSubsheet(project, {
      parentSheetId: root.id,
      childSheetId: child.id,
      subsheetNode,
      movedNodeIds: [sinkNode.id],
    });

    expect(result).toEqual({
      movedNodeCount: 1,
      movedLabelCount: 0,
      createdPortCount: 1,
    });

    expect(root.nodes.map((node) => node.id).sort()).toEqual(
      [srcNode.id, subsheetNode.id].sort(),
    );
    expect(child.nodes.map((node) => node.id)).toEqual([sinkNode.id]);

    const childPort = child.ports[0];
    expect(childPort).toBeDefined();
    expect(childPort?.name).toBe("in");
    expect(childPort?.direction).toBe("in");

    expect(root.directConnections).toEqual([
      {
        id: "conn_src_sink",
        a: { kind: "node-pin", nodeId: srcNode.id, pinKey: "out" },
        b: { kind: "node-pin", nodeId: subsheetNode.id, pinKey: childPort?.id },
        signalName: "sig_in",
      },
    ]);
    expect(child.directConnections).toEqual([
      {
        id: expect.any(String),
        a: { kind: "sheet-port", portId: childPort?.id },
        b: { kind: "node-pin", nodeId: sinkNode.id, pinKey: "in" },
        signalName: "sig_in",
      },
    ]);

    const childFastOutput = child.hal?.threadOutputs?.find(
      (output) => output.name === "fast",
    );
    expect(childFastOutput).toBeDefined();
    expect(subsheetNode.hal?.threadMap?.[childFastOutput?.id ?? ""]).toBe(
      fastOutputId,
    );
    expect(root.hal?.addfQueue).toEqual([
      {
        kind: "subsheet-output",
        nodeId: subsheetNode.id,
        childThreadOutputId: childFastOutput?.id,
        sheetThreadOutputId: fastOutputId,
      },
    ]);
    expect(child.hal?.addfQueue).toEqual([
      {
        kind: "node",
        nodeId: sinkNode.id,
        sheetThreadOutputId: childFastOutput?.id,
      },
    ]);
  });
});
