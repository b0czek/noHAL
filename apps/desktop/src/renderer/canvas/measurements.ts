import type { Rect, SheetDefinition, Size, XY } from "@nohal/core/types";
import Konva from "konva";
import { comment as commentConst } from "./constants/comments";
import { label } from "./constants/labels";
import { port as portConst } from "./constants/ports";
import { typography } from "./constants/typography";

interface TextMeasureOptions {
  text: string;
  fontFamily: string;
  fontSize: number;
  lineHeight?: number;
  padding?: number;
}

const textMeasureCache = new Map<string, Map<string, Size>>();
const sharedMeasureText = new Konva.Text({
  listening: false,
});

function fontFamilyCacheKey(fontFamily: string): string {
  if (fontFamily === typography.family.mono) return "mono";
  if (fontFamily === typography.family.sans) return "sans";
  return fontFamily;
}

function textMeasureBucketKey(options: TextMeasureOptions): string {
  return [
    fontFamilyCacheKey(options.fontFamily),
    options.fontSize,
    options.lineHeight ?? 1,
    options.padding ?? 0,
  ].join("\u0000");
}

export function measureTextSize(options: TextMeasureOptions): Size {
  const bucketKey = textMeasureBucketKey(options);
  let bucket = textMeasureCache.get(bucketKey);
  if (!bucket) {
    bucket = new Map<string, Size>();
    textMeasureCache.set(bucketKey, bucket);
  }

  const cached = bucket.get(options.text);
  if (cached) return cached;

  sharedMeasureText.setAttrs({
    text: options.text,
    fontFamily: options.fontFamily,
    fontSize: options.fontSize,
    lineHeight: options.lineHeight ?? 1,
    padding: options.padding ?? 0,
  });

  const measured = {
    width: Math.ceil(sharedMeasureText.width()),
    height: Math.ceil(sharedMeasureText.height()),
  };
  bucket.set(options.text, measured);
  return measured;
}

export function measureTextWidth(
  text: string,
  fontFamily: string,
  fontSize: number,
): number {
  return measureTextSize({
    text,
    fontFamily,
    fontSize,
  }).width;
}

export function measureMonoTextSize(
  text: string,
  fontSize: number,
  options?: Pick<TextMeasureOptions, "lineHeight" | "padding">,
): Size {
  return measureTextSize({
    text,
    fontFamily: typography.family.mono,
    fontSize,
    ...options,
  });
}

export function measureSansTextSize(
  text: string,
  fontSize: number,
  options?: Pick<TextMeasureOptions, "lineHeight" | "padding">,
): Size {
  return measureTextSize({
    text,
    fontFamily: typography.family.sans,
    fontSize,
    ...options,
  });
}

export function measureLabelScopeWidth(scope: string): number {
  return measureSansTextSize(scope, label.scope.fontSize).width;
}

export function measurePortLabelWidth(name: string): number {
  return (
    measureMonoTextSize(name, portConst.text.fontSize).width +
    portConst.text.widthPadding
  );
}

export function measureLabelBox(scope: string, name: string): Size {
  const scopeW = measureLabelScopeWidth(scope);
  const nameW = measureMonoTextSize(name, label.name.fontSize).width;

  return {
    width:
      label.box.padding.left +
      scopeW +
      label.box.middleGap +
      nameW +
      label.box.padding.right,
    height: label.box.height,
  };
}

export function measureLabelBoxForLabel(
  label: SheetDefinition["labels"][number],
): Size {
  return measureLabelBox(label.scope, label.name);
}

export function measureCommentSize(text: string | null | undefined): Size {
  const content = (text || "").trimEnd() || " ";
  const measured = measureSansTextSize(content, commentConst.font.size, {
    lineHeight: commentConst.font.lineHeight,
    padding: commentConst.box.padding,
  });
  return {
    width: Math.max(commentConst.box.minWidth, measured.width),
    height: Math.max(commentConst.box.minHeight, measured.height),
  };
}

export function estimatePortBox(
  port: SheetDefinition["ports"][number],
  position?: XY,
): Rect {
  const pos = position ?? port.position;
  const width = measurePortLabelWidth(port.name);
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
