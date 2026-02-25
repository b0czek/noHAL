import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "../../shared/types";

export type SceneSelection =
  | { kind: "node"; id: string }
  | { kind: "label"; id: string }
  | { kind: "comment"; id: string }
  | { kind: "sheet-port"; id: string }
  | { kind: "wire-connection"; id: string }
  | { kind: "multi"; nodeIds: string[]; labelIds: string[]; portIds: string[] }
  | null;

export type SceneContextMenuTarget =
  | { kind: "node"; id: string; nodeKind: "component" | "sheet" }
  | { kind: "label"; id: string }
  | { kind: "comment"; id: string }
  | { kind: "sheet-port"; id: string }
  | { kind: "wire-connection"; connectionId: string }
  | { kind: "wire-waypoint"; connectionId: string; waypointIndex: number };

export interface SceneContextMenuRequest {
  clientX: number;
  clientY: number;
  target: SceneContextMenuTarget;
}

export interface SceneCallbacks {
  onSelect: (selection: SceneSelection) => void;
  onOpenNode: (nodeId: string) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onLabelClick: (labelId: string) => void;
  onCommentClick: (commentId: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveComment: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
  onMoveConnectionWaypoints: (connectionId: string, waypoints: XY[]) => void;
  onBackgroundClick?: (point: XY) => void;
  onCameraChange?: (camera: { x: number; y: number; scale: number }) => void;
  onContextMenuRequest?: (request: SceneContextMenuRequest) => void;
}

export interface SceneRenderState {
  project: NoHALProject;
  sheet: SheetDefinition;
  selection: SceneSelection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
}
