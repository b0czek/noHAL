import type { Rect, SheetDefinition, Size, XY } from "@nohal/core/types";
import Konva from "konva";
import { comment as commentConst } from "./constants/comments";
import { label } from "./constants/labels";
import { port as portConst } from "./constants/ports";
import { typography } from "./constants/typography";

const labelWidthMeasureCache = new Map<
  string,
  { scopeW: number; nameW: number }
>();

function measureTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
): number {
  const measure = new Konva.Text({
    text,
    fontFamily,
    fontSize,
  });
  const width = Math.ceil(measure.width());
  measure.destroy();
  return width;
}

export function measureLabelScopeWidth(scope: string): number {
  return measureTextWidth(scope, typography.family.sans, label.scope.fontSize);
}

export function estimatePortLabelWidth(name: string): number {
  return (
    Math.ceil(name.length * portConst.text.charWidth) +
    portConst.text.widthPadding
  );
}

export function measureLabelBox(scope: string, name: string): Size {
  const cacheKey = `${scope}\u0000${name}`;
  let cached = labelWidthMeasureCache.get(cacheKey);
  if (!cached) {
    cached = {
      scopeW: measureLabelScopeWidth(scope),
      nameW: measureTextWidth(
        name,
        typography.family.mono,
        label.name.fontSize,
      ),
    };
    labelWidthMeasureCache.set(cacheKey, cached);
  }

  return {
    width:
      label.box.padding.left +
      cached.scopeW +
      label.box.middleGap +
      cached.nameW +
      label.box.padding.right,
    height: label.box.height,
  };
}

export function measureLabelBoxForLabel(
  label: SheetDefinition["labels"][number],
): Size {
  return measureLabelBox(label.scope, label.name);
}

export function estimateCommentSize(text: string): Size {
  const lines = text.replace(/\r/g, "").split("\n");
  const maxLineLength = Math.max(1, ...lines.map((line) => line.length));
  const lineCount = Math.max(1, lines.length);
  return {
    width: Math.max(
      commentConst.box.minWidth,
      Math.ceil(maxLineLength * commentConst.measure.charWidth) +
        commentConst.measure.widthPadding,
    ),
    height: Math.max(
      commentConst.box.minHeight,
      Math.ceil(lineCount * commentConst.measure.lineHeight) +
        commentConst.measure.heightPadding,
    ),
  };
}

export function estimatePortBox(
  port: SheetDefinition["ports"][number],
  position?: XY,
): Rect {
  const pos = position ?? port.position;
  const width = estimatePortLabelWidth(port.name);
  const height = portConst.label.height;
  let x = pos.x + portConst.label.offset;
  let y = pos.y - height / 2;
  if (port.side === "right") {
    x = pos.x - width - portConst.label.offset;
  }
  if (port.side === "top") {
    x = pos.x - width / 2;
    y = pos.y + portConst.label.offset;
  }
  if (port.side === "bottom") {
    x = pos.x - width / 2;
    y = pos.y - height - portConst.label.offset;
  }
  return { x, y, width, height };
}
