import { describe, expect, it } from "vitest";

import { parseHalImportDraft } from "./parse";

function parseHal(text: string, sourcePath = "/configs/demo/custom.hal") {
  return parseHalImportDraft(text.trim(), sourcePath);
}

function groupByComponentName(text: string) {
  const draft = parseHal(text);
  const groups = new Map(
    draft.componentGroups.map((group) => [
      group.inferredHalComponentName,
      group,
    ]),
  );
  return { draft, groups };
}

describe("parseHalImportDraft (HAL spec behavior)", () => {
  it("parses loadrt instance naming modes used by HAL configs (count and names)", () => {
    const { draft, groups } = groupByComponentName(`
      loadrt and2 count=3
      loadrt or2 names=aa,ab
    `);

    expect(draft.warnings).toEqual([]);

    expect(groups.get("and2")).toMatchObject({
      inferredHalComponentName: "and2",
      runtimeHint: "rt",
    });
    expect(
      groups.get("and2")?.instances.map((instance) => instance.instanceName),
    ).toEqual(["and2.0", "and2.1", "and2.2"]);

    expect(groups.get("or2")).toMatchObject({
      inferredHalComponentName: "or2",
      runtimeHint: "rt",
    });
    expect(
      groups.get("or2")?.instances.map((instance) => instance.instanceName),
    ).toEqual(["aa", "ab"]);
  });

  it("parses documented net forms with optional arrows and repeated signal names while inferring endpoint directions", () => {
    const { draft, groups } = groupByComponentName(`
      loadrt stepgen count=1
      loadrt parport count=1
      net xStep stepgen.0.out => parport.0.pin-02-out parport.0.pin-08-out
      net xStep => parport.0.pin-06-out
      net home-x joint.0.home-sw-in <= parport.0.pin-11-in
    `);

    expect(draft.warnings).toEqual([]);
    expect(draft.nets.filter((net) => net.name === "xStep")).toHaveLength(2);
    expect(draft.nets.map((net) => net.name)).toEqual([
      "xStep",
      "xStep",
      "home-x",
    ]);

    expect(draft.nets[0]).toMatchObject({
      name: "xStep",
      endpoints: [
        { rawPath: "stepgen.0.out", instanceName: "stepgen.0", pinName: "out" },
        {
          rawPath: "parport.0.pin-02-out",
          instanceName: "parport.0",
          pinName: "pin-02-out",
        },
        {
          rawPath: "parport.0.pin-08-out",
          instanceName: "parport.0",
          pinName: "pin-08-out",
        },
      ],
    });
    expect(draft.nets[1]).toMatchObject({
      name: "xStep",
      endpoints: [
        {
          rawPath: "parport.0.pin-06-out",
          instanceName: "parport.0",
          pinName: "pin-06-out",
        },
      ],
    });

    const stepgenPins = groups.get("stepgen")?.pins;
    expect(stepgenPins).toContainEqual({
      name: "out",
      observedDirections: ["out"],
    });

    const parportPins = groups.get("parport")?.pins;
    expect(parportPins).toEqual(
      expect.arrayContaining([
        { name: "pin-02-out", observedDirections: ["in"] },
        { name: "pin-06-out", observedDirections: ["in"] },
        { name: "pin-08-out", observedDirections: ["in"] },
        { name: "pin-11-in", observedDirections: ["out"] },
      ]),
    );

    const jointPins = groups.get("joint")?.pins;
    expect(jointPins).toContainEqual({
      name: "home-sw-in",
      observedDirections: ["in"],
    });
  });

  it("parses setp values and addf position/thread metadata, preserving halcmd INI substitutions and quoted hashes", () => {
    const draft = parseHal(
      `
      loadrt lowpass count=1
      addf lowpass.0 servo-thread 17
      setp lowpass.0.gain .01
      setp stepgen.0.maxvel [JOINT_0]MAX_VELOCITY
      setp demo.0.note "abc # not a comment"
    `,
      "/machine/configs/softstart.hal",
    );

    expect(draft.sourcePath).toBe("/machine/configs/softstart.hal");
    expect(draft.sourceFileName).toBe("softstart.hal");
    expect(draft.lineCount).toBe(5);

    expect(draft.addfs).toEqual([
      {
        line: 2,
        functionName: "lowpass.0",
        thread: "servo-thread",
        position: 17,
      },
    ]);

    expect(draft.setps).toEqual([
      {
        line: 3,
        rawPath: "lowpass.0.gain",
        instanceName: "lowpass.0",
        fieldName: "gain",
        value: ".01",
      },
      {
        line: 4,
        rawPath: "stepgen.0.maxvel",
        instanceName: "stepgen.0",
        fieldName: "maxvel",
        value: "[JOINT_0]MAX_VELOCITY",
      },
      {
        line: 5,
        rawPath: "demo.0.note",
        instanceName: "demo.0",
        fieldName: "note",
        value: "abc # not a comment",
      },
    ]);
  });

  it("parses simple loadusr commands as userspace component instances", () => {
    const { draft, groups } = groupByComponentName(`
      loadusr -W hal_manualtoolchange
      net tool-change iocontrol.0.tool-change => hal_manualtoolchange.change
      setp hal_manualtoolchange.number 3
    `);

    expect(
      draft.warnings.some((warning) =>
        warning.includes("loadusr parsing is partial"),
      ),
    ).toBe(false);

    expect(groups.get("hal_manualtoolchange")).toMatchObject({
      inferredHalComponentName: "hal_manualtoolchange",
      runtimeHint: "userspace",
    });
    expect(groups.get("hal_manualtoolchange")?.instances[0]).toMatchObject({
      instanceName: "hal_manualtoolchange",
    });
    expect(groups.get("iocontrol")).toBeDefined();
  });

  it("parses `loadusr` flags (`-W`, `-Wn`, `-n`, `-c`) to infer userspace instance names", () => {
    const { draft, groups } = groupByComponentName(`
      loadusr halscope
      loadusr -W hal_manualtoolchange
      loadusr -Wn spindle gs2_vfd -n spindle
      loadusr -Wn winder gladevcp -c winder -u handler.py winder.glade
    `);

    expect(draft.warnings).toEqual([]);

    expect(groups.get("halscope")).toMatchObject({
      inferredHalComponentName: "halscope",
      runtimeHint: "userspace",
    });
    expect(
      groups.get("halscope")?.instances.map((item) => item.instanceName),
    ).toEqual(["halscope"]);

    expect(groups.get("hal_manualtoolchange")).toMatchObject({
      inferredHalComponentName: "hal_manualtoolchange",
      runtimeHint: "userspace",
    });
    expect(
      groups
        .get("hal_manualtoolchange")
        ?.instances.map((item) => item.instanceName),
    ).toEqual(["hal_manualtoolchange"]);

    expect(groups.get("gs2_vfd")).toMatchObject({
      inferredHalComponentName: "gs2_vfd",
      runtimeHint: "userspace",
    });
    expect(
      groups.get("gs2_vfd")?.instances.map((item) => item.instanceName),
    ).toEqual(["spindle"]);

    expect(groups.get("gladevcp")).toMatchObject({
      inferredHalComponentName: "gladevcp",
      runtimeHint: "userspace",
    });
    expect(
      groups.get("gladevcp")?.instances.map((item) => item.instanceName),
    ).toEqual(["winder"]);
  });

  it("uses `<=` / `<=>` arrows to infer direction hints for endpoints before the arrow token", () => {
    const { draft, groups } = groupByComponentName(`
      net home-x joint.0.home-sw-in <= parport.0.pin-11-in
      net jog-enable ui.jog-enable <=> mux2.0.sel
    `);

    expect(draft.warnings).toEqual([]);

    expect(groups.get("joint")?.pins).toContainEqual({
      name: "home-sw-in",
      observedDirections: ["in"],
    });
    expect(groups.get("parport")?.pins).toContainEqual({
      name: "pin-11-in",
      observedDirections: ["out"],
    });

    expect(groups.get("ui")?.pins).toContainEqual({
      name: "jog-enable",
      observedDirections: ["io"],
    });
    expect(groups.get("mux2")?.pins).toContainEqual({
      name: "sel",
      observedDirections: ["io"],
    });
  });
});

describe("parseHalImportDraft (documented HAL features not imported yet)", () => {
  it.todo(
    "imports `sets <signal> <value>` commands (HAL basic-hal.adoc) as signal value assignments",
  );
  it.todo(
    "imports `unlinkp <pin>` commands (HAL basic-hal.adoc) as graph edits / disconnect operations",
  );
  it.todo(
    "imports explicit `newsig` declarations and legacy `linksp`/`linkps` compatibility commands",
  );
  it.todo(
    "imports `alias pin ...` / `alias param ...` naming aliases used in LinuxCNC configs",
  );
  it.todo(
    "maps bare `loadrt component` to canonical runtime instance paths like `component.0.*` used by LinuxCNC examples",
  );
  it.todo(
    "validates `net` writer/reader constraints from the HAL spec (single writer, IO vs OUT rules)",
  );
  it.todo(
    "handles `source` includes / multi-file HAL import instead of parsing one file in isolation",
  );
});
