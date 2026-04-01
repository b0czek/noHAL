import type {
  HalValueType,
  LabelScope,
  NoHALProject,
  PinDirection,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "@nohal/core/types";
import type { Selection } from "../state/store/selectionTypes";

export type SceneSelection = Selection;
export type SceneSelectOptions = {
  mode?: "add" | "toggle";
};

export type SceneComponentPlacement = {
  kind: "component";
  componentId: string;
};
export type SceneSubsheetPlacement = { kind: "subsheet" };
export type SceneCommentPlacement = { kind: "comment" };
export type SceneLabelPlacement = {
  kind: "label";
  scope: LabelScope;
};
export type SceneSheetPortPlacement = {
  kind: "sheet-port";
  direction: PinDirection;
  type: HalValueType;
};

export type ScenePlacement =
  | SceneComponentPlacement
  | SceneSubsheetPlacement
  | SceneCommentPlacement
  | SceneLabelPlacement
  | SceneSheetPortPlacement;

export type SceneContextMenuNodeTarget = {
  kind: "node";
  id: string;
  nodeKind: "component" | "sheet";
};
export type SceneLabelContextMenuTarget = { kind: "label"; id: string };
export type SceneLabelAnchorContextMenuTarget = {
  kind: "label-anchor";
  anchorId: string;
};
export type SceneCommentContextMenuTarget = { kind: "comment"; id: string };
export type SceneSheetPortContextMenuTarget = {
  kind: "sheet-port";
  id: string;
};
export type SceneWireConnectionContextMenuTarget = {
  kind: "wire-connection";
  connectionId: string;
};
export type SceneWireWaypointContextMenuTarget = {
  kind: "wire-waypoint";
  connectionId: string;
  waypointIndex: number;
};
export type SceneWireContextMenuTarget =
  | SceneWireConnectionContextMenuTarget
  | SceneWireWaypointContextMenuTarget;

export type SceneContextMenuTarget =
  | SceneContextMenuNodeTarget
  | SceneLabelContextMenuTarget
  | SceneLabelAnchorContextMenuTarget
  | SceneCommentContextMenuTarget
  | SceneSheetPortContextMenuTarget
  | SceneWireContextMenuTarget;

export interface SceneContextMenuRequest {
  clientX: number;
  clientY: number;
  target: SceneContextMenuTarget;
}

export interface SceneCallbacks {
  onSelect: (selection: SceneSelection, options?: SceneSelectOptions) => void;
  onOpenNode: (nodeId: string) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onLabelClick: (labelId: string, options?: SceneSelectOptions) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveComment: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
  onMoveSelectionGroup?: (updates: {
    nodePositions: Array<{ id: string; x: number; y: number }>;
    labelPositions: Array<{ id: string; x: number; y: number }>;
    commentPositions: Array<{ id: string; x: number; y: number }>;
    portPositions: Array<{ id: string; x: number; y: number }>;
  }) => void;
  onMoveConnectionWaypoints: (connectionId: string, waypoints: XY[]) => void;
  onBackgroundClick?: (point: XY, options?: SceneSelectOptions) => void;
  onCameraChange?: (camera: { x: number; y: number; scale: number }) => void;
  onCursorPosChange?: (point: XY | null) => void;
  onContextMenuRequest?: (request: SceneContextMenuRequest) => void;
}

export interface SceneRenderState {
  project: NoHALProject;
  sheet: SheetDefinition;
  selection: SceneSelection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
  placement: ScenePlacement | null;
}
