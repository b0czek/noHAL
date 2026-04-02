import type { XY } from "@nohal/core/types";
import type Konva from "konva";
import type { NodeLayout } from "../layout";
import type { DragSelectionTarget } from "../renderables";
import type { SceneCallbacks, SceneRenderState } from "../types";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CullModel = {
  localRect: Rect;
  rotationDeg: number;
};

export type SceneBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type CameraState = {
  x: number;
  y: number;
  scale: number;
};

export type FocusTarget = {
  kind: "node" | "label" | "comment" | "sheet-port";
  id: string;
};

export type GroupDragSession = {
  anchor: DragSelectionTarget;
  nodeStartPositions: Map<string, XY>;
  labelStartPositions: Map<string, XY>;
  commentStartPositions: Map<string, XY>;
  portStartPositions: Map<string, XY>;
  connectionWaypointStartPositions: Map<string, XY[]>;
  anchorStartPos: XY;
  appliedDx: number;
  appliedDy: number;
};

export type SelectionSets = {
  selectedNodeIds: Set<string>;
  selectedLabelIds: Set<string>;
  selectedCommentIds: Set<string>;
  selectedPortIds: Set<string>;
  selectedConnectionId: string | null;
};

export type CullGroupMap = Map<string, Konva.Group>;

export type SceneView = {
  container: HTMLDivElement;
  stage: Konva.Stage;
  wireLayer: Konva.Layer;
  mainLayer: Konva.Layer;
  uiLayer: Konva.Layer;
  placementHitRect: Konva.Rect;
  previewWorld: Konva.Group;
  wireWorld: Konva.Group;
  mainWorld: Konva.Group;
  marqueeRect: Konva.Rect;
};

export type SceneInteractionState = {
  isPanning: boolean;
  panLastScreenPos: XY | null;
  backgroundTapStartScreenPos: XY | null;
  backgroundTapAdditive: boolean;
  isMarqueeSelecting: boolean;
  marqueeStartScreenPos: XY | null;
  marqueeCurrentScreenPos: XY | null;
  marqueeAdditive: boolean;
  groupDragSession: GroupDragSession | null;
  gridSnapOverridePressed: boolean;
  spacePressed: boolean;
};

export type SceneGraphState = {
  nodeLayouts: Map<string, NodeLayout>;
  liveNodePositions: Map<string, XY>;
  liveLabelPositions: Map<string, XY>;
  liveCommentPositions: Map<string, XY>;
  livePortPositions: Map<string, XY>;
  liveConnectionWaypoints: Map<string, XY[]>;
  nodeGroups: Map<string, Konva.Group>;
  labelGroups: Map<string, Konva.Group>;
  commentGroups: Map<string, Konva.Group>;
  portGroups: Map<string, Konva.Group>;
  labelCullModels: Map<string, CullModel>;
  commentCullModels: Map<string, CullModel>;
  portCullModels: Map<string, CullModel>;
};

export type SceneState = {
  lastState: SceneRenderState | null;
  cursorPos: XY | null;
  camera: CameraState;
  selectedConnectionId: string | null;
  selectedWaypointIndex: number | null;
  wireRedrawFrameId: number | null;
  sceneBounds: SceneBounds;
  interactionCleanup: (() => void) | null;
  interaction: SceneInteractionState;
};

export type SceneRuntime = {
  callbacks: SceneCallbacks;
  view: SceneView;
  graph: SceneGraphState;
  state: SceneState;
};
