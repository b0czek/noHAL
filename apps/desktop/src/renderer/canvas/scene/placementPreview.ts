import Konva from "konva";
import {
  BASE_STROKE_WIDTH,
  CORNER_RADIUS_MD,
  FONT_MONO,
  FONT_SANS,
  HEADER_H,
  NODE_FILL,
  NODE_WIDTH,
  PIN_HALO_FILL,
  PIN_HALO_RADIUS_PAD,
  PIN_R,
  PIN_STROKE,
  PORT_LABEL_H,
  PORT_PANEL_FILL,
  SELECTED_BORDER,
  SELECTED_LABEL_BORDER,
  SHEET_NODE_FILL,
  SIDE_ROW_H,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SOFT,
} from "../constants";
import { estimateCommentSize, measureLabelBox } from "../measurements";
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
    const width = NODE_WIDTH;
    const height = HEADER_H + SIDE_ROW_H + 12;
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width,
        height,
        cornerRadius: 14,
        fill: NODE_FILL,
        stroke: SELECTED_BORDER,
        strokeWidth: 2,
        dash: [8, 6],
      }),
    );
    group.add(
      new Konva.Text({
        x: 10,
        y: 8,
        width: width - 58,
        text: component?.halComponentName ?? "Component",
        fontFamily: FONT_SANS,
        fontSize: 12,
        fill: TEXT_PRIMARY,
      }),
    );
    group.add(
      new Konva.Text({
        x: width - 46,
        y: 8,
        width: 40,
        align: "right",
        text: "comp",
        fontFamily: FONT_SANS,
        fontSize: 11,
        fill: TEXT_MUTED,
      }),
    );
    group.add(
      new Konva.Text({
        x: 10,
        y: HEADER_H + 8,
        width: width - 20,
        text: component?.source ?? "component",
        fontFamily: FONT_MONO,
        fontSize: 11,
        fill: TEXT_SOFT,
      }),
    );
    return group;
  }

  if (placement.kind === "subsheet") {
    const width = NODE_WIDTH;
    const height = HEADER_H + SIDE_ROW_H + 12;
    group.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width,
        height,
        cornerRadius: 14,
        fill: SHEET_NODE_FILL,
        stroke: SELECTED_BORDER,
        strokeWidth: 2,
        dash: [8, 6],
      }),
    );
    group.add(
      new Konva.Text({
        x: 10,
        y: 8,
        width: width - 58,
        text: "Sheet",
        fontFamily: FONT_SANS,
        fontSize: 12,
        fill: TEXT_PRIMARY,
      }),
    );
    group.add(
      new Konva.Text({
        x: width - 46,
        y: 8,
        width: 40,
        align: "right",
        text: "sheet",
        fontFamily: FONT_SANS,
        fontSize: 11,
        fill: TEXT_MUTED,
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
        cornerRadius: CORNER_RADIUS_MD,
        fill: "rgba(12, 24, 28, 0.72)",
        stroke: SELECTED_BORDER,
        strokeWidth: 2,
        dash: [8, 6],
      }),
    );
    group.add(
      new Konva.Text({
        x: 0,
        y: 0,
        text: content,
        fontFamily: FONT_SANS,
        fontSize: 14,
        lineHeight: 1.25,
        fill: TEXT_PRIMARY,
        padding: 10,
        listening: false,
      }),
    );
    return group;
  }

  if (placement.kind === "label") {
    const name = placement.scope === "global" ? "global_sig" : "sig";
    const size = measureLabelBox(placement.scope, name);
    const scopeWidth = Math.ceil(placement.scope.length * 5.8);
    group.add(
      new Konva.Rect({
        x: 0,
        y: -size.height / 2,
        width: size.width,
        height: size.height,
        cornerRadius: CORNER_RADIUS_MD,
        fill: labelFill(placement.scope),
        stroke: SELECTED_LABEL_BORDER,
        strokeWidth: 2,
        dash: [8, 6],
      }),
    );
    group.add(
      new Konva.Text({
        x: 8,
        y: -4,
        text: placement.scope,
        fontFamily: FONT_SANS,
        fontSize: 10,
        fill: TEXT_SOFT,
        listening: false,
      }),
    );
    group.add(
      new Konva.Text({
        x: 14 + scopeWidth + 6,
        y: -2,
        text: name,
        fontFamily: FONT_MONO,
        fontSize: 12,
        fill: TEXT_PRIMARY,
        listening: false,
      }),
    );
    return group;
  }

  const name = previewPortName(placement.direction);
  const width = Math.ceil(name.length * 7.2) + 20;
  const side = previewPortSide(placement.direction);
  let labelRectX = 12;
  let labelRectY = -PORT_LABEL_H / 2;
  if (side === "right") labelRectX = -width - 12;
  if (side === "top") {
    labelRectX = -width / 2;
    labelRectY = 12;
  }
  group.add(
    new Konva.Rect({
      x: labelRectX,
      y: labelRectY,
      width,
      height: PORT_LABEL_H,
      cornerRadius: CORNER_RADIUS_MD,
      fill: PORT_PANEL_FILL,
      stroke: dirStroke(placement.direction),
      strokeWidth: 2,
      dash: [8, 6],
    }),
  );
  group.add(
    new Konva.Text({
      x: labelRectX + 9,
      y: labelRectY + 5,
      text: name,
      fontFamily: FONT_MONO,
      fontSize: 12,
      fill: TEXT_PRIMARY,
      listening: false,
    }),
  );
  group.add(
    new Konva.Circle({
      x: 0,
      y: 0,
      radius: PIN_R + PIN_HALO_RADIUS_PAD,
      fill: PIN_HALO_FILL,
      listening: false,
    }),
  );
  group.add(
    new Konva.Circle({
      x: 0,
      y: 0,
      radius: PIN_R,
      fill: typeFill(placement.type),
      stroke: PIN_STROKE,
      strokeWidth: BASE_STROKE_WIDTH,
      listening: false,
    }),
  );
  return group;
}
