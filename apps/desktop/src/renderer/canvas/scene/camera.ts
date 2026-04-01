import type { Pt } from "../layout";
import { clampRuntimePos, sceneWorldExtents } from "./bounds";
import type { CameraState, SceneBounds, SceneRuntime } from "./types";

const CAMERA_OVERSCROLL_PX = 220;
const CAMERA_MIN_SCALE = 0.1;
const CAMERA_MAX_SCALE = 2.8;
const CAMERA_SCALE_EPSILON = 1e-6;

export function clientToWorld(
  runtime: SceneRuntime,
  clientX: number,
  clientY: number,
): Pt {
  const rect = runtime.view.container.getBoundingClientRect();
  return clampRuntimePos(
    runtime,
    screenToWorld(runtime.state.camera, {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }),
  );
}

export function screenToWorld(camera: CameraState, pos: Pt): Pt {
  return {
    x: (pos.x - camera.x) / camera.scale,
    y: (pos.y - camera.y) / camera.scale,
  };
}

export function centerCamera(args: {
  stageWidth: number;
  stageHeight: number;
  sceneBounds: SceneBounds;
}): CameraState {
  const { stageWidth, stageHeight, sceneBounds } = args;
  return {
    x: Math.round(
      (stageWidth - (sceneBounds.maxX - sceneBounds.minX)) / 2 -
        sceneBounds.minX,
    ),
    y: Math.round(
      (stageHeight - (sceneBounds.maxY - sceneBounds.minY)) / 2 -
        sceneBounds.minY,
    ),
    scale: 1,
  };
}

export function centerCameraOnWorldPoint(args: {
  camera: CameraState;
  center: Pt;
  stageWidth: number;
  stageHeight: number;
}): void {
  const { camera, center, stageWidth, stageHeight } = args;
  camera.x = stageWidth / 2 - center.x * camera.scale;
  camera.y = stageHeight / 2 - center.y * camera.scale;
}

export function isZoomInShortcut(evt: KeyboardEvent): boolean {
  return (
    evt.key === "=" ||
    evt.key === "+" ||
    evt.code === "Equal" ||
    evt.code === "NumpadAdd"
  );
}

export function isZoomOutShortcut(evt: KeyboardEvent): boolean {
  return (
    evt.key === "-" ||
    evt.key === "_" ||
    evt.code === "Minus" ||
    evt.code === "NumpadSubtract"
  );
}

export function panCamera(camera: CameraState, dx: number, dy: number): void {
  camera.x += dx;
  camera.y += dy;
}

export function zoomCameraByFactor(args: {
  camera: CameraState;
  zoomFactor: number;
  pointer: Pt | null;
  stageWidth: number;
  stageHeight: number;
}): boolean {
  const { camera, zoomFactor, pointer, stageWidth, stageHeight } = args;
  const anchor = pointer ?? {
    x: stageWidth / 2,
    y: stageHeight / 2,
  };
  const oldScale = camera.scale;
  const nextScale = Math.max(
    CAMERA_MIN_SCALE,
    Math.min(CAMERA_MAX_SCALE, oldScale * zoomFactor),
  );
  if (Math.abs(nextScale - oldScale) < CAMERA_SCALE_EPSILON) return false;
  const worldAtPointer = screenToWorld(camera, anchor);
  camera.scale = nextScale;
  camera.x = anchor.x - worldAtPointer.x * nextScale;
  camera.y = anchor.y - worldAtPointer.y * nextScale;
  return true;
}

export function applyCamera(args: {
  runtime: SceneRuntime;
  updateCullVisibility: () => void;
  syncPlacementPreview: () => void;
  onCameraChange?: (camera: CameraState) => void;
}): void {
  const {
    runtime,
    updateCullVisibility,
    syncPlacementPreview,
    onCameraChange,
  } = args;
  const { camera, sceneBounds } = runtime.state;
  const { stage, wireWorld, mainWorld, previewWorld, wireLayer, mainLayer } =
    runtime.view;

  clampCamera(camera, {
    stageWidth: stage.width(),
    stageHeight: stage.height(),
    sceneBounds,
  });

  const transform = {
    x: camera.x,
    y: camera.y,
    scaleX: camera.scale,
    scaleY: camera.scale,
  };
  wireWorld.setAttrs(transform);
  mainWorld.setAttrs(transform);
  previewWorld.setAttrs(transform);
  updateCullVisibility();
  wireLayer.batchDraw();
  mainLayer.batchDraw();
  syncPlacementPreview();
  onCameraChange?.({ ...camera });
}

function clampCamera(
  camera: CameraState,
  args: {
    stageWidth: number;
    stageHeight: number;
    sceneBounds: SceneBounds;
  },
): void {
  const { stageWidth, stageHeight, sceneBounds } = args;
  const world = sceneWorldExtents(sceneBounds);
  const scaledWorldW = (world.maxX - world.minX) * camera.scale;
  const scaledWorldH = (world.maxY - world.minY) * camera.scale;

  if (scaledWorldW <= stageWidth - CAMERA_OVERSCROLL_PX * 2) {
    camera.x = Math.round(
      (stageWidth - scaledWorldW) / 2 - world.minX * camera.scale,
    );
  } else {
    const minX = stageWidth - CAMERA_OVERSCROLL_PX - world.maxX * camera.scale;
    const maxX = CAMERA_OVERSCROLL_PX - world.minX * camera.scale;
    camera.x = Math.max(minX, Math.min(maxX, camera.x));
  }

  if (scaledWorldH <= stageHeight - CAMERA_OVERSCROLL_PX * 2) {
    camera.y = Math.round(
      (stageHeight - scaledWorldH) / 2 - world.minY * camera.scale,
    );
  } else {
    const minY = stageHeight - CAMERA_OVERSCROLL_PX - world.maxY * camera.scale;
    const maxY = CAMERA_OVERSCROLL_PX - world.minY * camera.scale;
    camera.y = Math.max(minY, Math.min(maxY, camera.y));
  }
}
