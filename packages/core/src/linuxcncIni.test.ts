import { describe, expect, it } from "vitest";

import { collectLinuxCncHalReferences, parseLinuxCncIni } from "./linuxcncIni";

describe("parseLinuxCncIni", () => {
  it("parses sections and preserves duplicate keys in order", () => {
    const ini = parseLinuxCncIni(
      `
      [HAL]
      HALFILE = core.hal
      HALFILE = io.hal
      POSTGUI_HALFILE = postgui.hal

      [JOINT_0]
      SCALE = 400
      SCALE = 800
    `.trim(),
      "/configs/demo/demo.ini",
    );

    expect(ini.sourceFileName).toBe("demo.ini");
    expect(ini.sections.map((s) => s.name)).toEqual(["HAL", "JOINT_0"]);
    expect(ini.sections[0]?.entries.map((e) => `${e.key}=${e.value}`)).toEqual([
      "HALFILE=core.hal",
      "HALFILE=io.hal",
      "POSTGUI_HALFILE=postgui.hal",
    ]);
    expect(ini.sections[1]?.entries.map((e) => `${e.key}=${e.value}`)).toEqual([
      "SCALE=400",
      "SCALE=800",
    ]);
  });

  it("collects HAL references and splits file token from optional args", () => {
    const ini = parseLinuxCncIni(`
      [HAL]
      HALFILE = core.hal
      HALFILE = custom.tcl foo bar
      POSTGUI_HALFILE = "post gui.hal"
      SHUTDOWN = shutdown.hal ; comment
    `);

    const refs = collectLinuxCncHalReferences(ini);
    expect(refs.map((r) => [r.kind, r.fileToken, r.args])).toEqual([
      ["HALFILE", "core.hal", []],
      ["HALFILE", "custom.tcl", ["foo", "bar"]],
      ["POSTGUI_HALFILE", "post gui.hal", []],
      ["SHUTDOWN", "shutdown.hal", []],
    ]);
  });
});
