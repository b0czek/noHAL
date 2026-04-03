import type { XY } from "@nohal/core/types";
import type Konva from "konva";
import { snapPointToGrid } from "../grid";
import type { SceneRenderState } from "../types";
import { clampRuntimePos } from "./bounds";
import {
  isZoomInShortcut,
  isZoomOutShortcut,
  panCamera,
  screenToWorld,
} from "./camera";
import type { SceneRuntime } from "./types";

const EVENT_NS = ".sceneInteraction";
const BACKGROUND_TAP_THRESHOLD_PX = 4;
const KEYBOARD_ZOOM_FACTOR = 1.08;
const WHEEL_LINE_DELTA_PX = 16;

interface SceneInteractionOps {
  syncPlacementPreview: () => void;
  applyCamera: () => void;
  redrawWires: () => void;
  zoomByFactor: (zoomFactor: number, pointer?: XY) => void;
  deleteSelectedWaypoint: () => boolean;
  startMarqueeSelection: (screenPos: XY, additive: boolean) => void;
  cancelMarqueeSelection: () => void;
  finishMarqueeSelection: () => void;
  updateMarqueeRect: () => void;
}

function resetBackgroundTapState(runtime: SceneRuntime): void {
  runtime.state.interaction.backgroundTapStartScreenPos = null;
  runtime.state.interaction.backgroundTapAdditive = false;
}

function preventCancelableEvent(
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
): void {
  if ("preventDefault" in evt.evt) evt.evt.preventDefault();
}

function syncGridSnapOverrideFromKeyboardEvent(
  runtime: SceneRuntime,
  evt: KeyboardEvent,
): void {
  runtime.state.interaction.gridSnapOverridePressed =
    evt.ctrlKey || evt.metaKey;
}

function syncGridSnapOverrideFromPointerEvent(
  runtime: SceneRuntime,
  evt: MouseEvent | TouchEvent | WheelEvent,
): void {
  if (evt instanceof TouchEvent) return;
  runtime.state.interaction.gridSnapOverridePressed =
    evt.ctrlKey || evt.metaKey;
}

function maybeSnapWorldPos(runtime: SceneRuntime, pos: XY): XY {
  const clamped = clampRuntimePos(runtime, pos);
  const state = runtime.state.lastState;
  if (
    !state ||
    !state.gridResolution ||
    runtime.state.interaction.gridSnapOverridePressed
  ) {
    return clamped;
  }
  return clampRuntimePos(
    runtime,
    snapPointToGrid(clamped, state.gridResolution),
  );
}

function syncCursorPos(runtime: SceneRuntime, pos: XY | null): void {
  runtime.state.cursorPos = pos;
  runtime.callbacks.onCursorPosChange?.(
    pos ? { x: Math.round(pos.x), y: Math.round(pos.y) } : null,
  );
}

function syncCursorPosFromScreenPos(
  runtime: SceneRuntime,
  screenPos: XY | null,
  toWorld: (pos: XY) => XY,
): void {
  syncCursorPos(runtime, screenPos ? toWorld(screenPos) : null);
}

function handlePendingEndpointBackgroundClick(args: {
  runtime: SceneRuntime;
  stage: Konva.Stage;
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>;
  toWorld: (pos: XY) => XY;
}): boolean {
  const { runtime, stage, evt, toWorld } = args;
  const pos = stage.getPointerPosition();
  if (
    !pos ||
    !runtime.state.lastState?.pendingEndpoint ||
    !(evt.evt instanceof MouseEvent) ||
    evt.evt.button !== 0 ||
    runtime.state.interaction.spacePressed ||
    !isBackgroundTarget(stage, evt.target)
  ) {
    return false;
  }

  evt.cancelBubble = true;
  evt.evt.preventDefault();
  runtime.callbacks.onBackgroundClick?.(toWorld({ x: pos.x, y: pos.y }));
  resetBackgroundTapState(runtime);
  return true;
}

