import type Konva from "konva";
import type { Pt } from "../layout";
import type { DragSelectionTarget } from "../renderables";
import type { SceneCallbacks, SceneRenderState } from "../types";
import {
  buildGroupDragSession,
  collectGroupDragUpdates,
  constrainGroupDragDelta,
} from "./selection";
import type { GroupDragSession } from "./types";

type DragSelectionMaps = {
  nodeGroups: Map<string, Konva.Group>;
  labelGroups: Map<string, Konva.Group>;
  commentGroups: Map<string, Konva.Group>;
  portGroups: Map<string, Konva.Group>;
  liveNodePositions: Map<string, Pt>;
  liveLabelPositions: Map<string, Pt>;
  liveCommentPositions: Map<string, Pt>;
  livePortPositions: Map<string, Pt>;
};

export function startDragSelection(args: {
  target: DragSelectionTarget;
  pos: Pt;
  state: SceneRenderState | null;
  liveNodePositions: Map<string, Pt>;
  liveLabelPositions: Map<string, Pt>;
  livePortPositions: Map<string, Pt>;
}): GroupDragSession | null {
  const {
    target,
    pos,
    state,
    liveNodePositions,
    liveLabelPositions,
    livePortPositions,
  } = args;
  return buildGroupDragSession({
    target,
    anchorPos: pos,
    state,
    liveNodePositions,
    liveLabelPositions,
    livePortPositions,
  });
}

export function moveDragSelection(
  args: {
    target: DragSelectionTarget;
    pos: Pt;
    session: GroupDragSession | null;
    clampPos: (pos: Pt) => Pt;
    redrawWires: () => void;
  } & DragSelectionMaps,
): boolean {
  const { target, pos, session, clampPos, redrawWires, ...maps } = args;
  if (!session) return false;
  if (session.anchor.kind !== target.kind || session.anchor.id !== target.id) {
    return false;
  }

  const constrained = constrainGroupDragDelta({
    session,
    dx: pos.x - session.anchorStartPos.x,
    dy: pos.y - session.anchorStartPos.y,
    clampPos,
  });
  session.appliedDx = constrained.x;
  session.appliedDy = constrained.y;
  applyGroupDragSessionPositions({ session, clampPos, ...maps });
  redrawWires();
  return true;
}

export function endDragSelection(
  args: {
    target: DragSelectionTarget;
    pos: Pt;
    session: GroupDragSession | null;
    clampPos: (pos: Pt) => Pt;
    redrawWires: () => void;
    callbacks: SceneCallbacks;
  } & DragSelectionMaps,
): boolean {
  const { target, pos, session, clampPos, redrawWires, callbacks, ...maps } =
    args;
  if (!session) return false;
  if (session.anchor.kind !== target.kind || session.anchor.id !== target.id) {
    return false;
  }

  moveDragSelection({
    target,
    pos,
    session,
    clampPos,
    redrawWires,
    ...maps,
  });

  const { nodePositions, labelPositions, portPositions } =
    collectGroupDragUpdates({
      session,
      clampPos,
    });

  if (callbacks.onMoveSelectionGroup) {
    callbacks.onMoveSelectionGroup({
      nodePositions,
      labelPositions,
      portPositions,
    });
    return true;
  }

  for (const entry of nodePositions) {
    callbacks.onMoveNode(entry.id, entry.x, entry.y);
  }
  for (const entry of labelPositions) {
    callbacks.onMoveLabel(entry.id, entry.x, entry.y);
  }
  for (const entry of portPositions) {
    callbacks.onMoveSheetPort(entry.id, entry.x, entry.y);
  }
  return true;
}

function applyGroupDragSessionPositions(
  args: {
    session: GroupDragSession;
    clampPos: (pos: Pt) => Pt;
  } & DragSelectionMaps,
): void {
  const { session, clampPos, ...maps } = args;
  const moveAll = (
    entries: IterableIterator<[string, Pt]>,
    kind: DragSelectionTarget["kind"],
  ) => {
    for (const [id, start] of entries) {
      const next = clampPos({
        x: start.x + session.appliedDx,
        y: start.y + session.appliedDy,
      });
      setRenderedGroupPosition(maps, { kind, id }, next);
      setLiveGroupPosition(maps, { kind, id }, next);
    }
  };

  moveAll(session.nodeStartPositions.entries(), "node");
  moveAll(session.labelStartPositions.entries(), "label");
  moveAll(session.portStartPositions.entries(), "sheet-port");
}

function setRenderedGroupPosition(
  maps: DragSelectionMaps,
  target: DragSelectionTarget,
  pos: Pt,
): void {
  const group =
    target.kind === "node"
      ? maps.nodeGroups.get(target.id)
      : target.kind === "label"
        ? maps.labelGroups.get(target.id)
        : target.kind === "comment"
          ? maps.commentGroups.get(target.id)
          : maps.portGroups.get(target.id);
  if (group) group.position(pos);
}

function setLiveGroupPosition(
  maps: DragSelectionMaps,
  target: DragSelectionTarget,
  pos: Pt,
): void {
  if (target.kind === "node") {
    maps.liveNodePositions.set(target.id, pos);
    return;
  }
  if (target.kind === "label") {
    maps.liveLabelPositions.set(target.id, pos);
    return;
  }
  if (target.kind === "comment") {
    maps.liveCommentPositions.set(target.id, pos);
    return;
  }
  maps.livePortPositions.set(target.id, pos);
}
