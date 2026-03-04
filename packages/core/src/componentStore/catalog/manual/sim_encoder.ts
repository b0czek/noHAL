import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../../types";

function simEncoderPins(): ImportedComponentDefinition["pins"] {
  return [
    { key: "phase_a", name: "phase-A", direction: "out", type: "bit" },
    { key: "phase_b", name: "phase-B", direction: "out", type: "bit" },
    { key: "phase_z", name: "phase-Z", direction: "out", type: "bit" },
    { key: "ppr", name: "ppr", direction: "io", type: "u32" },
    { key: "scale", name: "scale", direction: "io", type: "float" },
    { key: "speed", name: "speed", direction: "in", type: "float" },
    {
      key: "rawcounts",
      name: "rawcounts",
      direction: "in",
      type: "s32",
      doc: "Raw count input used by the pulse generator state machine.",
    },
  ];
}

function makeSimEncoderBase(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  return {
    id: `linuxcnc:${version}:manual:sim_encoder`,
    name: "sim_encoder",
    halComponentName: "sim_encoder",
    source: "manual",
    sourcePath: `git:${refName}:src/hal/components/sim_encoder.c`,
    docs: {
      component: "simulated quadrature encoder with index pulse output",
      description:
        "Realtime simulated encoder that emits phase-A/phase-B/phase-Z signals from a commanded speed and scaling configuration.",
      seeAlso: "sim_encoder(9)",
      notes:
        "Uses runtime HAL prefix 'sim-encoder.*' for canonical num_chan naming.",
    },
    pins: simEncoderPins(),
    params: [],
    functions: [
      {
        key: "make_pulses",
        declaredName: "make-pulses",
        halSuffix: "make-pulses",
        floatMode: "nofp",
        doc: "Generate quadrature and index pulses for all channels.",
      },
      {
        key: "update_speed",
        declaredName: "update-speed",
        halSuffix: "update-speed",
        floatMode: "fp",
        doc: "Convert speed and scaling settings into pulse-generator state.",
      },
    ],
    runtime: {
      kind: "rt",
      loadrt: {
        strategy: "names_or_num_chan",
      },
      options: {
        max_channels: 8,
        default_num_chan: 1,
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

export function simEncoder(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  if (version === "2.7") return makeSimEncoderBase("2.7", refName);
  if (version === "2.8") return makeSimEncoderBase("2.8", refName);
  if (version === "2.9") return makeSimEncoderBase("2.9", refName);
  return makeSimEncoderBase("2.10", refName);
}
