import { describe, expect, it } from "vitest";
import { interpolateLoadrt } from "./registry";

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
});
