import { endpointKey } from "@nohal/core/src/graph";
import type { ProjectWireLayerPosition } from "@nohal/core/src/types";
import { buildSheetSceneLayout, type Pt } from "../layout";
import {
  type DragSelectionTarget,
  type RenderSceneContext,
  renderComments,
  renderLabels,
  renderNodes,
  renderPorts,
} from "../renderables";
import type { SceneCallbacks, SceneRenderState } from "../types";
import {
  deleteSelectedWaypoint as deleteWireSelectedWaypoint,
  getSplitLabelPositionsForConnection as getSplitLabelPositionsForWire,
  redraw as redrawSceneWires,
} from "../wires";
import { clampScenePos } from "./bounds";
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
  cancelMarqueeSelection as cancelSceneMarqueeSelection,
  finishMarqueeSelection as finishSceneMarqueeSelection,
  startMarqueeSelection as startSceneMarqueeSelection,
  updateMarqueeRect as updateSceneMarqueeRect,
} from "./marquee";
import { buildPlacementPreview } from "./placementPreview";
import { createSceneRuntime } from "./runtime";
import { buildSelectionSets, selectItemsInWorldRect } from "./selection";
import type { FocusTarget, Rect } from "./types";

const MARQUEE_SELECT_THRESHOLD_PX = 4;
const CULL_SCREEN_MARGIN_PX = 180;

export interface SheetScene {
  destroy(): void;
  resize(width: number, height: number): void;
  clientToWorld(clientX: number, clientY: number): Pt;
  focusTarget(target: FocusTarget): boolean;
  getSplitLabelPositionsForConnection(
    connectionId: string,
  ): ReturnType<typeof getSplitLabelPositionsForWire>;
  render(state: SceneRenderState): void;
}

