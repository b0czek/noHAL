import type Konva from "konva";
import type { Pt } from "../layout";
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

type SceneInteractionOps = {
  syncPlacementPreview: () => void;
  applyCamera: () => void;
  redrawWires: () => void;
  zoomByFactor: (zoomFactor: number, pointer?: Pt) => void;
  deleteSelectedWaypoint: () => boolean;
  startMarqueeSelection: (screenPos: Pt, additive: boolean) => void;
  cancelMarqueeSelection: () => void;
  finishMarqueeSelection: () => void;
  updateMarqueeRect: () => void;
};

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
  const toClampedWorld = (pos: Pt): Pt =>
    clampRuntimePos(runtime, screenToWorld(runtime.state.camera, pos));

  const onKeyDown = (evt: KeyboardEvent) => {
    if (evt.code === "Space") runtime.state.interaction.spacePressed = true;
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
        zoomByFactor(isZoomIn ? 1.08 : 1 / 1.08);
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
    if (evt.code === "Space") runtime.state.interaction.spacePressed = false;
  };

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp);

  placementHitRect.on(`mousedown${EVENT_NS} touchstart${EVENT_NS}`, (evt) => {
    if (!runtime.state.lastState?.placement) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    evt.cancelBubble = true;
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    runtime.callbacks.onBackgroundClick?.(
      toClampedWorld({ x: pos.x, y: pos.y }),
    );
  });

  placementHitRect.on(`contextmenu${EVENT_NS}`, (evt) => {
    evt.cancelBubble = true;
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
  });

  stage.on(`mousemove${EVENT_NS} touchmove${EVENT_NS}`, () => {
    const pos = stage.getPointerPosition();
    const screenPos = pos ? { x: pos.x, y: pos.y } : null;
    runtime.state.cursorPos = screenPos ? toClampedWorld(screenPos) : null;
    syncPlacementPreview();

    const { interaction } = runtime.state;
    if (interaction.isPanning && screenPos && interaction.panLastScreenPos) {
      const dx = screenPos.x - interaction.panLastScreenPos.x;
      const dy = screenPos.y - interaction.panLastScreenPos.y;
      panCamera(runtime.state.camera, dx, dy);
      interaction.panLastScreenPos = screenPos;
      applyCamera();
    }

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

  stage.on(`mouseleave${EVENT_NS}`, () => {
    runtime.state.interaction.isPanning = false;
    runtime.state.interaction.panLastScreenPos = null;
    runtime.state.interaction.backgroundTapStartScreenPos = null;
    runtime.state.interaction.backgroundTapAdditive = false;
    cancelMarqueeSelection();
    runtime.state.cursorPos = null;
    syncPlacementPreview();
    if (runtime.state.lastState?.pendingEndpoint) redrawWires();
  });

  stage.on(`mousedown${EVENT_NS} touchstart${EVENT_NS}`, (evt) => {
    const pos = stage.getPointerPosition();
    if (
      pos &&
      runtime.state.lastState?.pendingEndpoint &&
      evt.evt instanceof MouseEvent &&
      evt.evt.button === 0 &&
      !runtime.state.interaction.spacePressed &&
      isBackgroundTarget(stage, evt.target)
    ) {
      evt.cancelBubble = true;
      evt.evt.preventDefault();
      runtime.callbacks.onBackgroundClick?.(
        toClampedWorld({ x: pos.x, y: pos.y }),
      );
      runtime.state.interaction.backgroundTapStartScreenPos = null;
      return;
    }

    if (
      shouldStartMarquee(
        stage,
        evt,
        runtime.state.lastState,
        runtime.state.interaction.spacePressed,
      )
    ) {
      if (!pos) return;
      evt.cancelBubble = true;
      startMarqueeSelection(
        { x: pos.x, y: pos.y },
        evt.evt instanceof MouseEvent && evt.evt.shiftKey,
      );
      runtime.state.interaction.backgroundTapStartScreenPos = null;
      runtime.state.interaction.backgroundTapAdditive = false;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      return;
    }

    if (shouldStartPan(stage, evt, runtime.state.interaction.spacePressed)) {
      if (!pos) return;
      evt.cancelBubble = true;
      runtime.state.interaction.isPanning = true;
      runtime.state.interaction.panLastScreenPos = { x: pos.x, y: pos.y };
      runtime.state.interaction.backgroundTapStartScreenPos = null;
      container.style.cursor = "grabbing";
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      return;
    }

    if (
      shouldTrackBackgroundTap(
        stage,
        evt,
        runtime.state.lastState,
        runtime.state.interaction.spacePressed,
      )
    ) {
      if (!pos) return;
      runtime.state.interaction.backgroundTapStartScreenPos = {
        x: pos.x,
        y: pos.y,
      };
      runtime.state.interaction.backgroundTapAdditive = false;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      return;
    }

    // Track plain background clicks so mouseup can clear selection, but keep
    // Shift-background clicks non-destructive for additive selection flows.
    if (
      !runtime.state.lastState?.pendingEndpoint &&
      !runtime.state.lastState?.placement &&
      evt.evt instanceof MouseEvent &&
      evt.evt.button === 0 &&
      !runtime.state.interaction.spacePressed &&
      isBackgroundTarget(stage, evt.target)
    ) {
      if (!pos) return;
      runtime.state.interaction.backgroundTapStartScreenPos = {
        x: pos.x,
        y: pos.y,
      };
      runtime.state.interaction.backgroundTapAdditive = evt.evt.shiftKey;
      evt.cancelBubble = true;
      evt.evt.preventDefault();
      return;
    }

    runtime.state.interaction.backgroundTapStartScreenPos = null;
    runtime.state.interaction.backgroundTapAdditive = false;
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
    evt.evt.preventDefault();

    if (!(wheelEvt.ctrlKey || wheelEvt.metaKey)) {
      let deltaScale = 1;
      if (wheelEvt.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        deltaScale = 16;
      } else if (wheelEvt.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        deltaScale = stage.height();
      }
      panCamera(
        runtime.state.camera,
        -wheelEvt.deltaX * deltaScale,
        -wheelEvt.deltaY * deltaScale,
      );
      applyCamera();
      if (runtime.state.lastState?.pendingEndpoint) redrawWires();
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    zoomByFactor(wheelEvt.deltaY > 0 ? 1 / 1.08 : 1.08, pointer);
  });

  return () => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("keyup", onKeyUp);
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
  start: Pt,
  current: Pt,
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
