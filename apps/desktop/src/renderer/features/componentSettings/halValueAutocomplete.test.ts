import { describe, expect, it } from "vitest";
import {
  applyIniReferenceSuggestion,
  filterIniReferenceSuggestions,
  flattenIniReferenceSections,
  getActiveIniReferenceQuery,
} from "./halValueAutocomplete";
import { formatIniReferenceToken } from "./iniReference";

const DISPLAY_FRAGMENT = "[DIS";
const DISPLAY_EDITOR_REFERENCE = "setp foo [DISPLAY]ED";
const NON_REFERENCE_VALUE = "setp foo 123";
const NON_REFERENCE_EXPRESSION = "[DISPLAY]EDITOR + 1";
const FILTER_FRAGMENT = "[disp";
const REPLACE_FRAGMENT = "setp foo [DIS";

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
    expect(
      getActiveIniReferenceQuery(DISPLAY_FRAGMENT, DISPLAY_FRAGMENT.length),
    ).toEqual({
      start: 0,
      end: 4,
      text: DISPLAY_FRAGMENT,
      normalizedText: DISPLAY_FRAGMENT,
    });

    expect(
      getActiveIniReferenceQuery(
        DISPLAY_EDITOR_REFERENCE,
        DISPLAY_EDITOR_REFERENCE.length,
      ),
    ).toEqual({
      start: 9,
      end: 20,
      text: "[DISPLAY]ED",
      normalizedText: "[DISPLAY]ED",
    });

    expect(
      getActiveIniReferenceQuery(
        NON_REFERENCE_VALUE,
        NON_REFERENCE_VALUE.length,
      ),
    ).toBeNull();
    expect(
      getActiveIniReferenceQuery(
        NON_REFERENCE_EXPRESSION,
        NON_REFERENCE_EXPRESSION.lastIndexOf("1"),
      ),
    ).toBeNull();
  });

  it("filters suggestions using the active token fragment", () => {
    const query = getActiveIniReferenceQuery(
      FILTER_FRAGMENT,
      FILTER_FRAGMENT.length,
    );
    const suggestions = filterIniReferenceSuggestions(entries, query);

    expect(suggestions).toHaveLength(2);
    expect(suggestions.map((entry) => entry.token)).toEqual([
      "[DISPLAY]EDITOR",
      "[DISPLAY]LATHE",
    ]);
  });

  it("replaces only the active token fragment when applying a suggestion", () => {
    const query = getActiveIniReferenceQuery(
      REPLACE_FRAGMENT,
      REPLACE_FRAGMENT.length,
    );
    expect(query).not.toBeNull();
    if (!query) {
      throw new Error("Expected an active ini query");
    }

    const applied = applyIniReferenceSuggestion(
      REPLACE_FRAGMENT,
      query,
      "[DISPLAY]EDITOR",
    );

    expect(applied).toEqual({
      nextValue: "setp foo [DISPLAY]EDITOR",
      caret: 24,
    });
  });
});
