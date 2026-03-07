import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentPinDefinition,
  ProjectMotmodConfig,
} from "../../../types";

export function motionSupportsMiscError(version: LinuxCncVersion): boolean {
  return version === "2.9" || version === "2.10";
}

export function motionInstanceConfigDefinition(
  version: LinuxCncVersion,
): NonNullable<ComponentDefinition["runtime"]>["instanceConfig"] {
  const fields: NonNullable<
    NonNullable<ComponentDefinition["runtime"]>["instanceConfig"]
  >["fields"] = [
    {
      key: "num_dio",
      type: "integer",
      doc: "Number of motion.digital-in/out pins exported by motmod.",
      defaultValue: 4,
      min: 0,
      max: 256,
    },
    {
      key: "num_aio",
      type: "integer",
      doc: "Number of motion.analog-in/out pins exported by motmod.",
      defaultValue: 4,
      min: 0,
      max: 256,
    },
  ];

  if (motionSupportsMiscError(version)) {
    fields.push({
      key: "num_misc_error",
      type: "integer",
      doc: "Number of motion.misc-error-NN pins exported by motmod.",
      defaultValue: 0,
      min: 0,
      max: 256,
    });
  }

  const pinExpansionRules: NonNullable<
    NonNullable<ComponentDefinition["runtime"]>["instanceConfig"]
  >["pinExpansionRules"] = [
    {
      kind: "indexed_by_count",
      countConfigKey: "num_dio",
      indexStart: 0,
      templates: [
        {
          keyTemplate: "digital_in_{index2}",
          nameTemplate: "digital-in-{index2}",
          direction: "in",
          type: "bit",
        },
        {
          keyTemplate: "digital_out_{index2}",
          nameTemplate: "digital-out-{index2}",
          direction: "out",
          type: "bit",
        },
      ],
    },
    {
      kind: "indexed_by_count",
      countConfigKey: "num_aio",
      indexStart: 0,
      templates: [
        {
          keyTemplate: "analog_in_{index2}",
          nameTemplate: "analog-in-{index2}",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "analog_out_{index2}",
          nameTemplate: "analog-out-{index2}",
          direction: "out",
          type: "float",
        },
      ],
    },
  ];

  if (motionSupportsMiscError(version)) {
    pinExpansionRules.push({
      kind: "indexed_by_count",
      countConfigKey: "num_misc_error",
      indexStart: 0,
      templates: [
        {
          keyTemplate: "misc_error_{index2}",
          nameTemplate: "misc-error-{index2}",
          direction: "in",
          type: "bit",
        },
      ],
    });
  }

  return { fields, pinExpansionRules };
}

export function motionInstanceConfigValues(
  linuxcncVersion: LinuxCncVersion,
  motmod: ProjectMotmodConfig,
): Record<string, string> {
  const values: Record<string, string> = {
    num_dio: `${motmod.numDio}`,
    num_aio: `${motmod.numAio}`,
  };
  if (motionSupportsMiscError(linuxcncVersion)) {
    values.num_misc_error = `${motmod.numMiscError}`;
  }
  return values;
}

function motionPins27(): ComponentPinDefinition[] {
  return [
    { key: "enable", name: "enable", direction: "in", type: "bit" },
    {
      key: "probe_input",
      name: "probe-input",
      direction: "in",
      type: "bit",
    },
    {
      key: "feed_hold",
      name: "feed-hold",
      direction: "in",
      type: "bit",
    },
    {
      key: "feed_inhibit",
      name: "feed-inhibit",
      direction: "in",
      type: "bit",
    },
    {
      key: "coord_mode",
      name: "coord-mode",
      direction: "out",
      type: "bit",
    },
    {
      key: "teleop_mode",
      name: "teleop-mode",
      direction: "out",
      type: "bit",
    },
    {
      key: "in_position",
      name: "in-position",
      direction: "out",
      type: "bit",
    },
    {
      key: "distance_to_go",
      name: "distance-to-go",
      direction: "out",
      type: "float",
    },
    {
      key: "requested_vel",
      name: "requested-vel",
      direction: "out",
      type: "float",
    },
    {
      key: "current_vel",
      name: "current-vel",
      direction: "out",
      type: "float",
    },
    {
      key: "motion_enabled",
      name: "motion-enabled",
      direction: "out",
      type: "bit",
    },
  ];
}

function motionPins28(): ComponentPinDefinition[] {
  return [
    ...motionPins27(),
    {
      key: "homing_inhibit",
      name: "homing-inhibit",
      direction: "in",
      type: "bit",
    },
  ];
}

function motionPins29Plus(): ComponentPinDefinition[] {
  return [
    ...motionPins28(),
    {
      key: "jog_inhibit",
      name: "jog-inhibit",
      direction: "in",
      type: "bit",
    },
    {
      key: "jog_stop",
      name: "jog-stop",
      direction: "in",
      type: "bit",
    },
    {
      key: "jog_stop_immediate",
      name: "jog-stop-immediate",
      direction: "in",
      type: "bit",
    },
    {
      key: "is_all_homed",
      name: "is-all-homed",
      direction: "out",
      type: "bit",
    },
  ];
}

export function motionPinsForVersion(
  linuxcncVersion: LinuxCncVersion,
): ComponentPinDefinition[] {
  if (linuxcncVersion === "2.7") return motionPins27();
  if (linuxcncVersion === "2.8") return motionPins28();
  if (linuxcncVersion === "2.9") return motionPins29Plus();
  return motionPins29Plus();
}

export function motionFunctions(): ComponentFunctionDefinition[] {
  return [
    {
      key: "motion_command_handler",
      declaredName: "motion-command-handler",
      halSuffix: "motion-command-handler",
      addfTargetTemplate: "motion-command-handler",
      floatMode: "fp",
    },
    {
      key: "motion_controller",
      declaredName: "motion-controller",
      halSuffix: "motion-controller",
      addfTargetTemplate: "motion-controller",
      floatMode: "fp",
    },
  ];
}