function handleMarqueeStart(args: {
  runtime: SceneRuntime;
  stage: Konva.Stage;
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>;
  startMarqueeSelection: SceneInteractionOps["startMarqueeSelection"];
}): boolean {
  const { runtime, stage, evt, startMarqueeSelection } = args;
  if (
    !shouldStartMarquee(
      stage,
      evt,
      runtime.state.lastState,
      runtime.state.interaction.spacePressed,
    )
  ) {
    return false;
  }

  const pos = stage.getPointerPosition();
  if (!pos) return true;
  evt.cancelBubble = true;
  startMarqueeSelection(
    { x: pos.x, y: pos.y },
    evt.evt instanceof MouseEvent && evt.evt.shiftKey,
  );
  resetBackgroundTapState(runtime);
  preventCancelableEvent(evt);
  return true;
}

function handlePanStart(args: {
  runtime: SceneRuntime;
  stage: Konva.Stage;
  container: HTMLDivElement;
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>;
}): boolean {
  const { runtime, stage, container, evt } = args;
  if (!shouldStartPan(stage, evt, runtime.state.interaction.spacePressed)) {
    return false;
  }

  const pos = stage.getPointerPosition();
  if (!pos) return true;
  evt.cancelBubble = true;
  runtime.state.interaction.isPanning = true;
  runtime.state.interaction.panLastScreenPos = { x: pos.x, y: pos.y };
  runtime.state.interaction.backgroundTapStartScreenPos = null;
  container.style.cursor = "grabbing";
  preventCancelableEvent(evt);
  return true;
}

function handleTouchBackgroundTapTracking(args: {
  runtime: SceneRuntime;
  stage: Konva.Stage;
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>;
}): boolean {
  const { runtime, stage, evt } = args;
  if (
    !shouldTrackBackgroundTap(
      stage,
      evt,
      runtime.state.lastState,
      runtime.state.interaction.spacePressed,
    )
  ) {
    return false;
  }

  const pos = stage.getPointerPosition();
  if (!pos) return true;
  runtime.state.interaction.backgroundTapStartScreenPos = {
    x: pos.x,
    y: pos.y,
  };
  runtime.state.interaction.backgroundTapAdditive = false;
  preventCancelableEvent(evt);
  return true;
}

function handlePlainBackgroundTapTracking(args: {
  runtime: SceneRuntime;
  stage: Konva.Stage;
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>;
}): boolean {
  const { runtime, stage, evt } = args;
  if (
    runtime.state.lastState?.pendingEndpoint ||
    runtime.state.lastState?.placement ||
    !(evt.evt instanceof MouseEvent) ||
    evt.evt.button !== 0 ||
    runtime.state.interaction.spacePressed ||
    !isBackgroundTarget(stage, evt.target)
  ) {
    return false;
  }

  const pos = stage.getPointerPosition();
  if (!pos) return true;
  runtime.state.interaction.backgroundTapStartScreenPos = {
    x: pos.x,
    y: pos.y,
  };
  runtime.state.interaction.backgroundTapAdditive = evt.evt.shiftKey;
  evt.cancelBubble = true;
  evt.evt.preventDefault();
  return true;
}

