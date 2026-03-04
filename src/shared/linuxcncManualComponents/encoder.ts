import type { LinuxCncVersion } from "../linuxcncVersion";
import type { ImportedComponentDefinition } from "../types";

function encoderPins27(): ImportedComponentDefinition["pins"] {
  return [
    { key: "phase_a", name: "phase-A", direction: "in", type: "bit" },
    { key: "phase_b", name: "phase-B", direction: "in", type: "bit" },
    { key: "phase_z", name: "phase-Z", direction: "in", type: "bit" },
    {
      key: "index_enable",
      name: "index-enable",
      direction: "io",
      type: "bit",
    },
    { key: "reset", name: "reset", direction: "in", type: "bit" },
    { key: "latch_input", name: "latch-input", direction: "in", type: "bit" },
    {
      key: "latch_rising",
      name: "latch-rising",
      direction: "in",
      type: "bit",
    },
    {
      key: "latch_falling",
      name: "latch-falling",
      direction: "in",
      type: "bit",
    },
    { key: "rawcounts", name: "rawcounts", direction: "out", type: "s32" },
    { key: "counts", name: "counts", direction: "out", type: "s32" },
    {
      key: "counts_latched",
      name: "counts-latched",
      direction: "out",
      type: "s32",
    },
    {
      key: "min_speed_estimate",
      name: "min-speed-estimate",
      direction: "in",
      type: "float",
      doc: "Default: 1.0",
    },
    { key: "position", name: "position", direction: "out", type: "float" },
    {
      key: "position_interpolated",
      name: "position-interpolated",
      direction: "out",
      type: "float",
    },
    {
      key: "position_latched",
      name: "position-latched",
      direction: "out",
      type: "float",
    },
    { key: "velocity", name: "velocity", direction: "out", type: "float" },
    {
      key: "position_scale",
      name: "position-scale",
      direction: "io",
      type: "float",
    },
    { key: "x4_mode", name: "x4-mode", direction: "io", type: "bit" },
    {
      key: "counter_mode",
      name: "counter-mode",
      direction: "io",
      type: "bit",
    },
  ];
}

function encoderPins28(): ImportedComponentDefinition["pins"] {
  return [
    ...encoderPins27(),
    {
      key: "velocity_rpm",
      name: "velocity-rpm",
      direction: "out",
      type: "float",
    },
  ];
}

function encoderPins29Plus(): ImportedComponentDefinition["pins"] {
  return [
    ...encoderPins28(),
    {
      key: "missing_teeth",
      name: "missing-teeth",
      direction: "in",
      type: "s32",
    },
  ];
}

function makeEncoderBase(
  version: LinuxCncVersion,
  refName: string,
  pins: ImportedComponentDefinition["pins"],
): ImportedComponentDefinition {
  return {
    id: `linuxcnc:${version}:manual:encoder`,
    name: "encoder",
    halComponentName: "encoder",
    source: "manual",
    sourcePath: `git:${refName}:src/hal/components/encoder.c`,
    docs: {
      component: "software counting of quadrature encoder signals",
      description:
        "Realtime encoder counter component supporting quadrature mode, single-channel counter mode, indexing, and optional latch capture.",
      seeAlso: "encoder(9)",
      notes:
        "Exports two functions for all channels: update-counters (nofp) and capture-position (fp).",
    },
    pins,
    params: [],
    functions: [
      {
        key: "update_counters",
        declaredName: "update-counters",
        halSuffix: "update-counters",
        floatMode: "nofp",
        doc: "Sample and decode encoder signals for all channels.",
      },
      {
        key: "capture_position",
        declaredName: "capture-position",
        halSuffix: "capture-position",
        floatMode: "fp",
        doc: "Capture counts and compute position/velocity outputs for all channels.",
      },
    ],
    runtime: {
      kind: "rt",
      loadrt: {
        strategy: "names_or_num_chan",
      },
      options: {
        max_channels: 8,
        default_num_chan: 3,
      },
    },
    parseMeta: {
      parser: "nohal-comp-v1",
      warnings: [
        "Manual component definition from non-.comp LinuxCNC source file.",
      ],
    },
  };
}

export function encoder(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  if (version === "2.7")
    return makeEncoderBase("2.7", refName, encoderPins27());
  if (version === "2.8")
    return makeEncoderBase("2.8", refName, encoderPins28());
  if (version === "2.9")
    return makeEncoderBase("2.9", refName, encoderPins29Plus());
  return makeEncoderBase("2.10", refName, encoderPins29Plus());
}
