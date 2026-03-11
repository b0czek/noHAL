import { describe, expect, it } from "vitest";
import { resolveComponentPinsForInstance } from "../componentInstance";
import { getNodePins } from "../graph";
import { exportProjectToHal } from "../halExport";
import { createId } from "../id";
import { createEmptyProject } from "../project";
import { findSystemSheet } from "../sheet";
import type {
  ComponentDefinition,
  ComponentNode,
  ComponentPinDefinition,
  NoHALProject,
} from "../types";
import { buildSystemOverrideDefinition } from "./shared";
import { reconcileSystemSingleton } from "./singleton";

const TEST_SYSTEM_COMPONENT_ID = "system:testsys";
const TEST_SYSTEM_MANAGER = "testsys";
const TEST_SYSTEM_FAMILY = "testsys";
const TEST_CUSTOM_OVERRIDE_MANAGER = "testsys-custom";
const TEST_INSTANCE_CONFIG_VALUES = { count: "2" };

function createTestSystemDefinition(): ComponentDefinition {
  return {
    id: TEST_SYSTEM_COMPONENT_ID,
    name: "testsys",
    halComponentName: "testsys",
    source: "manual",
    runtime: {
      kind: "userspace",
      instanceConfig: {
        fields: [
          {
            key: "count",
            type: "integer",
            defaultValue: 2,
          },
        ],
        pinExpansionRules: [
          {
            kind: "indexed_by_count",
            countConfigKey: "count",
            templates: [
              {
                keyTemplate: "status_{index}",
                nameTemplate: "status-{index:02d}",
                direction: "out",
                type: "bit",
              },
            ],
          },
        ],
      },
    },
    pins: [{ key: "enable", name: "enable", direction: "in", type: "bit" }],
    params: [{ key: "mode", name: "mode", direction: "rw", type: "u32" }],
    functions: [
      {
        key: "update",
        declaredName: "update",
        halSuffix: "update",
        floatMode: "nofp",
      },
    ],
    system: {
      manager: TEST_SYSTEM_MANAGER,
      family: TEST_SYSTEM_FAMILY,
    },
    constraints: {
      fixedInstanceName: "testsys",
      fixedExportStage: "postgui",
    },
    visibility: {
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    },
  };
}

function createImportedTestComponent(
  overrides: Partial<ComponentDefinition> = {},
): ComponentDefinition {
  const resolvedPins = resolveComponentPinsForInstance(
    createTestSystemDefinition(),
    TEST_INSTANCE_CONFIG_VALUES,
  );
  return {
    id: "halimport:testsys",
    name: "testsys",
    halComponentName: "testsys",
    source: "manual",
    runtime: { kind: "unknown" },
    pins: resolvedPins.map((pin) => ({ ...pin })),
    params: [{ key: "mode", name: "mode", direction: "rw", type: "u32" }],
    functions: [
      {
        key: "update",
        declaredName: "update",
        halSuffix: "update",
        floatMode: "nofp",
      },
    ],
    ...overrides,
  };
}

function isTestLikeNode(project: NoHALProject, node: ComponentNode): boolean {
  const component = project.library.components[node.componentId];
  if (!component) return false;
  if (
    (component.system?.manager === TEST_SYSTEM_MANAGER ||
      component.system?.manager === TEST_CUSTOM_OVERRIDE_MANAGER) &&
    component.system?.family === TEST_SYSTEM_FAMILY
  ) {
    return true;
  }
  return component.halComponentName === "testsys";
}

function reconcileTestSystem(project: NoHALProject): NoHALProject {
  return reconcileSystemSingleton({
    project,
    systemComponentId: TEST_SYSTEM_COMPONENT_ID,
    expectedDefinition: createTestSystemDefinition(),
    customOverrideManager: TEST_CUSTOM_OVERRIDE_MANAGER,
    customOverrideFamily: TEST_SYSTEM_FAMILY,
    defaultPosition: { x: 120, y: 120 },
    isLikeNode: isTestLikeNode,
    syncInstanceConfig: true,
    expectedInstanceConfigValues: TEST_INSTANCE_CONFIG_VALUES,
    fixedExportStage: "postgui",
    pruneUnusedImportedComponents(nextProject) {
      const referenced = new Set<string>();
      for (const sheet of Object.values(nextProject.sheets)) {
        for (const node of sheet.nodes) {
          if (node.kind !== "component") continue;
          referenced.add(node.componentId);
        }
      }
      if (!referenced.has("halimport:testsys")) {
        delete nextProject.library.components["halimport:testsys"];
      }
    },
  });
}

function findTestNode(
  project: ReturnType<typeof createEmptyProject>,
): ComponentNode | undefined {
  const systemSheet = findSystemSheet(project);
  return systemSheet?.nodes.find(
    (node): node is ComponentNode =>
      node.kind === "component" && node.instanceName === "testsys",
  );
}

