import { describe, expect, it } from "vitest";

import { parseCompComponentDefinition } from "./compParser";

function parseComp(text: string, filePath = "demo.comp") {
  return parseCompComponentDefinition(text.trim(), filePath);
}

function expectParseError(text: string, pattern: RegExp) {
  expect(() => parseComp(text)).toThrowError(pattern);
}

describe("parseCompComponentDefinition (.comp spec behavior)", () => {
  it("normalizes HAL pin/param identifiers from HALNAME syntax", () => {
    const parsed = parseComp(`
      component demo;
      pin in bit in_0;
      pin out float x_y.z_;
      param rw unsigned limit_;
      ;;
    `);

    expect(parsed.pins.map((pin) => pin.name)).toEqual(["in-0", "x-y.z"]);
    expect(parsed.params[0]).toMatchObject({
      name: "limit",
      type: "u32",
    });
  });

  it("parses docs/options from the declaration header and ignores the body after ';;'", () => {
    const parsed = parseComp(`
      // Header comments and semicolons should be ignored ;
      component demo "Demo component";
      /* block comment ; with semicolon */
      description "Short description";
      notes r"""Line one
Line two""";
      option userspace;
      option count 3;
      option verbose TRUE;
      option disabled no;
      pin in bit input_pin "Input";
      ;;
      component ignored "body code should not be parsed";
      pin out bit body_only;
    `);

    expect(parsed.docs).toMatchObject({
      component: "Demo component",
      description: "Short description",
      notes: "Line one\nLine two",
    });
    expect(parsed.runtime).toEqual({
      kind: "userspace",
      options: {
        userspace: true,
        count: 3,
        verbose: true,
        disabled: false,
      },
    });
    expect(parsed.pins).toHaveLength(1);
    expect(parsed.functions).toEqual([]);
    expect(parsed.pins[0]).toMatchObject({
      name: "input-pin",
      doc: "Input",
    });
  });

  it("parses multiple function declarations and distinguishes fp vs nofp", () => {
    const parsed = parseComp(`
      component demo;
      function _ nofp "Default integer-only update";
      function read_inputs fp "Read hardware";
      function write_outputs "Defaults to fp";
      ;;
    `);

    expect(parsed.functions).toEqual([
      {
        key: "default",
        declaredName: "_",
        halSuffix: "",
        floatMode: "nofp",
        doc: "Default integer-only update",
      },
      {
        key: "read_inputs",
        declaredName: "read_inputs",
        halSuffix: "read-inputs",
        floatMode: "fp",
        doc: "Read hardware",
      },
      {
        key: "write_outputs",
        declaredName: "write_outputs",
        halSuffix: "write-outputs",
        floatMode: "fp",
        doc: "Defaults to fp",
      },
    ]);
  });

  it("parses array/default/conditional pin declarations using declaration syntax", () => {
    const parsed = parseComp(`
      component demo;
      pin out float chan_#[16:MAX_CHANS] = 1.5 if has_chan "Per-channel output";
      ;;
    `);

    expect(parsed.pins[0]).toMatchObject({
      name: "chan-#",
      direction: "out",
      type: "float",
      arrayLen: 16,
      arrayExpr: "MAX_CHANS",
      defaultValue: "1.5",
      doc: "Per-channel output",
    });
  });

  it("warns when a pin/param uses '#' without an explicit array size", () => {
    const parsed = parseComp(`
      component demo;
      pin in bit probe_#;
      param rw bit latch_#;
      ;;
    `);

    expect(
      parsed.parseMeta.warnings.some(
        (warning) =>
          warning.includes("probe_#") &&
          warning.includes("no explicit array length"),
      ),
    ).toBe(true);
    expect(
      parsed.parseMeta.warnings.some(
        (warning) =>
          warning.includes("latch_#") &&
          warning.includes("no explicit array length"),
      ),
    ).toBe(true);
  });

  it("accepts 'hal_' component names (HAL pin namespace stripping happens at runtime naming, not parsing)", () => {
    const parsed = parseComp(`
      component hal_loop;
      pin out float example;
      ;;
    `);

    expect(parsed.halComponentName).toBe("hal_loop");
    expect(parsed.pins[0].name).toBe("example");
  });

  it("preserves hash placeholder width for later zero-padded expansion", () => {
    const parsed = parseComp(`
      component arraydemo;
      pin out bit out_##[12];
      ;;
    `);

    expect(parsed.pins[0]).toMatchObject({
      name: "out-##",
      arrayLen: 12,
    });
    expect(parsed.parseMeta.warnings).toEqual([]);
  });
});

describe("parseCompComponentDefinition (malformed input handling)", () => {
  it("rejects unterminated block comments in the declaration header", () => {
    expectParseError(
      `
      component demo;
      /* missing end
      pin in bit in_0;
      ;;
      `,
      /Unterminated block comment/,
    );
  });

  it("rejects unterminated quoted strings", () => {
    expectParseError(
      `
      component demo "oops;
      pin in bit in_0;
      ;;
      `,
      /Unterminated string/,
    );
  });

  it("rejects unterminated raw triple strings", () => {
    expectParseError(
      `
      component demo;
      notes r"""still open;
      ;;
      `,
      /Unterminated raw triple string/,
    );
  });

  it("rejects malformed component declarations with no name", () => {
    expectParseError(
      `
      component;
      pin in bit in_0;
      ;;
      `,
      /Malformed component declaration/,
    );
  });

  it("rejects malformed pin declarations missing required fields", () => {
    expectParseError(
      `
      component demo;
      pin in bit;
      ;;
      `,
      /Malformed pin declaration/,
    );
  });

  it("rejects unsupported HAL types in pin/param declarations", () => {
    expectParseError(
      `
      component demo;
      pin out bool ready;
      ;;
      `,
      /Unknown pin type/,
    );
    expectParseError(
      `
      component demo;
      param rw integer count;
      ;;
      `,
      /Unknown param type/,
    );
  });

  it("rejects unterminated array expressions", () => {
    expectParseError(
      `
      component demo;
      pin out float out_#[16:MAX_CHANS;
      ;;
      `,
      /Unterminated \[\] expression/,
    );
  });
});
