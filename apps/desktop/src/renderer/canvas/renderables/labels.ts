import Konva from "konva";
import {
  CORNER_RADIUS_MD,
  FONT_MONO,
  FONT_SANS,
  NEUTRAL_BORDER,
  SELECTED_LABEL_BORDER,
  TEXT_PRIMARY,
  TEXT_SOFT,
} from "../constants";
import { labelFill } from "../theme";
import type { RenderLabelsArgs, RenderRuntimeContext } from "./shared";

export function renderLabels(
  ctx: RenderRuntimeContext,
  args: RenderLabelsArgs,
): void {
  const {
    mainWorld,
    callbacks,
    clampPos,
    redrawWires,
    onSelectionDragStart,
    onSelectionDragMove,
    onSelectionDragEnd,
  } = ctx;

  const { sheet, selectedLabelIds, liveLabelPositions, labelGroups } = args;

  for (const label of sheet.labels) {
    const group = new Konva.Group({
      x: label.position.x,
      y: label.position.y,
      rotation: label.rotation ?? 0,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });
    labelGroups.set(label.id, group);
    const scopeMeasure = new Konva.Text({
      text: label.scope,
      fontFamily: FONT_SANS,
      fontSize: 10,
    });
    const nameMeasure = new Konva.Text({
      text: label.name,
      fontFamily: FONT_MONO,
      fontSize: 12,
    });
    const w =
      16 +
      Math.ceil(scopeMeasure.width()) +
      8 +
      Math.ceil(nameMeasure.width()) +
      10;
    const h = 22;
    group.add(
      new Konva.Rect({
        x: 0,
        y: -11,
        width: w,
        height: h,
        cornerRadius: CORNER_RADIUS_MD,
        fill: labelFill(label.scope),
        stroke: selectedLabelIds.has(label.id)
          ? SELECTED_LABEL_BORDER
          : NEUTRAL_BORDER,
        strokeWidth: selectedLabelIds.has(label.id) ? 2 : 1,
      }),
    );
    group.add(
      new Konva.Text({
        x: 8,
        y: -4,
        text: label.scope,
        fontFamily: FONT_SANS,
        fontSize: 10,
        fill: TEXT_SOFT,
      }),
    );
    group.add(
      new Konva.Text({
        x: 14 + Math.ceil(scopeMeasure.width()) + 6,
        y: -2,
        text: label.name,
        fontFamily: FONT_MONO,
        fontSize: 12,
        fill: TEXT_PRIMARY,
      }),
    );

    group.on("dragstart", () => {
      const pos = clampPos(group.position());
      group.position(pos);
      liveLabelPositions.set(label.id, pos);
      onSelectionDragStart({ kind: "label", id: label.id }, pos);
    });
    group.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onLabelClick(label.id);
    });
    group.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      if (evt.evt instanceof MouseEvent) {
        callbacks.onContextMenuRequest?.({
          clientX: evt.evt.clientX,
          clientY: evt.evt.clientY,
          target: { kind: "label", id: label.id },
        });
      }
    });
    group.on("dragend", () => {
      const pos = clampPos(group.position());
      group.position(pos);
      if (onSelectionDragEnd({ kind: "label", id: label.id }, pos)) {
        return;
      }
      liveLabelPositions.set(label.id, pos);
      redrawWires();
      callbacks.onMoveLabel(label.id, pos.x, pos.y);
    });
    group.on("dragmove", () => {
      const pos = clampPos(group.position());
      group.position(pos);
      if (onSelectionDragMove({ kind: "label", id: label.id }, pos)) {
        return;
      }
      liveLabelPositions.set(label.id, pos);
      redrawWires();
    });

    mainWorld.add(group);
  }
}
