import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
} from "@nohal/core/src/types";
import type Konva from "konva";
import type { NodeLayout, Pt } from "../layout";
import type { SceneCallbacks, SceneRenderState } from "../types";

export type WireAttrs = {
  stroke: string | CanvasGradient;
  strokeWidth: number;
  dash?: number[];
  listening?: boolean;
  hitStrokeWidth?: number | "auto";
};

export type CullBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EndpointSide = "left" | "right" | "top" | "bottom";

export type SheetLookup = {
  nodesById: Map<string, SheetDefinition["nodes"][number]>;
  portsById: Map<string, SheetDefinition["ports"][number]>;
  labelsById: Map<string, SheetDefinition["labels"][number]>;
  nodePinSidesById: Map<string, Map<string, EndpointSide>>;
};

export interface KonvaSheetSceneWiresContext {
  stage: Konva.Stage;
  wireLayer: Konva.Layer;
  wireWorld: Konva.Group;
  callbacks: Pick<
    SceneCallbacks,
    "onMoveConnectionWaypoints" | "onContextMenuRequest" | "onSelect"
  >;
  clampPos: (pos: Pt) => Pt;
  screenToWorld: (pos: Pt) => Pt;
  getCursorPosCache: () => Pt | null;
  getLastState: () => SceneRenderState | null;
  getNodeLayouts: () => Map<string, NodeLayout>;
  getLiveNodePositions: () => Map<string, Pt>;
  getLiveLabelPositions: () => Map<string, Pt>;
  getLivePortPositions: () => Map<string, Pt>;
  getSelectedConnectionId: () => string | null;
  setSelectedConnectionId: (id: string | null) => void;
  getSelectedWaypointIndex: () => number | null;
  setSelectedWaypointIndex: (index: number | null) => void;
}

export type WireStateProject = NoHALProject;
export type WireStateSheet = SheetDefinition;
export type WireEndpoint = SheetEndpointRef;
