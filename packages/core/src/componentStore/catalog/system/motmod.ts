import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type {
  ComponentDefinition,
  ComponentPinDefinition,
  ProjectMotmodConfig,
} from "../../../types";
import { axisPinsForVersion, requiredAxisInstances } from "./axis";
import { jointPinsForVersion } from "./joint";
import {
  motionFunctions,
  motionInstanceConfigDefinition,
  motionInstanceConfigValues,
  motionPinsForVersion,
} from "./motion";
import { spindlePinsForVersion } from "./spindle";

export const MOTMOD_SYSTEM_COMPONENT_IDS = {
  motion: "system:motmod:motion",
  axis: "system:motmod:axis",
  joint: "system:motmod:joint",
  spindle: "system:motmod:spindle",
} as const;

export const MOTMOD_MANAGED_FAMILIES = [
  "motion",
  "axis",
  "joint",
  "spindle",
] as const;

export type MotmodManagedFamily = (typeof MOTMOD_MANAGED_FAMILIES)[number];

export function managedInstanceConfigValuesForFamily(
  family: MotmodManagedFamily,
  linuxcncVersion: LinuxCncVersion,
  motmod: ProjectMotmodConfig,
): Record<string, string> | undefined {
  if (family !== "motion") return undefined;
  return motionInstanceConfigValues(linuxcncVersion, motmod);
}

export function systemPinsByFamily(
  family: MotmodManagedFamily,
  linuxcncVersion: LinuxCncVersion,
): ComponentPinDefinition[] {
  if (family === "motion") return motionPinsForVersion(linuxcncVersion);
  if (family === "axis") return axisPinsForVersion(linuxcncVersion);
  if (family === "joint") return jointPinsForVersion(linuxcncVersion);
  return spindlePinsForVersion(linuxcncVersion);
}

export function createMotmodSystemComponentDefinition(
  family: MotmodManagedFamily,
  linuxcncVersion: LinuxCncVersion,
): ComponentDefinition {
  const runtime: NonNullable<ComponentDefinition["runtime"]> =
    family === "motion"
      ? {
          kind: "rt",
          instanceConfig: motionInstanceConfigDefinition(linuxcncVersion),
        }
      : { kind: "unknown" };

  return {
    id: MOTMOD_SYSTEM_COMPONENT_IDS[family],
    name: family,
    halComponentName: family,
    source: "manual",
    system: {
      manager: "motmod",
      family,
    },
    visibility: {
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    },
    ...(family === "motion"
      ? {
          constraints: {
            fixedInstanceName: "motion",
          },
        }
      : {}),
    runtime,
    pins: systemPinsByFamily(family, linuxcncVersion),
    params: [],
    ...(family === "motion" ? { functions: motionFunctions() } : {}),
    docs: {
      description:
        "System-managed HAL namespace exported by LinuxCNC motmod; instances are synchronized from motmod config.",
    },
  };
}

export function requiredMotmodInstancesByFamily(
  linuxcncVersion: LinuxCncVersion,
  motmod: ProjectMotmodConfig,
): Record<MotmodManagedFamily, string[]> {
  if (linuxcncVersion === "2.7") {
    return {
      motion: ["motion"],
      axis: requiredAxisInstances(linuxcncVersion, motmod.numJoints),
      joint: [],
      spindle: [],
    };
  }
  return {
    motion: ["motion"],
    axis: requiredAxisInstances(linuxcncVersion, motmod.numJoints),
    joint: Array.from({ length: motmod.numJoints }, (_, i) => `joint.${i}`),
    spindle: Array.from(
      { length: motmod.numSpindles },
      (_, i) => `spindle.${i}`,
    ),
  };
}

export function defaultPositionForMotmodFamily(
  family: MotmodManagedFamily,
  index: number,
): { x: number; y: number } {
  let baseX = 1100;
  if (family === "motion") {
    baseX = 120;
  } else if (family === "axis") {
    baseX = 420;
  } else if (family === "joint") {
    baseX = 760;
  }
  const baseY = 120;
  const row = index % 9;
  const col = Math.floor(index / 9);
  return {
    x: baseX + col * 260,
    y: baseY + row * 82,
  };
}
