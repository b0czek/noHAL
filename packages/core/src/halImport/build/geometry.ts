import type { ComponentPinDefinition } from "../../types";
import { buildLabel, buildNode, buildText } from "./constants";

export interface ImportNodeLayoutMetrics {
  bodyWidth: number;
  bodyHeight: number;
  leftLaneWidth: number;
  rightLaneWidth: number;
  sideRightOffsetX: number;
  sideLabelGapX: number;
  sideLabelStartY: number;
  sideLabelStepY: number;
  bottomLabelStartX: number;
  bottomLabelGapY: number;
  bottomLabelStepX: number;
  bottomLabelStepY: number;
  bottomLabelsPerRow: number;
  bottomPinCount: number;
  cellWidth: number;
  cellHeight: number;
}

const estimateMonoTextWidth = (text: string, fontSize: number) =>
  Math.ceil(
    text.length *
      buildText.mono.charWidthAt12 *
      (fontSize / buildText.mono.baseFontSize),
  );

const estimateSansTextWidth = (text: string, fontSize: number) =>
  Math.ceil(
    text.length *
      buildText.sans.charWidthAt10 *
      (fontSize / buildText.sans.baseFontSize),
  );

export const estimateImportedLabelWidth = (name: string) =>
  buildLabel.scope.leftPadding +
  estimateSansTextWidth("global", buildText.sans.baseFontSize) +
  buildLabel.scope.gap +
  estimateMonoTextWidth(name, buildText.mono.baseFontSize) +
  buildLabel.rightPadding;

export function computeEstimatedBodySize(pins: ComponentPinDefinition[]) {
  const leftNames = pins
    .filter((pin) => pin.direction === "in")
    .map((pin) => pin.name);
  const rightNames = pins
    .filter((pin) => pin.direction === "out")
    .map((pin) => pin.name);
  const bottomNames = pins
    .filter((pin) => pin.direction === "io")
    .map((pin) => pin.name);

  const leftMax = Math.max(
    0,
    ...leftNames.map((name) =>
      estimateMonoTextWidth(name, buildText.mono.baseFontSize),
    ),
  );
  const rightMax = Math.max(
    0,
    ...rightNames.map((name) =>
      estimateMonoTextWidth(name, buildText.mono.baseFontSize),
    ),
  );
  const sideWidth =
    leftMax +
    rightMax +
    buildNode.side.labelClearance +
    buildNode.side.labelGap;

  const rows = Math.max(leftNames.length, rightNames.length, 1);
  const sideHeight = rows * buildNode.side.rowHeight;

  let bottomWidth = 0;
  let bottomBandHeight = 0;
  if (bottomNames.length > 0) {
    const verticalWidth = Math.ceil(
      buildNode.bottom.pin.columnStep * (bottomNames.length + 1),
    );

    const horizontalPillWidths = bottomNames.map(
      (name) =>
        estimateMonoTextWidth(name, buildNode.bottom.pin.fontSize) +
        buildNode.pill.horizontalPadding,
    );
    let horizontalWidth = 0;
    if (horizontalPillWidths.length === 1) {
      horizontalWidth =
        (horizontalPillWidths[0] ?? 0) + buildNode.pill.horizontalSingleExtra;
    } else if (horizontalPillWidths.length > 1) {
      const maxPill = Math.max(...horizontalPillWidths);
      let requiredStep = maxPill / 2 + buildNode.pill.horizontalStepBasePadding;
      for (let index = 0; index < horizontalPillWidths.length - 1; index += 1) {
        requiredStep = Math.max(
          requiredStep,
          ((horizontalPillWidths[index] ?? 0) +
            (horizontalPillWidths[index + 1] ?? 0)) /
            2 +
            buildNode.pill.horizontalStepGap,
        );
      }
      horizontalWidth = Math.ceil(
        requiredStep * (horizontalPillWidths.length + 1),
      );
    }

    const verticalBandHeight =
      Math.max(
        buildNode.bottom.pin.pillWidth,
        Math.max(
          0,
          ...bottomNames.map((name) =>
            estimateMonoTextWidth(name, buildNode.bottom.pin.fontSize),
          ),
        ) + buildNode.bottom.pin.textPadding,
      ) +
      buildNode.bottom.pin.dotGap +
      buildNode.bottom.pin.radius;

    const horizontalBandHeight =
      buildNode.bottom.height -
      buildNode.pill.bandInset +
      buildNode.bottom.pin.dotGap +
      buildNode.bottom.pin.radius;

    const verticalCandidate = {
      width: Math.max(buildNode.width, sideWidth, verticalWidth),
      height:
        buildNode.header.height +
        sideHeight +
        verticalBandHeight +
        buildNode.bottom.bandGap +
        buildNode.bottom.padding,
      bandHeight: verticalBandHeight,
    };
    const horizontalCandidate = {
      width: Math.max(buildNode.width, sideWidth, horizontalWidth),
      height:
        buildNode.header.height +
        sideHeight +
        horizontalBandHeight +
        buildNode.bottom.bandGap +
        buildNode.bottom.padding,
      bandHeight: horizontalBandHeight,
    };
    const best =
      horizontalCandidate.width * horizontalCandidate.height <=
      verticalCandidate.width * verticalCandidate.height
        ? horizontalCandidate
        : verticalCandidate;
    bottomWidth = Math.max(
      0,
      best.width - Math.max(buildNode.width, sideWidth),
    );
    bottomBandHeight = best.bandHeight;
  }

  const bodyWidth = Math.max(
    buildNode.width,
    sideWidth,
    buildNode.width + bottomWidth,
  );
  const bottomHeight =
    bottomNames.length > 0 ? bottomBandHeight + buildNode.bottom.bandGap : 0;
  const bodyHeight =
    buildNode.header.height +
    sideHeight +
    bottomHeight +
    buildNode.bottom.padding;
  return { bodyWidth, bodyHeight };
}
