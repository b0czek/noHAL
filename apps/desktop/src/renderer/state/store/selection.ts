import type { EditorSelection } from "./actions/types";

export type SelectionIdBuckets = {
  nodeIds: Set<string>;
  labelIds: Set<string>;
  commentIds: Set<string>;
  portIds: Set<string>;
};

function createSelectionIdBuckets(args?: {
  nodeIds?: Iterable<string>;
  labelIds?: Iterable<string>;
  commentIds?: Iterable<string>;
  portIds?: Iterable<string>;
}): SelectionIdBuckets {
  return {
    nodeIds: new Set(args?.nodeIds ?? []),
    labelIds: new Set(args?.labelIds ?? []),
    commentIds: new Set(args?.commentIds ?? []),
    portIds: new Set(args?.portIds ?? []),
  };
}

export function selectionIdBuckets(
  selection: EditorSelection,
): SelectionIdBuckets | null {
  if (!selection) return null;

  switch (selection.kind) {
    case "node":
      return createSelectionIdBuckets({ nodeIds: [selection.id] });
    case "label":
      return createSelectionIdBuckets({ labelIds: [selection.id] });
    case "comment":
      return createSelectionIdBuckets({ commentIds: [selection.id] });
    case "sheet-port":
      return createSelectionIdBuckets({ portIds: [selection.id] });
    case "multi":
      return createSelectionIdBuckets({
        nodeIds: selection.nodeIds,
        labelIds: selection.labelIds,
        portIds: selection.portIds,
      });
    default:
      return null;
  }
}
