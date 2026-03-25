import { describe, expect, it } from "vitest";
import {
  compareNoHALVersions,
  getProjectVersionWarning,
} from "./projectVersionWarning";

describe("project version warning", () => {
  it("compares semantic versions numerically", () => {
    expect(compareNoHALVersions("0.2.10", "0.2.9")).toBe(1);
    expect(compareNoHALVersions("0.2", "0.2.0")).toBe(0);
    expect(compareNoHALVersions("0.2.1", "0.2.1")).toBe(0);
    expect(compareNoHALVersions("0.2.0", "0.2.1")).toBe(-1);
  });

  it("ignores prerelease suffixes during comparison", () => {
    expect(compareNoHALVersions("0.3.0-beta.1", "0.2.9")).toBe(1);
  });

  it("returns no warning when the saved version is not newer", () => {
    expect(getProjectVersionWarning(undefined, "0.2.1")).toBeNull();
    expect(getProjectVersionWarning("0.2.1", "0.2.1")).toBeNull();
    expect(getProjectVersionWarning("0.2.0", "0.2.1")).toBeNull();
    expect(getProjectVersionWarning("dev-build", "0.2.1")).toBeNull();
  });

  it("returns a warning when the project was saved by a newer version", () => {
    expect(getProjectVersionWarning("0.2.2", "0.2.1")).toEqual({
      title: "Project Saved in Newer NoHAL",
      message: "This project was last saved with NoHAL 0.2.2.",
      detail:
        "You are running NoHAL 0.2.1. The project will still open, but newer features or settings may be missing or behave differently in this version.",
    });
  });
});
