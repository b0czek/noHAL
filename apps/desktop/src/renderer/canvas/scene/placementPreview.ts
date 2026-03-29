import Konva from "konva";
import { comment } from "../constants/comments";
import { label } from "../constants/labels";
import { node } from "../constants/nodes";
import { port } from "../constants/ports";
import { surface } from "../constants/surfaces";
import { typography } from "../constants/typography";
import { wire } from "../constants/wires";
import {
  estimateCommentSize,
  estimatePortLabelWidth,
  measureLabelBox,
  measureLabelScopeWidth,
} from "../measurements";
import { dirStroke, labelFill, typeFill } from "../theme";
import type { ScenePlacement, SceneRenderState } from "../types";

type SceneSheetPortPlacement = Extract<ScenePlacement, { kind: "sheet-port" }>;

function previewPortName(
  direction: SceneSheetPortPlacement["direction"],
): string {
  if (direction === "in") return "in_sig";
  if (direction === "out") return "out_sig";
  return "io_sig";
}

function previewPortSide(
  direction: SceneSheetPortPlacement["direction"],
): "left" | "right" | "top" {
  if (direction === "in") return "right";
  if (direction === "out") return "left";
  return "top";
}

export function buildPlacementPreview(args: {
  placement: ScenePlacement;
  state: SceneRenderState | null;
}): Konva.Group {
  const { placement, state } = args;
  const group = new Konva.Group({
    listening: false,
    opacity: 0.84,
  });

  if (placement.kind === "component") {
    const component = state?.project.library.components[placement.componentId];
    const width = node.width;
    const height =
      node.header.height + node.side.rowHeight + node.body.bottomPadding;
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width,
        height,
        cornerRadius: node.cornerRadius,
        fill: surface.node.fill,
        stroke: surface.border.selected,
        strokeWidth: 2,
        dash: wire.pending.dash,
      }),
    );
    group.add(
      new Konva.Text({
        x: node.title.x,
        y: node.title.y,
        width: width - node.title.rightPadding,
        text: component?.halComponentName ?? "Component",
        fontFamily: typography.family.sans,
        fontSize: node.title.fontSize,
        fill: typography.color.primary,
      }),
    );
    group.add(
      new Konva.Text({
        x: width - node.kind.rightX,
        y: node.title.y,
        width: node.kind.width,
        align: "right",
        text: "comp",
        fontFamily: typography.family.sans,
        fontSize: node.kind.fontSize,
        fill: typography.color.muted,
      }),
    );
    group.add(
      new Konva.Text({
        x: node.title.x,
        y: node.header.height + node.title.y,
        width: width - node.subtitle.rightPadding,
        text: component?.source ?? "component",
        fontFamily: typography.family.mono,
        fontSize: node.subtitle.fontSize,
        fill: typography.color.soft,
      }),
    );
    return group;
  }

  if (placement.kind === "subsheet") {
    const width = node.width;
    const height =
      node.header.height + node.side.rowHeight + node.body.bottomPadding;
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width,
        height,
        cornerRadius: node.cornerRadius,
        fill: surface.sheetNode.fill,
        stroke: surface.border.selected,
        strokeWidth: 2,
        dash: wire.pending.dash,
      }),
    );
    group.add(
      new Konva.Text({
        x: node.title.x,
        y: node.title.y,
        width: width - node.title.rightPadding,
        text: "Sheet",
        fontFamily: typography.family.sans,
        fontSize: node.title.fontSize,
        fill: typography.color.primary,
      }),
    );
    group.add(
      new Konva.Text({
        x: width - node.kind.rightX,
        y: node.title.y,
        width: node.kind.width,
        align: "right",
        text: "sheet",
        fontFamily: typography.family.sans,
        fontSize: node.kind.fontSize,
        fill: typography.color.muted,
      }),
    );
    return group;
  }

  if (placement.kind === "comment") {
    const content = "Comment";
    const size = estimateCommentSize(content);
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
        cornerRadius: surface.radius.md,
        fill: comment.box.fill,
        stroke: surface.border.selected,
        strokeWidth: 2,
        dash: wire.pending.dash,
      }),
    );
    group.add(
      new Konva.Text({
        x: 0,
        y: 0,
        text: content,
        fontFamily: typography.family.sans,
        fontSize: comment.font.size,
        lineHeight: comment.font.lineHeight,
        fill: typography.color.primary,
        padding: comment.box.padding,
        listening: false,
      }),
    );
    return group;
  }

  if (placement.kind === "label") {
    const name = placement.scope === "global" ? "global_sig" : "sig";
    const size = measureLabelBox(placement.scope, name);
    const scopeWidth = measureLabelScopeWidth(placement.scope);
    group.add(
      new Konva.Rect({
        x: 0,
        y: -size.height / 2,
        width: size.width,
        height: size.height,
        cornerRadius: surface.radius.md,
        fill: labelFill(placement.scope),
        stroke: surface.border.selectedLabel,
        strokeWidth: 2,
        dash: wire.pending.dash,
      }),
    );
    group.add(
      new Konva.Text({
        x: label.scope.text.x,
        y: label.scope.text.y,
        text: placement.scope,
        fontFamily: typography.family.sans,
        fontSize: label.scope.fontSize,
        fill: typography.color.soft,
        listening: false,
      }),
    );
    group.add(
      new Konva.Text({
        x: label.name.text.baseX + scopeWidth + label.name.text.gap,
        y: label.name.text.y,
        text: name,
        fontFamily: typography.family.mono,
        fontSize: label.name.fontSize,
        fill: typography.color.primary,
        listening: false,
      }),
    );
    return group;
  }

  const name = previewPortName(placement.direction);
  const width = estimatePortLabelWidth(name);
  const side = previewPortSide(placement.direction);
  let labelRectX = port.label.offset;
  let labelRectY = -port.label.height / 2;
  if (side === "right") labelRectX = -width - port.label.offset;
  if (side === "top") {
    labelRectX = -width / 2;
    labelRectY = port.label.offset;
  }
  group.add(
    new Konva.Rect({
      x: labelRectX,
      y: labelRectY,
      width,
      height: port.label.height,
      cornerRadius: surface.radius.md,
      fill: surface.portPanelFill,
      stroke: dirStroke(placement.direction),
      strokeWidth: 2,
      dash: wire.pending.dash,
    }),
  );
  group.add(
    new Konva.Text({
      x: labelRectX + port.text.x,
      y: labelRectY + port.text.y,
      text: name,
      fontFamily: typography.family.mono,
      fontSize: port.text.fontSize,
      fill: typography.color.primary,
      listening: false,
    }),
  );
  group.add(
    new Konva.Circle({
      x: 0,
      y: 0,
      radius: surface.pin.radius + surface.pin.haloRadiusPadding,
      fill: surface.pin.haloFill,
      listening: false,
    }),
  );
  group.add(
    new Konva.Circle({
      x: 0,
      y: 0,
      radius: surface.pin.radius,
      fill: typeFill(placement.type),
      stroke: surface.pin.stroke,
      strokeWidth: surface.baseStrokeWidth,
      listening: false,
    }),
  );
  return group;
}
