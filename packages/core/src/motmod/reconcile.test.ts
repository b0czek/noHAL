import { describe, expect, it } from "vitest";
import { makeAddfQueueFunctionEntry } from "../addfQueue";
import { getNodePins } from "../graph";
import { exportProjectToHal } from "../halExport";
import {
  createEmptyProject,
  parseNoHALProject,
  stringifyNoHALProject,
} from "../project";
import { findSystemSheet } from "../systemSheet";
import {
  createMotmodSystemComponentDefinition,
  planMotmodReconcile,
  reconcileMotmodManagedNodes,
} from ".";

function managedInstanceNames(project: ReturnType<typeof createEmptyProject>) {
  const systemSheet = findSystemSheet(project);
  return (systemSheet?.nodes ?? [])
    .filter(
      (node) =>
        node.kind === "component" &&
        project.library.components[node.componentId]?.system?.manager ===
          "motmod",
    )
    .map((node) => node.instanceName)
    .sort((a, b) => a.localeCompare(b));
}

const AXIS_LETTERS = ["a", "b", "c", "u", "v", "w", "x", "y", "z"] as const;

function expectedAxisInstances(): string[] {
  return AXIS_LETTERS.map((letter) => `axis.${letter}`);
}

function expectedAxisInstances27(numJoints: number): string[] {
  return Array.from({ length: Math.max(1, numJoints) }, (_, i) => `axis.${i}`);
}

