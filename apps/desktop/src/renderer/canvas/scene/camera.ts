import type Konva from "konva";
import type { Pt } from "../layout";
import type { CameraState, SceneBounds } from "./types";

const CAMERA_OVERSCROLL_PX = 220;
const SCENE_POSITION_PADDING = 2400;

export function clientToWorld(args: {
  clientX: number;
  clientY: number;
  container: HTMLDivElement;
  camera: CameraState;
  clampPos: (pos: Pt) => Pt;
}): Pt {
  const { clientX, clientY, container, camera, clampPos } = args;
  const rect = container.getBoundingClientRect();
  return clampPos(
    screenToWorld(camera, {
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
  const nextScale = Math.max(0.35, Math.min(2.8, oldScale * zoomFactor));
  if (Math.abs(nextScale - oldScale) < 1e-6) return false;
  const worldAtPointer = screenToWorld(camera, anchor);
  camera.scale = nextScale;
  camera.x = anchor.x - worldAtPointer.x * nextScale;
  camera.y = anchor.y - worldAtPointer.y * nextScale;
  return true;
}

export function applyCamera(args: {
  camera: CameraState;
  sceneBounds: SceneBounds;
  stage: Pick<Konva.Stage, "width" | "height">;
  wireWorld: Konva.Group;
  mainWorld: Konva.Group;
  previewWorld: Konva.Group;
  wireLayer: Konva.Layer;
  mainLayer: Konva.Layer;
  updateCullVisibility: () => void;
  syncPlacementPreview: () => void;
  onCameraChange?: (camera: CameraState) => void;
}): void {
  const {
    camera,
    sceneBounds,
    stage,
    wireWorld,
    mainWorld,
    previewWorld,
    wireLayer,
    mainLayer,
    updateCullVisibility,
    syncPlacementPreview,
    onCameraChange,
  } = args;

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
  const minWorldX = -SCENE_POSITION_PADDING;
  const minWorldY = -SCENE_POSITION_PADDING;
  const maxWorldX = sceneBounds.maxX + SCENE_POSITION_PADDING;
  const maxWorldY = sceneBounds.maxY + SCENE_POSITION_PADDING;
  const scaledWorldW = (maxWorldX - minWorldX) * camera.scale;
  const scaledWorldH = (maxWorldY - minWorldY) * camera.scale;

  if (scaledWorldW <= stageWidth - CAMERA_OVERSCROLL_PX * 2) {
    camera.x = Math.round(
      (stageWidth - scaledWorldW) / 2 - minWorldX * camera.scale,
    );
  } else {
    const minX = stageWidth - CAMERA_OVERSCROLL_PX - maxWorldX * camera.scale;
    const maxX = CAMERA_OVERSCROLL_PX - minWorldX * camera.scale;
    camera.x = Math.max(minX, Math.min(maxX, camera.x));
  }

  if (scaledWorldH <= stageHeight - CAMERA_OVERSCROLL_PX * 2) {
    camera.y = Math.round(
      (stageHeight - scaledWorldH) / 2 - minWorldY * camera.scale,
    );
  } else {
    const minY = stageHeight - CAMERA_OVERSCROLL_PX - maxWorldY * camera.scale;
    const maxY = CAMERA_OVERSCROLL_PX - minWorldY * camera.scale;
    camera.y = Math.max(minY, Math.min(maxY, camera.y));
  }
}
