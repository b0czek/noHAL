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
  applyCamera,
  centerCamera,
  centerCameraOnWorldPoint,
  clientToWorld,
  screenToWorld,
  zoomCameraByFactor,
} from "./camera";
import {
  computeSceneBounds,
  focusCenterFromCullModel,
  rebuildCullModels,
  updateMainCullVisibility,
  updateWireCullVisibility,
} from "./culling";
import {
  endDragSelection,
  moveDragSelection,
  startDragSelection,
} from "./dragSelection";
import { viewportWorldRect } from "./geometry";
import { bindSceneInteractions } from "./interaction";
import {
  cancelMarqueeSelection,
  finishMarqueeSelection,
  startMarqueeSelection,
  updateMarqueeRect,
} from "./marquee";
import { buildPlacementPreview } from "./placementPreview";
import { buildSelectionSets, selectItemsInWorldRect } from "./selection";
import type {
  CameraState,
  CullModel,
  FocusTarget,
  GroupDragSession,
  Rect,
  SceneBounds,
} from "./types";

const SCENE_POSITION_PADDING = 2400;
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
  private camera: CameraState = { x: 0, y: 0, scale: 1 };
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
  private interactionCleanup: (() => void) | null = null;

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
    this.camera = centerCamera({
      stageWidth: this.stage.width(),
      stageHeight: this.stage.height(),
      sceneBounds: this.sceneBounds,
    });
    this.applyCamera();
    this.interactionCleanup = bindSceneInteractions({
      stage: this.stage,
      container: this.container,
      placementHitRect: this.placementHitRect,
      callbacks: this.callbacks,
      getLastState: () => this.lastState,
      getCamera: () => this.camera,
      clampPos: (pos) => this.clampPos(pos),
      screenToWorld: (pos) => screenToWorld(this.camera, pos),
      syncPlacementPreview: () => this.syncPlacementPreview(),
      applyCamera: () => this.applyCamera(),
      redrawWires: () => this.redrawWires(),
      zoomByFactor: (zoomFactor, pointer) =>
        this.zoomByFactor(zoomFactor, pointer),
      deleteSelectedWaypoint: () => this.deleteSelectedWaypoint(),
      getSpacePressed: () => this.spacePressed,
      setSpacePressed: (value) => {
        this.spacePressed = value;
      },
      getIsPanning: () => this.isPanning,
      setIsPanning: (value) => {
        this.isPanning = value;
      },
      getPanLastScreenPos: () => this.panLastScreenPos,
      setPanLastScreenPos: (value) => {
        this.panLastScreenPos = value;
      },
      getIsMarqueeSelecting: () => this.isMarqueeSelecting,
      setMarqueeCurrentScreenPos: (value) => {
        this.marqueeCurrentScreenPos = value;
      },
      startMarqueeSelection: (screenPos) =>
        this.startMarqueeSelection(screenPos),
      cancelMarqueeSelection: () => this.cancelMarqueeSelection(),
      finishMarqueeSelection: () => this.finishMarqueeSelection(),
      updateMarqueeRect: () => this.updateMarqueeRect(),
      setCursorPos: (pos) => {
        this.cursorPos = pos;
      },
    });
  }

  destroy(): void {
    this.interactionCleanup?.();
    this.interactionCleanup = null;
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
    return clientToWorld({
      clientX,
      clientY,
      container: this.container,
      camera: this.camera,
      clampPos: (pos) => this.clampPos(pos),
    });
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
    centerCameraOnWorldPoint({
      camera: this.camera,
      center,
      stageWidth: this.stage.width(),
      stageHeight: this.stage.height(),
    });
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

  private zoomByFactor(zoomFactor: number, pointer?: Pt): void {
    const changed = zoomCameraByFactor({
      camera: this.camera,
      zoomFactor,
      pointer: pointer ?? this.stage.getPointerPosition(),
      stageWidth: this.stage.width(),
      stageHeight: this.stage.height(),
    });
    if (!changed) return;
    this.applyCamera();
    if (this.lastState?.pendingEndpoint) this.redrawWires();
  }

  private applyCamera(): void {
    applyCamera({
      camera: this.camera,
      sceneBounds: this.sceneBounds,
      stage: this.stage,
      wireWorld: this.wireWorld,
      mainWorld: this.mainWorld,
      previewWorld: this.previewWorld,
      wireLayer: this.wireLayer,
      mainLayer: this.mainLayer,
      updateCullVisibility: () => this.updateCullVisibility(),
      syncPlacementPreview: () => this.syncPlacementPreview(),
      onCameraChange: this.callbacks.onCameraChange,
    });
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
      screenToWorld: (pos) => screenToWorld(this.camera, pos),
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

  private startMarqueeSelection(screenPos: Pt): void {
    startMarqueeSelection({
      screenPos,
      container: this.container,
      setIsMarqueeSelecting: (value) => {
        this.isMarqueeSelecting = value;
      },
      setMarqueeStartScreenPos: (value) => {
        this.marqueeStartScreenPos = value;
      },
      setMarqueeCurrentScreenPos: (value) => {
        this.marqueeCurrentScreenPos = value;
      },
      updateMarqueeRect: () => this.updateMarqueeRect(),
    });
  }

  private cancelMarqueeSelection(): void {
    cancelMarqueeSelection({
      isMarqueeSelecting: this.isMarqueeSelecting,
      marqueeRect: this.marqueeRect,
      uiLayer: this.uiLayer,
      isPanning: this.isPanning,
      container: this.container,
      setIsMarqueeSelecting: (value) => {
        this.isMarqueeSelecting = value;
      },
      setMarqueeStartScreenPos: (value) => {
        this.marqueeStartScreenPos = value;
      },
      setMarqueeCurrentScreenPos: (value) => {
        this.marqueeCurrentScreenPos = value;
      },
    });
  }

  private finishMarqueeSelection(): void {
    finishMarqueeSelection({
      start: this.marqueeStartScreenPos,
      end: this.marqueeCurrentScreenPos,
      thresholdPx: MARQUEE_SELECT_THRESHOLD_PX,
      clampPos: (pos) => this.clampPos(pos),
      screenToWorld: (pos) => screenToWorld(this.camera, pos),
      cancelMarqueeSelection: () => this.cancelMarqueeSelection(),
      onClearSelection: () => {
        this.callbacks.onSelect(null);
      },
      onSelectWorldRect: (rect) => this.selectItemsInWorldRect(rect),
    });
  }

  private updateMarqueeRect(): void {
    updateMarqueeRect({
      start: this.marqueeStartScreenPos,
      end: this.marqueeCurrentScreenPos,
      marqueeRect: this.marqueeRect,
      uiLayer: this.uiLayer,
    });
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

  private onSelectionDragStart = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    const session = startDragSelection({
      target,
      state: this.lastState,
      liveNodePositions: this.liveNodePositions,
      liveLabelPositions: this.liveLabelPositions,
      livePortPositions: this.livePortPositions,
      pos,
    });
    this.groupDragSession = session;
    return session !== null;
  };

  private onSelectionDragMove = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    return moveDragSelection({
      clampPos: (nextPos) => this.clampPos(nextPos),
      redrawWires: () => this.redrawWires(),
      session: this.groupDragSession,
      target,
      pos,
      nodeGroups: this.nodeGroups,
      labelGroups: this.labelGroups,
      commentGroups: this.commentGroups,
      portGroups: this.portGroups,
      liveNodePositions: this.liveNodePositions,
      liveLabelPositions: this.liveLabelPositions,
      liveCommentPositions: this.liveCommentPositions,
      livePortPositions: this.livePortPositions,
    });
  };

  private onSelectionDragEnd = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    const handled = endDragSelection({
      callbacks: this.callbacks,
      clampPos: (nextPos) => this.clampPos(nextPos),
      redrawWires: () => this.redrawWires(),
      session: this.groupDragSession,
      target,
      pos,
      nodeGroups: this.nodeGroups,
      labelGroups: this.labelGroups,
      commentGroups: this.commentGroups,
      portGroups: this.portGroups,
      liveNodePositions: this.liveNodePositions,
      liveLabelPositions: this.liveLabelPositions,
      liveCommentPositions: this.liveCommentPositions,
      livePortPositions: this.livePortPositions,
    });
    this.groupDragSession = null;
    return handled;
  };

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
      screenToWorld: (pos) => screenToWorld(this.camera, pos),
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
