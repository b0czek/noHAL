import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "../../shared/types";

export type SceneSelection =
  | { kind: "node"; id: string }
  | { kind: "label"; id: string }
  | { kind: "sheet-port"; id: string }
  | null;

export interface SceneCallbacks {
  onSelect: (selection: SceneSelection) => void;
  onOpenNode: (nodeId: string) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onLabelClick: (labelId: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
  onMoveConnectionWaypoints: (connectionId: string, waypoints: XY[]) => void;
  onBackgroundClick?: (point: XY) => void;
  onCameraChange?: (camera: { x: number; y: number; scale: number }) => void;
}

export interface SceneRenderState {
  project: NoHALProject;
  sheet: SheetDefinition;
  selection: SceneSelection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
}