export function bindSceneInteractions(
  runtime: SceneRuntime,
  ops: SceneInteractionOps,
): () => void {
  const {
    syncPlacementPreview,
    applyCamera,
    redrawWires,
    zoomByFactor,
    deleteSelectedWaypoint,
    startMarqueeSelection,
    cancelMarqueeSelection,
    finishMarqueeSelection,
    updateMarqueeRect,
  } = ops;
  const { stage, container, placementHitRect } = runtime.view;
  const toWorld = (pos: XY): XY =>
    maybeSnapWorldPos(runtime, screenToWorld(runtime.state.camera, pos));

  const onKeyDown = (evt: KeyboardEvent) => {
    syncGridSnapOverrideFromKeyboardEvent(runtime, evt);
    if (evt.code === "Space") runtime.state.interaction.spacePressed = true;
    syncCursorPosFromScreenPos(runtime, stage.getPointerPosition(), toWorld);
    syncPlacementPreview();
    const primaryModifier = evt.ctrlKey || evt.metaKey;
    if (
      primaryModifier &&
      !evt.altKey &&
      !isEditableTarget(evt.target) &&
      isContainerVisible(container)
    ) {
      const isZoomIn = isZoomInShortcut(evt);
      const isZoomOut = isZoomOutShortcut(evt);
      if (isZoomIn || isZoomOut) {
        zoomByFactor(
          isZoomIn ? KEYBOARD_ZOOM_FACTOR : 1 / KEYBOARD_ZOOM_FACTOR,
        );
        syncCursorPosFromScreenPos(
          runtime,
          stage.getPointerPosition(),
          toWorld,
        );
        syncPlacementPreview();
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        return;
      }
    }
    if (
      (evt.key === "Delete" || evt.key === "Backspace") &&
      !isEditableTarget(evt.target)
    ) {
      if (!deleteSelectedWaypoint()) return;
      evt.preventDefault();
      evt.stopPropagation();
      evt.stopImmediatePropagation();
    }
  };

  const onKeyUp = (evt: KeyboardEvent) => {
    syncGridSnapOverrideFromKeyboardEvent(runtime, evt);
    if (evt.code === "Space") runtime.state.interaction.spacePressed = false;
    syncCursorPosFromScreenPos(runtime, stage.getPointerPosition(), toWorld);
    syncPlacementPreview();
  };

  const onWindowBlur = () => {
    runtime.state.interaction.gridSnapOverridePressed = false;
    runtime.state.interaction.spacePressed = false;
    syncCursorPosFromScreenPos(runtime, stage.getPointerPosition(), toWorld);
    syncPlacementPreview();
  };

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);

  placementHitRect.on(`mousedown${EVENT_NS} touchstart${EVENT_NS}`, (evt) => {
    if (!runtime.state.lastState?.placement) return;
    syncGridSnapOverrideFromPointerEvent(runtime, evt.evt);
    const pos = stage.getPointerPosition();
    if (!pos) return;
    evt.cancelBubble = true;
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    runtime.callbacks.onBackgroundClick?.(toWorld({ x: pos.x, y: pos.y }));
  });

  placementHitRect.on(`contextmenu${EVENT_NS}`, (evt) => {
    evt.cancelBubble = true;
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
  });

  stage.on(`mousemove${EVENT_NS} touchmove${EVENT_NS}`, (evt) => {
    syncGridSnapOverrideFromPointerEvent(runtime, evt.evt);
    const pos = stage.getPointerPosition();
    const screenPos = pos ? { x: pos.x, y: pos.y } : null;

    const { interaction } = runtime.state;
    if (interaction.isPanning && screenPos && interaction.panLastScreenPos) {
      const dx = screenPos.x - interaction.panLastScreenPos.x;
      const dy = screenPos.y - interaction.panLastScreenPos.y;
      panCamera(runtime.state.camera, dx, dy);
      interaction.panLastScreenPos = screenPos;
      applyCamera();
    }

    syncCursorPosFromScreenPos(runtime, screenPos, toWorld);
    syncPlacementPreview();

    if (interaction.isMarqueeSelecting && screenPos) {
      interaction.marqueeCurrentScreenPos = screenPos;
      updateMarqueeRect();
    }

    if (
      interaction.backgroundTapStartScreenPos &&
      screenPos &&
      movementExceededThreshold(
        interaction.backgroundTapStartScreenPos,
        screenPos,
        BACKGROUND_TAP_THRESHOLD_PX,
      )
    ) {
      interaction.backgroundTapStartScreenPos = null;
    }

    if (runtime.state.lastState?.pendingEndpoint) redrawWires();
  });

  stage.on(
    `dragstart${EVENT_NS} dragmove${EVENT_NS} dragend${EVENT_NS}`,
    () => {
      syncCursorPosFromScreenPos(runtime, stage.getPointerPosition(), toWorld);
      syncPlacementPreview();
    },
  );

  stage.on(`mouseleave${EVENT_NS}`, () => {
    runtime.state.interaction.isPanning = false;
    runtime.state.interaction.panLastScreenPos = null;
    runtime.state.interaction.backgroundTapStartScreenPos = null;
    runtime.state.interaction.backgroundTapAdditive = false;
    cancelMarqueeSelection();
    syncCursorPos(runtime, null);
    syncPlacementPreview();
    if (runtime.state.lastState?.pendingEndpoint) redrawWires();
  });

  stage.on(`mousedown${EVENT_NS} touchstart${EVENT_NS}`, (evt) => {
    syncGridSnapOverrideFromPointerEvent(runtime, evt.evt);
    if (
      handlePendingEndpointBackgroundClick({
        runtime,
        stage,
        evt,
        toWorld,
      })
    ) {
      return;
    }
    if (handleMarqueeStart({ runtime, stage, evt, startMarqueeSelection })) {
      return;
    }
    if (handlePanStart({ runtime, stage, container, evt })) return;
    if (handleTouchBackgroundTapTracking({ runtime, stage, evt })) return;
    if (handlePlainBackgroundTapTracking({ runtime, stage, evt })) return;
    resetBackgroundTapState(runtime);
  });

  stage.on(`mouseup${EVENT_NS} touchend${EVENT_NS}`, () => {
    if (runtime.state.interaction.isMarqueeSelecting) {
      finishMarqueeSelection();
      return;
    }

    const shouldClearSelection =
      runtime.state.interaction.backgroundTapStartScreenPos !== null &&
      !runtime.state.interaction.backgroundTapAdditive &&
      !runtime.state.lastState?.pendingEndpoint &&
      !runtime.state.lastState?.placement;

    runtime.state.interaction.isPanning = false;
    runtime.state.interaction.panLastScreenPos = null;
    runtime.state.interaction.backgroundTapStartScreenPos = null;
    runtime.state.interaction.backgroundTapAdditive = false;
    container.style.cursor = "";

    if (shouldClearSelection) runtime.callbacks.onSelect(null);
  });

  stage.on(`wheel${EVENT_NS}`, (evt) => {
    const wheelEvt = evt.evt;
    syncGridSnapOverrideFromPointerEvent(runtime, wheelEvt);
    evt.evt.preventDefault();

    if (!(wheelEvt.ctrlKey || wheelEvt.metaKey)) {
      let deltaScale = 1;
      if (wheelEvt.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        deltaScale = WHEEL_LINE_DELTA_PX;
      } else if (wheelEvt.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        deltaScale = stage.height();
      }
      panCamera(
        runtime.state.camera,
        -wheelEvt.deltaX * deltaScale,
        -wheelEvt.deltaY * deltaScale,
      );
      applyCamera();
      syncCursorPosFromScreenPos(runtime, stage.getPointerPosition(), toWorld);
      if (runtime.state.lastState?.pendingEndpoint) redrawWires();
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    zoomByFactor(
      wheelEvt.deltaY > 0 ? 1 / KEYBOARD_ZOOM_FACTOR : KEYBOARD_ZOOM_FACTOR,
      pointer,
    );
    syncCursorPosFromScreenPos(runtime, pointer, toWorld);
  });

  return () => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onWindowBlur);
    stage.off(EVENT_NS);
    placementHitRect.off(EVENT_NS);
  };
}

