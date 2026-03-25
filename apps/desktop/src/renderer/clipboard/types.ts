import type {
  DirectConnection,
  LabelAnchor,
  SheetComment,
  SheetLabel,
  SheetNodeInstance,
  SheetPort,
} from "@nohal/core/src/types";

export type SelectionClipboardSnapshot = {
  nodes: SheetNodeInstance[];
  labels: SheetLabel[];
  comments: SheetComment[];
  ports: SheetPort[];
  directConnections: DirectConnection[];
  labelAnchors: LabelAnchor[];
};

export type PastedSelectionIds = {
  nodeIds: string[];
  labelIds: string[];
  commentIds: string[];
  portIds: string[];
};
