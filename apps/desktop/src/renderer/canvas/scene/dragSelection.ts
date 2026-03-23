import type { Pt } from "../layout";
import type { DragSelectionTarget } from "../renderables";
import { clampRuntimePos } from "./bounds";
import {
  buildGroupDragSession,
  collectGroupDragUpdates,
  constrainGroupDragDelta,
} from "./selection";
import type { GroupDragSession, SceneRuntime } from "./types";

type DragSelectionOps = {
  redrawWires: () => void;
};

export function startDragSelection(
  runtime: SceneRuntime,
  target: DragSelectionTarget,
  pos: Pt,
): GroupDragSession | null {
  return buildGroupDragSession({
    target,
    anchorPos: pos,
    state: runtime.state.lastState,
    liveNodePositions: runtime.graph.liveNodePositions,
    liveLabelPositions: runtime.graph.liveLabelPositions,
    liveCommentPositions: runtime.graph.liveCommentPositions,
    livePortPositions: runtime.graph.livePortPositions,
  });
}

export function moveDragSelection(
  runtime: SceneRuntime,
  target: DragSelectionTarget,
  pos: Pt,
  ops: DragSelectionOps,
): boolean {
  const session = runtime.state.interaction.groupDragSession;
  if (!session) return false;
  if (session.anchor.kind !== target.kind || session.anchor.id !== target.id) {
    return false;
  }
  const clampPos = (nextPos: Pt) => clampRuntimePos(runtime, nextPos);

  const constrained = constrainGroupDragDelta({
    session,
    dx: pos.x - session.anchorStartPos.x,
    dy: pos.y - session.anchorStartPos.y,
    clampPos,
  });
  session.appliedDx = constrained.x;
  session.appliedDy = constrained.y;
  applyGroupDragSessionPositions(runtime, session);
  ops.redrawWires();
  return true;
}

export function endDragSelection(
  runtime: SceneRuntime,
  target: DragSelectionTarget,
  pos: Pt,
  ops: DragSelectionOps,
): boolean {
  const session = runtime.state.interaction.groupDragSession;
  if (!session) return false;
  if (session.anchor.kind !== target.kind || session.anchor.id !== target.id) {
    return false;
  }
  const clampPos = (nextPos: Pt) => clampRuntimePos(runtime, nextPos);

  moveDragSelection(runtime, target, pos, ops);

  const { nodePositions, labelPositions, commentPositions, portPositions } =
    collectGroupDragUpdates({
      session,
      clampPos,
    });

  if (runtime.callbacks.onMoveSelectionGroup) {
    runtime.callbacks.onMoveSelectionGroup({
      nodePositions,
      labelPositions,
      commentPositions,
      portPositions,
    });
    return true;
  }

  for (const entry of nodePositions) {
    runtime.callbacks.onMoveNode(entry.id, entry.x, entry.y);
  }
  for (const entry of labelPositions) {
    runtime.callbacks.onMoveLabel(entry.id, entry.x, entry.y);
  }
  for (const entry of commentPositions) {
    runtime.callbacks.onMoveComment(entry.id, entry.x, entry.y);
  }
  for (const entry of portPositions) {
    runtime.callbacks.onMoveSheetPort(entry.id, entry.x, entry.y);
  }
  return true;
}

function applyGroupDragSessionPositions(
  runtime: SceneRuntime,
  session: GroupDragSession,
): void {
  const moveAll = (
    entries: IterableIterator<[string, Pt]>,
    kind: DragSelectionTarget["kind"],
  ) => {
    for (const [id, start] of entries) {
      const next = clampRuntimePos(runtime, {
        x: start.x + session.appliedDx,
        y: start.y + session.appliedDy,
      });
      setRenderedGroupPosition(runtime, { kind, id }, next);
      setLiveGroupPosition(runtime, { kind, id }, next);
    }
  };

  moveAll(session.nodeStartPositions.entries(), "node");
  moveAll(session.labelStartPositions.entries(), "label");
  moveAll(session.commentStartPositions.entries(), "comment");
  moveAll(session.portStartPositions.entries(), "sheet-port");
}

function setRenderedGroupPosition(
  runtime: SceneRuntime,
  target: DragSelectionTarget,
  pos: Pt,
): void {
  const group =
    target.kind === "node"
      ? runtime.graph.nodeGroups.get(target.id)
      : target.kind === "label"
        ? runtime.graph.labelGroups.get(target.id)
        : target.kind === "comment"
          ? runtime.graph.commentGroups.get(target.id)
          : runtime.graph.portGroups.get(target.id);
  if (group) group.position(pos);
}

function setLiveGroupPosition(
  runtime: SceneRuntime,
  target: DragSelectionTarget,
  pos: Pt,
): void {
  if (target.kind === "node") {
    runtime.graph.liveNodePositions.set(target.id, pos);
    return;
  }
  if (target.kind === "label") {
    runtime.graph.liveLabelPositions.set(target.id, pos);
    return;
  }
  if (target.kind === "comment") {
    runtime.graph.liveCommentPositions.set(target.id, pos);
    return;
  }
  runtime.graph.livePortPositions.set(target.id, pos);
}
