import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ComponentPinDefinition } from "../../../types";

function jointPins28(): ComponentPinDefinition[] {
  return [
    {
      key: "home_sw_in",
      name: "home-sw-in",
      direction: "in",
      type: "bit",
    },
    { key: "homing", name: "homing", direction: "out", type: "bit" },
    { key: "homed", name: "homed", direction: "out", type: "bit" },
    {
      key: "pos_cmd",
      name: "pos-cmd",
      direction: "out",
      type: "float",
    },
    { key: "pos_fb", name: "pos-fb", direction: "in", type: "float" },
    {
      key: "motor_pos_cmd",
      name: "motor-pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "motor_pos_fb",
      name: "motor-pos-fb",
      direction: "in",
      type: "float",
    },
    {
      key: "joint_vel_cmd",
      name: "joint-vel-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "amp_enable_out",
      name: "amp-enable-out",
      direction: "out",
      type: "bit",
    },
    {
      key: "amp_fault_in",
      name: "amp-fault-in",
      direction: "in",
      type: "bit",
    },
    {
      key: "jog_enable",
      name: "jog-enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "jog_counts",
      name: "jog-counts",
      direction: "in",
      type: "s32",
    },
    {
      key: "jog_scale",
      name: "jog-scale",
      direction: "in",
      type: "float",
    },
    {
      key: "jog_accel_fraction",
      name: "jog-accel-fraction",
      direction: "in",
      type: "float",
    },
    {
      key: "in_position",
      name: "in-position",
      direction: "out",
      type: "bit",
    },
    {
      key: "kb_jog_active",
      name: "kb-jog-active",
      direction: "out",
      type: "bit",
    },
  ];
}

function jointPins29Plus(): ComponentPinDefinition[] {
  return [
    {
      key: "home_sw_in",
      name: "home-sw-in",
      direction: "in",
      type: "bit",
    },
    { key: "homing", name: "homing", direction: "out", type: "bit" },
    { key: "homed", name: "homed", direction: "out", type: "bit" },
    {
      key: "pos_cmd",
      name: "pos-cmd",
      direction: "out",
      type: "float",
    },
    { key: "pos_fb", name: "pos-fb", direction: "in", type: "float" },
    {
      key: "motor_pos_cmd",
      name: "motor-pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "motor_pos_fb",
      name: "motor-pos-fb",
      direction: "in",
      type: "float",
    },
    {
      key: "vel_cmd",
      name: "vel-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "amp_enable_out",
      name: "amp-enable-out",
      direction: "out",
      type: "bit",
    },
    {
      key: "amp_fault_in",
      name: "amp-fault-in",
      direction: "in",
      type: "bit",
    },
    {
      key: "jog_enable",
      name: "jog-enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "jog_counts",
      name: "jog-counts",
      direction: "in",
      type: "s32",
    },
    {
      key: "jog_scale",
      name: "jog-scale",
      direction: "in",
      type: "float",
    },
    {
      key: "jog_accel_fraction",
      name: "jog-accel-fraction",
      direction: "in",
      type: "float",
    },
    {
      key: "in_position",
      name: "in-position",
      direction: "out",
      type: "bit",
    },
    {
      key: "kb_jog_active",
      name: "kb-jog-active",
      direction: "out",
      type: "bit",
    },
  ];
}

export function jointPinsForVersion(
  linuxcncVersion: LinuxCncVersion,
): ComponentPinDefinition[] {
  if (linuxcncVersion === "2.7") return [];
  if (linuxcncVersion === "2.8") return jointPins28();
  if (linuxcncVersion === "2.9") return jointPins29Plus();
  return jointPins29Plus();
}
