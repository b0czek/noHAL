import type { Pt } from "../layout";
import type { CullModel, Rect, SceneBounds } from "./types";

const HALF_TURN_DEGREES = 180;

export const DEGREES_TO_RADIANS = Math.PI / HALF_TURN_DEGREES;
export const ROTATION_EPSILON = 1e-6;

export function normalizedRect(a: Pt, b: Pt): Rect {
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x);
  const y2 = Math.max(a.y, b.y);
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function rectContainsRect(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

export function expandBoundsWithRotatedRect(
  bounds: SceneBounds,
  rect: Rect,
  rotationDeg: number,
  pivot: Pt,
): void {
  const rad = rotationDeg * DEGREES_TO_RADIANS;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const corners: Pt[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  for (const point of corners) {
    const dx = point.x - pivot.x;
    const dy = point.y - pivot.y;
    const x = pivot.x + dx * c - dy * s;
    const y = pivot.y + dx * s + dy * c;
    bounds.minX = Math.min(bounds.minX, x);
    bounds.minY = Math.min(bounds.minY, y);
    bounds.maxX = Math.max(bounds.maxX, x);
    bounds.maxY = Math.max(bounds.maxY, y);
  }
}

export function rotatedRectBounds(
  rect: Rect,
  rotationDeg: number,
  pivot: Pt,
): Rect {
  const bounds: SceneBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
  expandBoundsWithRotatedRect(bounds, rect, rotationDeg, pivot);
  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

export function worldBoundsFromLocalRect(pos: Pt, model: CullModel): Rect {
  const worldRect = {
    x: pos.x + model.localRect.x,
    y: pos.y + model.localRect.y,
    width: model.localRect.width,
    height: model.localRect.height,
  };
  if (Math.abs(model.rotationDeg) < ROTATION_EPSILON) return worldRect;
  return rotatedRectBounds(worldRect, model.rotationDeg, pos);
}

export function viewportWorldRect(args: {
  width: number;
  height: number;
  margin: number;
  screenToWorld: (pos: Pt) => Pt;
}): Rect {
  const { width, height, margin, screenToWorld } = args;
  return normalizedRect(
    screenToWorld({ x: -margin, y: -margin }),
    screenToWorld({ x: width + margin, y: height + margin }),
  );
}
