import Konva from "konva";
import { SCENE_HEIGHT, SCENE_WIDTH } from "../constants";
import type { SceneCallbacks } from "../types";
import type { SceneRuntime } from "./types";

export function createSceneRuntime(
  container: HTMLDivElement,
  callbacks: SceneCallbacks,
): SceneRuntime {
  const stage = new Konva.Stage({
    container,
    width: Math.max(320, container.clientWidth || 320),
    height: Math.max(240, container.clientHeight || 240),
  });
  const wireLayer = new Konva.Layer();
  const mainLayer = new Konva.Layer();
  const uiLayer = new Konva.Layer();
  const placementHitRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    visible: false,
    fill: "rgba(0,0,0,0.001)",
  });
  const previewWorld = new Konva.Group({
    listening: false,
    visible: false,
  });
  const wireWorld = new Konva.Group();
  const mainWorld = new Konva.Group();
  const marqueeRect = new Konva.Rect({
    visible: false,
    listening: false,
    fill: "rgba(120, 180, 255, 0.16)",
    stroke: "rgba(120, 180, 255, 0.92)",
    strokeWidth: 1,
    dash: [6, 4],
    cornerRadius: 2,
  });

  wireLayer.add(wireWorld);
  mainLayer.add(mainWorld);
  uiLayer.add(placementHitRect);
  uiLayer.add(previewWorld);
  uiLayer.add(marqueeRect);
  stage.add(wireLayer);
  stage.add(mainLayer);
  stage.add(uiLayer);

  return {
    callbacks,
    view: {
      container,
      stage,
      wireLayer,
      mainLayer,
      uiLayer,
      placementHitRect,
      previewWorld,
      wireWorld,
      mainWorld,
      marqueeRect,
    },
    graph: {
      nodeLayouts: new Map(),
      liveNodePositions: new Map(),
      liveLabelPositions: new Map(),
      liveCommentPositions: new Map(),
      livePortPositions: new Map(),
      nodeGroups: new Map(),
      labelGroups: new Map(),
      commentGroups: new Map(),
      portGroups: new Map(),
      labelCullModels: new Map(),
      commentCullModels: new Map(),
      portCullModels: new Map(),
    },
    state: {
      lastState: null,
      cursorPos: null,
      camera: { x: 0, y: 0, scale: 1 },
      selectedConnectionId: null,
      selectedWaypointIndex: null,
      wireRedrawFrameId: null,
      sceneBounds: {
        minX: 0,
        minY: 0,
        maxX: SCENE_WIDTH,
        maxY: SCENE_HEIGHT,
      },
      interactionCleanup: null,
      interaction: {
        isPanning: false,
        panLastScreenPos: null,
        backgroundTapStartScreenPos: null,
        backgroundTapAdditive: false,
        isMarqueeSelecting: false,
        marqueeStartScreenPos: null,
        marqueeCurrentScreenPos: null,
        marqueeAdditive: false,
        groupDragSession: null,
        spacePressed: false,
      },
    },
  };
}
