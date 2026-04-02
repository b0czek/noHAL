import type { XY } from "@nohal/core/types";
import type { SceneBounds, SceneRuntime } from "./types";

export const SCENE_POSITION_PADDING = 2400;

export function sceneWorldExtents(sceneBounds: SceneBounds): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  return {
    minX: -SCENE_POSITION_PADDING,
    minY: -SCENE_POSITION_PADDING,
    maxX: sceneBounds.maxX + SCENE_POSITION_PADDING,
    maxY: sceneBounds.maxY + SCENE_POSITION_PADDING,
  };
}

export function clampScenePos(pos: XY, sceneBounds: SceneBounds): XY {
  const { minX, minY, maxX, maxY } = sceneWorldExtents(sceneBounds);
  return {
    x: Math.max(minX, Math.min(maxX, pos.x)),
    y: Math.max(minY, Math.min(maxY, pos.y)),
  };
}

export function clampRuntimePos(runtime: SceneRuntime, pos: XY): XY {
  return clampScenePos(pos, runtime.state.sceneBounds);
}
