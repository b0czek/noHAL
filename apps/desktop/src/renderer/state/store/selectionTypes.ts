export type Selection =
  | { kind: "node"; id: string }
  | { kind: "label"; id: string }
  | { kind: "comment"; id: string }
  | { kind: "sheet-port"; id: string }
  | { kind: "wire-connection"; id: string }
  | {
      kind: "multi";
      nodeIds: string[];
      labelIds: string[];
      commentIds: string[];
      portIds: string[];
    }
  | null;
