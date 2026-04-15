import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../project";
import type { ComponentDefinition, SheetDefinition } from "../types";
import {
  hasComponentExportPathConflict,
  nextComponentInstanceName,
  resolveComponentExportNamespace,
} from "./naming";

function createSheet(id: string, name: string): SheetDefinition {
  return {
    id,
    name,
    nodes: [],
    ports: [],
    labels: [],
    comments: [],
    directConnections: [],
    labelAnchors: [],
  };
}

function createGlobalDebounceLikeComponent(): ComponentDefinition {
  return {
    id: "comp:debounce",
    name: "debounce",
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

function createSheetScopedComponent(
  componentName: string,
): ComponentDefinition {
  return {
    id: `comp:${componentName}`,
    name: componentName,
    halComponentName: componentName,
    source: "manual",
    runtime: { kind: "rt" },
    pins: [],
    params: [],
  };
}

describe("component export namespace", () => {
  it("treats locked canonical runtime names as global by default", () => {
    expect(
      resolveComponentExportNamespace(createGlobalDebounceLikeComponent()),
    ).toBe("global");
  });

  it("skips conflicting global names that would collide with exported root paths", () => {
    const project = createEmptyProject("naming-collision");
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[childSheet.id] = childSheet;

    const globalComponent = createGlobalDebounceLikeComponent();
    project.library.components[globalComponent.id] = globalComponent;
    project.library.components["comp:plain"] =
      createSheetScopedComponent("plain");

    rootSheet.nodes.push(
      {
        id: "root_plain",
        kind: "component",
        componentId: "comp:plain",
        instanceName: "debounce.0",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "sheet_node",
        kind: "sheet",
        sheetId: childSheet.id,
        instanceName: "logic",
        position: { x: 100, y: 0 },
      },
    );

    expect(
      nextComponentInstanceName(project, childSheet, globalComponent),
    ).toBe("debounce.1");
  });

  it("detects that a global component inside a multi-instanced sheet is ambiguous", () => {
    const project = createEmptyProject("multi-instance-global");
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[childSheet.id] = childSheet;

    const globalComponent = createGlobalDebounceLikeComponent();
    project.library.components[globalComponent.id] = globalComponent;

    rootSheet.nodes.push(
      {
        id: "sheet_a",
        kind: "sheet",
        sheetId: childSheet.id,
        instanceName: "logic_a",
        position: { x: 0, y: 0 },
      },
      {
        id: "sheet_b",
        kind: "sheet",
        sheetId: childSheet.id,
        instanceName: "logic_b",
        position: { x: 120, y: 0 },
      },
    );

    expect(
      hasComponentExportPathConflict({
        project,
        sheetId: childSheet.id,
        component: globalComponent,
        instanceName: "debounce.0",
      }),
    ).toBe(true);
    expect(
      nextComponentInstanceName(project, childSheet, globalComponent),
    ).toBe(undefined);
  });
});
