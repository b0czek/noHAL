import Konva from "konva";
import { label as labelConst } from "../constants/labels";
import { surface } from "../constants/surfaces";
import { typography } from "../constants/typography";
import { measureLabelBox, measureLabelScopeWidth } from "../measurements";
import { labelFill } from "../theme";
import {
  bindDraggableRenderable,
  type RenderLabelsArgs,
  type RenderSceneContext,
} from "./shared";

export function renderLabels(
  ctx: RenderSceneContext,
  args: RenderLabelsArgs,
): void {
  const { mainWorld, clampPos, redrawWires, dragSelection } = ctx;
  const {
    callbacks,
    sheet,
    selectedLabelIds,
    liveLabelPositions,
    labelGroups,
  } = args;

  for (const label of sheet.labels) {
    const group = new Konva.Group({
      x: label.position.x,
      y: label.position.y,
      rotation: label.rotation ?? 0,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });
    labelGroups.set(label.id, group);
    const scopeWidth = measureLabelScopeWidth(label.scope);
    const { width, height } = measureLabelBox(label.scope, label.name);
    group.add(
      new Konva.Rect({
        x: 0,
        y: -height / 2,
        width,
        height,
        cornerRadius: surface.radius.md,
        fill: labelFill(label.scope),
        stroke: selectedLabelIds.has(label.id)
          ? surface.border.selectedLabel
          : surface.border.neutral,
        strokeWidth: selectedLabelIds.has(label.id) ? 2 : 1,
      }),
    );
    group.add(
      new Konva.Text({
        x: labelConst.scope.text.x,
        y: labelConst.scope.text.y,
        text: label.scope,
        fontFamily: typography.family.sans,
        fontSize: labelConst.scope.fontSize,
        fill: typography.color.soft,
      }),
    );
    group.add(
      new Konva.Text({
        x: labelConst.name.text.baseX + scopeWidth + labelConst.name.text.gap,
        y: labelConst.name.text.y,
        text: label.name,
        fontFamily: typography.family.mono,
        fontSize: labelConst.name.fontSize,
        fill: typography.color.primary,
      }),
    );

    bindDraggableRenderable({
      group,
      target: { kind: "label", id: label.id },
      clampPos,
      setLivePosition: (pos) => {
        liveLabelPositions.set(label.id, pos);
      },
      dragSelection,
      redrawWires,
      persistMove: (pos) => {
        callbacks.onMoveLabel(label.id, pos.x, pos.y);
      },
    });
    group.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onLabelClick(label.id, {
        mode:
          evt.evt instanceof MouseEvent && evt.evt.shiftKey
            ? "toggle"
            : undefined,
      });
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
    mainWorld.add(group);
  }
}
