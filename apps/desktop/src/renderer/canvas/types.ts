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

export interface CameraState extends XY {
  scale: number;
}

export interface SceneSelectOptions {
  mode?: "add" | "toggle";
}

export interface SceneComponentPlacement {
  kind: "component";
  componentId: string;
}
export interface SceneSubsheetPlacement {
  kind: "subsheet";
}
export interface SceneCommentPlacement {
  kind: "comment";
}
export interface SceneLabelPlacement {
  kind: "label";
  scope: LabelScope;
}
export interface SceneSheetPortPlacement {
  kind: "sheet-port";
  direction: PinDirection;
  type: HalValueType;
}

export type ScenePlacement =
  | SceneComponentPlacement
  | SceneSubsheetPlacement
  | SceneCommentPlacement
  | SceneLabelPlacement
  | SceneSheetPortPlacement;

export interface SceneContextMenuNodeTarget {
  kind: "node";
  id: string;
  nodeKind: "component" | "sheet";
}
export interface SceneLabelContextMenuTarget {
  kind: "label";
  id: string;
}
export interface SceneLabelAnchorContextMenuTarget {
  kind: "label-anchor";
  anchorId: string;
}
export interface SceneCommentContextMenuTarget {
  kind: "comment";
  id: string;
}
export interface SceneSheetPortContextMenuTarget {
  kind: "sheet-port";
  id: string;
}
export interface SceneWireConnectionContextMenuTarget {
  kind: "wire-connection";
  connectionId: string;
}
export interface SceneWireWaypointContextMenuTarget {
  kind: "wire-waypoint";
  connectionId: string;
  waypointIndex: number;
}
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
  onCameraChange?: (camera: CameraState) => void;
  onCursorPosChange?: (point: XY | null) => void;
  onContextMenuRequest?: (request: SceneContextMenuRequest) => void;
}

export interface SceneRenderState {
  project: NoHALProject;
  sheet: SheetDefinition;
  camera: CameraState | null;
  gridResolution: number | null;
  selection: SceneSelection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
  placement: ScenePlacement | null;
}
