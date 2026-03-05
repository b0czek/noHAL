import { createEmptyComponentStore } from "../componentStore";
import { getNodePins } from "../graph";
import { describe, expect, it } from "vitest";
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
      result.project.rootSheetId
    ].nodes
      .filter(
        (node) =>
          node.kind === "component" &&
          result.project.library.components[node.componentId]?.system?.manager ===
            "motmod",
      )
      .map((node) => node.instanceName)
      .sort((a, b) => a.localeCompare(b));

    expect(result.project.target.linuxcncVersion).toBe("2.7");
    expect(managedInstanceNames).toEqual(["axis.0", "axis.1", "axis.2", "motion"]);
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

    const root = result.project.sheets[result.project.rootSheetId];
    const motionNode = root.nodes.find(
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
    expect(motionPins.filter((name) => name.startsWith("digital-in-")).length).toBe(
      64,
    );
    expect(
      motionPins.filter((name) => name.startsWith("digital-out-")).length,
    ).toBe(64);
    expect(result.project.library.components["halimport:motion"]).toBeUndefined();
    expect(result.project.library.components["halimport:axis"]).toBeUndefined();
  });
});
