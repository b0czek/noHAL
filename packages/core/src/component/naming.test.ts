import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../project";
import type { ComponentDefinition, SheetDefinition } from "../types";
import {
  hasComponentExportPathConflict,
  nextComponentInstanceName,
  resolveComponentExportNamespace,
  resolveDefaultComponentExportNamespace,
  resolveNodeExportNamespace,
  resolveNodeInstancePath,
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

function createCustomLoadusrComponent(
  componentName: string,
): ComponentDefinition {
  return {
    id: `comp:${componentName}`,
    name: componentName,
    halComponentName: componentName,
    source: "manual",
    loadCommand: `loadusr -W ${componentName}`,
    runtime: { kind: "userspace" },
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

  it("treats custom loadusr components as global by default", () => {
    expect(
      resolveComponentExportNamespace(
        createCustomLoadusrComponent("manual_userspace"),
      ),
    ).toBe("global");
  });

  it("allows explicit namespace overrides to differ from the default", () => {
    const component = createGlobalDebounceLikeComponent();

    expect(resolveDefaultComponentExportNamespace(component)).toBe("global");

    component.constraints = { exportNamespace: "sheet_scoped" };

    expect(resolveComponentExportNamespace(component)).toBe("sheet_scoped");
  });

  it("allows a single instance of a sheet-scoped component to export globally", () => {
    const component = createSheetScopedComponent("plain");

    expect(
      resolveNodeExportNamespace({ exportNamespace: "global" }, component),
    ).toBe("global");
    expect(
      resolveNodeInstancePath(
        ["logic"],
        { instanceName: "plain_0", exportNamespace: "global" },
        component,
      ),
    ).toBe("plain_0");
    expect(
      resolveNodeInstancePath(
        ["logic"],
        { instanceName: "plain_0" },
        component,
      ),
    ).toBe("logic.plain_0");
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
        candidateNode: {
          instanceName: "debounce.0",
        },
      }),
    ).toBe(true);
    expect(
      nextComponentInstanceName(project, childSheet, globalComponent),
    ).toBe(undefined);
  });

  it("detects conflicts for a single instance promoted to the global namespace", () => {
    const project = createEmptyProject("per-instance-global-collision");
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[childSheet.id] = childSheet;
    project.library.components["comp:plain"] =
      createSheetScopedComponent("plain");

    rootSheet.nodes.push(
      {
        id: "root_plain",
        kind: "component",
        componentId: "comp:plain",
        instanceName: "plain_0",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "child_ref",
        kind: "sheet",
        sheetId: childSheet.id,
        instanceName: "logic",
        position: { x: 100, y: 0 },
      },
    );

    expect(
      hasComponentExportPathConflict({
        project,
        sheetId: childSheet.id,
        component: project.library.components["comp:plain"],
        candidateNode: {
          instanceName: "plain_0",
          exportNamespace: "global",
        },
      }),
    ).toBe(true);
  });
});
