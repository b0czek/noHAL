import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../../types";

function makePidBase(
  version: LinuxCncVersion,
  refName: string,
  pins: ImportedComponentDefinition["pins"],
): ImportedComponentDefinition {
  return {
    id: `linuxcnc:${version}:manual:pid`,
    name: "pid",
    halComponentName: "pid",
    source: "manual",
    sourcePath: `git:${refName}:src/hal/components/pid.c`,
    docs: {
      component:
        "proportional/integral/derivative controller with automatic tuning support",
      description:
        "Realtime PID loop component. Loads up to 16 channels via num_chan=... or names=..., and exports one floating-point function per instance.",
      seeAlso: "pid(9)",
      notes:
        "Default load behavior uses num_chan for canonical pid.N instances, with fallback to names for custom instance names.",
    },
    pins,
    params: [],
    functions: [
      {
        key: "do_pid_calcs",
        declaredName: "do-pid-calcs",
        halSuffix: "do-pid-calcs",
        floatMode: "fp",
        doc: "Perform one PID update step for this channel.",
      },
    ],
    runtime: {
      kind: "rt",
      loadrt: {
        strategy: "names_or_num_chan",
      },
      options: {
        max_channels: 16,
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

function pidPins27(): ImportedComponentDefinition["pins"] {
  return [
    { key: "enable", name: "enable", direction: "in", type: "bit" },
    { key: "command", name: "command", direction: "in", type: "float" },
    {
      key: "command_deriv",
      name: "command-deriv",
      direction: "in",
      type: "float",
    },
    { key: "feedback", name: "feedback", direction: "in", type: "float" },
    {
      key: "feedback_deriv",
      name: "feedback-deriv",
      direction: "in",
      type: "float",
    },
    { key: "error", name: "error", direction: "out", type: "float" },
    { key: "output", name: "output", direction: "out", type: "float" },
    { key: "saturated", name: "saturated", direction: "out", type: "bit" },
    {
      key: "saturated_s",
      name: "saturated-s",
      direction: "out",
      type: "float",
    },
    {
      key: "saturated_count",
      name: "saturated-count",
      direction: "out",
      type: "s32",
    },
    { key: "pgain", name: "Pgain", direction: "in", type: "float" },
    { key: "igain", name: "Igain", direction: "in", type: "float" },
    { key: "dgain", name: "Dgain", direction: "in", type: "float" },
    { key: "ff0", name: "FF0", direction: "in", type: "float" },
    { key: "ff1", name: "FF1", direction: "in", type: "float" },
    { key: "ff2", name: "FF2", direction: "in", type: "float" },
    { key: "deadband", name: "deadband", direction: "in", type: "float" },
    { key: "maxerror", name: "maxerror", direction: "in", type: "float" },
    { key: "maxerror_i", name: "maxerrorI", direction: "in", type: "float" },
    { key: "maxerror_d", name: "maxerrorD", direction: "in", type: "float" },
    { key: "maxcmd_d", name: "maxcmdD", direction: "in", type: "float" },
    { key: "maxcmd_dd", name: "maxcmdDD", direction: "in", type: "float" },
    { key: "bias", name: "bias", direction: "in", type: "float" },
    { key: "maxoutput", name: "maxoutput", direction: "in", type: "float" },
    {
      key: "index_enable",
      name: "index-enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "error_previous_target",
      name: "error-previous-target",
      direction: "in",
      type: "bit",
    },
    {
      key: "error_i",
      name: "errorI",
      direction: "out",
      type: "float",
      doc: "Only exported when loadrt pid debug=1",
    },
    {
      key: "error_d",
      name: "errorD",
      direction: "out",
      type: "float",
      doc: "Only exported when loadrt pid debug=1",
    },
    {
      key: "command_d",
      name: "commandD",
      direction: "out",
      type: "float",
      doc: "Only exported when loadrt pid debug=1",
    },
    {
      key: "command_dd",
      name: "commandDD",
      direction: "out",
      type: "float",
      doc: "Only exported when loadrt pid debug=1",
    },
  ];
}

function pidPins28(): ImportedComponentDefinition["pins"] {
  return [
    ...pidPins27(),
    { key: "ff3", name: "FF3", direction: "in", type: "float" },
    {
      key: "maxcmd_ddd",
      name: "maxcmdDDD",
      direction: "in",
      type: "float",
    },
    {
      key: "command_ddd",
      name: "commandDDD",
      direction: "out",
      type: "float",
      doc: "Only exported when loadrt pid debug=1",
    },
  ];
}

function pidPins29Plus(): ImportedComponentDefinition["pins"] {
  return [...pidPins28()];
}

export function pid(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  if (version === "2.7") return makePidBase("2.7", refName, pidPins27());
  if (version === "2.8") return makePidBase("2.8", refName, pidPins28());
  if (version === "2.9") return makePidBase("2.9", refName, pidPins29Plus());
  return makePidBase("2.10", refName, pidPins29Plus());
}
