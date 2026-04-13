import type { Rect } from "@nohal/core/types";
import type Konva from "konva";

export type CullBounds = Rect;

const CULL_BOUNDS_ATTR = "cullBounds";

export function setCullBounds(node: Konva.Node, bounds: CullBounds): void {
  node.setAttr(CULL_BOUNDS_ATTR, bounds);
}

export function getCullBounds(node: Konva.Node): CullBounds | undefined {
  return node.getAttr(CULL_BOUNDS_ATTR) as CullBounds | undefined;
}
