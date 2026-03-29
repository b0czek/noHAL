import type { XY } from "../types";

export type SheetPortSide = "left" | "right" | "top" | "bottom";

const sheetLayout = {
  rotation: {
    fullDegrees: 360,
  },
  node: {
    base: { x: 120, y: 100 },
    columns: 4,
    step: { x: 280, y: 180 },
  },
  label: {
    base: { x: 160, y: 520 },
    columns: 5,
    step: { x: 160, y: 70 },
    splitPairOffset: { x: 108, y: 34 },
  },
  comment: {
    base: { x: 180, y: 620 },
    columns: 4,
    step: { x: 220, y: 90 },
  },
  port: {
    leftX: 20,
    rightX: 1380,
    topBaseX: 220,
    topY: 20,
    bottomY: 740,
    verticalBaseY: 120,
    verticalStepY: 50,
    horizontalStepX: 120,
  },
} as const;

export function normalizeRotationDegrees(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const normalized = value % sheetLayout.rotation.fullDegrees;
  return Object.is(normalized, -0) ? 0 : normalized;
}

export function defaultNodePositionForIndex(index: number): XY {
  return {
    x:
      sheetLayout.node.base.x +
      (index % sheetLayout.node.columns) * sheetLayout.node.step.x,
    y:
      sheetLayout.node.base.y +
      Math.floor(index / sheetLayout.node.columns) * sheetLayout.node.step.y,
  };
}

export function defaultLabelPositionForIndex(index: number): XY {
  return {
    x:
      sheetLayout.label.base.x +
      (index % sheetLayout.label.columns) * sheetLayout.label.step.x,
    y:
      sheetLayout.label.base.y +
      Math.floor(index / sheetLayout.label.columns) * sheetLayout.label.step.y,
  };
}

export function defaultCommentPositionForIndex(index: number): XY {
  return {
    x:
      sheetLayout.comment.base.x +
      (index % sheetLayout.comment.columns) * sheetLayout.comment.step.x,
    y:
      sheetLayout.comment.base.y +
      Math.floor(index / sheetLayout.comment.columns) *
        sheetLayout.comment.step.y,
  };
}

export function defaultPortPositionForIndex(
  count: number,
  side: SheetPortSide,
): XY {
  if (side === "left") {
    return {
      x: sheetLayout.port.leftX,
      y:
        sheetLayout.port.verticalBaseY + count * sheetLayout.port.verticalStepY,
    };
  }
  if (side === "right") {
    return {
      x: sheetLayout.port.rightX,
      y:
        sheetLayout.port.verticalBaseY + count * sheetLayout.port.verticalStepY,
    };
  }
  if (side === "top") {
    return {
      x: sheetLayout.port.topBaseX + count * sheetLayout.port.horizontalStepX,
      y: sheetLayout.port.topY,
    };
  }
  return {
    x: sheetLayout.port.topBaseX + count * sheetLayout.port.horizontalStepX,
    y: sheetLayout.port.bottomY,
  };
}

export function defaultSplitConnectionLabelPositionsForIndex(index: number): {
  firstLabelPosition: XY;
  secondLabelPosition: XY;
} {
  const firstLabelPosition = defaultLabelPositionForIndex(index);
  return {
    firstLabelPosition,
    secondLabelPosition: {
      x: firstLabelPosition.x + sheetLayout.label.splitPairOffset.x,
      y: firstLabelPosition.y + sheetLayout.label.splitPairOffset.y,
    },
  };
}
