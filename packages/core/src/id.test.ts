import { describe, expect, it } from "vitest";
import { nextUniqueName, safeKey, slugify } from "./id";

describe("id helpers", () => {
  it("slugify normalizes a label into a slug", () => {
    expect(slugify("  Sheet Name  ")).toBe("sheet-name");
  });

  it("safeKey normalizes a label into an identifier-like key", () => {
    expect(safeKey("  Axis #1  ")).toBe("Axis_idx1");
  });

  it("returns the base name when it is unused", () => {
    expect(nextUniqueName("sheet", new Set(["other"]))).toBe("sheet");
  });

  it("uses the base name with a 2 suffix when only the base is taken", () => {
    expect(nextUniqueName("sheet", new Set(["sheet"]))).toBe("sheet2");
  });

  it("appends the next available numeric suffix starting at 2", () => {
    expect(
      nextUniqueName("sheet", new Set(["sheet", "sheet2", "sheet3"])),
    ).toBe("sheet4");
  });

  it("fills the first available numeric gap instead of always taking the highest suffix", () => {
    expect(nextUniqueName("sheet", new Set(["sheet", "sheet3"]))).toBe(
      "sheet2",
    );
  });

  it("ignores lookalike names that do not match the next numbered candidate", () => {
    expect(nextUniqueName("sheet", new Set(["sheet", "sheet10"]))).toBe(
      "sheet2",
    );
  });

  it("treats a numeric suffix in the base name as part of the base", () => {
    expect(nextUniqueName("sheet2", new Set(["sheet2", "sheet22"]))).toBe(
      "sheet23",
    );
  });
});
