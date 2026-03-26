import { describe, expect, it } from "vitest";
import {
  applyIniReferenceSuggestion,
  filterIniReferenceSuggestions,
  flattenIniReferenceSections,
  getActiveIniReferenceQuery,
} from "./halValueAutocomplete";
import { formatIniReferenceToken } from "./iniReference";

describe("halValueAutocomplete helpers", () => {
  const entries = flattenIniReferenceSections([
    {
      name: "DISPLAY",
      entries: [
        {
          key: "EDITOR",
          value: "gmoccapy",
          token: formatIniReferenceToken("DISPLAY", "EDITOR"),
        },
        {
          key: "LATHE",
          value: "1",
          token: formatIniReferenceToken("DISPLAY", "LATHE"),
        },
      ],
    },
    {
      name: "TRAJ",
      entries: [
        {
          key: "COORDINATES",
          value: "X Y Z",
          token: formatIniReferenceToken("TRAJ", "COORDINATES"),
        },
      ],
    },
  ]);

  it("detects the active ini token fragment around the caret", () => {
    expect(getActiveIniReferenceQuery("[DIS", 4)).toEqual({
      start: 0,
      end: 4,
      text: "[DIS",
      normalizedText: "[DIS",
    });

    expect(getActiveIniReferenceQuery("setp foo [DISPLAY]ED", 20)).toEqual({
      start: 9,
      end: 20,
      text: "[DISPLAY]ED",
      normalizedText: "[DISPLAY]ED",
    });

    expect(getActiveIniReferenceQuery("setp foo 123", 12)).toBeNull();
    expect(getActiveIniReferenceQuery("[DISPLAY]EDITOR + 1", 18)).toBeNull();
  });

  it("filters suggestions using the active token fragment", () => {
    const query = getActiveIniReferenceQuery("[disp", 5);
    const suggestions = filterIniReferenceSuggestions(entries, query);

    expect(suggestions).toHaveLength(2);
    expect(suggestions.map((entry) => entry.token)).toEqual([
      "[DISPLAY]EDITOR",
      "[DISPLAY]LATHE",
    ]);
  });

  it("replaces only the active token fragment when applying a suggestion", () => {
    const query = getActiveIniReferenceQuery("setp foo [DIS", 13);
    expect(query).not.toBeNull();
    if (!query) {
      throw new Error("Expected an active ini query");
    }

    const applied = applyIniReferenceSuggestion(
      "setp foo [DIS",
      query,
      "[DISPLAY]EDITOR",
    );

    expect(applied).toEqual({
      nextValue: "setp foo [DISPLAY]EDITOR",
      caret: 24,
    });
  });
});
