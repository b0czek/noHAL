import { describe, expect, it } from "vitest";
import {
  isSystemHalImportComponentGroup,
  isSystemHalImportComponentName,
} from "./system";

describe("hal import system component detection", () => {
  it("recognizes LinuxCNC system component namespaces", () => {
    expect(isSystemHalImportComponentName("motion")).toBe(true);
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
});
