import { describe, expect, it } from "vitest";
import {
  analyzeSystemHalImportOverride,
  isSystemHalImportComponentGroup,
  isSystemHalImportComponentName,
} from "./system";

describe("hal import system component detection", () => {
  it("recognizes LinuxCNC system component namespaces", () => {
    expect(isSystemHalImportComponentName("motion")).toBe(true);
    expect(isSystemHalImportComponentName("halui")).toBe(true);
    expect(isSystemHalImportComponentName("iocontrol")).toBe(true);
    expect(isSystemHalImportComponentName("INI")).toBe(true);
  });

  it("rejects regular imported component names", () => {
    expect(isSystemHalImportComponentName("and2")).toBe(false);
    expect(isSystemHalImportComponentName("encoder")).toBe(false);
  });

  it("detects system groups from inferred HAL component names", () => {
    expect(
      isSystemHalImportComponentGroup({
        inferredHalComponentName: "joint",
      }),
    ).toBe(true);
    expect(
      isSystemHalImportComponentGroup({
        inferredHalComponentName: "custom_logic",
      }),
    ).toBe(false);
  });

  it("reports when imported system motion requires a custom override", () => {
    const analysis = analyzeSystemHalImportOverride(
      { inferredHalComponentName: "motion" },
      {
        pins: [
          {
            key: "motion_enabled",
            name: "motion-enabled",
            direction: "out",
            type: "bit",
          },
          {
            key: "digital_in_00",
            name: "digital-in-00",
            direction: "in",
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
        functions: [
          {
            key: "motion_controller",
            declaredName: "motion-controller",
            halSuffix: "motion-controller",
            floatMode: "fp",
          },
          {
            key: "motion_probe_monitor",
            declaredName: "motion-probe-monitor",
            halSuffix: "motion-probe-monitor",
            floatMode: "fp",
          },
        ],
      },
      {
        linuxcncVersion: "2.10",
        motmod: { numDio: 4, numAio: 4, numJoints: 3, numSpindles: 1 },
      },
    );

    expect(analysis).toEqual({
      extraPins: ["extra-fault"],
      extraParams: [],
      extraFunctions: ["motion-probe-monitor"],
    });
  });

  it("returns null for standard imported system schemas even with fuzzy observed direction", () => {
    const analysis = analyzeSystemHalImportOverride(
      { inferredHalComponentName: "iocontrol" },
      {
        pins: [
          {
            key: "emc_enable_in",
            name: "emc-enable-in",
            direction: "io",
            type: "bit",
          },
          {
            key: "tool_change",
            name: "tool-change",
            direction: "io",
            type: "bit",
          },
        ],
        params: [],
        functions: [],
      },
      {
        linuxcncVersion: "2.10",
      },
    );

    expect(analysis).toBeNull();
  });

  it("treats the halui schema as standard for matching imports", () => {
    const analysis = analyzeSystemHalImportOverride(
      { inferredHalComponentName: "halui" },
      {
        pins: [
          {
            key: "program_run",
            name: "program.run",
            direction: "io",
            type: "bit",
          },
          {
            key: "feed_override_reset",
            name: "feed-override.reset",
            direction: "io",
            type: "bit",
          },
        ],
        params: [],
        functions: [],
      },
      {
        linuxcncVersion: "2.10",
      },
    );

    expect(analysis).toBeNull();
  });
});
