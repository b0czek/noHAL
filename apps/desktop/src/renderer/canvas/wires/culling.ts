import type Konva from "konva";
import type { Pt } from "../layout";
import type { CullBounds } from "./types";

const STROKE_RADIUS_MULTIPLIER = 0.5;
const wireCullExtraPadding = {
  path: 10,
  waypoint: 12,
  labelAnchor: 8,
} as const;

export function getStrokeCullPadding(args: {
  strokeWidth: number;
  extraPadding: number;
  hitStrokeWidth?: number;
}): number {
  const { strokeWidth, extraPadding, hitStrokeWidth = 0 } = args;
  return (
    Math.max(strokeWidth, hitStrokeWidth) * STROKE_RADIUS_MULTIPLIER +
    extraPadding
  );
}

export function getPathCullPadding(args: {
  strokeWidth: number;
  hitStrokeWidth?: number;
}): number {
  return getStrokeCullPadding({
    ...args,
    extraPadding: wireCullExtraPadding.path,
  });
}

export function getWaypointCullPadding(args: {
  strokeWidth: number;
  hitStrokeWidth?: number;
}): number {
  return getStrokeCullPadding({
    ...args,
    extraPadding: wireCullExtraPadding.waypoint,
  });
}

export function getLabelAnchorCullPadding(strokeWidth: number): number {
  return getStrokeCullPadding({
    strokeWidth,
    extraPadding: wireCullExtraPadding.labelAnchor,
  });
}

export function boundsFromPoints(points: Pt[], pad = 0): CullBounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

export function setCullBounds(node: Konva.Node, bounds: CullBounds): void {
  node.setAttr("cullBounds", bounds);
}
