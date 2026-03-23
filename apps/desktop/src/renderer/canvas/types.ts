import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "@nohal/core/src/types";
import type { Selection } from "../state/store/selectionTypes";

export type SceneSelection = Selection;

export type ScenePlacement =
  | { kind: "component"; componentId: string }
  | { kind: "subsheet" }
  | { kind: "comment" }
  | { kind: "label"; scope: "local" | "global" }
  | {
      kind: "sheet-port";
      direction: "in" | "out" | "io";
      type: "bit" | "float" | "s32" | "u32" | "s64" | "u64" | "port";
    };

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
  onMoveSelectionGroup?: (updates: {
    nodePositions: Array<{ id: string; x: number; y: number }>;
    labelPositions: Array<{ id: string; x: number; y: number }>;
    commentPositions: Array<{ id: string; x: number; y: number }>;
    portPositions: Array<{ id: string; x: number; y: number }>;
  }) => void;
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
  placement: ScenePlacement | null;
}
