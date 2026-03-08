import type { HalImportComponentGroup } from "../types";

const SYSTEM_HAL_COMPONENT_NAMES = new Set([
  "axis",
  "ini",
  "iocontrol",
  "joint",
  "motion",
  "spindle",
]);

export function isSystemHalImportComponentName(name: string): boolean {
  return SYSTEM_HAL_COMPONENT_NAMES.has(name.trim().toLowerCase());
}

export function isSystemHalImportComponentGroup(
  group: Pick<HalImportComponentGroup, "inferredHalComponentName">,
): boolean {
  return isSystemHalImportComponentName(group.inferredHalComponentName);
}
