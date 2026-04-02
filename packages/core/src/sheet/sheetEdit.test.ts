import { describe, expect, it } from "vitest";
import { makeAddfQueueNodeEntry } from "../addfQueue";
import { createEmptyProject, createSheet } from "../project";
import { sheetModelEdits } from "./sheetEdit";

describe("sheet model edit helpers", () => {
  it("manages sheet thread outputs and remaps dependent references", () => {
    const project = createEmptyProject("Thread Output Edit");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    project.sheets[child.id] = child;

    const childOutputId = child.hal?.threadOutputs?.[0]?.id;
    if (!childOutputId) throw new Error("expected child output");

    const added = sheetModelEdits.threadOutput.add(root);
    root.nodes.push({
      id: "node_child",
      kind: "sheet",
      sheetId: child.id,
      instanceName: "child",
      position: { x: 10, y: 20 },
      hal: {
        threadMap: {
          [childOutputId]: added.id,
        },
      },
    });
    root.hal = {
      ...(root.hal ?? {}),
      addfQueue: [makeAddfQueueNodeEntry("node_child", added.id)],
    };

    expect(
      sheetModelEdits.threadOutput.name.update(root, added.id, "fast"),
    ).toEqual({
      ok: true,
      changed: true,
      output: expect.objectContaining({ id: added.id, name: "fast" }),
    });
    expect(
      sheetModelEdits.threadOutput.halBinding.update(
        root,
        added.id,
        "thread-servo",
      ),
    ).toEqual({
      ok: true,
      changed: true,
      output: expect.objectContaining({
        id: added.id,
        name: "fast",
        halThreadId: "thread-servo",
      }),
    });

    const removed = sheetModelEdits.threadOutput.remove(root, added.id);
    expect(removed).toEqual({
      ok: true,
      removedOutputId: added.id,
      fallbackOutputId: root.hal?.threadOutputs?.[0]?.id,
      threadOutputs: root.hal?.threadOutputs,
    });
    expect(root.hal?.addfQueue).toEqual([
      expect.objectContaining({
        kind: "node",
        nodeId: "node_child",
        sheetThreadOutputId: root.hal?.threadOutputs?.[0]?.id,
      }),
    ]);
    const childNode = root.nodes.find(
      (node): node is (typeof root.nodes)[number] & { kind: "sheet" } =>
        node.kind === "sheet" && node.id === "node_child",
    );
    expect(childNode?.hal).toBeUndefined();
  });

  it("adds sheet definitions with unique names and instance names", () => {
    const project = createEmptyProject("Sheet Definition Edit");
    const root = project.sheets[project.rootSheetId];

    const first = sheetModelEdits.definition.add(project, root.id);
    expect(first?.name).toBe("Sheet");
    expect(first?.node.instanceName).toBe("sheet");

    const second = sheetModelEdits.definition.add(project, root.id);
    expect(second?.name).toBe("Sheet2");
    expect(second?.node.instanceName).toBe("sheet2");
    expect(project.sheets[first?.sheet.id ?? ""]).toBeTruthy();
    expect(project.sheets[second?.sheet.id ?? ""]).toBeTruthy();
  });

  it("deletes only the targeted definition and prunes its references", () => {
    const project = createEmptyProject("Delete Sheet Definition");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    const grandchild = createSheet("Grandchild");
    project.sheets[child.id] = child;
    project.sheets[grandchild.id] = grandchild;

    root.nodes.push({
      id: "node_child",
      kind: "sheet",
      sheetId: child.id,
      instanceName: "child",
      position: { x: 20, y: 30 },
    });
    child.nodes.push({
      id: "node_grandchild",
      kind: "sheet",
      sheetId: grandchild.id,
      instanceName: "grandchild",
      position: { x: 40, y: 50 },
    });
    root.ports.push({
      id: "port_root",
      name: "root_out",
      direction: "out",
      type: "bit",
      side: "left",
      position: { x: 0, y: 0 },
    });
    root.directConnections.push({
      id: "conn_child",
      a: { kind: "node-pin", nodeId: "node_child", pinKey: "pin-1" },
      b: { kind: "sheet-port", portId: "port_root" },
    });
    root.labelAnchors.push({
      id: "anchor_child",
      labelId: "label-1",
      endpoint: { kind: "node-pin", nodeId: "node_child", pinKey: "pin-1" },
    });

    const result = sheetModelEdits.definition.remove(
      project,
      child.id,
      grandchild.id,
    );

    expect(result).toEqual({
      ok: true,
      deletedSheetIds: [child.id],
      deletedSheetName: "Child",
      nextActiveSheetId: grandchild.id,
    });
    expect(project.sheets[child.id]).toBeUndefined();
    expect(project.sheets[grandchild.id]).toBeDefined();
    expect(root.nodes.some((node) => node.id === "node_child")).toBe(false);
    expect(root.directConnections).toHaveLength(0);
    expect(root.labelAnchors).toHaveLength(0);
  });

  it("detaches a sheet reference into an independent definition snapshot", () => {
    const project = createEmptyProject("Detach Sheet Reference");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    child.nodes.push({
      id: "node_component",
      kind: "component",
      componentId: "comp:test",
      instanceName: "test.0",
      position: { x: 10, y: 20 },
      paramValues: {},
    });
    project.sheets[child.id] = child;
    root.nodes.push({
      id: "node_child",
      kind: "sheet",
      sheetId: child.id,
      instanceName: "child",
      position: { x: 20, y: 30 },
    });

    const result = sheetModelEdits.reference.detach(
      project,
      root.id,
      "node_child",
    );

    expect(result).not.toBeNull();
    expect(result?.originalSheetId).toBe(child.id);
    expect(result?.detachedSheet.id).not.toBe(child.id);
    expect(result?.detachedSheet.name).toBe("Child Copy");
    expect(result?.node.sheetId).toBe(result?.detachedSheet.id);
    expect(result?.detachedSheet.nodes[0]?.id).not.toBe("node_component");
  });
});