describe("systemReconcile singleton", () => {
  it("creates the canonical singleton node and syncs config", () => {
    const project = createEmptyProject("system singleton defaults");

    reconcileTestSystem(project);

    const node = findTestNode(project);
    expect(node?.componentId).toBe(TEST_SYSTEM_COMPONENT_ID);
    expect(node?.instanceConfigValues).toEqual(TEST_INSTANCE_CONFIG_VALUES);
    expect(node?.exportStage).toBe("postgui");
    expect(
      project.library.components[TEST_SYSTEM_COMPONENT_ID]?.system,
    ).toEqual({
      manager: TEST_SYSTEM_MANAGER,
      family: TEST_SYSTEM_FAMILY,
    });
  });

  it("adopts standard imported nodes and prunes duplicates", () => {
    const project = createEmptyProject("system singleton adopt");
    const systemSheet = findSystemSheet(project);
    if (!systemSheet) throw new Error("expected system sheet");

    project.library.components["halimport:testsys"] =
      createImportedTestComponent({
        runtime: { kind: "userspace" },
      });
    systemSheet.nodes.push(
      {
        id: createId("node"),
        kind: "component",
        componentId: "halimport:testsys",
        instanceName: "testsys",
        position: { x: 200, y: 200 },
        paramValues: {},
      },
      {
        id: createId("node"),
        kind: "component",
        componentId: "halimport:testsys",
        instanceName: "testsys.1",
        position: { x: 260, y: 260 },
        paramValues: {},
      },
    );

    reconcileTestSystem(project);

    const testNodes = systemSheet.nodes.filter(
      (node) => node.kind === "component" && isTestLikeNode(project, node),
    );
    expect(testNodes).toHaveLength(1);
    expect(findTestNode(project)?.componentId).toBe(TEST_SYSTEM_COMPONENT_ID);
    expect(project.library.components["halimport:testsys"]).toBeUndefined();
  });

  it("keeps custom overrides when imported members are non-standard", () => {
    const project = createEmptyProject("system singleton custom override");
    const systemSheet = findSystemSheet(project);
    if (!systemSheet) throw new Error("expected system sheet");

    project.library.components["halimport:testsys"] =
      createImportedTestComponent({
        pins: [
          { key: "enable", name: "enable", direction: "in", type: "bit" },
          {
            key: "status_0",
            name: "status-00",
            direction: "out",
            type: "bit",
          },
          {
            key: "status_1",
            name: "status-01",
            direction: "out",
            type: "bit",
          },
          {
            key: "aux_ready",
            name: "aux-ready",
            direction: "in",
            type: "bit",
          },
        ],
        params: [
          { key: "mode", name: "mode", direction: "rw", type: "u32" },
          {
            key: "debug_level",
            name: "debug-level",
            direction: "rw",
            type: "u32",
          },
        ],
        functions: [
          {
            key: "update",
            declaredName: "update",
            halSuffix: "update",
            floatMode: "nofp",
          },
          {
            key: "diag",
            declaredName: "diag",
            halSuffix: "diag",
            floatMode: "nofp",
          },
        ],
      });
    project.library.components["test:src"] = {
      id: "test:src",
      name: "src",
      halComponentName: "src",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };

    systemSheet.nodes.push(
      {
        id: "node_testsys",
        kind: "component",
        componentId: "halimport:testsys",
        instanceName: "testsys",
        position: { x: 200, y: 200 },
        paramValues: {},
      },
      {
        id: "node_src",
        kind: "component",
        componentId: "test:src",
        instanceName: "src",
        position: { x: 320, y: 200 },
        paramValues: {},
      },
    );

    reconcileTestSystem(project);

    const node = findTestNode(project);
    expect(node?.componentId).toBe("halimport:testsys");
    expect(project.library.components["halimport:testsys"]?.system).toEqual({
      manager: TEST_CUSTOM_OVERRIDE_MANAGER,
      family: TEST_SYSTEM_FAMILY,
    });
    expect(node?.instanceConfigValues).toEqual(TEST_INSTANCE_CONFIG_VALUES);
    expect(node?.exportStage).toBe("postgui");
    if (!node) return;

    const pins = getNodePins(project, node);
    expect(pins.map((pin) => pin.name)).toContain("aux-ready");
    expect(pins.map((pin) => pin.name)).toContain("status-01");
    expect(
      project.library.components["halimport:testsys"]?.params.map(
        (param) => param.name,
      ),
    ).toContain("debug-level");
    expect(
      project.library.components["halimport:testsys"]?.functions?.map(
        (fn) => fn.halSuffix,
      ),
    ).toContain("diag");

    const extraPin = pins.find((pin) => pin.name === "aux-ready");
    expect(extraPin).toBeDefined();
    if (!extraPin) return;

    systemSheet.directConnections.push({
      id: "dc_testsys_extra",
      a: { kind: "node-pin", nodeId: "node_src", pinKey: "out" },
      b: { kind: "node-pin", nodeId: node.id, pinKey: extraPin.key },
      signalName: "testsys_extra",
    });

    const out = exportProjectToHal(project);
    expect(out.text).not.toContain("testsys.aux-ready");
    expect(out.postguiText ?? "").toContain(
      "net testsys_extra system.src.out system.testsys.aux-ready",
    );
  });

  it("does not promote imported members that already match by identity", () => {
    const matchingPins: ComponentPinDefinition[] =
      createImportedTestComponent().pins.map((pin, index) => ({
        ...pin,
        direction: index === 0 ? "out" : index === 1 ? "in" : "io",
        type: index === 0 ? "float" : index === 1 ? "u32" : "s32",
      }));

    const override = buildSystemOverrideDefinition(
      createImportedTestComponent({
        pins: matchingPins,
        params: [
          { key: "mode_value", name: "mode", direction: "rw", type: "s64" },
        ],
        functions: [
          {
            key: "tick",
            declaredName: "run_update",
            halSuffix: "update",
            floatMode: "fp",
          },
        ],
      }),
      createTestSystemDefinition(),
      TEST_CUSTOM_OVERRIDE_MANAGER,
      TEST_SYSTEM_FAMILY,
      TEST_INSTANCE_CONFIG_VALUES,
    );

    expect(override).toBeNull();
  });
});
