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
        commentIds: selection.commentIds,
        portIds: selection.portIds,
      });
    default:
      return null;
  }
}

export function selectionFromBuckets(
  buckets: SelectionIdBuckets,
): EditorSelection {
  const nodeIds = [...buckets.nodeIds];
  const labelIds = [...buckets.labelIds];
  const commentIds = [...buckets.commentIds];
  const portIds = [...buckets.portIds];
  const total =
    nodeIds.length + labelIds.length + commentIds.length + portIds.length;

  if (total === 0) return null;
  if (total === 1) {
    if (nodeIds.length === 1) return { kind: "node", id: nodeIds[0] };
    if (labelIds.length === 1) return { kind: "label", id: labelIds[0] };
    if (commentIds.length === 1) return { kind: "comment", id: commentIds[0] };
    return { kind: "sheet-port", id: portIds[0] };
  }

  return {
    kind: "multi",
    nodeIds,
    labelIds,
    commentIds,
    portIds,
  };
}

export function extendSelection(
  current: EditorSelection,
  added: EditorSelection,
): EditorSelection {
  if (!current) return added;
  if (!added) return current;
  if (current.kind === "wire-connection" || added.kind === "wire-connection") {
    return added;
  }

  const currentBuckets = selectionIdBuckets(current);
  const addedBuckets = selectionIdBuckets(added);
  if (!currentBuckets || !addedBuckets) return added;

  for (const id of addedBuckets.nodeIds) currentBuckets.nodeIds.add(id);
  for (const id of addedBuckets.labelIds) currentBuckets.labelIds.add(id);
  for (const id of addedBuckets.commentIds) currentBuckets.commentIds.add(id);
  for (const id of addedBuckets.portIds) currentBuckets.portIds.add(id);

  return selectionFromBuckets(currentBuckets);
}

export function toggleSelection(
  current: EditorSelection,
  toggled: EditorSelection,
): EditorSelection {
  if (!toggled) return current;
  if (!current) return toggled;

  if (toggled.kind === "wire-connection") {
    if (current.kind === "wire-connection" && current.id === toggled.id) {
      return null;
    }
    return toggled;
  }

  if (current.kind === "wire-connection") return toggled;

  const currentBuckets = selectionIdBuckets(current);
  const toggledBuckets = selectionIdBuckets(toggled);
  if (!currentBuckets || !toggledBuckets) return toggled;

  for (const id of toggledBuckets.nodeIds) {
    if (currentBuckets.nodeIds.has(id)) currentBuckets.nodeIds.delete(id);
    else currentBuckets.nodeIds.add(id);
  }
  for (const id of toggledBuckets.labelIds) {
    if (currentBuckets.labelIds.has(id)) currentBuckets.labelIds.delete(id);
    else currentBuckets.labelIds.add(id);
  }
  for (const id of toggledBuckets.commentIds) {
    if (currentBuckets.commentIds.has(id)) currentBuckets.commentIds.delete(id);
    else currentBuckets.commentIds.add(id);
  }
  for (const id of toggledBuckets.portIds) {
    if (currentBuckets.portIds.has(id)) currentBuckets.portIds.delete(id);
    else currentBuckets.portIds.add(id);
  }

  return selectionFromBuckets(currentBuckets);
}
