import Konva from "konva";
import {
  CORNER_RADIUS_MD,
  FONT_SANS,
  NEUTRAL_BORDER,
  SELECTED_BORDER,
  TEXT_PRIMARY,
} from "../constants";
import {
  bindDraggableRenderable,
  type RenderCommentsArgs,
  type RenderRuntimeContext,
} from "./shared";

export function renderComments(
  ctx: RenderRuntimeContext,
  args: RenderCommentsArgs,
): void {
  const {
    mainWorld,
    callbacks,
    clampPos,
    onSelectionDragStart,
    onSelectionDragMove,
    onSelectionDragEnd,
  } = ctx;

  const { sheet, selectedCommentIds, liveCommentPositions, commentGroups } =
    args;

  for (const comment of sheet.comments) {
    const group = new Konva.Group({
      x: comment.position.x,
      y: comment.position.y,
      rotation: comment.rotation ?? 0,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });
    commentGroups.set(comment.id, group);

    const content = (comment.text || "").trimEnd() || " ";
    const text = new Konva.Text({
      x: 0,
      y: 0,
      text: content,
      fontFamily: FONT_SANS,
      fontSize: 14,
      lineHeight: 1.25,
      fill: TEXT_PRIMARY,
      padding: 10,
    });
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: Math.max(48, Math.ceil(text.width())),
        height: Math.max(28, Math.ceil(text.height())),
        cornerRadius: CORNER_RADIUS_MD,
        fill: "rgba(12, 24, 28, 0.72)",
        stroke: selectedCommentIds.has(comment.id)
          ? SELECTED_BORDER
          : NEUTRAL_BORDER,
        strokeWidth: selectedCommentIds.has(comment.id) ? 2 : 1,
      }),
    );
    group.add(text);

    bindDraggableRenderable({
      group,
      target: { kind: "comment", id: comment.id },
      clampPos,
      setLivePosition: (pos) => {
        liveCommentPositions.set(comment.id, pos);
      },
      onSelectionDragStart,
      onSelectionDragMove,
      onSelectionDragEnd,
      persistMove: (pos) => {
        callbacks.onMoveComment(comment.id, pos.x, pos.y);
      },
    });
    group.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onCommentClick(comment.id);
    });
    group.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      if (evt.evt instanceof MouseEvent) {
        callbacks.onContextMenuRequest?.({
          clientX: evt.evt.clientX,
          clientY: evt.evt.clientY,
          target: { kind: "comment", id: comment.id },
        });
      }
    });
    mainWorld.add(group);
  }
}
