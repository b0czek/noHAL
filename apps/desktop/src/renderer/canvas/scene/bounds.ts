import type { Bounds, XY } from "@nohal/core/types";
import type { SceneRuntime } from "./types";

export const SCENE_POSITION_PADDING = 2400;

export function sceneWorldExtents(sceneBounds: Bounds): Bounds {
  return {
    minX: -SCENE_POSITION_PADDING,
    minY: -SCENE_POSITION_PADDING,
    maxX: sceneBounds.maxX + SCENE_POSITION_PADDING,
    maxY: sceneBounds.maxY + SCENE_POSITION_PADDING,
  };
}

export function clampScenePos(pos: XY, sceneBounds: Bounds): XY {
  const { minX, minY, maxX, maxY } = sceneWorldExtents(sceneBounds);
  return {
    x: Math.max(minX, Math.min(maxX, pos.x)),
    y: Math.max(minY, Math.min(maxY, pos.y)),
  };
}

export function clampRuntimePos(runtime: SceneRuntime, pos: XY): XY {
  return clampScenePos(pos, runtime.state.sceneBounds);
}
