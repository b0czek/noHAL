export interface NodeSelection {
  kind: "node";
  id: string;
}
export interface LabelSelection {
  kind: "label";
  id: string;
}
export interface LabelAnchorSelection {
  kind: "label-anchor";
  id: string;
}
export interface CommentSelection {
  kind: "comment";
  id: string;
}
export interface SheetPortSelection {
  kind: "sheet-port";
  id: string;
}
export interface WireConnectionSelection {
  kind: "wire-connection";
  id: string;
}
export interface MultiSelection {
  kind: "multi";
  nodeIds: string[];
  labelIds: string[];
  commentIds: string[];
  portIds: string[];
}

export type Selection =
  | NodeSelection
  | LabelSelection
  | LabelAnchorSelection
  | CommentSelection
  | SheetPortSelection
  | WireConnectionSelection
  | MultiSelection
  | null;
