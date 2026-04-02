import type { XY } from "@nohal/core/types";

export function snapCoordinateToGrid(
  value: number,
  resolution: number,
): number {
  return Math.round(value / resolution) * resolution;
}

export function snapPointToGrid(point: XY, resolution: number): XY {
  return {
    x: snapCoordinateToGrid(point.x, resolution),
    y: snapCoordinateToGrid(point.y, resolution),
  };
}
