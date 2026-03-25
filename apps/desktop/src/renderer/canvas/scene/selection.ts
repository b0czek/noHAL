import type { SheetEndpointRef } from "@nohal/core/src/types";
import {
  estimateCommentSize,
  estimatePortBox,
  measureLabelBox,
} from "../measurements";
import type { DragSelectionTarget } from "../renderables";
import type { SceneRenderState, SceneSelection } from "../types";
import { rectContainsRect, rotatedRectBounds } from "./geometry";
import type { GroupDragSession, Rect, SelectionSets } from "./types";

export function buildSelectionSets(
  selection: SceneRenderState["selection"],
): SelectionSets {
  const selectedNodeIds = new Set<string>();
  const selectedLabelIds = new Set<string>();
  const selectedCommentIds = new Set<string>();
  const selectedPortIds = new Set<string>();

  if (selection?.kind === "node") selectedNodeIds.add(selection.id);
  else if (selection?.kind === "label") selectedLabelIds.add(selection.id);
  else if (selection?.kind === "comment") selectedCommentIds.add(selection.id);
  else if (selection?.kind === "sheet-port") selectedPortIds.add(selection.id);
  else if (selection?.kind === "multi") {
    for (const id of selection.nodeIds) selectedNodeIds.add(id);
    for (const id of selection.labelIds) selectedLabelIds.add(id);
    for (const id of selection.commentIds) selectedCommentIds.add(id);
    for (const id of selection.portIds) selectedPortIds.add(id);
  }

  return {
    selectedNodeIds,
    selectedLabelIds,
    selectedCommentIds,
    selectedPortIds,
    selectedConnectionId:
      selection?.kind === "wire-connection" ? selection.id : null,
  };
}

export function selectionContainsTarget(
  selection: SceneRenderState["selection"],
  target: DragSelectionTarget,
): boolean {
  if (!selection) return false;
  if (selection.kind === target.kind) return selection.id === target.id;
  if (selection.kind !== "multi") return false;
  if (target.kind === "node") return selection.nodeIds.includes(target.id);
  if (target.kind === "label") return selection.labelIds.includes(target.id);
  if (target.kind === "comment")
    return selection.commentIds.includes(target.id);
  return selection.portIds.includes(target.id);
}

export function buildGroupDragSession(args: {
  target: DragSelectionTarget;
  anchorPos: { x: number; y: number };
  state: SceneRenderState | null;
  liveNodePositions: Map<string, { x: number; y: number }>;
  liveLabelPositions: Map<string, { x: number; y: number }>;
  liveCommentPositions: Map<string, { x: number; y: number }>;
  livePortPositions: Map<string, { x: number; y: number }>;
}): GroupDragSession | null {
  const {
    target,
    anchorPos,
    state,
    liveNodePositions,
    liveLabelPositions,
    liveCommentPositions,
    livePortPositions,
  } = args;
  const selection = state?.selection;
  if (!state || !selection || selection.kind !== "multi") return null;
  if (!selectionContainsTarget(selection, target)) return null;

  const total =
    selection.nodeIds.length +
    selection.labelIds.length +
    selection.commentIds.length +
    selection.portIds.length;
  if (total <= 1) return null;

  const nodeStartPositions = new Map<string, { x: number; y: number }>();
  const labelStartPositions = new Map<string, { x: number; y: number }>();
  const commentStartPositions = new Map<string, { x: number; y: number }>();
  const portStartPositions = new Map<string, { x: number; y: number }>();
  const connectionWaypointStartPositions = new Map<
    string,
    { x: number; y: number }[]
  >();

  for (const nodeId of selection.nodeIds) {
    const node = state.sheet.nodes.find((entry) => entry.id === nodeId);
    if (!node) continue;
    nodeStartPositions.set(
      nodeId,
      liveNodePositions.get(nodeId) ?? node.position,
    );
  }

  for (const labelId of selection.labelIds) {
    const label = state.sheet.labels.find((entry) => entry.id === labelId);
    if (!label) continue;
    labelStartPositions.set(
      labelId,
      liveLabelPositions.get(labelId) ?? label.position,
    );
  }

  for (const commentId of selection.commentIds) {
    const comment = state.sheet.comments.find(
      (entry) => entry.id === commentId,
    );
    if (!comment) continue;
    commentStartPositions.set(
      commentId,
      liveCommentPositions.get(commentId) ?? comment.position,
    );
  }

  for (const portId of selection.portIds) {
    const port = state.sheet.ports.find((entry) => entry.id === portId);
    if (!port) continue;
    portStartPositions.set(
      portId,
      livePortPositions.get(portId) ?? port.position,
    );
  }

  // Treat connection waypoints as part of the dragged group when both endpoints
  // are already included in the multi-selection.
  for (const connection of state.sheet.directConnections) {
    const waypoints = connection.waypoints;
    if (!waypoints || waypoints.length === 0) continue;
    if (
      !endpointMovesWithSelection(connection.a, selection) ||
      !endpointMovesWithSelection(connection.b, selection)
    ) {
      continue;
    }
    connectionWaypointStartPositions.set(
      connection.id,
      waypoints.map((point) => ({ x: point.x, y: point.y })),
    );
  }

  if (
    nodeStartPositions.size +
      labelStartPositions.size +
      commentStartPositions.size +
      portStartPositions.size <=
    1
  ) {
    return null;
  }

  return {
    anchor: target,
    nodeStartPositions,
    labelStartPositions,
    commentStartPositions,
    portStartPositions,
    connectionWaypointStartPositions,
    anchorStartPos: { x: anchorPos.x, y: anchorPos.y },
    appliedDx: 0,
    appliedDy: 0,
  };
}

