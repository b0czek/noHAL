import type { SheetDefinition } from "@nohal/core/types";
import Konva from "konva";
import { FONT_MONO, FONT_SANS } from "./constants";
import type { Pt } from "./layout";

const labelWidthMeasureCache = new Map<
  string,
  { scopeW: number; nameW: number }
>();

export function measureLabelBox(
  scope: string,
  name: string,
): {
  width: number;
  height: number;
} {
  const cacheKey = `${scope}\u0000${name}`;
  let cached = labelWidthMeasureCache.get(cacheKey);
  if (!cached) {
    const scopeMeasure = new Konva.Text({
      text: scope,
      fontFamily: FONT_SANS,
      fontSize: 10,
    });
    const nameMeasure = new Konva.Text({
      text: name,
      fontFamily: FONT_MONO,
      fontSize: 12,
    });
    cached = {
      scopeW: Math.ceil(scopeMeasure.width()),
      nameW: Math.ceil(nameMeasure.width()),
    };
    labelWidthMeasureCache.set(cacheKey, cached);
    scopeMeasure.destroy();
    nameMeasure.destroy();
  }

  return {
    width: 16 + cached.scopeW + 8 + cached.nameW + 10,
    height: 22,
  };
}

export function measureLabelBoxForLabel(
  label: SheetDefinition["labels"][number],
): { width: number; height: number } {
  return measureLabelBox(label.scope, label.name);
}

export function estimateCommentSize(text: string): {
  width: number;
  height: number;
} {
  const lines = text.replace(/\r/g, "").split("\n");
  const maxLineLength = Math.max(1, ...lines.map((line) => line.length));
  const lineCount = Math.max(1, lines.length);
  return {
    width: Math.max(48, Math.ceil(maxLineLength * 8.1) + 20),
    height: Math.max(28, Math.ceil(lineCount * 17.5) + 8),
  };
}

export function estimatePortBox(
  port: SheetDefinition["ports"][number],
  position?: Pt,
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const pos = position ?? port.position;
  const width = Math.ceil(port.name.length * 7.2) + 20;
  const height = 24;
  let x = pos.x + 12;
  let y = pos.y - height / 2;
  if (port.side === "right") x = pos.x - width - 12;
  if (port.side === "top") {
    x = pos.x - width / 2;
    y = pos.y + 12;
  }
  if (port.side === "bottom") {
    x = pos.x - width / 2;
    y = pos.y - height - 12;
  }
  return { x, y, width, height };
}
