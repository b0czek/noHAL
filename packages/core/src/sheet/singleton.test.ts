import { describe, expect, it } from "vitest";
import { exportProjectToHal } from "../halExport";
import { createEmptyProject } from "../project";
import type { ComponentDefinition, SheetDefinition } from "../types";
import { sheetModelEdits } from "./sheetEdit";
import {
  analyzeSheetSingletons,
  findInvalidForcedSheetSingletons,
  isSingletonReferenceBlocked,
} from "./singleton";

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

function createCustomLoadusrComponent(): ComponentDefinition {
  return {
    id: "comp:manual-userspace",
    name: "manual-userspace",
    halComponentName: "manual_userspace",
    source: "manual",
    loadCommand: "loadusr -W manual_userspace",
    runtime: { kind: "userspace" },
    pins: [],
    params: [],
  };
}

function createSheetScopedComponent(): ComponentDefinition {
  return {
    id: "comp:plain",
    name: "plain",
    halComponentName: "plain",
    source: "manual",
    runtime: { kind: "rt" },
    pins: [],
    params: [],
  };
}

describe("sheet singletonity", () => {
  it("classifies sheets from reachable instances and singleton-forcing nodes", () => {
    const project = createEmptyProject("sheet-singletonity");
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[childSheet.id] = childSheet;

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

    expect(analyzeSheetSingletons(project).get(childSheet.id)?.status).toBe(
      "not_possible",
    );

    const globalComponent = createGlobalDebounceLikeComponent();
    project.library.components[globalComponent.id] = globalComponent;
    childSheet.nodes.push({
      id: "global_node",
      kind: "component",
      componentId: globalComponent.id,
      instanceName: "debounce.0",
      position: { x: 0, y: 0 },
      paramValues: {},
    });

    const childInfo = analyzeSheetSingletons(project).get(childSheet.id);
    expect(childInfo?.status).toBe("forced");
    expect(childInfo?.canBeSingleton).toBe(false);
    expect(
      findInvalidForcedSheetSingletons(project).map((info) => info.sheetId),
    ).toContain(childSheet.id);

    const { text, warnings } = exportProjectToHal(project);
    expect(text).toBe("");
    expect(
      warnings.some((warning) =>
        warning.includes("contains singleton-only nodes"),
      ),
    ).toBe(true);
  });

  it("treats custom loadusr components as singleton-forcing", () => {
    const project = createEmptyProject("sheet-loadusr-singletonity");
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[childSheet.id] = childSheet;

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

    const customLoadusrComponent = createCustomLoadusrComponent();
    project.library.components[customLoadusrComponent.id] =
      customLoadusrComponent;
    childSheet.nodes.push({
      id: "loadusr_node",
      kind: "component",
      componentId: customLoadusrComponent.id,
      instanceName: "manual_userspace",
      position: { x: 0, y: 0 },
      paramValues: {},
    });

    const childInfo = analyzeSheetSingletons(project).get(childSheet.id);
    expect(childInfo?.status).toBe("forced");
    expect(childInfo?.canBeSingleton).toBe(false);
    expect(
      findInvalidForcedSheetSingletons(project).map((info) => info.sheetId),
    ).toContain(childSheet.id);
  });

  it("treats per-instance global overrides as singleton-forcing", () => {
    const project = createEmptyProject("sheet-instance-global-singletonity");
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[childSheet.id] = childSheet;

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

    const component = createSheetScopedComponent();
    project.library.components[component.id] = component;
    childSheet.nodes.push({
      id: "global_node",
      kind: "component",
      componentId: component.id,
      instanceName: "plain_0",
      exportNamespace: "global",
      position: { x: 0, y: 0 },
      paramValues: {},
    });

    const childInfo = analyzeSheetSingletons(project).get(childSheet.id);
    expect(childInfo?.status).toBe("forced");
    expect(childInfo?.canBeSingleton).toBe(false);
    expect(
      findInvalidForcedSheetSingletons(project).map((info) => info.sheetId),
    ).toContain(childSheet.id);
  });

  it("propagates forced singletonity through subsheets and blocks duplicate references", () => {
    const project = createEmptyProject("sheet-singleton-propagation");
    const rootSheet = project.sheets[project.rootSheetId];
    const parentSheet = createSheet("sheet_parent", "Parent");
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[parentSheet.id] = parentSheet;
    project.sheets[childSheet.id] = childSheet;

    const globalComponent = createGlobalDebounceLikeComponent();
    project.library.components[globalComponent.id] = globalComponent;
    childSheet.nodes.push({
      id: "global_node",
      kind: "component",
      componentId: globalComponent.id,
      instanceName: "debounce.0",
      position: { x: 0, y: 0 },
      paramValues: {},
    });
    parentSheet.nodes.push({
      id: "child_ref",
      kind: "sheet",
      sheetId: childSheet.id,
      instanceName: "child",
      position: { x: 0, y: 0 },
    });
    rootSheet.nodes.push({
      id: "parent_ref",
      kind: "sheet",
      sheetId: parentSheet.id,
      instanceName: "parent",
      position: { x: 0, y: 0 },
    });

    const analysis = analyzeSheetSingletons(project);
    expect(analysis.get(childSheet.id)?.status).toBe("forced");
    expect(analysis.get(parentSheet.id)?.status).toBe("forced");
    expect(
      isSingletonReferenceBlocked(project, rootSheet.id, parentSheet.id),
    ).toBe(true);
    expect(
      sheetModelEdits.reference.add(project, rootSheet.id, parentSheet.id),
    ).toBeNull();
  });

  it("allows singleton-forcing components in a single-instanced sheet", () => {
    const project = createEmptyProject("single-instanced-global");
    const rootSheet = project.sheets[project.rootSheetId];
    const childSheet = createSheet("sheet_child", "Child");
    project.sheets[childSheet.id] = childSheet;

    rootSheet.nodes.push({
      id: "sheet_ref",
      kind: "sheet",
      sheetId: childSheet.id,
      instanceName: "logic",
      position: { x: 0, y: 0 },
    });

    const globalComponent = createGlobalDebounceLikeComponent();
    project.library.components[globalComponent.id] = globalComponent;
    childSheet.nodes.push({
      id: "global_node",
      kind: "component",
      componentId: globalComponent.id,
      instanceName: "debounce.0",
      position: { x: 0, y: 0 },
      paramValues: {},
      instanceConfigValues: { channels: "1" },
    });

    const { warnings } = exportProjectToHal(project);

    expect(warnings.some((warning) => warning.includes("Export aborted"))).toBe(
      false,
    );
    expect(
      sheetModelEdits.reference.add(project, rootSheet.id, childSheet.id),
    ).toBeNull();
  });
});
