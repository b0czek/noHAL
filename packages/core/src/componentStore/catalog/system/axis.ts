import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ComponentPinDefinition } from "../../../types";

const AXIS_LETTERS = ["x", "y", "z", "a", "b", "c", "u", "v", "w"] as const;

function axisPins27(): ComponentPinDefinition[] {
  return [
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
      key: "motor_offset",
      name: "motor-offset",
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
      key: "pos_lim_sw_in",
      name: "pos-lim-sw-in",
      direction: "in",
      type: "bit",
    },
    {
      key: "neg_lim_sw_in",
      name: "neg-lim-sw-in",
      direction: "in",
      type: "bit",
    },
    {
      key: "home_sw_in",
      name: "home-sw-in",
      direction: "in",
      type: "bit",
    },
    {
      key: "index_enable",
      name: "index-enable",
      direction: "io",
      type: "bit",
    },
    {
      key: "amp_enable_out",
      name: "amp-enable-out",
      direction: "out",
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
      key: "coarse_pos_cmd",
      name: "coarse-pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "joint_vel_cmd",
      name: "joint-vel-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "backlash_corr",
      name: "backlash-corr",
      direction: "out",
      type: "float",
    },
    {
      key: "backlash_filt",
      name: "backlash-filt",
      direction: "out",
      type: "float",
    },
    {
      key: "backlash_vel",
      name: "backlash-vel",
      direction: "out",
      type: "float",
    },
    {
      key: "f_error",
      name: "f-error",
      direction: "out",
      type: "float",
    },
    {
      key: "f_error_lim",
      name: "f-error-lim",
      direction: "out",
      type: "float",
    },
    {
      key: "free_pos_cmd",
      name: "free-pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "free_vel_lim",
      name: "free-vel-lim",
      direction: "out",
      type: "float",
    },
    {
      key: "free_tp_enable",
      name: "free-tp-enable",
      direction: "out",
      type: "bit",
    },
    {
      key: "wheel_jog_active",
      name: "wheel-jog-active",
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
      key: "kb_jog_active",
      name: "kb-jog-active",
      direction: "out",
      type: "bit",
    },
    { key: "active", name: "active", direction: "out", type: "bit" },
    { key: "error", name: "error", direction: "out", type: "bit" },
    {
      key: "pos_hard_limit",
      name: "pos-hard-limit",
      direction: "out",
      type: "bit",
    },
    {
      key: "neg_hard_limit",
      name: "neg-hard-limit",
      direction: "out",
      type: "bit",
    },
    {
      key: "f_errored",
      name: "f-errored",
      direction: "out",
      type: "bit",
    },
    { key: "faulted", name: "faulted", direction: "out", type: "bit" },
    {
      key: "home_state",
      name: "home-state",
      direction: "out",
      type: "s32",
    },
    { key: "unlock", name: "unlock", direction: "out", type: "bit" },
    {
      key: "is_unlocked",
      name: "is-unlocked",
      direction: "in",
      type: "bit",
    },
  ];
}

function axisPins28Plus(): ComponentPinDefinition[] {
  return [
    {
      key: "pos_cmd",
      name: "pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "teleop_vel_cmd",
      name: "teleop-vel-cmd",
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
      key: "teleop_vel_lim",
      name: "teleop-vel-lim",
      direction: "out",
      type: "float",
    },
    {
      key: "teleop_tp_enable",
      name: "teleop-tp-enable",
      direction: "out",
      type: "bit",
    },
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
    { key: "kb_jog_active", name: "kb-jog-active", direction: "out", type: "bit" },
    {
      key: "wheel_jog_active",
      name: "wheel-jog-active",
      direction: "out",
      type: "bit",
    },
    {
      key: "jog_accel_fraction",
      name: "jog-accel-fraction",
      direction: "in",
      type: "float",
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
