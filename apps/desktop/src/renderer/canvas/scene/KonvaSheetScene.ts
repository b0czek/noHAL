import { endpointKey } from "@nohal/core/src/graph";
import type {
  ProjectWireLayerPosition,
  SheetEndpointRef,
} from "@nohal/core/src/types";
import Konva from "konva";
import { SCENE_HEIGHT, SCENE_WIDTH } from "../constants";
import { buildSheetSceneLayout, type NodeLayout, type Pt } from "../layout";
import type { DragSelectionTarget } from "../renderables";
import {
  renderComments,
  renderLabels,
  renderNodes,
  renderPorts,
} from "../renderables";
import type { SceneCallbacks, SceneRenderState } from "../types";
import {
  deleteSelectedWaypoint as deleteWireSelectedWaypoint,
  getSplitLabelPositionsForConnection,
  type KonvaSheetSceneWiresContext,
  redraw as redrawSceneWires,
} from "../wires";
import {
  computeSceneBounds,
  focusCenterFromCullModel,
  rebuildCullModels,
  updateMainCullVisibility,
  updateWireCullVisibility,
} from "./culling";
import { normalizedRect, viewportWorldRect } from "./geometry";
import { buildPlacementPreview } from "./placementPreview";
import {
  buildGroupDragSession,
  buildSelectionSets,
  collectGroupDragUpdates,
  constrainGroupDragDelta,
  selectItemsInWorldRect,
} from "./selection";
import type {
  CullModel,
  FocusTarget,
  GroupDragSession,
  Rect,
  SceneBounds,
} from "./types";

const SCENE_POSITION_PADDING = 2400;
const CAMERA_OVERSCROLL_PX = 220;
const MARQUEE_SELECT_THRESHOLD_PX = 4;
const CULL_SCREEN_MARGIN_PX = 180;

export class KonvaSheetScene {
  private container: HTMLDivElement;
  private stage: Konva.Stage;
  private wireLayer: Konva.Layer;
  private mainLayer: Konva.Layer;
  private uiLayer: Konva.Layer;
  private placementHitRect: Konva.Rect;
  private previewWorld: Konva.Group;
  private wireWorld: Konva.Group;
  private mainWorld: Konva.Group;
  private marqueeRect: Konva.Rect;
  private callbacks: SceneCallbacks;
  private lastState: SceneRenderState | null = null;
  private nodeLayouts = new Map<string, NodeLayout>();
  private liveNodePositions = new Map<string, Pt>();
  private liveLabelPositions = new Map<string, Pt>();
  private liveCommentPositions = new Map<string, Pt>();
  private livePortPositions = new Map<string, Pt>();
  private nodeGroups = new Map<string, Konva.Group>();
  private labelGroups = new Map<string, Konva.Group>();
  private commentGroups = new Map<string, Konva.Group>();
  private portGroups = new Map<string, Konva.Group>();
  private labelCullModels = new Map<string, CullModel>();
  private commentCullModels = new Map<string, CullModel>();
  private portCullModels = new Map<string, CullModel>();
  private cursorPos: Pt | null = null;
  private camera = { x: 0, y: 0, scale: 1 };
  private selectedConnectionId: string | null = null;
  private selectedWaypointIndex: number | null = null;
  private wireRedrawFrameId: number | null = null;
  private isPanning = false;
  private panLastScreenPos: Pt | null = null;
  private isMarqueeSelecting = false;
  private marqueeStartScreenPos: Pt | null = null;
  private marqueeCurrentScreenPos: Pt | null = null;
  private groupDragSession: GroupDragSession | null = null;
  private spacePressed = false;
  private sceneBounds: SceneBounds = {
    minX: 0,
    minY: 0,
    maxX: SCENE_WIDTH,
    maxY: SCENE_HEIGHT,
  };
  private onKeyDown: (evt: KeyboardEvent) => void;
  private onKeyUp: (evt: KeyboardEvent) => void;

