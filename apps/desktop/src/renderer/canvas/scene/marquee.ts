import type Konva from "konva";
import type { Pt } from "../layout";
import { normalizedRect } from "./geometry";
import type { Rect } from "./types";

export function startMarqueeSelection(args: {
  screenPos: Pt;
  container: HTMLDivElement;
  setIsMarqueeSelecting: (value: boolean) => void;
  setMarqueeStartScreenPos: (value: Pt | null) => void;
  setMarqueeCurrentScreenPos: (value: Pt | null) => void;
  updateMarqueeRect: () => void;
}): void {
  const {
    screenPos,
    container,
    setIsMarqueeSelecting,
    setMarqueeStartScreenPos,
    setMarqueeCurrentScreenPos,
    updateMarqueeRect,
  } = args;
  setIsMarqueeSelecting(true);
  setMarqueeStartScreenPos(screenPos);
  setMarqueeCurrentScreenPos(screenPos);
  container.style.cursor = "crosshair";
  updateMarqueeRect();
}

export function cancelMarqueeSelection(args: {
  isMarqueeSelecting: boolean;
  marqueeRect: Konva.Rect;
  uiLayer: Konva.Layer;
  isPanning: boolean;
  container: HTMLDivElement;
  setIsMarqueeSelecting: (value: boolean) => void;
  setMarqueeStartScreenPos: (value: Pt | null) => void;
  setMarqueeCurrentScreenPos: (value: Pt | null) => void;
}): void {
  const {
    isMarqueeSelecting,
    marqueeRect,
    uiLayer,
    isPanning,
    container,
    setIsMarqueeSelecting,
    setMarqueeStartScreenPos,
    setMarqueeCurrentScreenPos,
  } = args;
  if (!isMarqueeSelecting && !marqueeRect.visible()) return;
  setIsMarqueeSelecting(false);
  setMarqueeStartScreenPos(null);
  setMarqueeCurrentScreenPos(null);
  marqueeRect.hide();
  uiLayer.batchDraw();
  if (!isPanning) container.style.cursor = "";
}

export function finishMarqueeSelection(args: {
  start: Pt | null;
  end: Pt | null;
  thresholdPx: number;
  clampPos: (pos: Pt) => Pt;
  screenToWorld: (pos: Pt) => Pt;
  cancelMarqueeSelection: () => void;
  onClearSelection: () => void;
  onSelectWorldRect: (rect: Rect) => void;
}): void {
  const {
    start,
    end,
    thresholdPx,
    clampPos,
    screenToWorld,
    cancelMarqueeSelection,
    onClearSelection,
    onSelectWorldRect,
  } = args;
  const resolvedEnd = end ?? start;
  cancelMarqueeSelection();
  if (!start || !resolvedEnd) return;

  const screenRect = normalizedRect(start, resolvedEnd);
  if (screenRect.width < thresholdPx && screenRect.height < thresholdPx) {
    onClearSelection();
    return;
  }

  const worldRect = normalizedRect(
    clampPos(screenToWorld({ x: screenRect.x, y: screenRect.y })),
    clampPos(
      screenToWorld({
        x: screenRect.x + screenRect.width,
        y: screenRect.y + screenRect.height,
      }),
    ),
  );
  onSelectWorldRect(worldRect);
}

export function updateMarqueeRect(args: {
  start: Pt | null;
  end: Pt | null;
  marqueeRect: Konva.Rect;
  uiLayer: Konva.Layer;
}): void {
  const { start, end, marqueeRect, uiLayer } = args;
  if (!start || !end) return;
  const rect = normalizedRect(start, end);
  marqueeRect.setAttrs({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    visible: true,
  });
  uiLayer.batchDraw();
}