describe("motmod-managed obligatory components", () => {
  it("reports in-sync plan for a fresh project", () => {
    const project = createEmptyProject("motmod plan sync");
    const plan = planMotmodReconcile(project);

    expect(plan.inSync).toBe(true);
    expect(plan.motmodWillNormalize).toBe(false);
    expect(plan.addNodes).toEqual([]);
    expect(plan.removeNodes).toEqual([]);
    expect(plan.adoptNodes).toEqual([]);
    expect(plan.ensureComponents).toEqual([]);
    expect(plan.updateNodeConfigs).toEqual([]);
  });

  it("plans missing nodes without mutating until reconcile is called", () => {
    const project = createEmptyProject("motmod plan mutate");
    const systemSheet = findSystemSheet(project);
    if (!systemSheet) throw new Error("expected system sheet");
    systemSheet.nodes = systemSheet.nodes.filter(
      (node) => !(node.kind === "component" && node.instanceName === "joint.2"),
    );

    const before = managedInstanceNames(project);
    const plan = planMotmodReconcile(project);
    const afterPlan = managedInstanceNames(project);

    expect(before).toEqual(afterPlan);
    expect(plan.inSync).toBe(false);
    expect(plan.addNodes).toEqual([
      { family: "joint", instanceName: "joint.2" },
    ]);

    reconcileMotmodManagedNodes(project);
    expect(managedInstanceNames(project)).toContain("joint.2");
  });

  it("creates LinuxCNC 2.10 defaults (motion, axis, joint.N, spindle.N)", () => {
    const project = createEmptyProject("motmod defaults");

    expect(managedInstanceNames(project)).toEqual(
      [
        ...expectedAxisInstances(),
        "joint.0",
        "joint.1",
        "joint.2",
        "motion",
        "spindle.0",
      ].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("reuses persisted motmod nodes when system component definitions are rebuilt on load", () => {
    const project = createEmptyProject("motmod persisted system nodes");
    const persisted = {
      ...project,
      library: { components: {} },
    };

    const reparsed = parseNoHALProject(JSON.stringify(persisted));
    const managedNames = managedInstanceNames(reparsed);

    expect(managedNames).toEqual(managedInstanceNames(project));
    expect(new Set(managedNames).size).toBe(managedNames.length);
    expect(reparsed.sheets[reparsed.rootSheetId]?.nodes).toHaveLength(
      project.sheets[project.rootSheetId]?.nodes.length ?? 0,
    );
  });

  it("marks motmod system components as non-placeable internal components", () => {
    const project = createEmptyProject("motmod visibility");
    const motionComponent = project.library.components["system:motmod:motion"];
    expect(motionComponent?.system).toEqual({
      manager: "motmod",
      family: "motion",
    });
    expect(motionComponent?.visibility).toEqual({
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    });
    expect(motionComponent?.constraints).toEqual({
      fixedInstanceName: "motion",
    });
  });

  it("resizes managed joint/spindle instance counts from motmod config", () => {
    const project = createEmptyProject("motmod resize");
    project.motmod = {
      ...(project.motmod ?? {
        numJoints: 3,
        numDio: 4,
        numAio: 4,
        numSpindles: 1,
        numMiscError: 0,
        trajPeriodNs: 0,
      }),
      numJoints: 5,
      numSpindles: 2,
    };

    reconcileMotmodManagedNodes(project);

    expect(managedInstanceNames(project)).toEqual(
      [
        ...expectedAxisInstances(),
        "joint.0",
        "joint.1",
        "joint.2",
        "joint.3",
        "joint.4",
        "motion",
        "spindle.0",
        "spindle.1",
      ].sort((a, b) => a.localeCompare(b)),
    );

    project.motmod = {
      ...(project.motmod ?? {
        numJoints: 3,
        numDio: 4,
        numAio: 4,
        numSpindles: 1,
        numMiscError: 0,
        trajPeriodNs: 0,
      }),
      numJoints: 2,
      numSpindles: 1,
    };
    reconcileMotmodManagedNodes(project);

    expect(managedInstanceNames(project)).toEqual(
      [
        ...expectedAxisInstances(),
        "joint.0",
        "joint.1",
        "motion",
        "spindle.0",
      ].sort((a, b) => a.localeCompare(b)),
    );
  });

  it("uses LinuxCNC 2.7 mapping (motion + axis.N only)", () => {
    const project = createEmptyProject("motmod 2.7");
    project.target.linuxcncVersion = "2.7";
    project.motmod = {
      ...(project.motmod ?? {
        numJoints: 3,
        numDio: 4,
        numAio: 4,
        numSpindles: 1,
        numMiscError: 0,
        trajPeriodNs: 0,
      }),
      numJoints: 4,
    };

    reconcileMotmodManagedNodes(project);

    expect(managedInstanceNames(project)).toEqual(
      [...expectedAxisInstances27(4), "motion"].sort((a, b) =>
        a.localeCompare(b),
      ),
    );
  });

  it("uses version-specific pin schemas for motion and joint", () => {
    const motion27Pins = createMotmodSystemComponentDefinition(
      "motion",
      "2.7",
    ).pins.map((pin) => pin.name);
    const motion28Pins = createMotmodSystemComponentDefinition(
      "motion",
      "2.8",
    ).pins.map((pin) => pin.name);
    const motion29Pins = createMotmodSystemComponentDefinition(
      "motion",
      "2.9",
    ).pins.map((pin) => pin.name);
    const joint28Pins = createMotmodSystemComponentDefinition(
      "joint",
      "2.8",
    ).pins.map((pin) => pin.name);
    const joint29Pins = createMotmodSystemComponentDefinition(
      "joint",
      "2.9",
    ).pins.map((pin) => pin.name);

    expect(motion27Pins).not.toContain("homing-inhibit");
    expect(motion28Pins).toContain("homing-inhibit");
    expect(motion28Pins).not.toContain("jog-stop");
    expect(motion29Pins).toContain("jog-stop");
    expect(motion29Pins).toContain("is-all-homed");

    expect(joint28Pins).toContain("joint-vel-cmd");
    expect(joint28Pins).not.toContain("vel-cmd");
    expect(joint29Pins).toContain("vel-cmd");
    expect(joint29Pins).not.toContain("joint-vel-cmd");
  });

  it("expands motion dio/aio pins from instanceConfig values", () => {
    const project = createEmptyProject("motmod motion expansion");
    const systemSheet = findSystemSheet(project);
    const motion = systemSheet?.nodes.find(
      (node) => node.kind === "component" && node.instanceName === "motion",
    );
    expect(motion).toBeDefined();
    if (!motion || motion.kind !== "component") return;

    const pinsBefore = getNodePins(project, motion).map((pin) => pin.name);
    expect(pinsBefore).toContain("digital-in-00");
    expect(pinsBefore).toContain("digital-out-03");
    expect(pinsBefore).toContain("analog-in-00");
    expect(pinsBefore).toContain("analog-out-03");
    expect(pinsBefore).not.toContain("digital-in-04");

    const currentMotmod = project.motmod ?? {
      numJoints: 3,
      numDio: 4,
      numAio: 4,
      numSpindles: 1,
      numMiscError: 0,
      trajPeriodNs: 0,
    };
    project.motmod = {
      numJoints: currentMotmod.numJoints,
      numDio: 6,
      numAio: 2,
      numSpindles: currentMotmod.numSpindles,
      numMiscError: 2,
      trajPeriodNs: currentMotmod.trajPeriodNs,
    };
    const plan = planMotmodReconcile(project);
    expect(plan.inSync).toBe(false);
    expect(plan.updateNodeConfigs.length).toBeGreaterThan(0);

    reconcileMotmodManagedNodes(project);

    const pinsAfter = getNodePins(project, motion).map((pin) => pin.name);
    expect(pinsAfter).toContain("digital-in-05");
    expect(pinsAfter).toContain("digital-out-05");
    expect(pinsAfter).toContain("analog-out-01");
    expect(pinsAfter).not.toContain("analog-out-03");
    expect(pinsAfter).toContain("misc-error-00");
    expect(pinsAfter).toContain("misc-error-01");
  });

  it("refreshes motmod component definitions when LinuxCNC version changes", () => {
    const project = createEmptyProject("motmod version refresh");
    const motionBefore =
      project.library.components["system:motmod:motion"]?.pins.map(
        (pin) => pin.name,
      ) ?? [];
    expect(motionBefore).toContain("jog-stop");

    project.target.linuxcncVersion = "2.8";
    reconcileMotmodManagedNodes(project);

    const motionAfter =
      project.library.components["system:motmod:motion"]?.pins.map(
        (pin) => pin.name,
      ) ?? [];
    expect(motionAfter).toContain("homing-inhibit");
    expect(motionAfter).not.toContain("jog-stop");
  });

  it("restores removed managed nodes during project save/load normalization", () => {
    const project = createEmptyProject("motmod normalize");
    const systemSheet = findSystemSheet(project);
    if (!systemSheet) throw new Error("expected system sheet");
    systemSheet.nodes = systemSheet.nodes.filter(
      (node) => !(node.kind === "component" && node.instanceName === "joint.2"),
    );

    const saved = stringifyNoHALProject(project);
    const loaded = parseNoHALProject(saved);

    expect(managedInstanceNames(loaded)).toContain("joint.2");
  });

  it("adopts existing non-rt motion-owned nodes and rebinds to system definitions", () => {
    const project = createEmptyProject("motmod adopt");
    const systemSheet = findSystemSheet(project);
    if (!systemSheet) throw new Error("expected system sheet");
    systemSheet.nodes = systemSheet.nodes.filter(
      (node) => !(node.kind === "component" && node.instanceName === "joint.0"),
    );

    project.library.components["halimport:joint"] = {
      id: "halimport:joint",
      name: "joint",
      halComponentName: "joint",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [
        { key: "home_sw_in", name: "home-sw-in", direction: "in", type: "bit" },
      ],
      params: [],
    };

    systemSheet.nodes.push({
      id: "node_existing_joint_0",
      kind: "component",
      componentId: "halimport:joint",
      instanceName: "joint.0",
      position: { x: 0, y: 0 },
      paramValues: {},
    });

    reconcileMotmodManagedNodes(project);

    const adopted = systemSheet.nodes.find(
      (node) =>
        node.kind === "component" && node.id === "node_existing_joint_0",
    );
    expect(adopted).toBeDefined();
    if (!adopted || adopted.kind !== "component") return;
    expect(adopted.componentId).toBe("system:motmod:joint");
    expect(
      project.library.components[adopted.componentId]?.system?.family,
    ).toBe("joint");
  });

  it("keeps non-standard motion pins in a system-derived custom override", () => {
    const project = createEmptyProject("motmod custom motion override");
    const systemSheet = findSystemSheet(project);
    if (!systemSheet) throw new Error("expected system sheet");
    systemSheet.nodes = systemSheet.nodes.filter(
      (node) => !(node.kind === "component" && node.instanceName === "motion"),
    );

    project.library.components["halimport:motion"] = {
      id: "halimport:motion",
      name: "motion",
      halComponentName: "motion",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [
        {
          key: "motion_enabled",
          name: "motion-enabled",
          direction: "out",
          type: "bit",
        },
        {
          key: "extra_fault",
          name: "extra-fault",
          direction: "in",
          type: "bit",
        },
      ],
      params: [],
    };
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
        id: "node_motion_custom",
        kind: "component",
        componentId: "halimport:motion",
        instanceName: "motion",
        position: { x: 0, y: 0 },
        paramValues: {},
      },
      {
        id: "node_src",
        kind: "component",
        componentId: "test:src",
        instanceName: "src",
        position: { x: 220, y: 0 },
        paramValues: {},
      },
    );

    reconcileMotmodManagedNodes(project);

    const motionNode = systemSheet.nodes.find(
      (
        node,
      ): node is (typeof systemSheet.nodes)[number] & { kind: "component" } =>
        node.kind === "component" && node.id === "node_motion_custom",
    );
    expect(motionNode?.componentId).toBe("halimport:motion");
    if (!motionNode) return;

    const motionPins = getNodePins(project, motionNode).map((pin) => pin.name);
    expect(motionPins).toContain("extra-fault");
    expect(motionPins).toContain("digital-in-03");
    expect(
      project.library.components["halimport:motion"]?.system?.manager,
    ).not.toBe("motmod");

    const extraPin = getNodePins(project, motionNode).find(
      (pin) => pin.name === "extra-fault",
    );
    expect(extraPin).toBeDefined();
    if (!extraPin) return;

    systemSheet.directConnections.push({
      id: "dc_motion_extra",
      a: { kind: "node-pin", nodeId: "node_src", pinKey: "out" },
      b: {
        kind: "node-pin",
        nodeId: "node_motion_custom",
        pinKey: extraPin.key,
      },
      signalName: "motion_extra",
    });
    systemSheet.hal = {
      ...(systemSheet.hal ?? {}),
      addfQueue: [
        makeAddfQueueFunctionEntry("node_motion_custom", "motion_controller"),
      ],
    };

    const out = exportProjectToHal(project);
    expect(out.text).toContain(
      "net motion_extra system.src.out system.motion.extra-fault",
    );
    expect(out.text).toContain("addf motion-controller servo-thread");
    expect(out.text).not.toContain("loadrt motion");
  });

  it("rebinds already-managed nodes to system component ids", () => {
    const project = createEmptyProject("motmod managed rebind");
    const systemSheet = findSystemSheet(project);
    const managedJoint = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        project.library.components[node.componentId]?.system?.manager ===
          "motmod" &&
        project.library.components[node.componentId]?.system?.family ===
          "joint" &&
        node.instanceName === "joint.0",
    );
    if (!managedJoint || managedJoint.kind !== "component")
      throw new Error("expected managed joint.0 node");

    project.library.components["halimport:joint"] = {
      id: "halimport:joint",
      name: "joint",
      halComponentName: "joint",
      source: "manual",
      runtime: { kind: "unknown" },
      pins: [
        { key: "home_sw_in", name: "home-sw-in", direction: "in", type: "bit" },
      ],
      params: [],
    };
    managedJoint.componentId = "halimport:joint";

    reconcileMotmodManagedNodes(project);

    expect(managedJoint.componentId).toBe("system:motmod:joint");
  });
});
