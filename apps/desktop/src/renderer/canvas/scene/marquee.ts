import type { Pt } from "../layout";
import { clampRuntimePos } from "./bounds";
import { screenToWorld } from "./camera";
import { normalizedRect } from "./geometry";
import type { Rect, SceneRuntime } from "./types";

export function startMarqueeSelection(args: {
  runtime: SceneRuntime;
  screenPos: Pt;
  updateMarqueeRect: () => void;
}): void {
  const { runtime, screenPos, updateMarqueeRect } = args;
  runtime.state.interaction.isMarqueeSelecting = true;
  runtime.state.interaction.marqueeStartScreenPos = screenPos;
  runtime.state.interaction.marqueeCurrentScreenPos = screenPos;
  runtime.view.container.style.cursor = "crosshair";
  updateMarqueeRect();
}

export function cancelMarqueeSelection(runtime: SceneRuntime): void {
  const { interaction } = runtime.state;
  if (!interaction.isMarqueeSelecting && !runtime.view.marqueeRect.visible()) {
    return;
  }
  interaction.isMarqueeSelecting = false;
  interaction.marqueeStartScreenPos = null;
  interaction.marqueeCurrentScreenPos = null;
  runtime.view.marqueeRect.hide();
  runtime.view.uiLayer.batchDraw();
  if (!interaction.isPanning) runtime.view.container.style.cursor = "";
}

export function finishMarqueeSelection(args: {
  runtime: SceneRuntime;
  thresholdPx: number;
  cancelMarqueeSelection: () => void;
  onClearSelection: () => void;
  onSelectWorldRect: (rect: Rect) => void;
}): void {
  const {
    runtime,
    thresholdPx,
    cancelMarqueeSelection,
    onClearSelection,
    onSelectWorldRect,
  } = args;
  const start = runtime.state.interaction.marqueeStartScreenPos;
  const end = runtime.state.interaction.marqueeCurrentScreenPos;
  const resolvedEnd = end ?? start;
  cancelMarqueeSelection();
  if (!start || !resolvedEnd) return;

  const screenRect = normalizedRect(start, resolvedEnd);
  if (screenRect.width < thresholdPx && screenRect.height < thresholdPx) {
    onClearSelection();
    return;
  }

  const worldRect = normalizedRect(
    clampRuntimePos(
      runtime,
      screenToWorld(runtime.state.camera, { x: screenRect.x, y: screenRect.y }),
    ),
    clampRuntimePos(
      runtime,
      screenToWorld(runtime.state.camera, {
        x: screenRect.x + screenRect.width,
        y: screenRect.y + screenRect.height,
      }),
    ),
  );
  onSelectWorldRect(worldRect);
}

export function updateMarqueeRect(runtime: SceneRuntime): void {
  const { start, end } = {
    start: runtime.state.interaction.marqueeStartScreenPos,
    end: runtime.state.interaction.marqueeCurrentScreenPos,
  };
  if (!start || !end) return;
  const rect = normalizedRect(start, end);
  runtime.view.marqueeRect.setAttrs({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    visible: true,
  });
  runtime.view.uiLayer.batchDraw();
}
