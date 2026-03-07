import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ComponentPinDefinition } from "../../../types";

const AXIS_LETTERS = ["x", "y", "z", "a", "b", "c", "u", "v", "w"] as const;

function axisPins27(): ComponentPinDefinition[] {
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
      key: "jog_vel_mode",
      name: "jog-vel-mode",
      direction: "in",
      type: "bit",
    },
    {
      key: "joint_pos_cmd",
      name: "joint-pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "joint_pos_fb",
      name: "joint-pos-fb",
      direction: "out",
      type: "float",
    },
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

function axisPins28Plus(): ComponentPinDefinition[] {
  return [
    {
      key: "eoffset",
      name: "eoffset",
      direction: "out",
      type: "float",
    },
    {
      key: "eoffset_clear",
      name: "eoffset-clear",
      direction: "in",
      type: "bit",
    },
    {
      key: "eoffset_counts",
      name: "eoffset-counts",
      direction: "in",
      type: "s32",
    },
    {
      key: "eoffset_enable",
      name: "eoffset-enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "eoffset_request",
      name: "eoffset-request",
      direction: "out",
      type: "float",
    },
    {
      key: "eoffset_scale",
      name: "eoffset-scale",
      direction: "in",
      type: "float",
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
      key: "jog_vel_mode",
      name: "jog-vel-mode",
      direction: "in",
      type: "bit",
    },
    {
      key: "jog_accel_fraction",
      name: "jog-accel-fraction",
      direction: "in",
      type: "float",
    },
    {
      key: "pos_cmd",
      name: "pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "teleop_pos_cmd",
      name: "teleop-pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "kb_jog_active",
      name: "kb-jog-active",
      direction: "out",
      type: "bit",
    },
  ];
}

export function axisPinsForVersion(
  linuxcncVersion: LinuxCncVersion,
): ComponentPinDefinition[] {
  if (linuxcncVersion === "2.7") return axisPins27();
  return axisPins28Plus();
}

export function requiredAxisInstances(
  linuxcncVersion: LinuxCncVersion,
  numJoints: number,
): string[] {
  if (linuxcncVersion === "2.7") {
    return Array.from(
      { length: Math.max(1, numJoints) },
      (_, i) => `axis.${i}`,
    );
  }
  return AXIS_LETTERS.map((letter) => `axis.${letter}`);
}
