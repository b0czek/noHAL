import type Konva from "konva";
import type { Pt } from "../layout";
import type { DragSelectionTarget } from "../renderables";

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
  nodeStartPositions: Map<string, Pt>;
  labelStartPositions: Map<string, Pt>;
  portStartPositions: Map<string, Pt>;
  anchorStartPos: Pt;
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
