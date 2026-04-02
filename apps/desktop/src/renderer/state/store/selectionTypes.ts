export type NodeSelection = { kind: "node"; id: string };
export type LabelSelection = { kind: "label"; id: string };
export type LabelAnchorSelection = { kind: "label-anchor"; id: string };
export type CommentSelection = { kind: "comment"; id: string };
export type SheetPortSelection = { kind: "sheet-port"; id: string };
export type WireConnectionSelection = { kind: "wire-connection"; id: string };
export type MultiSelection = {
  kind: "multi";
  nodeIds: string[];
  labelIds: string[];
  commentIds: string[];
  portIds: string[];
};

export type Selection =
  | NodeSelection
  | LabelSelection
  | LabelAnchorSelection
  | CommentSelection
  | SheetPortSelection
  | WireConnectionSelection
  | MultiSelection
  | null;