export function createKonvaSheetScene(
  container: HTMLDivElement,
  callbacks: SceneCallbacks,
): SheetScene {
  const runtime = createSceneRuntime(container, callbacks);
  runtime.state.camera = centerCamera({
    stageWidth: runtime.view.stage.width(),
    stageHeight: runtime.view.stage.height(),
    sceneBounds: runtime.state.sceneBounds,
  });
  applyCameraToRuntime();
  runtime.state.interactionCleanup = bindSceneInteractions(runtime, {
    syncPlacementPreview,
    applyCamera: applyCameraToRuntime,
    redrawWires: () => redrawWires(),
    zoomByFactor,
    deleteSelectedWaypoint,
    startMarqueeSelection: startMarqueeSelection,
    cancelMarqueeSelection: cancelMarqueeSelection,
    finishMarqueeSelection: finishMarqueeSelection,
    updateMarqueeRect: updateMarqueeRect,
  });

  const onSelectionDragStart = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    runtime.state.interaction.groupDragSession = startDragSelection(
      runtime,
      target,
      pos,
    );
    return runtime.state.interaction.groupDragSession !== null;
  };

  const onSelectionDragMove = (target: DragSelectionTarget, pos: Pt): boolean =>
    moveDragSelection(runtime, target, pos, {
      redrawWires: () => redrawWires(),
    });

  const onSelectionDragEnd = (
    target: DragSelectionTarget,
    pos: Pt,
  ): boolean => {
    const handled = endDragSelection(runtime, target, pos, {
      redrawWires: () => redrawWires(),
    });
    runtime.state.interaction.groupDragSession = null;
    return handled;
  };

  return {
    destroy() {
      runtime.state.interactionCleanup?.();
      runtime.state.interactionCleanup = null;
      if (runtime.state.wireRedrawFrameId !== null) {
        window.cancelAnimationFrame(runtime.state.wireRedrawFrameId);
        runtime.state.wireRedrawFrameId = null;
      }
      runtime.view.stage.destroy();
    },

    resize(width: number, height: number): void {
      const w = Math.max(320, Math.floor(width));
      const h = Math.max(240, Math.floor(height));
      if (
        runtime.view.stage.width() === w &&
        runtime.view.stage.height() === h
      ) {
        return;
      }
      runtime.view.stage.size({ width: w, height: h });
      runtime.view.placementHitRect.size({ width: w, height: h });
      applyCameraToRuntime();
      if (runtime.state.lastState) {
        redrawWires(true);
        runtime.view.mainLayer.batchDraw();
        runtime.view.uiLayer.batchDraw();
      }
    },

    clientToWorld(clientX: number, clientY: number): Pt {
      return clientToWorld(runtime, clientX, clientY);
    },

    focusTarget(target: FocusTarget): boolean {
      let center: Pt | null = null;

      if (target.kind === "node") {
        const node = runtime.graph.nodeGroups.get(target.id);
        const layout = runtime.graph.nodeLayouts.get(target.id);
        if (!node || !layout) return false;
        const position = node.position();
        center = {
          x: position.x + layout.width / 2,
          y: position.y + layout.height / 2,
        };
      } else if (target.kind === "label") {
        center = focusCenterFromCullModel(
          target.id,
          runtime.graph.labelGroups,
          runtime.graph.labelCullModels,
        );
      } else if (target.kind === "sheet-port") {
        center = focusCenterFromCullModel(
          target.id,
          runtime.graph.portGroups,
          runtime.graph.portCullModels,
        );
      } else {
        center = focusCenterFromCullModel(
          target.id,
          runtime.graph.commentGroups,
          runtime.graph.commentCullModels,
        );
      }

      if (!center) return false;
      centerCameraOnWorldPoint({
        camera: runtime.state.camera,
        center,
        stageWidth: runtime.view.stage.width(),
        stageHeight: runtime.view.stage.height(),
      });
      applyCameraToRuntime();
      if (runtime.state.lastState?.pendingEndpoint) redrawWires();
      return true;
    },

    getSplitLabelPositionsForConnection(connectionId: string) {
      return getSplitLabelPositionsForWire(runtime, connectionId);
    },

    render(state: SceneRenderState): void {
      const { project, sheet, selection, pendingEndpoint } = state;
      const pendingKey = pendingEndpoint ? endpointKey(pendingEndpoint) : null;
      const {
        selectedNodeIds,
        selectedLabelIds,
        selectedCommentIds,
        selectedPortIds,
        selectedConnectionId,
      } = buildSelectionSets(selection);
      if (runtime.state.selectedConnectionId !== selectedConnectionId) {
        runtime.state.selectedWaypointIndex = null;
      }
      runtime.state.selectedConnectionId = selectedConnectionId;

      runtime.state.lastState = state;
      resetTransientPositions();
      runtime.view.mainWorld.destroyChildren();
      syncLayerOrder(project.ui.wireLayerPosition);

      const { nodeLayouts } = buildSheetSceneLayout(project, sheet);
      runtime.graph.nodeLayouts = nodeLayouts;
      rebuildCullModelsIntoRuntime(state);
      runtime.state.sceneBounds = computeSceneBounds({
        state,
        nodeLayouts: runtime.graph.nodeLayouts,
      });
      applyCameraToRuntime();
      redrawWires(true);

      const renderCtx: RenderSceneContext = {
        mainWorld: runtime.view.mainWorld,
        clampPos,
        redrawWires: () => redrawWires(),
        dragSelection: {
          onSelectionDragStart,
          onSelectionDragMove,
          onSelectionDragEnd,
        },
      };

      renderPorts(renderCtx, {
        callbacks: runtime.callbacks,
        sheet,
        pendingKey,
        selectedPortIds,
        livePortPositions: runtime.graph.livePortPositions,
        portGroups: runtime.graph.portGroups,
      });
      renderNodes(renderCtx, {
        callbacks: runtime.callbacks,
        project,
        sheet,
        pendingKey,
        selectedNodeIds,
        nodeLayouts,
        liveNodePositions: runtime.graph.liveNodePositions,
        nodeGroups: runtime.graph.nodeGroups,
      });
      renderLabels(renderCtx, {
        callbacks: runtime.callbacks,
        sheet,
        selectedLabelIds,
        liveLabelPositions: runtime.graph.liveLabelPositions,
        labelGroups: runtime.graph.labelGroups,
      });
      renderComments(renderCtx, {
        callbacks: runtime.callbacks,
        sheet,
        selectedCommentIds,
        liveCommentPositions: runtime.graph.liveCommentPositions,
        commentGroups: runtime.graph.commentGroups,
      });

      updateMainCullVisibilityForRuntime();
      runtime.view.mainLayer.batchDraw();
    },
  };

  function clampPos(pos: Pt): Pt {
    return clampScenePos(pos, runtime.state.sceneBounds);
  }

  function zoomByFactor(zoomFactor: number, pointer?: Pt): void {
    const changed = zoomCameraByFactor({
      camera: runtime.state.camera,
      zoomFactor,
      pointer: pointer ?? runtime.view.stage.getPointerPosition(),
      stageWidth: runtime.view.stage.width(),
      stageHeight: runtime.view.stage.height(),
    });
    if (!changed) return;
    applyCameraToRuntime();
    if (runtime.state.lastState?.pendingEndpoint) redrawWires();
  }

  function applyCameraToRuntime(): void {
    applyCamera({
      runtime,
      updateCullVisibility,
      syncPlacementPreview,
      onCameraChange: runtime.callbacks.onCameraChange,
    });
  }

  function syncPlacementPreview(): void {
    const placement = runtime.state.lastState?.placement ?? null;
    const hadHitRect = runtime.view.placementHitRect.visible();
    const hadPreview = runtime.view.previewWorld.visible();
    runtime.view.placementHitRect.visible(placement !== null);

    if (!placement || !runtime.state.cursorPos) {
      if (!hadHitRect && !hadPreview) return;
      runtime.view.previewWorld.visible(false);
      runtime.view.previewWorld.destroyChildren();
      runtime.view.uiLayer.batchDraw();
      return;
    }

    runtime.view.previewWorld.visible(true);
    runtime.view.previewWorld.destroyChildren();
    const preview = buildPlacementPreview({
      placement,
      state: runtime.state.lastState,
    });
    preview.position(runtime.state.cursorPos);
    runtime.view.previewWorld.add(preview);
    runtime.view.uiLayer.batchDraw();
  }

  function syncLayerOrder(position: ProjectWireLayerPosition): void {
    if (position === "above-components") {
      runtime.view.mainLayer.zIndex(0);
      runtime.view.wireLayer.zIndex(1);
      runtime.view.uiLayer.zIndex(2);
      return;
    }
    runtime.view.wireLayer.zIndex(0);
    runtime.view.mainLayer.zIndex(1);
    runtime.view.uiLayer.zIndex(2);
  }

  function viewportWorldRectForRuntime(): Rect {
    return viewportWorldRect({
      width: runtime.view.stage.width(),
      height: runtime.view.stage.height(),
      margin: CULL_SCREEN_MARGIN_PX,
      screenToWorld: (pos) => screenToWorld(runtime.state.camera, pos),
    });
  }

  function updateMainCullVisibilityForRuntime(): void {
    updateMainCullVisibility({
      view: viewportWorldRectForRuntime(),
      graph: runtime.graph,
    });
  }

  function updateWireCullVisibilityForRuntime(): void {
    updateWireCullVisibility(
      runtime.view.wireWorld,
      viewportWorldRectForRuntime(),
    );
  }

  function updateCullVisibility(): void {
    updateMainCullVisibilityForRuntime();
    updateWireCullVisibilityForRuntime();
  }

  function rebuildCullModelsIntoRuntime(state: SceneRenderState): void {
    const models = rebuildCullModels(state);
    runtime.graph.labelCullModels = models.labelCullModels;
    runtime.graph.commentCullModels = models.commentCullModels;
    runtime.graph.portCullModels = models.portCullModels;
  }

  function startMarqueeSelection(screenPos: Pt): void {
    startSceneMarqueeSelection({
      runtime,
      screenPos,
      updateMarqueeRect,
    });
  }

  function cancelMarqueeSelection(): void {
    cancelSceneMarqueeSelection(runtime);
  }

  function finishMarqueeSelection(): void {
    finishSceneMarqueeSelection({
      runtime,
      thresholdPx: MARQUEE_SELECT_THRESHOLD_PX,
      cancelMarqueeSelection,
      onClearSelection: () => {
        runtime.callbacks.onSelect(null);
      },
      onSelectWorldRect: selectItemsInWorldRectFromRuntime,
    });
  }

  function updateMarqueeRect(): void {
    updateSceneMarqueeRect(runtime);
  }

  function selectItemsInWorldRectFromRuntime(rect: Rect): void {
    const state = runtime.state.lastState;
    if (!state) return;
    runtime.callbacks.onSelect(
      selectItemsInWorldRect({
        rect,
        state,
        nodeLayouts: runtime.graph.nodeLayouts,
        liveNodePositions: runtime.graph.liveNodePositions,
        liveLabelPositions: runtime.graph.liveLabelPositions,
        livePortPositions: runtime.graph.livePortPositions,
      }),
    );
  }

  function resetTransientPositions(): void {
    runtime.state.interaction.groupDragSession = null;
    runtime.graph.liveNodePositions.clear();
    runtime.graph.liveLabelPositions.clear();
    runtime.graph.liveCommentPositions.clear();
    runtime.graph.livePortPositions.clear();
    runtime.graph.nodeGroups.clear();
    runtime.graph.labelGroups.clear();
    runtime.graph.commentGroups.clear();
    runtime.graph.portGroups.clear();
    runtime.graph.labelCullModels.clear();
    runtime.graph.commentCullModels.clear();
    runtime.graph.portCullModels.clear();
  }

  function deleteSelectedWaypoint(): boolean {
    return deleteWireSelectedWaypoint(runtime);
  }

  function redrawWires(immediate = false): void {
    const draw = () => {
      runtime.state.wireRedrawFrameId = null;
      redrawSceneWires(runtime);
      updateWireCullVisibilityForRuntime();
    };

    if (immediate) {
      if (runtime.state.wireRedrawFrameId !== null) {
        window.cancelAnimationFrame(runtime.state.wireRedrawFrameId);
        runtime.state.wireRedrawFrameId = null;
      }
      draw();
      return;
    }

    if (runtime.state.wireRedrawFrameId !== null) return;
    runtime.state.wireRedrawFrameId = window.requestAnimationFrame(draw);
  }
}
