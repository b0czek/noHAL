import { describe, expect, it } from "vitest";
import { createEmptyProject, createSheet } from "../project";
import type { ComponentDefinition } from "../types";
import { nodeModelEdits } from "./nodeEdit";

function createSheetScopedComponent(id: string): ComponentDefinition {
  return {
    id,
    name: "Plain Component",
    halComponentName: "plain",
    source: "manual",
    runtime: { kind: "rt" },
    pins: [],
    params: [],
  };
}

function createLockedCanonicalComponent(id: string): ComponentDefinition {
  return {
    id,
    name: "Locked Canonical",
    halComponentName: "debounce",
    source: "manual",
    runtime: {
      kind: "rt",
      instanceNaming: {
        strategy: "canonical_indexed",
        lockToCanonical: true,
        maxInstances: 8,
      },
    },
    pins: [],
    params: [],
  };
}

describe("node model edit helpers", () => {
  it("adds a component node with defaults and an export-safe instance name", () => {
    const project = createEmptyProject("Add Component Node");
    const root = project.sheets[project.rootSheetId];
    project.library.components["comp:plain"] = {
      id: "comp:plain",
      name: "Plain Component",
      halComponentName: "plain",
      source: "manual",
      runtime: {
        kind: "rt",
        instanceConfig: {
          fields: [
            { key: "count", type: "integer", defaultValue: 2 },
            { key: "unused", type: "string" },
          ],
        },
      },
      pins: [],
      params: [
        {
          key: "gain",
          name: "gain",
          direction: "rw",
          type: "float",
          defaultValue: "1.5",
        },
      ],
    };

    const result = nodeModelEdits.component.add(
      project,
      root.id,
      "comp:plain",
      { x: 120, y: 140 },
    );

    expect(result.isOk()).toBe(true);
    if (result.isErr()) throw new Error("expected ok result");
    expect(result.value.changed).toBe(true);
    expect(result.value.data).toEqual(
      expect.objectContaining({
        kind: "component",
        componentId: "comp:plain",
        instanceName: "plain",
        position: { x: 120, y: 140 },
        paramValues: { gain: "1.5" },
        instanceConfigValues: { count: "2" },
      }),
    );
    expect(root.nodes).toContainEqual(result.value.data);
  });

  it("renames sheet nodes and rejects duplicate sheet-local instance names", () => {
    const project = createEmptyProject("Rename Sheet Node");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    project.sheets[child.id] = child;

    root.nodes.push(
      {
        id: "node_child_a",
        kind: "sheet",
        sheetId: child.id,
        instanceName: "child_a",
        position: { x: 20, y: 30 },
      },
      {
        id: "node_child_b",
        kind: "sheet",
        sheetId: child.id,
        instanceName: "child_b",
        position: { x: 60, y: 30 },
      },
    );

    const renamed = nodeModelEdits.instanceName.update(
      project,
      root.id,
      "node_child_a",
      " renamed_child ",
    );
    expect(renamed.isOk()).toBe(true);
    if (renamed.isErr()) throw new Error("expected ok result");
    expect(renamed.value).toEqual({
      changed: true,
      data: {
        sheetId: root.id,
        nodeId: "node_child_a",
        instanceName: "renamed_child",
      },
    });
    expect(
      root.nodes.find((node) => node.id === "node_child_a")?.instanceName,
    ).toBe("renamed_child");

    const duplicate = nodeModelEdits.instanceName.update(
      project,
      root.id,
      "node_child_a",
      "child_b",
    );
    expect(duplicate.isErr()).toBe(true);
    if (duplicate.isOk()) throw new Error("expected err result");
    expect(duplicate.error).toEqual({
      code: "conflict",
      detail: "duplicate-name",
    });
  });

  it("rejects component renames that would collide in the exported namespace", () => {
    const project = createEmptyProject("Rename Component Export Conflict");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    const component = createSheetScopedComponent("comp:plain");
    project.sheets[child.id] = child;
    project.library.components[component.id] = component;

    root.nodes.push({
      id: "node_child",
      kind: "sheet",
      sheetId: child.id,
      instanceName: "child",
      position: { x: 20, y: 30 },
    });

    root.nodes.push({
      id: "node_global_root",
      kind: "component",
      componentId: component.id,
      instanceName: "shared_name",
      exportNamespace: "global",
      position: { x: 0, y: 0 },
      paramValues: {},
    });
    child.nodes.push({
      id: "node_global_child",
      kind: "component",
      componentId: component.id,
      instanceName: "other_name",
      exportNamespace: "global",
      position: { x: 0, y: 0 },
      paramValues: {},
    });

    const result = nodeModelEdits.instanceName.update(
      project,
      child.id,
      "node_global_child",
      "shared_name",
    );
    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("expected err result");
    expect(result.error).toEqual({
      code: "conflict",
      detail: "duplicate-exported-instance-path",
    });
    expect(child.nodes[0]?.instanceName).toBe("other_name");
  });

  it("rejects renaming components with fixed runtime-controlled instance names", () => {
    const project = createEmptyProject("Rename Locked Component");
    const root = project.sheets[project.rootSheetId];
    const component = createLockedCanonicalComponent("comp:debounce");
    project.library.components[component.id] = component;

    root.nodes.push({
      id: "node_locked",
      kind: "component",
      componentId: component.id,
      instanceName: "debounce.0",
      position: { x: 20, y: 30 },
      paramValues: {},
    });

    const result = nodeModelEdits.instanceName.update(
      project,
      root.id,
      "node_locked",
      "debounce.1",
    );
    expect(result.isErr()).toBe(true);
    if (result.isOk()) throw new Error("expected err result");
    expect(result.error).toEqual({
      code: "forbidden",
      detail: "fixed-instance-name",
    });
    expect(
      root.nodes.find((node) => node.id === "node_locked")?.instanceName,
    ).toBe("debounce.0");
  });

  it("renames a sheet instance by resolving its parent reference in core", () => {
    const project = createEmptyProject("Rename Sheet Instance");
    const root = project.sheets[project.rootSheetId];
    const child = createSheet("Child");
    project.sheets[child.id] = child;

    root.nodes.push({
      id: "node_child_ref",
      kind: "sheet",
      sheetId: child.id,
      instanceName: "child",
      position: { x: 20, y: 30 },
    });

    const result = nodeModelEdits.instanceName.updateSheet(
      project,
      child.id,
      "renamed_child",
    );

    expect(result.isOk()).toBe(true);
    if (result.isErr()) throw new Error("expected ok result");
    expect(result.value).toEqual({
      changed: true,
      data: {
        sheetId: root.id,
        nodeId: "node_child_ref",
        instanceName: "renamed_child",
      },
    });
    expect(
      root.nodes.find((node) => node.id === "node_child_ref")?.instanceName,
    ).toBe("renamed_child");
  });
});
