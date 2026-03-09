import type { ComponentNode } from "@nohal/core/src/types";
import type { Accessor } from "solid-js";

export type ComponentNodeTab =
  | "instance"
  | "functions"
  | "instance-config"
  | "parameters"
  | "pins";

export const COMPONENT_NODE_PIN_FILTER_MODES = [
  "all",
  "in",
  "out",
  "io",
] as const;

export type ComponentNodePinFilterMode =
  (typeof COMPONENT_NODE_PIN_FILTER_MODES)[number];

export interface ComponentNodeDialogTabProps {
  node: Accessor<ComponentNode | null>;
}
