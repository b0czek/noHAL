import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ComponentPinDefinition } from "../../../types";

function jointPins28PlusBase(): ComponentPinDefinition[] {
  return [
    {
      key: "coarse_pos_cmd",
      name: "coarse-pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "pos_cmd",
      name: "pos-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "pos_fb",
      name: "pos-fb",
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
      key: "motor_offset",
      name: "motor-offset",
      direction: "out",
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
    { key: "index_enable", name: "index-enable", direction: "io", type: "bit" },
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
      key: "jog_counts",
      name: "jog-counts",
      direction: "in",
      type: "s32",
    },
    {
      key: "jog_enable",
      name: "jog-enable",
      direction: "in",
      type: "bit",
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
      key: "vel_cmd",
      name: "vel-cmd",
      direction: "out",
      type: "float",
    },
    {
      key: "acc_cmd",
      name: "acc-cmd",
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
      key: "kb_jog_active",
      name: "kb-jog-active",
      direction: "out",
      type: "bit",
    },
    {
      key: "wheel_jog_active",
      name: "wheel-jog-active",
      direction: "out",
      type: "bit",
    },
    { key: "in_position", name: "in-position", direction: "out", type: "bit" },
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
      key: "active",
      name: "active",
      direction: "out",
      type: "bit",
    },
    {
      key: "error",
      name: "error",
      direction: "out",
      type: "bit",
    },
    {
      key: "f_errored",
      name: "f-errored",
      direction: "out",
      type: "bit",
    },
    {
      key: "faulted",
      name: "faulted",
      direction: "out",
      type: "bit",
    },
    { key: "homed", name: "homed", direction: "out", type: "bit" },
    { key: "homing", name: "homing", direction: "out", type: "bit" },
    {
      key: "home_state",
      name: "home-state",
      direction: "out",
      type: "s32",
    },
    {
      key: "jog_accel_fraction",
      name: "jog-accel-fraction",
      direction: "in",
      type: "float",
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

function jointPins28(): ComponentPinDefinition[] {
  return jointPins28PlusBase();
}

function jointPins29Plus(): ComponentPinDefinition[] {
  return [
    ...jointPins28PlusBase(),
    {
      key: "posthome_cmd",
      name: "posthome-cmd",
      direction: "out",
      type: "float",
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
