import { describe, expect, it } from "vitest";
import { type Failure, matchFailure } from "./result";

describe("result matchers", () => {
  it("matches failures by code, cause, and detail", () => {
    const error: Failure<"invalid-input", "project-name", "empty-name"> = {
      code: "invalid-input",
      cause: "project-name",
      detail: "empty-name",
    };

    const result = matchFailure(error, {
      "invalid-input": {
        "project-name": {
          "empty-name": () => "empty",
        },
      },
    });

    expect(result).toBe("empty");
  });

  it("matches failures with literal leaf values", () => {
    const error: Failure<"invalid-input", "project-name", "empty-name"> = {
      code: "invalid-input",
      cause: "project-name",
      detail: "empty-name",
    };

    const result = matchFailure(error, {
      "invalid-input": {
        "project-name": {
          "empty-name": "empty",
        },
      },
      _: "fallback",
    });

    expect(result).toBe("empty");
  });
});
