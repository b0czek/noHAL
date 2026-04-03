import type {
  DirectConnection,
  LabelAnchor,
  SheetComment,
  SheetLabel,
  SheetNodeInstance,
  SheetPort,
} from "@nohal/core/types";

export interface SelectionClipboardSnapshot {
  nodes: SheetNodeInstance[];
  labels: SheetLabel[];
  comments: SheetComment[];
  ports: SheetPort[];
  directConnections: DirectConnection[];
  labelAnchors: LabelAnchor[];
}

export interface PastedSelectionIds {
  nodeIds: string[];
  labelIds: string[];
  commentIds: string[];
  portIds: string[];
}
