import { describe, expect, it } from "vitest";
import { makeAddfQueueNodeEntry } from "../addfQueue";
import { createEmptyProject, createSheet } from "../project";
import type { ComponentDefinition } from "../types";
import { sheetModelEdits } from "./sheetEdit";
import { ensureSystemSheet } from "./system";

function createSystemComponent(id: string): ComponentDefinition {
  return {
    id,
    name: "System Component",
    halComponentName: "system_component",
    source: "manual",
    pins: [],
    params: [],
    system: {
      manager: "test",
      family: "test",
    },
  };
}

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

    const renamed = sheetModelEdits.threadOutput.name.update(
      root,
      added.id,
      "fast",
    );
    expect(renamed.isOk()).toBe(true);
    if (renamed.isErr()) throw new Error("expected ok result");
    expect(renamed.value).toEqual({
      changed: true,
      data: expect.objectContaining({ id: added.id, name: "fast" }),
    });
    const rebound = sheetModelEdits.threadOutput.halBinding.update(
      root,
      added.id,
      "thread-servo",
    );
    expect(rebound.isOk()).toBe(true);
    if (rebound.isErr()) throw new Error("expected ok result");
    expect(rebound.value).toEqual({
      changed: true,
      data: expect.objectContaining({
        id: added.id,
        name: "fast",
        halThreadId: "thread-servo",
      }),
    });

    const removed = sheetModelEdits.threadOutput.remove(root, added.id);
    expect(removed.isOk()).toBe(true);
    if (removed.isErr()) throw new Error("expected ok result");
    expect(removed.value).toEqual({
      changed: true,
      data: {
        removedOutputId: added.id,
        fallbackOutputId: root.hal?.threadOutputs?.[0]?.id,
        threadOutputs: root.hal?.threadOutputs,
      },
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

  it("rejects invalid sheet item moves before mutating the project", () => {
    const project = createEmptyProject("Sheet Item Move Guard");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    project.sheets[child.id] = child;
    project.library.components["system:test"] =
      createSystemComponent("system:test");

    root.nodes.push(
      {
        id: "node_child",
        kind: "sheet",
        sheetId: child.id,
        instanceName: "child",
        position: { x: 20, y: 30 },
      },
      {
        id: "node_system",
        kind: "component",
        componentId: "system:test",
        instanceName: "system_component",
        position: { x: 60, y: 70 },
        paramValues: {},
      },
    );

    const blockedBySystem = sheetModelEdits.items.moveIntoNewSubsheet(
      project,
      root.id,
      {
        nodeIds: new Set(["node_system"]),
        labelIds: new Set(),
        portIds: new Set(),
      },
    );
    expect(blockedBySystem.isErr()).toBe(true);
    if (blockedBySystem.isOk()) throw new Error("expected err result");
    expect(blockedBySystem.error).toEqual({ code: "protected-system-node" });
    expect(root.nodes.some((node) => node.id === "node_system")).toBe(true);

    const blockedByTarget = sheetModelEdits.items.moveIntoExistingSubsheet(
      project,
      root.id,
      "node_child",
      {
        nodeIds: new Set(["node_child"]),
        labelIds: new Set(),
        portIds: new Set(),
      },
    );
    expect(blockedByTarget.isErr()).toBe(true);
    if (blockedByTarget.isOk()) throw new Error("expected err result");
    expect(blockedByTarget.error).toEqual({ code: "target-in-items" });
    expect(child.nodes).toHaveLength(0);
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

    expect(result.isOk()).toBe(true);
    if (result.isErr()) throw new Error("expected ok result");
    expect(result.value).toEqual({
      changed: true,
      data: {
        deletedSheetIds: [child.id],
        deletedSheetName: "Child",
        nextActiveSheetId: grandchild.id,
      },
    });
    expect(project.sheets[child.id]).toBeUndefined();
    expect(project.sheets[grandchild.id]).toBeDefined();
    expect(root.nodes.some((node) => node.id === "node_child")).toBe(false);
    expect(root.directConnections).toHaveLength(0);
    expect(root.labelAnchors).toHaveLength(0);
  });

  it("deletes a sheet port and prunes parent-sheet usages", () => {
    const project = createEmptyProject("Delete Sheet Port");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    child.ports.push({
      id: "port_child_in",
      name: "child_in",
      direction: "in",
      type: "bit",
      side: "right",
      position: { x: 0, y: 0 },
    });
    project.sheets[child.id] = child;

    root.nodes.push({
      id: "node_child",
      kind: "sheet",
      sheetId: child.id,
      instanceName: "child",
      position: { x: 20, y: 30 },
    });
    root.ports.push({
      id: "port_root_in",
      name: "root_in",
      direction: "in",
      type: "bit",
      side: "right",
      position: { x: 0, y: 0 },
    });
    root.directConnections.push({
      id: "conn_child_port",
      a: { kind: "sheet-port", portId: "port_root_in" },
      b: { kind: "node-pin", nodeId: "node_child", pinKey: "port_child_in" },
    });
    root.labelAnchors.push({
      id: "anchor_child_port",
      labelId: "label-1",
      endpoint: {
        kind: "node-pin",
        nodeId: "node_child",
        pinKey: "port_child_in",
      },
    });

    const removed = sheetModelEdits.port.remove(
      project,
      child.id,
      "port_child_in",
    );
    expect(removed.isOk()).toBe(true);
    if (removed.isErr()) throw new Error("expected ok result");
    expect(removed.value).toEqual({
      changed: true,
      data: {
        removedPortId: "port_child_in",
        removedReferenceInstanceCount: 1,
      },
    });
    expect(child.ports).toHaveLength(0);
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

    expect(result.isOk()).toBe(true);
    if (result.isErr()) throw new Error("expected detach to succeed");
    expect(result.value.data.originalSheetId).toBe(child.id);
    expect(result.value.data.detachedSheet.id).not.toBe(child.id);
    expect(result.value.data.detachedSheet.name).toBe("Child Copy");
    expect(result.value.data.node.sheetId).toBe(
      result.value.data.detachedSheet.id,
    );
    expect(result.value.data.detachedSheet.nodes[0]?.id).not.toBe(
      "node_component",
    );
  });

  it("keeps protected system sheets immutable through sheet definition/reference edits", () => {
    const project = createEmptyProject("Protected System Sheet Edit");
    const { rootSheet, systemSheet, systemSheetNode } =
      ensureSystemSheet(project);

    const blockedDefinition = sheetModelEdits.definition.remove(
      project,
      systemSheet.id,
      project.rootSheetId,
    );
    expect(blockedDefinition.isErr()).toBe(true);
    if (blockedDefinition.isOk()) throw new Error("expected err result");
    expect(blockedDefinition.error).toEqual({
      code: "protected-system-sheet",
    });
    expect(project.sheets[systemSheet.id]).toBeDefined();

    const blockedReferenceRemoval = sheetModelEdits.reference.remove(
      project,
      rootSheet.id,
      systemSheetNode.id,
    );
    expect(blockedReferenceRemoval.isErr()).toBe(true);
    if (blockedReferenceRemoval.isOk()) throw new Error("expected err result");
    expect(blockedReferenceRemoval.error).toEqual({
      code: "protected-system-sheet",
    });
    expect(rootSheet.nodes.some((node) => node.id === systemSheetNode.id)).toBe(
      true,
    );

    const blockedDetach = sheetModelEdits.reference.detach(
      project,
      rootSheet.id,
      systemSheetNode.id,
    );
    expect(blockedDetach.isErr()).toBe(true);
    if (blockedDetach.isOk()) throw new Error("expected err result");
    expect(blockedDetach.error).toEqual({
      code: "protected-system-sheet",
    });
    expect(systemSheetNode.sheetId).toBe(systemSheet.id);
  });
});
