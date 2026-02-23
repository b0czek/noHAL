export type HalValueType = "bit" | "float" | "s32" | "u32" | "s64" | "u64" | "port";
export type PinDirection = "in" | "out" | "io";
export type ParamDirection = "r" | "rw";
export type PortSide = "left" | "right" | "bottom";
export type LabelScope = "local" | "global" | "hierarchical";

export interface XY {
  x: number;
  y: number;
}
