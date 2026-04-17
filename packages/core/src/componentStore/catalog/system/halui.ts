import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type {
  ComponentDefinition,
  ComponentPinDefinition,
  XY,
} from "../../../types";

export const HALUI_SYSTEM_COMPONENT_ID = "system:halui:halui";
export const HALUI_SYSTEM_MANAGER = "halui" as const;
export const HALUI_SYSTEM_FAMILY = "halui" as const;
export const HALUI_INSTANCE_NAME = "halui";

const TOOL_OFFSET_AXES = ["a", "b", "c", "u", "v", "w", "x", "y", "z"] as const;

function haluiPinsBase(): ComponentPinDefinition[] {
  return [
    { key: "abort", name: "abort", direction: "in", type: "bit" },
    {
      key: "tool_number",
      name: "tool.number",
      direction: "out",
      type: "u32",
    },
    ...TOOL_OFFSET_AXES.map((axis) => ({
      key: `tool_length_offset_${axis}`,
      name: `tool.length-offset.${axis}`,
      direction: "out" as const,
      type: "float" as const,
    })),
    {
      key: "program_block_delete_is_on",
      name: "program.block-delete.is-on",
      direction: "out",
      type: "bit",
    },
    {
      key: "program_block_delete_off",
      name: "program.block-delete.off",
      direction: "in",
      type: "bit",
    },
    {
      key: "program_block_delete_on",
      name: "program.block-delete.on",
      direction: "in",
      type: "bit",
    },
    {
      key: "program_is_idle",
      name: "program.is-idle",
      direction: "out",
      type: "bit",
    },
    {
      key: "program_is_paused",
      name: "program.is-paused",
      direction: "out",
      type: "bit",
    },
    {
      key: "program_is_running",
      name: "program.is-running",
      direction: "out",
      type: "bit",
    },
    {
      key: "program_optional_stop_is_on",
      name: "program.optional-stop.is-on",
      direction: "out",
      type: "bit",
    },
    {
      key: "program_optional_stop_off",
      name: "program.optional-stop.off",
      direction: "in",
      type: "bit",
    },
    {
      key: "program_optional_stop_on",
      name: "program.optional-stop.on",
      direction: "in",
      type: "bit",
    },
    {
      key: "program_pause",
      name: "program.pause",
      direction: "in",
      type: "bit",
    },
    {
      key: "program_resume",
      name: "program.resume",
      direction: "in",
      type: "bit",
    },
    { key: "program_run", name: "program.run", direction: "in", type: "bit" },
    { key: "program_step", name: "program.step", direction: "in", type: "bit" },
    {
      key: "program_stop",
      name: "program.stop",
      direction: "in",
      type: "bit",
    },
    { key: "mode_auto", name: "mode.auto", direction: "in", type: "bit" },
    {
      key: "mode_is_auto",
      name: "mode.is-auto",
      direction: "out",
      type: "bit",
    },
    {
      key: "mode_is_joint",
      name: "mode.is-joint",
      direction: "out",
      type: "bit",
    },
    {
      key: "mode_is_manual",
      name: "mode.is-manual",
      direction: "out",
      type: "bit",
    },
    { key: "mode_is_mdi", name: "mode.is-mdi", direction: "out", type: "bit" },
    {
      key: "mode_is_teleop",
      name: "mode.is-teleop",
      direction: "out",
      type: "bit",
    },
    { key: "mode_joint", name: "mode.joint", direction: "in", type: "bit" },
    { key: "mode_manual", name: "mode.manual", direction: "in", type: "bit" },
    { key: "mode_mdi", name: "mode.mdi", direction: "in", type: "bit" },
    { key: "mode_teleop", name: "mode.teleop", direction: "in", type: "bit" },
    { key: "mist_is_on", name: "mist.is-on", direction: "out", type: "bit" },
    { key: "mist_off", name: "mist.off", direction: "in", type: "bit" },
    { key: "mist_on", name: "mist.on", direction: "in", type: "bit" },
    {
      key: "max_velocity_count_enable",
      name: "max-velocity.count-enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "max_velocity_counts",
      name: "max-velocity.counts",
      direction: "in",
      type: "s32",
    },
    {
      key: "max_velocity_decrease",
      name: "max-velocity.decrease",
      direction: "in",
      type: "bit",
    },
    {
      key: "max_velocity_direct_value",
      name: "max-velocity.direct-value",
      direction: "in",
      type: "bit",
    },
    {
      key: "max_velocity_increase",
      name: "max-velocity.increase",
      direction: "in",
      type: "bit",
    },
    {
      key: "max_velocity_scale",
      name: "max-velocity.scale",
      direction: "in",
      type: "float",
    },
    {
      key: "max_velocity_value",
      name: "max-velocity.value",
      direction: "out",
      type: "float",
    },
    {
      key: "machine_is_on",
      name: "machine.is-on",
      direction: "out",
      type: "bit",
    },
    { key: "machine_off", name: "machine.off", direction: "in", type: "bit" },
    { key: "machine_on", name: "machine.on", direction: "in", type: "bit" },
    { key: "lube_is_on", name: "lube.is-on", direction: "out", type: "bit" },
    { key: "lube_off", name: "lube.off", direction: "in", type: "bit" },
    { key: "lube_on", name: "lube.on", direction: "in", type: "bit" },
    { key: "flood_is_on", name: "flood.is-on", direction: "out", type: "bit" },
    { key: "flood_off", name: "flood.off", direction: "in", type: "bit" },
    { key: "flood_on", name: "flood.on", direction: "in", type: "bit" },
    {
      key: "feed_override_count_enable",
      name: "feed-override.count-enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "feed_override_counts",
      name: "feed-override.counts",
      direction: "in",
      type: "s32",
    },
    {
      key: "feed_override_decrease",
      name: "feed-override.decrease",
      direction: "in",
      type: "bit",
    },
    {
      key: "feed_override_direct_value",
      name: "feed-override.direct-value",
      direction: "in",
      type: "bit",
    },
    {
      key: "feed_override_increase",
      name: "feed-override.increase",
      direction: "in",
      type: "bit",
    },
    {
      key: "feed_override_scale",
      name: "feed-override.scale",
      direction: "in",
      type: "float",
    },
    {
      key: "feed_override_value",
      name: "feed-override.value",
      direction: "out",
      type: "float",
    },
    {
      key: "rapid_override_count_enable",
      name: "rapid-override.count-enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "rapid_override_counts",
      name: "rapid-override.counts",
      direction: "in",
      type: "s32",
    },
    {
      key: "rapid_override_decrease",
      name: "rapid-override.decrease",
      direction: "in",
      type: "bit",
    },
    {
      key: "rapid_override_direct_value",
      name: "rapid-override.direct-value",
      direction: "in",
      type: "bit",
    },
    {
      key: "rapid_override_increase",
      name: "rapid-override.increase",
      direction: "in",
      type: "bit",
    },
    {
      key: "rapid_override_scale",
      name: "rapid-override.scale",
      direction: "in",
      type: "float",
    },
    {
      key: "rapid_override_value",
      name: "rapid-override.value",
      direction: "out",
      type: "float",
    },
    {
      key: "estop_activate",
      name: "estop.activate",
      direction: "in",
      type: "bit",
    },
    {
      key: "estop_is_activated",
      name: "estop.is-activated",
      direction: "out",
      type: "bit",
    },
    { key: "estop_reset", name: "estop.reset", direction: "in", type: "bit" },
    { key: "home_all", name: "home-all", direction: "in", type: "bit" },
  ];
}

