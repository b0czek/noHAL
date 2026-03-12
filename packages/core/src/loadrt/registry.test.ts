import { describe, expect, it } from "vitest";
import {
  interpolateLoadrt,
  interpolateLoadrtByStrategy,
  interpolateLoadrtImport,
} from "./registry";

describe("loadrt strategy interpolation", () => {
  it("emits count=... for canonical names_or_count instances", () => {
    const result = interpolateLoadrt({
      componentName: "channel",
      instancePaths: ["channel.0", "channel.1"],
      extraArgs: [],
      runtime: { kind: "rt", loadrt: { strategy: "names_or_count" } },
    });

    expect(result.lines).toEqual(["loadrt channel count=2"]);
    expect(result.warnings).toBeUndefined();
  });

  it("emits names=... for non-canonical names_or_count instances", () => {
    const result = interpolateLoadrt({
      componentName: "channel",
      instancePaths: ["orient-a", "orient-b"],
      extraArgs: ["debug=1"],
      runtime: { kind: "rt", loadrt: { strategy: "names_or_count" } },
    });

    expect(result.lines).toEqual([
      "loadrt channel names=orient-a,orient-b debug=1",
    ]);
    expect(result.warnings).toBeUndefined();
  });

  it("emits num_chan=... for canonical names_or_num_chan instances", () => {
    const result = interpolateLoadrt({
      componentName: "pid",
      instancePaths: ["pid.0", "pid.1", "pid.2"],
      extraArgs: [],
      runtime: { kind: "rt", loadrt: { strategy: "names_or_num_chan" } },
    });

    expect(result.lines).toEqual(["loadrt pid num_chan=3"]);
    expect(result.warnings).toBeUndefined();
  });

  it("falls back to names=... for non-canonical names_or_num_chan instances", () => {
    const result = interpolateLoadrt({
      componentName: "pid",
      instancePaths: ["orient-pid"],
      extraArgs: [],
      runtime: { kind: "rt", loadrt: { strategy: "names_or_num_chan" } },
    });

    expect(result.lines).toEqual(["loadrt pid names=orient-pid"]);
    expect(
      result.warnings?.some((w) =>
        w.includes("expected canonical instance names"),
      ),
    ).toBe(true);
  });

  it("uses names_or_count by default when strategy is unset", () => {
    const result = interpolateLoadrt({
      componentName: "not",
      instancePaths: ["src"],
      extraArgs: [],
      runtime: { kind: "rt" },
    });

    expect(result.lines).toEqual(["loadrt not names=src"]);
    expect(result.warnings).toBeUndefined();
  });

  it("emits cfg=... using per-instance config values when cfg strategy is selected", () => {
    const result = interpolateLoadrt({
      componentName: "debounce",
      instancePaths: ["debounce.0", "debounce.1"],
      instanceConfigByPath: {
        "debounce.0": { channels: "2" },
        "debounce.1": { channels: "4" },
      },
      extraArgs: [],
      runtime: {
        kind: "rt",
        loadrt: { strategy: "cfg" },
        instanceConfig: {
          fields: [
            {
              key: "channels",
              type: "integer",
              defaultValue: 1,
              min: 1,
              max: 50,
            },
          ],
          pinExpansionRules: [
            {
              kind: "indexed_by_count",
              countConfigKey: "channels",
              templates: [],
            },
          ],
        },
      },
    });

    expect(result.lines).toEqual(["loadrt debounce cfg=2,4"]);
    expect(result.warnings).toBeUndefined();
  });

  it("imports cfg=... into canonical instance names and instance config values", () => {
    const result = interpolateLoadrtImport({
      componentName: "debounce",
      args: { cfg: "3,1,2" },
    });

    expect(result.strategyId).toBe("cfg");
    expect(result.instancePaths).toEqual([
      "debounce.0",
      "debounce.1",
      "debounce.2",
    ]);
    expect(result.instanceConfigByPath).toEqual({
      "debounce.0": { channels: "3" },
      "debounce.1": { channels: "1" },
      "debounce.2": { channels: "2" },
    });
  });

  it("routes loadrt import to names_or_num_chan when only num_chan=... is present", () => {
    const result = interpolateLoadrtImport({
      componentName: "pid",
      args: { num_chan: "3" },
    });

    expect(result.strategyId).toBe("names_or_num_chan");
    expect(result.instancePaths).toEqual(["pid.0", "pid.1", "pid.2"]);
  });

  it("routes loadrt import to names_or_count when count=... is present", () => {
    const result = interpolateLoadrtImport({
      componentName: "and2",
      args: { count: "2" },
    });

    expect(result.strategyId).toBe("names_or_count");
    expect(result.instancePaths).toEqual(["and2.0", "and2.1"]);
  });

  it("routes motmod to dedicated motmod strategy for import/export", () => {
    const importResult = interpolateLoadrtImport({
      componentName: "motmod",
      args: { num_joints: "3", traj_period_nsec: "1000000" },
    });
    const exportResult = interpolateLoadrtByStrategy("motmod", {
      componentName: "motmod",
      instancePaths: ["motmod.0"],
      extraArgs: ["num_joints=3"],
      runtime: { kind: "rt" },
    });

    expect(importResult.strategyId).toBe("motmod");
    expect(importResult.instancePaths).toEqual([]);
    expect(importResult.events).toEqual([
      {
        topic: "project.motmod",
        payload: {
          numJoints: 3,
          trajPeriodNs: 1000000,
        },
      },
    ]);
    expect(exportResult.lines).toEqual(["loadrt motmod num_joints=3"]);
  });

  it("routes debounce import to cfg strategy even when cfg is omitted", () => {
    const result = interpolateLoadrtImport({
      componentName: "debounce",
      args: {},
    });

    expect(result.strategyId).toBe("cfg");
    expect(result.instancePaths).toEqual(["debounce.0"]);
    expect(result.instanceConfigByPath).toEqual({
      "debounce.0": { channels: "1" },
    });
  });
});
