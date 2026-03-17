import type { ComponentNode } from "@nohal/core/src/types";
import type { Accessor } from "solid-js";

export type ComponentSettingsTab =
  | "instance"
  | "functions"
  | "instance-config"
  | "parameters"
  | "pins";

export const COMPONENT_SETTINGS_PIN_FILTER_MODES = [
  "all",
  "in",
  "out",
  "io",
] as const;

export type ComponentSettingsPinFilterMode =
  (typeof COMPONENT_SETTINGS_PIN_FILTER_MODES)[number];

export interface ComponentSettingsTabProps {
  node: Accessor<ComponentNode | null>;
}