export function constrainGroupDragDelta(args: {
  session: GroupDragSession;
  dx: number;
  dy: number;
  clampPos: (pos: { x: number; y: number }) => { x: number; y: number };
}): { x: number; y: number } {
  const { session, dx, dy, clampPos } = args;
  let nextDx = dx;
  let nextDy = dy;

  const applyConstraint = (start: { x: number; y: number }) => {
    const clamped = clampPos({ x: start.x + dx, y: start.y + dy });
    const allowedDx = clamped.x - start.x;
    const allowedDy = clamped.y - start.y;
    if (dx > 0) nextDx = Math.min(nextDx, allowedDx);
    else if (dx < 0) nextDx = Math.max(nextDx, allowedDx);
    if (dy > 0) nextDy = Math.min(nextDy, allowedDy);
    else if (dy < 0) nextDy = Math.max(nextDy, allowedDy);
  };

  for (const start of session.nodeStartPositions.values())
    applyConstraint(start);
  for (const start of session.labelStartPositions.values())
    applyConstraint(start);
  for (const start of session.commentStartPositions.values())
    applyConstraint(start);
  for (const start of session.portStartPositions.values())
    applyConstraint(start);
  for (const waypoints of session.connectionWaypointStartPositions.values()) {
    for (const waypoint of waypoints) applyConstraint(waypoint);
  }

  return { x: nextDx, y: nextDy };
}

export function collectGroupDragUpdates(args: {
  session: GroupDragSession;
  clampPos: (pos: { x: number; y: number }) => { x: number; y: number };
}): {
  nodePositions: Array<{ id: string; x: number; y: number }>;
  labelPositions: Array<{ id: string; x: number; y: number }>;
  commentPositions: Array<{ id: string; x: number; y: number }>;
  portPositions: Array<{ id: string; x: number; y: number }>;
} {
  const { session, clampPos } = args;
  const collectEntries = (
    entries: IterableIterator<[string, { x: number; y: number }]>,
  ): Array<{ id: string; x: number; y: number }> => {
    const result: Array<{ id: string; x: number; y: number }> = [];
    for (const [id, start] of entries) {
      const next = clampPos({
        x: start.x + session.appliedDx,
        y: start.y + session.appliedDy,
      });
      result.push({ id, x: next.x, y: next.y });
    }
    return result;
  };

  return {
    nodePositions: collectEntries(session.nodeStartPositions.entries()),
    labelPositions: collectEntries(session.labelStartPositions.entries()),
    commentPositions: collectEntries(session.commentStartPositions.entries()),
    portPositions: collectEntries(session.portStartPositions.entries()),
  };
}

function endpointMovesWithSelection(
  endpoint: SheetEndpointRef,
  selection: Extract<SceneSelection, { kind: "multi" }>,
): boolean {
  return endpoint.kind === "node-pin"
    ? selection.nodeIds.includes(endpoint.nodeId)
    : selection.portIds.includes(endpoint.portId);
}

export function selectItemsInWorldRect(args: {
  rect: Rect;
  state: SceneRenderState;
  nodeLayouts: Map<string, { width: number; height: number }>;
  liveNodePositions: Map<string, { x: number; y: number }>;
  liveLabelPositions: Map<string, { x: number; y: number }>;
  liveCommentPositions: Map<string, { x: number; y: number }>;
  livePortPositions: Map<string, { x: number; y: number }>;
}): SceneSelection {
  const {
    rect,
    state,
    nodeLayouts,
    liveNodePositions,
    liveLabelPositions,
    liveCommentPositions,
    livePortPositions,
  } = args;
  const nodeIds: string[] = [];
  const labelIds: string[] = [];
  const commentIds: string[] = [];
  const portIds: string[] = [];

  for (const node of state.sheet.nodes) {
    const layout = nodeLayouts.get(node.id);
    if (!layout) continue;
    const pos = liveNodePositions.get(node.id) ?? node.position;
    const nodeRect = {
      x: pos.x,
      y: pos.y,
      width: layout.width,
      height: layout.height,
    };
    if (rectContainsRect(rect, nodeRect)) nodeIds.push(node.id);
  }

  for (const label of state.sheet.labels) {
    const pos = liveLabelPositions.get(label.id) ?? label.position;
    const size = measureLabelBox(label.scope, label.name);
    const labelRect = rotatedRectBounds(
      {
        x: pos.x,
        y: pos.y - size.height / 2,
        width: size.width,
        height: size.height,
      },
      label.rotation ?? 0,
      pos,
    );
    if (rectContainsRect(rect, labelRect)) labelIds.push(label.id);
  }

  for (const comment of state.sheet.comments) {
    const pos = liveCommentPositions.get(comment.id) ?? comment.position;
    const size = estimateCommentSize(comment.text);
    const commentRect = rotatedRectBounds(
      {
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
      },
      comment.rotation ?? 0,
      pos,
    );
    if (rectContainsRect(rect, commentRect)) commentIds.push(comment.id);
  }

  for (const port of state.sheet.ports) {
    const pos = livePortPositions.get(port.id) ?? port.position;
    const portRect = rotatedRectBounds(
      estimatePortBox(port, pos),
      port.rotation ?? 0,
      pos,
    );
    if (rectContainsRect(rect, portRect)) portIds.push(port.id);
  }

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
