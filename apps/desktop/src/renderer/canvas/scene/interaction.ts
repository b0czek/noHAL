import type Konva from "konva";
import type { Pt } from "../layout";
import type { SceneCallbacks, SceneRenderState } from "../types";
import { isZoomInShortcut, isZoomOutShortcut, panCamera } from "./camera";
import type { CameraState } from "./types";

const EVENT_NS = ".sceneInteraction";

type SceneInteractionArgs = {
  stage: Konva.Stage;
  container: HTMLDivElement;
  placementHitRect: Konva.Rect;
  callbacks: SceneCallbacks;
  getLastState: () => SceneRenderState | null;
  getCamera: () => CameraState;
  clampPos: (pos: Pt) => Pt;
  screenToWorld: (pos: Pt) => Pt;
  syncPlacementPreview: () => void;
  applyCamera: () => void;
  redrawWires: () => void;
  zoomByFactor: (zoomFactor: number, pointer?: Pt) => void;
  deleteSelectedWaypoint: () => boolean;
  getSpacePressed: () => boolean;
  setSpacePressed: (value: boolean) => void;
  getIsPanning: () => boolean;
  setIsPanning: (value: boolean) => void;
  getPanLastScreenPos: () => Pt | null;
  setPanLastScreenPos: (value: Pt | null) => void;
  getIsMarqueeSelecting: () => boolean;
  setMarqueeCurrentScreenPos: (value: Pt | null) => void;
  startMarqueeSelection: (screenPos: Pt) => void;
  cancelMarqueeSelection: () => void;
  finishMarqueeSelection: () => void;
  updateMarqueeRect: () => void;
  setCursorPos: (pos: Pt | null) => void;
};

export function bindSceneInteractions(args: SceneInteractionArgs): () => void {
  const {
    stage,
    container,
    placementHitRect,
    callbacks,
    getLastState,
    getCamera,
    clampPos,
    screenToWorld,
    syncPlacementPreview,
    applyCamera,
    redrawWires,
    zoomByFactor,
    deleteSelectedWaypoint,
    getSpacePressed,
    setSpacePressed,
    getIsPanning,
    setIsPanning,
    getPanLastScreenPos,
    setPanLastScreenPos,
    getIsMarqueeSelecting,
    setMarqueeCurrentScreenPos,
    startMarqueeSelection,
    cancelMarqueeSelection,
    finishMarqueeSelection,
    updateMarqueeRect,
    setCursorPos,
  } = args;

  const onKeyDown = (evt: KeyboardEvent) => {
    if (evt.code === "Space") setSpacePressed(true);
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
    if (evt.code === "Space") setSpacePressed(false);
  };

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("keyup", onKeyUp);

  placementHitRect.on(`mousedown${EVENT_NS} touchstart${EVENT_NS}`, (evt) => {
    if (!getLastState()?.placement) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    evt.cancelBubble = true;
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    callbacks.onBackgroundClick?.(
      clampPos(screenToWorld({ x: pos.x, y: pos.y })),
    );
  });

  placementHitRect.on(`contextmenu${EVENT_NS}`, (evt) => {
    evt.cancelBubble = true;
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
  });

  stage.on(`mousemove${EVENT_NS} touchmove${EVENT_NS}`, () => {
    const pos = stage.getPointerPosition();
    const screenPos = pos ? { x: pos.x, y: pos.y } : null;
    setCursorPos(screenPos ? clampPos(screenToWorld(screenPos)) : null);
    syncPlacementPreview();

    const panLastScreenPos = getPanLastScreenPos();
    if (getIsPanning() && screenPos && panLastScreenPos) {
      const camera = getCamera();
      panCamera(
        camera,
        screenPos.x - panLastScreenPos.x,
        screenPos.y - panLastScreenPos.y,
      );
      setPanLastScreenPos(screenPos);
      applyCamera();
    }

    if (getIsMarqueeSelecting() && screenPos) {
      setMarqueeCurrentScreenPos(screenPos);
      updateMarqueeRect();
    }

    if (getLastState()?.pendingEndpoint) redrawWires();
  });

  stage.on(`mouseleave${EVENT_NS}`, () => {
    setIsPanning(false);
    setPanLastScreenPos(null);
    cancelMarqueeSelection();
    setCursorPos(null);
    syncPlacementPreview();
    if (getLastState()?.pendingEndpoint) redrawWires();
  });

  stage.on(`mousedown${EVENT_NS} touchstart${EVENT_NS}`, (evt) => {
    const pos = stage.getPointerPosition();
    if (
      pos &&
      getLastState()?.pendingEndpoint &&
      evt.evt instanceof MouseEvent &&
      evt.evt.button === 0 &&
      !getSpacePressed() &&
      isBackgroundTarget(stage, evt.target)
    ) {
      evt.cancelBubble = true;
      evt.evt.preventDefault();
      callbacks.onBackgroundClick?.(
        clampPos(screenToWorld({ x: pos.x, y: pos.y })),
      );
      return;
    }

    if (shouldStartMarquee(stage, evt, getLastState(), getSpacePressed())) {
      if (!pos) return;
      evt.cancelBubble = true;
      startMarqueeSelection({ x: pos.x, y: pos.y });
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      return;
    }

    if (!shouldStartPan(stage, evt, getSpacePressed())) return;
    if (!pos) return;
    evt.cancelBubble = true;
    setIsPanning(true);
    setPanLastScreenPos({ x: pos.x, y: pos.y });
    container.style.cursor = "grabbing";
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
  });

  stage.on(`mouseup${EVENT_NS} touchend${EVENT_NS}`, () => {
    if (getIsMarqueeSelecting()) {
      finishMarqueeSelection();
      return;
    }
    setIsPanning(false);
    setPanLastScreenPos(null);
    container.style.cursor = "";
  });

  stage.on(`click${EVENT_NS} tap${EVENT_NS}`, (evt) => {
    if (!isBackgroundTarget(stage, evt.target)) return;
    if (getLastState()?.pendingEndpoint || getLastState()?.placement) return;
    callbacks.onSelect(null);
  });

  stage.on(`wheel${EVENT_NS}`, (evt) => {
    const wheelEvt = evt.evt;
    evt.evt.preventDefault();

    if (!(wheelEvt.ctrlKey || wheelEvt.metaKey)) {
      const deltaScale =
        wheelEvt.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : wheelEvt.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? stage.height()
            : 1;
      panCamera(
        getCamera(),
        -wheelEvt.deltaX * deltaScale,
        -wheelEvt.deltaY * deltaScale,
      );
      applyCamera();
      if (getLastState()?.pendingEndpoint) redrawWires();
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