function shouldStartMarquee(
  stage: Konva.Stage,
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  state: SceneRenderState | null,
  spacePressed: boolean,
): boolean {
  return (
    !state?.pendingEndpoint &&
    evt.evt instanceof MouseEvent &&
    evt.evt.button === 0 &&
    !spacePressed &&
    isBackgroundTarget(stage, evt.target)
  );
}

function shouldStartPan(
  stage: Konva.Stage,
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  spacePressed: boolean,
): boolean {
  if (evt.evt instanceof MouseEvent) {
    if (evt.evt.button === 1) return true;
    if (spacePressed && evt.evt.button === 0) return true;
    return false;
  }

  return (
    spacePressed ||
    (isBackgroundTarget(stage, evt.target) && isTwoFingerTouch(evt.evt))
  );
}

function shouldTrackBackgroundTap(
  stage: Konva.Stage,
  evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  state: SceneRenderState | null,
  spacePressed: boolean,
): boolean {
  return (
    !state?.pendingEndpoint &&
    !state?.placement &&
    evt.evt instanceof TouchEvent &&
    !spacePressed &&
    isBackgroundTarget(stage, evt.target) &&
    !isTwoFingerTouch(evt.evt)
  );
}

function movementExceededThreshold(
  start: XY,
  current: XY,
  thresholdPx: number,
) {
  return (
    Math.abs(current.x - start.x) >= thresholdPx ||
    Math.abs(current.y - start.y) >= thresholdPx
  );
}

function isTwoFingerTouch(evt: TouchEvent): boolean {
  return evt.touches.length >= 2 || evt.targetTouches.length >= 2;
}

function isBackgroundTarget(stage: Konva.Stage, target: Konva.Node): boolean {
  const className = target.getClassName();
  return target === stage || className === "Layer";
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

function isContainerVisible(container: HTMLDivElement): boolean {
  if (!container.isConnected) return false;
  const rect = container.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
