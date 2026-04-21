import type { Bounds } from "@nohal/core/types";
import type { CameraState } from "../types";
import { centerCamera } from "./camera";

export function resolveSheetCamera(args: {
  currentCamera: CameraState;
  previousSheetId: string | null;
  nextSheetId: string;
  storedCamera: CameraState | null;
  stageWidth: number;
  stageHeight: number;
  sceneBounds: Bounds;
}): CameraState {
  const {
    currentCamera,
    previousSheetId,
    nextSheetId,
    storedCamera,
    stageWidth,
    stageHeight,
    sceneBounds,
  } = args;

  if (previousSheetId === nextSheetId) {
    return currentCamera;
  }

  if (storedCamera) {
    return { ...storedCamera };
  }

  return centerCamera({
    stageWidth,
    stageHeight,
    sceneBounds,
  });
}
