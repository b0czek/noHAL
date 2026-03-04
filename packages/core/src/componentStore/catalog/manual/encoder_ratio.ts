import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../../types";

function encoderRatioBasePins(): ImportedComponentDefinition["pins"] {
  return [
    { key: "master_a", name: "master-A", direction: "in", type: "bit" },
    { key: "master_b", name: "master-B", direction: "in", type: "bit" },
    { key: "slave_a", name: "slave-A", direction: "in", type: "bit" },
    { key: "slave_b", name: "slave-B", direction: "in", type: "bit" },
    { key: "enable", name: "enable", direction: "in", type: "bit" },
    { key: "error", name: "error", direction: "out", type: "float" },
  ];
}

function encoderRatioConfigPins(): ImportedComponentDefinition["pins"] {
  return [
    { key: "master_ppr", name: "master-ppr", direction: "io", type: "u32" },
    { key: "slave_ppr", name: "slave-ppr", direction: "io", type: "u32" },
    {
      key: "master_teeth",
      name: "master-teeth",
      direction: "io",
      type: "u32",
    },
    { key: "slave_teeth", name: "slave-teeth", direction: "io", type: "u32" },
  ];
}

function makeEncoderRatioBase(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  return {
    id: `linuxcnc:${version}:manual:encoder_ratio`,
    name: "encoder_ratio",
    halComponentName: "encoder_ratio",
    source: "manual",
    sourcePath: `git:${refName}:src/hal/components/encoder_ratio.c`,
    docs: {
      component: "electronic gear for synchronizing two encoder axes",
      description:
        "Realtime component that measures master/slave encoder movement and outputs a scaled tracking error for PID-based synchronization.",
      seeAlso: "encoder_ratio(9)",
      notes:
        "Pins/functions use the runtime HAL prefix 'encoder-ratio.*' when canonical num_chan naming is used by LinuxCNC.",
    },
    pins: [...encoderRatioBasePins(), ...encoderRatioConfigPins()],
    params: [],
    functions: [
      {
        key: "sample",
        declaredName: "sample",
        halSuffix: "sample",
        floatMode: "nofp",
        doc: "Sample all encoder inputs and update internal error accumulator.",
      },
      {
        key: "update",
        declaredName: "update",
        halSuffix: "update",
        floatMode: "fp",
        doc: "Update output error from accumulated counts and scale factors.",
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

export function encoderRatio(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  if (version === "2.7") return makeEncoderRatioBase("2.7", refName);
  if (version === "2.8") return makeEncoderRatioBase("2.8", refName);
  if (version === "2.9") return makeEncoderRatioBase("2.9", refName);
  return makeEncoderRatioBase("2.10", refName);
}
