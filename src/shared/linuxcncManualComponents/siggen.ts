import type { LinuxCncVersion } from "../linuxcncVersion";
import type { ImportedComponentDefinition } from "../types";

function siggenPins27(): ImportedComponentDefinition["pins"] {
  return [
    { key: "square", name: "square", direction: "out", type: "float" },
    { key: "sawtooth", name: "sawtooth", direction: "out", type: "float" },
    { key: "triangle", name: "triangle", direction: "out", type: "float" },
    { key: "sine", name: "sine", direction: "out", type: "float" },
    { key: "cosine", name: "cosine", direction: "out", type: "float" },
    { key: "clock", name: "clock", direction: "out", type: "bit" },
    { key: "frequency", name: "frequency", direction: "in", type: "float" },
    { key: "amplitude", name: "amplitude", direction: "in", type: "float" },
    { key: "offset", name: "offset", direction: "in", type: "float" },
  ];
}

function siggenPins28Plus(): ImportedComponentDefinition["pins"] {
  return [...siggenPins27(), { key: "reset", name: "reset", direction: "in", type: "bit" }];
}

function makeSiggenBase(
  version: LinuxCncVersion,
  refName: string,
  pins: ImportedComponentDefinition["pins"],
): ImportedComponentDefinition {
  return {
    id: `linuxcnc:${version}:manual:siggen`,
    name: "siggen",
    halComponentName: "siggen",
    source: "manual",
    sourcePath: `git:${refName}:src/hal/components/siggen.c`,
    docs: {
      component:
        "signal generator producing square, triangle, sine, cosine, sawtooth, and clock outputs",
      description:
        "Realtime test waveform generator with per-channel frequency, amplitude, and offset inputs.",
      seeAlso: "siggen(9)",
      notes:
        "Exports one floating-point function per channel: siggen.N.update.",
    },
    pins,
    params: [],
    functions: [
      {
        key: "update",
        declaredName: "update",
        halSuffix: "update",
        floatMode: "fp",
        doc: "Calculate one output sample for this signal-generator channel.",
      },
    ],
    runtime: {
      kind: "rt",
      loadrt: {
        strategy: "names_or_num_chan",
      },
      options: {
        max_channels: 16,
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

export function siggen(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  if (version === "2.7") return makeSiggenBase("2.7", refName, siggenPins27());
  if (version === "2.8")
    return makeSiggenBase("2.8", refName, siggenPins28Plus());
  if (version === "2.9")
    return makeSiggenBase("2.9", refName, siggenPins28Plus());
  return makeSiggenBase("2.10", refName, siggenPins28Plus());
}
