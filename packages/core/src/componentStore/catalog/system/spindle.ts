import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ComponentPinDefinition } from "../../../types";

function spindlePins28Plus(): ComponentPinDefinition[] {
  return [
    { key: "on", name: "on", direction: "out", type: "bit" },
    { key: "forward", name: "forward", direction: "out", type: "bit" },
    { key: "reverse", name: "reverse", direction: "out", type: "bit" },
    { key: "brake", name: "brake", direction: "out", type: "bit" },
    {
      key: "inhibit",
      name: "inhibit",
      direction: "in",
      type: "bit",
    },
    { key: "speed_out", name: "speed-out", direction: "out", type: "float" },
    { key: "speed_in", name: "speed-in", direction: "in", type: "float" },
    { key: "at_speed", name: "at-speed", direction: "in", type: "bit" },
    {
      key: "orient_angle",
      name: "orient-angle",
      direction: "out",
      type: "float",
    },
    { key: "orient", name: "orient", direction: "out", type: "bit" },
    { key: "is_oriented", name: "is-oriented", direction: "in", type: "bit" },
    { key: "locked", name: "locked", direction: "out", type: "bit" },
    {
      key: "amp_fault_in",
      name: "amp-fault-in",
      direction: "in",
      type: "bit",
    },
  ];
}

export function spindlePinsForVersion(
  linuxcncVersion: LinuxCncVersion,
): ComponentPinDefinition[] {
  if (linuxcncVersion === "2.7") return [];
  return spindlePins28Plus();
}
