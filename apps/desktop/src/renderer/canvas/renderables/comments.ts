import Konva from "konva";
import { comment as commentConst } from "../constants/comments";
import { surface } from "../constants/surfaces";
import { typography } from "../constants/typography";
import { estimateCommentSize } from "../measurements";
import {
  bindDraggableRenderable,
  type RenderCommentsArgs,
  type RenderSceneContext,
} from "./shared";

export function renderComments(
  ctx: RenderSceneContext,
  args: RenderCommentsArgs,
): void {
  const { mainWorld, clampPos, dragSelection } = ctx;
  const { sheet, selectedCommentIds, liveCommentPositions, commentGroups } =
    args;
  const { callbacks } = args;

  for (const sheetComment of sheet.comments) {
    const group = new Konva.Group({
      x: sheetComment.position.x,
      y: sheetComment.position.y,
      rotation: sheetComment.rotation ?? 0,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });
    commentGroups.set(sheetComment.id, group);

    const content = (sheetComment.text || "").trimEnd() || " ";
    const size = estimateCommentSize(content);
    const commentText = new Konva.Text({
      x: 0,
      y: 0,
      text: content,
      fontFamily: typography.family.sans,
      fontSize: commentConst.font.size,
      lineHeight: commentConst.font.lineHeight,
      fill: typography.color.primary,
      padding: commentConst.box.padding,
    });
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        cornerRadius: surface.radius.md,
        fill: commentConst.box.fill,
        stroke: selectedCommentIds.has(sheetComment.id)
          ? surface.border.selected
          : surface.border.neutral,
        strokeWidth: selectedCommentIds.has(sheetComment.id) ? 2 : 1,
      }),
    );
    group.add(commentText);

    bindDraggableRenderable({
      group,
      target: { kind: "comment", id: sheetComment.id },
      clampPos,
      setLivePosition: (pos) => {
        liveCommentPositions.set(sheetComment.id, pos);
      },
      dragSelection,
      persistMove: (pos) => {
        callbacks.onMoveComment(sheetComment.id, pos.x, pos.y);
      },
    });
    group.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onSelect(
        { kind: "comment", id: sheetComment.id },
        {
          mode:
            evt.evt instanceof MouseEvent && evt.evt.shiftKey
              ? "toggle"
              : undefined,
        },
      );
    });
    group.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      if (evt.evt instanceof MouseEvent) {
        callbacks.onContextMenuRequest?.({
          clientX: evt.evt.clientX,
          clientY: evt.evt.clientY,
          target: { kind: "comment", id: sheetComment.id },
        });
      }
    });
    mainWorld.add(group);
  }
}
