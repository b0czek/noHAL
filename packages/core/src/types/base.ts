export type HalValueType =
  | "bit"
  | "float"
  | "s32"
  | "u32"
  | "s64"
  | "u64"
  | "port";

export type PinDirection = "in" | "out" | "io";
export type ParamDirection = "r" | "rw";
export type PortSide = "left" | "right" | "top" | "bottom";
export type LabelScope = "local" | "global";

export interface XY {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Rect = XY & Size;
