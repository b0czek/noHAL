import { describe, expect, it } from "vitest";
import { snapCoordinateToGrid, snapPointToGrid } from "./grid";

const DEFAULT_GRID = 24;
const SMALL_GRID = 16;
const SNAP_DOWN_SAMPLE = 11;
const SNAP_UP_SAMPLE = 13;
const SNAP_FAR_SAMPLE = 39;
const SNAP_FAR_EXPECTED = 48;
const POINT_SAMPLE = { x: 31, y: -17 };
const POINT_EXPECTED = { x: 32, y: -16 };

describe("grid snapping", () => {
  it("snaps coordinates to the nearest grid line", () => {
    expect(snapCoordinateToGrid(SNAP_DOWN_SAMPLE, DEFAULT_GRID)).toBe(0);
    expect(snapCoordinateToGrid(SNAP_UP_SAMPLE, DEFAULT_GRID)).toBe(
      DEFAULT_GRID,
    );
    expect(snapCoordinateToGrid(SNAP_FAR_SAMPLE, DEFAULT_GRID)).toBe(
      SNAP_FAR_EXPECTED,
    );
  });

  it("snaps points on both axes", () => {
    expect(snapPointToGrid(POINT_SAMPLE, SMALL_GRID)).toEqual(POINT_EXPECTED);
  });
});