function haluiPins28Plus(): ComponentPinDefinition[] {
  return [
    ...haluiPinsBase(),
    {
      key: "tool_diameter",
      name: "tool.diameter",
      direction: "out",
      type: "float",
    },
    {
      key: "machine_units_per_mm",
      name: "machine.units-per-mm",
      direction: "out",
      type: "float",
    },
  ];
}

function haluiPins29Plus(): ComponentPinDefinition[] {
  return [
    ...haluiPins28Plus(),
    {
      key: "feed_override_reset",
      name: "feed-override.reset",
      direction: "in",
      type: "bit",
    },
    {
      key: "rapid_override_reset",
      name: "rapid-override.reset",
      direction: "in",
      type: "bit",
    },
  ];
}

export function haluiPinsForVersion(
  version: LinuxCncVersion,
): ComponentPinDefinition[] {
  if (version === "2.7") return haluiPinsBase();
  if (version === "2.8") return haluiPins28Plus();
  return haluiPins29Plus();
}

export function createHaluiSystemComponentDefinition(
  version: LinuxCncVersion,
): ComponentDefinition {
  return {
    id: HALUI_SYSTEM_COMPONENT_ID,
    name: "halui",
    halComponentName: "halui",
    source: "manual",
    system: {
      manager: HALUI_SYSTEM_MANAGER,
      family: HALUI_SYSTEM_FAMILY,
    },
    visibility: {
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    },
    constraints: {
      exportNamespace: "global",
      fixedInstanceName: HALUI_INSTANCE_NAME,
    },
    runtime: { kind: "userspace" },
    pins: haluiPinsForVersion(version),
    params: [],
    docs: {
      description:
        "System-managed LinuxCNC halui namespace. This partial schema covers the singleton halui instance and omits axis, joint, spindle, and dynamic mdi-command pins.",
    },
  };
}

export function defaultPositionForHalui(): XY {
  return { x: 720, y: 940 };
}