  constructor(container: HTMLDivElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.stage = new Konva.Stage({
      container,
      width: Math.max(320, container.clientWidth || 320),
      height: Math.max(240, container.clientHeight || 240),
    });
    this.wireLayer = new Konva.Layer();
    this.mainLayer = new Konva.Layer();
    this.uiLayer = new Konva.Layer();
    this.placementHitRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.stage.width(),
      height: this.stage.height(),
      visible: false,
      fill: "rgba(0,0,0,0.001)",
    });
    this.previewWorld = new Konva.Group({
      listening: false,
      visible: false,
    });
    this.wireWorld = new Konva.Group();
    this.mainWorld = new Konva.Group();
    this.marqueeRect = new Konva.Rect({
      visible: false,
      listening: false,
      fill: "rgba(120, 180, 255, 0.16)",
      stroke: "rgba(120, 180, 255, 0.92)",
      strokeWidth: 1,
      dash: [6, 4],
      cornerRadius: 2,
    });
    this.wireLayer.add(this.wireWorld);
    this.mainLayer.add(this.mainWorld);
    this.uiLayer.add(this.placementHitRect);
    this.uiLayer.add(this.previewWorld);
    this.uiLayer.add(this.marqueeRect);
    this.stage.add(this.wireLayer);
    this.stage.add(this.mainLayer);
    this.stage.add(this.uiLayer);
    this.centerCamera();
    this.applyCamera();

    this.onKeyDown = (evt) => {
      if (evt.code === "Space") this.spacePressed = true;
      const primaryModifier = evt.ctrlKey || evt.metaKey;
      if (
        primaryModifier &&
        !evt.altKey &&
        !this.isEditableTarget(evt.target) &&
        this.isContainerVisible()
      ) {
        const isZoomIn = this.isZoomInShortcut(evt);
        const isZoomOut = this.isZoomOutShortcut(evt);
        if (isZoomIn || isZoomOut) {
          this.zoomByFactor(isZoomIn ? 1.08 : 1 / 1.08);
          evt.preventDefault();
          evt.stopPropagation();
          evt.stopImmediatePropagation();
          return;
        }
      }
      if (
        (evt.key === "Delete" || evt.key === "Backspace") &&
        !this.isEditableTarget(evt.target)
      ) {
        if (!this.deleteSelectedWaypoint()) return;
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
      }
    };
    this.onKeyUp = (evt) => {
      if (evt.code === "Space") this.spacePressed = false;
    };
    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp);

    this.placementHitRect.on("mousedown touchstart", (evt) => {
      if (!this.lastState?.placement) return;
      const pos = this.stage.getPointerPosition();
      if (!pos) return;
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      this.callbacks.onBackgroundClick?.(
        this.clampPos(this.screenToWorld({ x: pos.x, y: pos.y })),
      );
    });
    this.placementHitRect.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    });

    this.stage.on("mousemove touchmove", () => {
      const pos = this.stage.getPointerPosition();
      const screenPos = pos ? { x: pos.x, y: pos.y } : null;
      this.cursorPos = screenPos
        ? this.clampPos(this.screenToWorld(screenPos))
        : null;
      this.syncPlacementPreview();

      if (this.isPanning && screenPos && this.panLastScreenPos) {
        const dx = screenPos.x - this.panLastScreenPos.x;
        const dy = screenPos.y - this.panLastScreenPos.y;
        this.panLastScreenPos = screenPos;
        this.camera.x += dx;
        this.camera.y += dy;
        this.applyCamera();
      }

      if (this.isMarqueeSelecting && screenPos) {
        this.marqueeCurrentScreenPos = screenPos;
        this.updateMarqueeRect();
      }

      if (this.lastState?.pendingEndpoint) this.redrawWires();
    });
    this.stage.on("mouseleave", () => {
      this.isPanning = false;
      this.panLastScreenPos = null;
      this.cancelMarqueeSelection();
      this.cursorPos = null;
      this.syncPlacementPreview();
      if (this.lastState?.pendingEndpoint) this.redrawWires();
    });
    this.stage.on("mousedown touchstart", (evt) => {
      const pos = this.stage.getPointerPosition();
      if (
        pos &&
        this.lastState?.pendingEndpoint &&
        evt.evt instanceof MouseEvent &&
        evt.evt.button === 0 &&
        !this.spacePressed &&
        this.isBackgroundTarget(evt.target)
      ) {
        evt.cancelBubble = true;
        evt.evt.preventDefault();
        this.callbacks.onBackgroundClick?.(
          this.clampPos(this.screenToWorld({ x: pos.x, y: pos.y })),
        );
        return;
      }

      if (this.shouldStartMarquee(evt)) {
        if (!pos) return;
        evt.cancelBubble = true;
        this.startMarqueeSelection({ x: pos.x, y: pos.y });
        if ("preventDefault" in evt.evt) evt.evt.preventDefault();
        return;
      }

      if (!this.shouldStartPan(evt)) return;
      if (!pos) return;
      evt.cancelBubble = true;
      this.isPanning = true;
      this.panLastScreenPos = { x: pos.x, y: pos.y };
      this.container.style.cursor = "grabbing";
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    });
    this.stage.on("mouseup touchend", () => {
      if (this.isMarqueeSelecting) {
        this.finishMarqueeSelection();
        return;
      }
      this.isPanning = false;
      this.panLastScreenPos = null;
      this.container.style.cursor = "";
    });
    this.stage.on("click tap", (evt) => {
      if (!this.isBackgroundTarget(evt.target)) return;
      if (this.lastState?.pendingEndpoint || this.lastState?.placement) {
        return;
      }
      this.callbacks.onSelect(null);
    });
    this.stage.on("wheel", (evt) => {
      const wheelEvt = evt.evt;
      evt.evt.preventDefault();

      if (!(wheelEvt.ctrlKey || wheelEvt.metaKey)) {
        const deltaScale =
          wheelEvt.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 16
            : wheelEvt.deltaMode === WheelEvent.DOM_DELTA_PAGE
              ? this.stage.height()
              : 1;
        this.camera.x -= wheelEvt.deltaX * deltaScale;
        this.camera.y -= wheelEvt.deltaY * deltaScale;
        this.applyCamera();
        if (this.lastState?.pendingEndpoint) this.redrawWires();
        return;
      }

      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;
      this.zoomByFactor(wheelEvt.deltaY > 0 ? 1 / 1.08 : 1.08, pointer);
    });
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("keyup", this.onKeyUp);
    if (this.wireRedrawFrameId !== null) {
      window.cancelAnimationFrame(this.wireRedrawFrameId);
      this.wireRedrawFrameId = null;
    }
    this.stage.destroy();
  }

  resize(width: number, height: number): void {
    const w = Math.max(320, Math.floor(width));
    const h = Math.max(240, Math.floor(height));
    if (this.stage.width() === w && this.stage.height() === h) return;
    this.stage.size({ width: w, height: h });
    this.placementHitRect.size({ width: w, height: h });
    this.applyCamera();
    if (this.lastState) {
      this.redrawWires(true);
      this.mainLayer.batchDraw();
      this.uiLayer.batchDraw();
    }
  }

  clientToWorld(clientX: number, clientY: number): Pt {
    const rect = this.container.getBoundingClientRect();
    const screen = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    return this.clampPos(this.screenToWorld(screen));
  }

  focusTarget(target: FocusTarget): boolean {
    let center: Pt | null = null;

    if (target.kind === "node") {
      const node = this.nodeGroups.get(target.id);
      const layout = this.nodeLayouts.get(target.id);
      if (!node || !layout) return false;
      const position = node.position();
      center = {
        x: position.x + layout.width / 2,
        y: position.y + layout.height / 2,
      };
    } else if (target.kind === "label") {
      center = focusCenterFromCullModel(
        target.id,
        this.labelGroups,
        this.labelCullModels,
      );
    } else if (target.kind === "sheet-port") {
      center = focusCenterFromCullModel(
        target.id,
        this.portGroups,
        this.portCullModels,
      );
    } else {
      center = focusCenterFromCullModel(
        target.id,
        this.commentGroups,
        this.commentCullModels,
      );
    }

    if (!center) return false;
    this.camera.x = this.stage.width() / 2 - center.x * this.camera.scale;
    this.camera.y = this.stage.height() / 2 - center.y * this.camera.scale;
    this.applyCamera();
    if (this.lastState?.pendingEndpoint) this.redrawWires();
    return true;
  }

  private clampPos(pos: { x: number; y: number }): { x: number; y: number } {
    const minX = -SCENE_POSITION_PADDING;
    const minY = -SCENE_POSITION_PADDING;
    const maxX = this.sceneBounds.maxX + SCENE_POSITION_PADDING;
    const maxY = this.sceneBounds.maxY + SCENE_POSITION_PADDING;
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  }

  private pendingKey(endpoint: SheetEndpointRef | null): string | null {
    return endpoint ? endpointKey(endpoint) : null;
  }

  private centerCamera(): void {
    const stageW = this.stage.width();
    const stageH = this.stage.height();
    const worldW = this.sceneBounds.maxX - this.sceneBounds.minX;
    const worldH = this.sceneBounds.maxY - this.sceneBounds.minY;
    this.camera.scale = 1;
    this.camera.x = Math.round(
      (stageW - worldW) / 2 - this.sceneBounds.minX * this.camera.scale,
    );
    this.camera.y = Math.round(
      (stageH - worldH) / 2 - this.sceneBounds.minY * this.camera.scale,
    );
  }

  private isContainerVisible(): boolean {
    if (!this.container.isConnected) return false;
    const rect = this.container.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  private isZoomInShortcut(evt: KeyboardEvent): boolean {
    return (
      evt.key === "=" ||
      evt.key === "+" ||
      evt.code === "Equal" ||
      evt.code === "NumpadAdd"
    );
  }

  private isZoomOutShortcut(evt: KeyboardEvent): boolean {
    return (
      evt.key === "-" ||
      evt.key === "_" ||
      evt.code === "Minus" ||
      evt.code === "NumpadSubtract"
    );
  }

  private zoomByFactor(zoomFactor: number, pointer?: Pt): void {
    const zoomAnchor = pointer ?? this.stage.getPointerPosition();
    const anchor = zoomAnchor ?? {
      x: this.stage.width() / 2,
      y: this.stage.height() / 2,
    };
    const oldScale = this.camera.scale;
    const nextScale = Math.max(0.35, Math.min(2.8, oldScale * zoomFactor));
    if (Math.abs(nextScale - oldScale) < 1e-6) return;
    const worldAtPointer = this.screenToWorld({ x: anchor.x, y: anchor.y });
    this.camera.scale = nextScale;
    this.camera.x = anchor.x - worldAtPointer.x * nextScale;
    this.camera.y = anchor.y - worldAtPointer.y * nextScale;
    this.applyCamera();
    if (this.lastState?.pendingEndpoint) this.redrawWires();
  }

  private clampCamera(): void {
    const stageW = this.stage.width();
    const stageH = this.stage.height();
    const minWorldX = -SCENE_POSITION_PADDING;
    const minWorldY = -SCENE_POSITION_PADDING;
    const maxWorldX = this.sceneBounds.maxX + SCENE_POSITION_PADDING;
    const maxWorldY = this.sceneBounds.maxY + SCENE_POSITION_PADDING;
    const scaledWorldW = (maxWorldX - minWorldX) * this.camera.scale;
    const scaledWorldH = (maxWorldY - minWorldY) * this.camera.scale;
    const overscrollX = CAMERA_OVERSCROLL_PX;
    const overscrollY = CAMERA_OVERSCROLL_PX;

    if (scaledWorldW <= stageW - overscrollX * 2) {
      this.camera.x = Math.round(
        (stageW - scaledWorldW) / 2 - minWorldX * this.camera.scale,
      );
    } else {
      const minX = stageW - overscrollX - maxWorldX * this.camera.scale;
      const maxX = overscrollX - minWorldX * this.camera.scale;
      this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
    }

    if (scaledWorldH <= stageH - overscrollY * 2) {
      this.camera.y = Math.round(
        (stageH - scaledWorldH) / 2 - minWorldY * this.camera.scale,
      );
    } else {
      const minY = stageH - overscrollY - maxWorldY * this.camera.scale;
      const maxY = overscrollY - minWorldY * this.camera.scale;
      this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
    }
  }

  private applyCamera(): void {
    this.clampCamera();
    const transform = {
      x: this.camera.x,
      y: this.camera.y,
      scaleX: this.camera.scale,
      scaleY: this.camera.scale,
    };
    this.wireWorld.setAttrs(transform);
    this.mainWorld.setAttrs(transform);
    this.previewWorld.setAttrs(transform);
    this.updateCullVisibility();
    this.wireLayer.batchDraw();
    this.mainLayer.batchDraw();
    this.syncPlacementPreview();
    this.callbacks.onCameraChange?.({ ...this.camera });
  }

  private syncPlacementPreview(): void {
    const placement = this.lastState?.placement ?? null;
    const hadHitRect = this.placementHitRect.visible();
    const hadPreview = this.previewWorld.visible();
    this.placementHitRect.visible(placement !== null);

    if (!placement || !this.cursorPos) {
      if (!hadHitRect && !hadPreview) return;
      this.previewWorld.visible(false);
      this.previewWorld.destroyChildren();
      this.uiLayer.batchDraw();
      return;
    }

    this.previewWorld.visible(true);
    this.previewWorld.destroyChildren();
    const preview = buildPlacementPreview({
      placement,
      state: this.lastState,
    });
    preview.position(this.cursorPos);
    this.previewWorld.add(preview);
    this.uiLayer.batchDraw();
  }

  private syncLayerOrder(position: ProjectWireLayerPosition): void {
    if (position === "above-components") {
      this.mainLayer.zIndex(0);
      this.wireLayer.zIndex(1);
      this.uiLayer.zIndex(2);
      return;
    }
    this.wireLayer.zIndex(0);
    this.mainLayer.zIndex(1);
    this.uiLayer.zIndex(2);
  }

  private viewportWorldRect(): Rect {
    return viewportWorldRect({
      width: this.stage.width(),
      height: this.stage.height(),
      margin: CULL_SCREEN_MARGIN_PX,
      screenToWorld: (pos) => this.screenToWorld(pos),
    });
  }

  private updateMainCullVisibility(): void {
    updateMainCullVisibility({
      view: this.viewportWorldRect(),
      nodeGroups: this.nodeGroups,
      nodeLayouts: this.nodeLayouts,
      labelGroups: this.labelGroups,
      labelCullModels: this.labelCullModels,
      commentGroups: this.commentGroups,
      commentCullModels: this.commentCullModels,
      portGroups: this.portGroups,
      portCullModels: this.portCullModels,
    });
  }

  private updateWireCullVisibility(): void {
    updateWireCullVisibility(this.wireWorld, this.viewportWorldRect());
  }

  private updateCullVisibility(): void {
    this.updateMainCullVisibility();
    this.updateWireCullVisibility();
  }

  private rebuildCullModels(state: SceneRenderState): void {
    const models = rebuildCullModels(state);
    this.labelCullModels = models.labelCullModels;
    this.commentCullModels = models.commentCullModels;
    this.portCullModels = models.portCullModels;
  }

  private screenToWorld(pos: Pt): Pt {
    return {
      x: (pos.x - this.camera.x) / this.camera.scale,
      y: (pos.y - this.camera.y) / this.camera.scale,
    };
  }

  private startMarqueeSelection(screenPos: Pt): void {
    this.isMarqueeSelecting = true;
    this.marqueeStartScreenPos = screenPos;
    this.marqueeCurrentScreenPos = screenPos;
    this.container.style.cursor = "crosshair";
    this.updateMarqueeRect();
  }

  private cancelMarqueeSelection(): void {
    if (!this.isMarqueeSelecting && !this.marqueeRect.visible()) return;
    this.isMarqueeSelecting = false;
    this.marqueeStartScreenPos = null;
    this.marqueeCurrentScreenPos = null;
    this.marqueeRect.hide();
    this.uiLayer.batchDraw();
    if (!this.isPanning) this.container.style.cursor = "";
  }

  private finishMarqueeSelection(): void {
    const start = this.marqueeStartScreenPos;
    const end = this.marqueeCurrentScreenPos ?? start;
    this.cancelMarqueeSelection();
    if (!start || !end) return;

    const screenRect = normalizedRect(start, end);
    if (
      screenRect.width < MARQUEE_SELECT_THRESHOLD_PX &&
      screenRect.height < MARQUEE_SELECT_THRESHOLD_PX
    ) {
      this.callbacks.onSelect(null);
      return;
    }

    const worldA = this.clampPos(
      this.screenToWorld({ x: screenRect.x, y: screenRect.y }),
    );
    const worldB = this.clampPos(
      this.screenToWorld({
        x: screenRect.x + screenRect.width,
        y: screenRect.y + screenRect.height,
      }),
    );
    const worldRect = normalizedRect(worldA, worldB);
    this.selectItemsInWorldRect(worldRect);
  }

  private updateMarqueeRect(): void {
    const start = this.marqueeStartScreenPos;
    const end = this.marqueeCurrentScreenPos;
    if (!start || !end) return;
    const rect = normalizedRect(start, end);
    this.marqueeRect.setAttrs({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      visible: true,
    });
    this.uiLayer.batchDraw();
  }

  private selectItemsInWorldRect(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void {
    const state = this.lastState;
    if (!state) return;
    this.callbacks.onSelect(
      selectItemsInWorldRect({
        rect,
        state,
        nodeLayouts: this.nodeLayouts,
        liveNodePositions: this.liveNodePositions,
        liveLabelPositions: this.liveLabelPositions,
        livePortPositions: this.livePortPositions,
      }),
    );
  }

  private shouldStartMarquee(
    evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ): boolean {
    return (
      !this.lastState?.pendingEndpoint &&
      evt.evt instanceof MouseEvent &&
      evt.evt.button === 0 &&
      !this.spacePressed &&
      this.isBackgroundTarget(evt.target)
    );
  }

  private setRenderedGroupPosition(target: DragSelectionTarget, pos: Pt): void {
    const group =
      target.kind === "node"
        ? this.nodeGroups.get(target.id)
        : target.kind === "label"
          ? this.labelGroups.get(target.id)
          : target.kind === "comment"
            ? this.commentGroups.get(target.id)
            : this.portGroups.get(target.id);
    if (group) group.position(pos);
  }

  private applyGroupDragLivePosition(
    target: DragSelectionTarget,
    pos: Pt,
  ): void {
    if (target.kind === "node") this.liveNodePositions.set(target.id, pos);
    else if (target.kind === "label")
      this.liveLabelPositions.set(target.id, pos);
    else if (target.kind === "comment")
      this.liveCommentPositions.set(target.id, pos);
    else this.livePortPositions.set(target.id, pos);
  }

  private applyGroupDragSessionPositions(session: GroupDragSession): void {
    const moveAll = (
      entries: IterableIterator<[string, Pt]>,
      kind: DragSelectionTarget["kind"],
    ) => {
      for (const [id, start] of entries) {
        const next = this.clampPos({
          x: start.x + session.appliedDx,
          y: start.y + session.appliedDy,
        });
        this.setRenderedGroupPosition({ kind, id }, next);
        this.applyGroupDragLivePosition({ kind, id }, next);
      }
    };

    moveAll(session.nodeStartPositions.entries(), "node");
    moveAll(session.labelStartPositions.entries(), "label");
    moveAll(session.portStartPositions.entries(), "sheet-port");
  }

  private onSelectionDragStart = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    const session = buildGroupDragSession({
      target,
      anchorPos: pos,
      state: this.lastState,
      liveNodePositions: this.liveNodePositions,
      liveLabelPositions: this.liveLabelPositions,
      livePortPositions: this.livePortPositions,
    });
    this.groupDragSession = session;
    return session !== null;
  };

  private onSelectionDragMove = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    const session = this.groupDragSession;
    if (!session) return false;
    if (
      session.anchor.kind !== target.kind ||
      session.anchor.id !== target.id
    ) {
      return false;
    }
    const desiredDx = pos.x - session.anchorStartPos.x;
    const desiredDy = pos.y - session.anchorStartPos.y;
    const constrained = constrainGroupDragDelta({
      session,
      dx: desiredDx,
      dy: desiredDy,
      clampPos: (nextPos) => this.clampPos(nextPos),
    });
    session.appliedDx = constrained.x;
    session.appliedDy = constrained.y;
    this.applyGroupDragSessionPositions(session);
    this.redrawWires();
    return true;
  };

  private onSelectionDragEnd = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    const session = this.groupDragSession;
    if (!session) return false;
    if (
      session.anchor.kind !== target.kind ||
      session.anchor.id !== target.id
    ) {
      return false;
    }

    this.onSelectionDragMove(target, pos);
    this.groupDragSession = null;
    const { nodePositions, labelPositions, portPositions } =
      collectGroupDragUpdates({
        session,
        clampPos: (nextPos) => this.clampPos(nextPos),
      });

    if (this.callbacks.onMoveSelectionGroup) {
      this.callbacks.onMoveSelectionGroup({
        nodePositions,
        labelPositions,
        portPositions,
      });
      return true;
    }

    for (const entry of nodePositions)
      this.callbacks.onMoveNode(entry.id, entry.x, entry.y);
    for (const entry of labelPositions)
      this.callbacks.onMoveLabel(entry.id, entry.x, entry.y);
    for (const entry of portPositions)
      this.callbacks.onMoveSheetPort(entry.id, entry.x, entry.y);
    return true;
  };

  private shouldStartPan(
    evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ): boolean {
    if (evt.evt instanceof MouseEvent) {
      if (evt.evt.button === 1) return true;
      if (this.spacePressed && evt.evt.button === 0) return true;
      return false;
    }

    return (
      this.spacePressed ||
      (this.isBackgroundTarget(evt.target) && this.isTwoFingerTouch(evt.evt))
    );
  }

  private isTwoFingerTouch(evt: TouchEvent): boolean {
    return evt.touches.length >= 2 || evt.targetTouches.length >= 2;
  }

  private isBackgroundTarget(target: Konva.Node): boolean {
    const className = target.getClassName();
    return target === this.stage || className === "Layer";
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
      target.isContentEditable ||
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT"
    );
  }

  private resetTransientPositions(): void {
    this.groupDragSession = null;
    this.liveNodePositions.clear();
    this.liveLabelPositions.clear();
    this.liveCommentPositions.clear();
    this.livePortPositions.clear();
    this.nodeGroups.clear();
    this.labelGroups.clear();
    this.commentGroups.clear();
    this.portGroups.clear();
    this.labelCullModels.clear();
    this.commentCullModels.clear();
    this.portCullModels.clear();
  }

  private wireContext(): KonvaSheetSceneWiresContext {
    return {
      stage: this.stage,
      wireLayer: this.wireLayer,
      wireWorld: this.wireWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      screenToWorld: (pos) => this.screenToWorld(pos),
      getCursorPosCache: () => this.cursorPos,
      getLastState: () => this.lastState,
      getNodeLayouts: () => this.nodeLayouts,
      getLiveNodePositions: () => this.liveNodePositions,
      getLiveLabelPositions: () => this.liveLabelPositions,
      getLivePortPositions: () => this.livePortPositions,
      getSelectedConnectionId: () => this.selectedConnectionId,
      setSelectedConnectionId: (id) => {
        this.selectedConnectionId = id;
      },
      getSelectedWaypointIndex: () => this.selectedWaypointIndex,
      setSelectedWaypointIndex: (index) => {
        this.selectedWaypointIndex = index;
      },
    };
  }

  private deleteSelectedWaypoint(): boolean {
    return deleteWireSelectedWaypoint(this.wireContext());
  }

  getSplitLabelPositionsForConnection(connectionId: string) {
    return getSplitLabelPositionsForConnection(
      this.wireContext(),
      connectionId,
    );
  }

  private redrawWires(immediate = false): void {
    const draw = () => {
      this.wireRedrawFrameId = null;
      redrawSceneWires(this.wireContext());
      this.updateWireCullVisibility();
    };

    if (immediate) {
      if (this.wireRedrawFrameId !== null) {
        window.cancelAnimationFrame(this.wireRedrawFrameId);
        this.wireRedrawFrameId = null;
      }
      draw();
      return;
    }

    if (this.wireRedrawFrameId !== null) return;
    this.wireRedrawFrameId = window.requestAnimationFrame(draw);
  }

  render(state: SceneRenderState): void {
    const { project, sheet, selection, pendingEndpoint } = state;
    const pendingKey = this.pendingKey(pendingEndpoint);
    const {
      selectedNodeIds,
      selectedLabelIds,
      selectedCommentIds,
      selectedPortIds,
      selectedConnectionId,
    } = buildSelectionSets(selection);
    if (this.selectedConnectionId !== selectedConnectionId) {
      this.selectedWaypointIndex = null;
    }
    this.selectedConnectionId = selectedConnectionId;

    this.lastState = state;
    this.resetTransientPositions();
    this.mainWorld.destroyChildren();
    this.syncLayerOrder(project.ui.wireLayerPosition);

    const { nodeLayouts } = buildSheetSceneLayout(project, sheet);
    this.nodeLayouts = nodeLayouts;
    this.rebuildCullModels(state);
    this.sceneBounds = computeSceneBounds({
      state,
      nodeLayouts: this.nodeLayouts,
    });
    this.applyCamera();
    this.redrawWires(true);

    renderPorts({
      sheet,
      pendingKey,
      selectedPortIds,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      onSelectionDragStart: this.onSelectionDragStart,
      onSelectionDragMove: this.onSelectionDragMove,
      onSelectionDragEnd: this.onSelectionDragEnd,
      livePortPositions: this.livePortPositions,
      portGroups: this.portGroups,
    });
    renderNodes({
      project,
      sheet,
      pendingKey,
      selectedNodeIds,
      nodeLayouts,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      onSelectionDragStart: this.onSelectionDragStart,
      onSelectionDragMove: this.onSelectionDragMove,
      onSelectionDragEnd: this.onSelectionDragEnd,
      liveNodePositions: this.liveNodePositions,
      nodeGroups: this.nodeGroups,
    });
    renderLabels({
      sheet,
      selectedLabelIds,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      onSelectionDragStart: this.onSelectionDragStart,
      onSelectionDragMove: this.onSelectionDragMove,
      onSelectionDragEnd: this.onSelectionDragEnd,
      liveLabelPositions: this.liveLabelPositions,
      labelGroups: this.labelGroups,
    });
    renderComments({
      sheet,
      selectedCommentIds,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      onSelectionDragStart: this.onSelectionDragStart,
      onSelectionDragMove: this.onSelectionDragMove,
      onSelectionDragEnd: this.onSelectionDragEnd,
      liveCommentPositions: this.liveCommentPositions,
      commentGroups: this.commentGroups,
    });

    this.updateMainCullVisibility();
    this.mainLayer.batchDraw();
  }
}
