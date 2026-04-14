import { describe, expect, it } from "vitest";
import { resolveSheetCamera } from "./cameraSelection";

describe("resolveSheetCamera", () => {
  it("keeps the current camera while rendering the same sheet", () => {
    const currentCamera = { x: 120, y: 80, scale: 1.25 };

    expect(
      resolveSheetCamera({
        currentCamera,
        previousSheetId: "sheet_root",
        nextSheetId: "sheet_root",
        storedCamera: { x: 10, y: 20, scale: 0.75 },
        stageWidth: 800,
        stageHeight: 600,
        sceneBounds: { minX: 0, minY: 0, maxX: 400, maxY: 300 },
      }),
    ).toBe(currentCamera);
  });

  it("restores the stored camera when switching sheets", () => {
    const storedCamera = { x: -40, y: 64, scale: 1.8 };

    expect(
      resolveSheetCamera({
        currentCamera: { x: 120, y: 80, scale: 1.25 },
        previousSheetId: "sheet_root",
        nextSheetId: "sheet_child",
        storedCamera,
        stageWidth: 800,
        stageHeight: 600,
        sceneBounds: { minX: 0, minY: 0, maxX: 400, maxY: 300 },
      }),
    ).toEqual(storedCamera);
  });

  it("centers on sheet bounds when no camera was stored yet", () => {
    expect(
      resolveSheetCamera({
        currentCamera: { x: 120, y: 80, scale: 1.25 },
        previousSheetId: "sheet_root",
        nextSheetId: "sheet_child",
        storedCamera: null,
        stageWidth: 900,
        stageHeight: 700,
        sceneBounds: { minX: 100, minY: 50, maxX: 500, maxY: 250 },
      }),
    ).toEqual({
      x: 150,
      y: 200,
      scale: 1,
    });
  });
});
