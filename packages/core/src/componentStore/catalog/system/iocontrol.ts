import type { ComponentDefinition, XY } from "../../../types";

export const IOCONTROL_SYSTEM_COMPONENT_ID = "system:iocontrol:iocontrol";
export const IOCONTROL_SYSTEM_MANAGER = "iocontrol" as const;
export const IOCONTROL_SYSTEM_FAMILY = "iocontrol" as const;
export const IOCONTROL_INSTANCE_NAME = "iocontrol.0";

export function createIocontrolSystemComponentDefinition(): ComponentDefinition {
  return {
    id: IOCONTROL_SYSTEM_COMPONENT_ID,
    name: "iocontrol",
    halComponentName: "iocontrol",
    source: "manual",
    system: {
      manager: IOCONTROL_SYSTEM_MANAGER,
      family: IOCONTROL_SYSTEM_FAMILY,
    },
    visibility: {
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    },
    constraints: {
      exportNamespace: "global",
      fixedInstanceName: IOCONTROL_INSTANCE_NAME,
    },
    runtime: { kind: "userspace" },
    pins: [
      {
        key: "coolant_flood",
        name: "coolant-flood",
        direction: "out",
        type: "bit",
      },
      {
        key: "coolant_mist",
        name: "coolant-mist",
        direction: "out",
        type: "bit",
      },
      {
        key: "emc_enable_in",
        name: "emc-enable-in",
        direction: "in",
        type: "bit",
      },
      {
        key: "tool_change",
        name: "tool-change",
        direction: "out",
        type: "bit",
      },
      {
        key: "tool_changed",
        name: "tool-changed",
        direction: "in",
        type: "bit",
      },
      {
        key: "tool_number",
        name: "tool-number",
        direction: "out",
        type: "s32",
      },
      {
        key: "tool_prep_number",
        name: "tool-prep-number",
        direction: "out",
        type: "s32",
      },
      {
        key: "tool_prep_pocket",
        name: "tool-prep-pocket",
        direction: "out",
        type: "s32",
      },
      {
        key: "tool_prepare",
        name: "tool-prepare",
        direction: "out",
        type: "bit",
      },
      {
        key: "tool_prepared",
        name: "tool-prepared",
        direction: "in",
        type: "bit",
      },
      {
        key: "user_enable_out",
        name: "user-enable-out",
        direction: "out",
        type: "bit",
      },
      {
        key: "user_request_enable",
        name: "user-request-enable",
        direction: "out",
        type: "bit",
      },
      {
        key: "tool_prep_index",
        name: "tool-prep-index",
        direction: "out",
        type: "s32",
      },
    ],
    params: [],
    docs: {
      description:
        "System-managed LinuxCNC iocontrol namespace. LinuxCNC creates the singleton iocontrol.0 instance automatically; HAL should net against its pins but not load it manually.",
    },
  };
}

export function defaultPositionForIocontrol(): XY {
  return { x: 420, y: 940 };
}
