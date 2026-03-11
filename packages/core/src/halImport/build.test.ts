import { describe, expect, it } from "vitest";
import { createEmptyComponentStore } from "../componentStore";
import { getNodePins } from "../graph";
import { findSystemSheet, findSystemSheetNode } from "../sheet";
import type { ComponentDefinition } from "../types";
import { buildProjectFromHalImport } from "./build";

describe("buildProjectFromHalImport", () => {
  it("applies selected LinuxCNC version before motmod reconciliation", () => {
    const result = buildProjectFromHalImport({
      draft: {
        parser: "nohal-hal-v1",
        lineCount: 0,
        componentGroups: [],
        nets: [],
        setps: [],
        addfs: [],
        warnings: [],
      },
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      linuxcncVersion: "2.7",
    });

    const managedInstanceNames = result.project.sheets[
      findSystemSheet(result.project)?.id ?? result.project.rootSheetId
    ].nodes
      .filter(
        (node) =>
          node.kind === "component" &&
          result.project.library.components[node.componentId]?.system
            ?.manager === "motmod",
      )
      .map((node) => node.instanceName)
      .sort((a, b) => a.localeCompare(b));

    expect(result.project.target.linuxcncVersion).toBe("2.7");
    expect(managedInstanceNames).toEqual([
      "axis.0",
      "axis.1",
      "axis.2",
      "motion",
    ]);
  });

  it("rebinds imported motmod-family nodes to system definitions with full pin schemas", () => {
    const result = buildProjectFromHalImport({
      draft: {
        parser: "nohal-hal-v1",
        lineCount: 0,
        componentGroups: [
          {
            id: "group_motion",
            inferredHalComponentName: "motion",
            runtimeHint: "unknown",
            instances: [
              {
                instanceName: "motion",
                componentGroupId: "group_motion",
                pinNames: ["motion-enabled", "digital-in-00", "digital-out-00"],
                paramValues: {},
              },
            ],
            pins: [
              {
                name: "motion-enabled",
                observedDirections: ["out"],
              },
              {
                name: "digital-in-00",
                observedDirections: ["in"],
              },
              {
                name: "digital-out-00",
                observedDirections: ["out"],
              },
            ],
            params: [],
          },
          {
            id: "group_axis",
            inferredHalComponentName: "axis",
            runtimeHint: "unknown",
            instances: [
              {
                instanceName: "axis.0",
                componentGroupId: "group_axis",
                pinNames: ["jog-enable"],
                paramValues: {},
              },
            ],
            pins: [
              {
                name: "jog-enable",
                observedDirections: ["in"],
              },
            ],
            params: [],
          },
        ],
        nets: [],
        setps: [],
        addfs: [],
        motmod: {
          numJoints: 2,
          numDio: 64,
          numAio: 0,
          numSpindles: 1,
          numMiscError: 0,
          trajPeriodNs: 0,
        },
        warnings: [],
      },
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      linuxcncVersion: "2.7",
    });

    const systemSheet = findSystemSheet(result.project);
    const motionNode = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.instanceName === "motion" &&
        result.project.library.components[node.componentId]?.system?.manager ===
          "motmod",
    );
    expect(motionNode).toBeDefined();
    if (!motionNode || motionNode.kind !== "component") return;
    expect(motionNode.componentId).toBe("system:motmod:motion");

    const motionPins = getNodePins(result.project, motionNode).map(
      (pin) => pin.name,
    );
    expect(
      motionPins.filter((name) => name.startsWith("digital-in-")).length,
    ).toBe(64);
    expect(
      motionPins.filter((name) => name.startsWith("digital-out-")).length,
    ).toBe(64);
    expect(
      result.project.library.components["halimport:motion"],
    ).toBeUndefined();
    expect(result.project.library.components["halimport:axis"]).toBeUndefined();
  });

  it("rebinds imported iocontrol.0 to the managed singleton definition", () => {
    const result = buildProjectFromHalImport({
      draft: {
        parser: "nohal-hal-v1",
        lineCount: 0,
        componentGroups: [
          {
            id: "group_iocontrol",
            inferredHalComponentName: "iocontrol",
            runtimeHint: "userspace",
            instances: [
              {
                instanceName: "iocontrol.0",
                componentGroupId: "group_iocontrol",
                pinNames: ["tool-change", "emc-enable-in"],
                paramValues: {},
              },
            ],
            pins: [
              {
                name: "tool-change",
                observedDirections: ["out"],
              },
              {
                name: "emc-enable-in",
                observedDirections: ["in"],
              },
            ],
            params: [],
          },
        ],
        nets: [],
        setps: [],
        addfs: [],
        warnings: [],
      },
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      linuxcncVersion: "2.10",
    });

    const systemSheet = findSystemSheet(result.project);
    const iocontrolNode = systemSheet?.nodes.find(
      (node) =>
        node.kind === "component" &&
        node.instanceName === "iocontrol.0" &&
        result.project.library.components[node.componentId]?.system?.manager ===
          "iocontrol",
    );

    expect(iocontrolNode).toBeDefined();
    if (!iocontrolNode || iocontrolNode.kind !== "component") return;
    expect(iocontrolNode.componentId).toBe("system:iocontrol:iocontrol");
    expect(
      result.project.library.components["halimport:iocontrol"],
    ).toBeUndefined();
  });

  it("uses edited project-local component overrides when provided", () => {
    const editedComponent: ComponentDefinition = {
      id: "halimport:custom_logic",
      name: "custom_logic_edited",
      halComponentName: "custom_logic_edited",
      source: "manual",
      runtime: { kind: "userspace" },
      loadCommand: "loadusr custom_logic_edited",
      pins: [
        {
          key: "in_a",
          name: "in-a",
          direction: "in",
          type: "float",
        },
        {
          key: "out_b",
          name: "out-b",
          direction: "out",
          type: "float",
        },
      ],
      params: [
        {
          key: "gain",
          name: "gain",
          direction: "rw",
          type: "float",
          defaultValue: "2.5",
        },
      ],
    };

    const result = buildProjectFromHalImport({
      draft: {
        parser: "nohal-hal-v1",
        lineCount: 0,
        componentGroups: [
          {
            id: "group_custom_logic",
            inferredHalComponentName: "custom_logic",
            runtimeHint: "rt",
            loadCommand: "loadrt custom_logic",
            instances: [
              {
                instanceName: "custom_logic.0",
                componentGroupId: "group_custom_logic",
                pinNames: ["in-a", "out-b"],
                paramValues: {},
              },
            ],
            pins: [
              {
                name: "in-a",
                observedDirections: ["in"],
              },
              {
                name: "out-b",
                observedDirections: ["out"],
              },
            ],
            params: [],
          },
        ],
        nets: [],
        setps: [],
        addfs: [],
        warnings: [],
      },
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      projectLocalComponentOverrides: {
        group_custom_logic: editedComponent,
      },
      linuxcncVersion: "2.10",
    });

    const component =
      result.project.library.components["halimport:custom_logic"];
    expect(component?.halComponentName).toBe("custom_logic_edited");
    expect(component?.runtime?.kind).toBe("userspace");
    expect(component?.loadCommand).toBe("loadusr custom_logic_edited");
    expect(component?.params[0]?.defaultValue).toBe("2.5");

    const root = result.project.sheets[result.project.rootSheetId];
    const node = root.nodes.find(
      (entry) =>
        entry.kind === "component" && entry.instanceName === "custom_logic.0",
    );
    expect(node).toBeDefined();
    if (!node || node.kind !== "component") return;
    expect(node.componentId).toBe("halimport:custom_logic");
  });

  it("places imported system-managed nodes behind the System subsheet", () => {
    const result = buildProjectFromHalImport({
      draft: {
        parser: "nohal-hal-v1",
        lineCount: 0,
        componentGroups: [
          {
            id: "group_motion",
            inferredHalComponentName: "motion",
            runtimeHint: "unknown",
            instances: [
              {
                instanceName: "motion",
                componentGroupId: "group_motion",
                pinNames: ["motion-enabled"],
                paramValues: {},
              },
            ],
            pins: [{ name: "motion-enabled", observedDirections: ["out"] }],
            params: [],
          },
        ],
        nets: [],
        setps: [],
        addfs: [],
        warnings: [],
      },
      componentStore: createEmptyComponentStore(),
      linkSelections: {},
      linuxcncVersion: "2.10",
    });

    const root = result.project.sheets[result.project.rootSheetId];
    const systemSheet = findSystemSheet(result.project);
    const systemSheetNode = findSystemSheetNode(result.project);

    expect(systemSheet?.name).toBe("System");
    expect(systemSheetNode?.kind).toBe("sheet");
    expect(
      root.nodes.some(
        (node) => node.kind === "component" && node.instanceName === "motion",
      ),
    ).toBe(false);
    expect(
      systemSheet?.nodes.some(
        (node) => node.kind === "component" && node.instanceName === "motion",
      ),
    ).toBe(true);
  });
});
