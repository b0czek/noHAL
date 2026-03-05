import { describe, expect, it } from "vitest";
import { resolveComponentPinsForInstance } from "../componentInstance";
import { getNodePins } from "../graph";
import { exportProjectToHal } from "../halExport";
import { createId } from "../id";
import { createEmptyProject } from "../project";
import type { ComponentNode } from "../types";
import {
  createIniSystemComponentDefinition,
  INI_SYSTEM_COMPONENT_ID,
  reconcileIniManagedNodes,
} from ".";

function findIniNode(project: ReturnType<typeof createEmptyProject>) {
  const root = project.sheets[project.rootSheetId];
  return root.nodes.find(
    (node): node is ComponentNode =>
      node.kind === "component" && node.instanceName === "ini",
  );
}

describe("ini-managed system component", () => {
  it("creates a managed postgui ini node in fresh projects", () => {
    const project = createEmptyProject("ini defaults");
    const node = findIniNode(project);
    const component = project.library.components[INI_SYSTEM_COMPONENT_ID];

    expect(node).toBeDefined();
    expect(component?.system).toEqual({ manager: "ini", family: "ini" });
    expect(component?.visibility).toEqual({
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    });
    expect(node?.componentId).toBe(INI_SYSTEM_COMPONENT_ID);
    expect(node?.exportStage).toBe("postgui");
  });

  it("adopts legacy ini nodes and forces postgui export stage", () => {
    const project = createEmptyProject("ini adopt");
    const root = project.sheets[project.rootSheetId];

    root.nodes = root.nodes.filter(
      (node) => !(node.kind === "component" && node.instanceName === "ini"),
    );

    project.library.components["halimport:legacy-ini"] = {
      id: "halimport:legacy-ini",
      name: "ini",
      halComponentName: "ini",
      source: "manual",
      runtime: { kind: "userspace" },
      pins: [],
      params: [],
    };
    root.nodes.push({
      id: createId("node"),
      kind: "component",
      componentId: "halimport:legacy-ini",
      instanceName: "ini",
      position: { x: 200, y: 200 },
      paramValues: {},
      exportStage: "main",
    });

    reconcileIniManagedNodes(project);

    const node = findIniNode(project);
    expect(node?.componentId).toBe(INI_SYSTEM_COMPONENT_ID);
    expect(node?.exportStage).toBe("postgui");
    expect(project.library.components["halimport:legacy-ini"]).toBeUndefined();
  });

  it("uses LinuxCNC-version pin schemas sourced from inihal", () => {
    const pins27 = resolveComponentPinsForInstance(
      createIniSystemComponentDefinition("2.7"),
    ).map((pin) => pin.name);

    const pins28 = resolveComponentPinsForInstance(
      createIniSystemComponentDefinition("2.8"),
      { num_joints: "3" },
    ).map((pin) => pin.name);

    expect(pins27).toContain("0.backlash");
    expect(pins27).toContain("8.min_ferror");
    expect(pins27).toContain("traj_arc_blend_tangent_kink_ratio");
    expect(pins27).not.toContain("0.home");
    expect(pins27).not.toContain("x.min_limit");

    expect(pins28).toContain("0.home");
    expect(pins28).toContain("2.home_sequence");
    expect(pins28).toContain("x.min_limit");
    expect(pins28).toContain("traj_arc_blend_tangent_kink_ratio");
    expect(pins28).not.toContain("3.home");
  });

  it("syncs and clamps num_joints from motmod config by LinuxCNC version", () => {
    const project = createEmptyProject("ini joint count");
    project.motmod = {
      ...(project.motmod ?? {
        numJoints: 3,
        numDio: 4,
        numAio: 4,
        numSpindles: 1,
        numMiscError: 0,
        trajPeriodNs: 0,
      }),
      numJoints: 20,
    };

    reconcileIniManagedNodes(project);

    let node = findIniNode(project);
    expect(node?.instanceConfigValues?.num_joints).toBe("16");
    if (!node) return;
    let pins = getNodePins(project, node).map((pin) => pin.name);
    expect(pins).toContain("15.home_sequence");
    expect(pins).not.toContain("16.home_sequence");

    project.target.linuxcncVersion = "2.8";
    project.motmod = {
      ...(project.motmod ?? {
        numJoints: 3,
        numDio: 4,
        numAio: 4,
        numSpindles: 1,
        numMiscError: 0,
        trajPeriodNs: 0,
      }),
      numJoints: 12,
    };

    reconcileIniManagedNodes(project);

    node = findIniNode(project);
    expect(node?.instanceConfigValues?.num_joints).toBe("9");
    if (!node) return;
    pins = getNodePins(project, node).map((pin) => pin.name);
    expect(pins).toContain("8.home_sequence");
    expect(pins).not.toContain("9.home_sequence");
  });

  it("forces ini nets into postgui output during HAL export", () => {
    const project = createEmptyProject("ini export stage");
    const root = project.sheets[project.rootSheetId];
    const iniNode = findIniNode(project);
    expect(iniNode).toBeDefined();
    if (!iniNode) return;

    // Simulate drift from UI/state edits before export.
    delete iniNode.exportStage;

    project.library.components["test:src"] = {
      id: "test:src",
      name: "src",
      halComponentName: "src",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [{ key: "out", name: "out", direction: "out", type: "bit" }],
      params: [],
    };
    root.nodes.push({
      id: "node_src",
      kind: "component",
      componentId: "test:src",
      instanceName: "src",
      position: { x: 220, y: 220 },
      paramValues: {},
    });

    const iniPin = getNodePins(project, iniNode).find(
      (pin) => pin.name === "traj_arc_blend_enable",
    );
    expect(iniPin).toBeDefined();
    if (!iniPin) return;

    root.directConnections.push({
      id: "dc_ini_stage",
      a: { kind: "node-pin", nodeId: "node_src", pinKey: "out" },
      b: { kind: "node-pin", nodeId: iniNode.id, pinKey: iniPin.key },
      signalName: "ini_stage_sig",
    });

    const out = exportProjectToHal(project);
    expect(out.text).not.toContain("ini.traj_arc_blend_enable");
    expect(out.postguiText ?? "").toContain("ini.traj_arc_blend_enable");
    expect(out.postguiText ?? "").toContain("net ini_stage_sig");
  });
});
