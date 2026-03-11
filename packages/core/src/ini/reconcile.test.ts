import { describe, expect, it } from "vitest";
import { resolveComponentPinsForInstance } from "../componentInstance";
import { getNodePins } from "../graph";
import { createEmptyProject } from "../project";
import { findSystemSheet } from "../sheet";
import type { ComponentNode } from "../types";
import {
  createIniSystemComponentDefinition,
  INI_SYSTEM_COMPONENT_ID,
  reconcileIniManagedNodes,
} from ".";

function findIniNode(project: ReturnType<typeof createEmptyProject>) {
  const systemSheet = findSystemSheet(project);
  return systemSheet?.nodes.find(
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
});
