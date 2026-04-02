import { endpointKey, getVisibleNodePins } from "@nohal/core/graph";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNodeInstance,
  Size,
  XY,
} from "@nohal/core/types";
import { node as nodeConst } from "./constants/nodes";
import { pin as pinConst } from "./constants/pins";
import { surface } from "./constants/surfaces";

export type BandPinLabelMode = "horizontal" | "vertical";

export interface NodeLayout extends Size {
  topBandHeight: number;
  topLabelMode: BandPinLabelMode;
  bottomBandHeight: number;
  bottomLabelMode: BandPinLabelMode;
  pinPositionsLocal: Record<string, XY>;
}

export interface SheetSceneLayout {
  nodeLayouts: Map<string, NodeLayout>;
  endpointPoints: Map<string, XY>;
}

const layoutHeuristics = {
  monoText: {
    charWidthAt12: 7.2,
    baseFontSize: 12,
  },
  sideLabels: {
    // Side pin bubbles and labels sit roughly 25px away from the body on each side.
    clearance: 50,
    gap: 16,
  },
  bandPinLabels: {
    fontSize: 11,
    horizontalPadding: 16,
    singlePinExtraWidth: 20,
    stepBasePadding: 6,
    stepGap: 8,
  },
  nodeEdgePinInset: 10,
} as const;

function estimateMonoTextWidth(text: string, fontSize: number): number {
  return Math.ceil(
    text.length *
      layoutHeuristics.monoText.charWidthAt12 *
      (fontSize / layoutHeuristics.monoText.baseFontSize),
  );
}

function computeSidePinWidth(
  leftNames: string[],
  rightNames: string[],
): number {
  const leftMax = Math.max(
    0,
    ...leftNames.map((name) =>
      estimateMonoTextWidth(name, layoutHeuristics.monoText.baseFontSize),
    ),
  );
  const rightMax = Math.max(
    0,
    ...rightNames.map((name) =>
      estimateMonoTextWidth(name, layoutHeuristics.monoText.baseFontSize),
    ),
  );
  return (
    leftMax +
    rightMax +
    layoutHeuristics.sideLabels.clearance +
    layoutHeuristics.sideLabels.gap
  );
}

function computeBandPinWidthVertical(pinNames: string[]): number {
  if (pinNames.length === 0) return 0;
  return Math.ceil(pinConst.columnStep * (pinNames.length + 1));
}

function computeBandPinWidthHorizontal(pinNames: string[]): number {
  if (pinNames.length === 0) return 0;

  const pillWidths = pinNames.map(
    (name) =>
      estimateMonoTextWidth(name, layoutHeuristics.bandPinLabels.fontSize) +
      layoutHeuristics.bandPinLabels.horizontalPadding,
  );
  const count = pillWidths.length;
  const maxPill = Math.max(...pillWidths);

  if (count === 1) {
    return maxPill + layoutHeuristics.bandPinLabels.singlePinExtraWidth;
  }

  let requiredStep =
    maxPill / 2 + layoutHeuristics.bandPinLabels.stepBasePadding;
  for (let i = 0; i < pillWidths.length - 1; i += 1) {
    requiredStep = Math.max(
      requiredStep,
      (pillWidths[i] + pillWidths[i + 1]) / 2 +
        layoutHeuristics.bandPinLabels.stepGap,
    );
  }
  return Math.ceil(requiredStep * (count + 1));
}

function computeBandHeightVertical(pinNames: string[]): number {
  if (pinNames.length === 0) return 0;

  const maxRotatedTextSpan = Math.max(
    ...pinNames.map((name) =>
      estimateMonoTextWidth(name, layoutHeuristics.bandPinLabels.fontSize),
    ),
  );
  const tallestPill = Math.max(
    pinConst.bottom.width,
    maxRotatedTextSpan + pinConst.bottom.textPadding,
  );
  return tallestPill + pinConst.bottom.dotGap + surface.pin.radius;
}

function computeBandHeightHorizontal(pinNames: string[]): number {
  if (pinNames.length === 0) return 0;
  return (
    nodeConst.bottom.height -
    pinConst.band.inset +
    pinConst.bottom.dotGap +
    surface.pin.radius
  );
}

function pickBandLayout(
  pinNames: string[],
  sideWidth: number,
  sideHeight: number,
): {
  mode: BandPinLabelMode;
  bandHeight: number;
  widthRequirement: number;
} {
  if (pinNames.length === 0) {
    return {
      mode: "horizontal",
      bandHeight: 0,
      widthRequirement: 0,
    };
  }

  const candidates = (["horizontal", "vertical"] as const).map((mode) => {
    const bandHeight =
      mode === "horizontal"
        ? computeBandHeightHorizontal(pinNames)
        : computeBandHeightVertical(pinNames);
    const widthRequirement =
      mode === "horizontal"
        ? computeBandPinWidthHorizontal(pinNames)
        : computeBandPinWidthVertical(pinNames);
    const candidateWidth = Math.max(
      nodeConst.width,
      sideWidth,
      widthRequirement,
    );
    const candidateHeight =
      nodeConst.header.height +
      bandHeight +
      sideHeight +
      nodeConst.sectionGap +
      nodeConst.body.bottomPadding;
    return {
      mode,
      bandHeight,
      widthRequirement,
      area: candidateWidth * candidateHeight,
    };
  });

  const best = candidates.reduce((acc, item) => {
    if (item.area < acc.area) return item;
    if (item.area === acc.area && item.mode === "horizontal") return item;
    return acc;
  });

  return {
    mode: best.mode,
    bandHeight: best.bandHeight,
    widthRequirement: best.widthRequirement,
  };
}

export function computeNodeLayout(
  project: NoHALProject,
  sheet: SheetDefinition,
  node: SheetNodeInstance,
): NodeLayout {
  const pins = getVisibleNodePins(project, sheet, node);
  const left = pins.filter((p) => p.side === "left");
  const right = pins.filter((p) => p.side === "right");
  const top = pins.filter((p) => p.side === "top");
  const bottom = pins.filter((p) => p.side === "bottom");
  const sideWidth = computeSidePinWidth(
    left.map((pin) => pin.name),
    right.map((pin) => pin.name),
  );

  const rows = Math.max(left.length, right.length, 1);
  const sideHeight = rows * nodeConst.side.rowHeight;
  const topNames = top.map((pin) => pin.name);
  const bottomNames = bottom.map((pin) => pin.name);

  const topBandLayout = pickBandLayout(topNames, sideWidth, sideHeight);
  const bottomBandLayout = pickBandLayout(bottomNames, sideWidth, sideHeight);

  const topLabelMode = topBandLayout.mode;
  const topBandHeight = topBandLayout.bandHeight;
  const topWidth = topBandLayout.widthRequirement;
  const bottomLabelMode = bottomBandLayout.mode;
  const bottomBandHeight = bottomBandLayout.bandHeight;
  const bottomWidth = bottomBandLayout.widthRequirement;

  const width = Math.max(nodeConst.width, sideWidth, topWidth, bottomWidth);
  const topHeight = top.length > 0 ? topBandHeight + nodeConst.sectionGap : 0;
  const bottomHeight =
    bottom.length > 0 ? bottomBandHeight + nodeConst.sectionGap : 0;
  const height =
    nodeConst.header.height +
    topHeight +
    sideHeight +
    bottomHeight +
    nodeConst.body.bottomPadding;
  const pinPositionsLocal: Record<string, XY> = {};

  top.forEach((pin, idx) => {
    const step = width / (top.length + 1);
    pinPositionsLocal[pin.key] = {
      x: step * (idx + 1),
      y: nodeConst.header.height + nodeConst.sectionGap,
    };
  });

  left.forEach((pin, idx) => {
    pinPositionsLocal[pin.key] = {
      x: layoutHeuristics.nodeEdgePinInset,
      y:
        nodeConst.header.height +
        topHeight +
        idx * nodeConst.side.rowHeight +
        nodeConst.side.rowHeight / 2,
    };
  });

  right.forEach((pin, idx) => {
    pinPositionsLocal[pin.key] = {
      x: width - layoutHeuristics.nodeEdgePinInset,
      y:
        nodeConst.header.height +
        topHeight +
        idx * nodeConst.side.rowHeight +
        nodeConst.side.rowHeight / 2,
    };
  });

  bottom.forEach((pin, idx) => {
    const step = width / (bottom.length + 1);
    pinPositionsLocal[pin.key] = {
      x: step * (idx + 1),
      y: height - nodeConst.sectionGap,
    };
  });

  return {
    width,
    height,
    topBandHeight,
    topLabelMode,
    bottomBandHeight,
    bottomLabelMode,
    pinPositionsLocal,
  };
}

export function endpointPointOf(
  sheet: SheetDefinition,
  layouts: Map<string, NodeLayout>,
  endpoint: SheetEndpointRef,
): XY | null {
  if (endpoint.kind === "sheet-port") {
    const port = sheet.ports.find((p) => p.id === endpoint.portId);
    return port ? { x: port.position.x, y: port.position.y } : null;
  }
  const node = sheet.nodes.find((n) => n.id === endpoint.nodeId);
  const layout = layouts.get(endpoint.nodeId);
  if (!node || !layout) return null;
  const local = layout.pinPositionsLocal[endpoint.pinKey];
  if (!local) return null;
  return { x: node.position.x + local.x, y: node.position.y + local.y };
}

export function buildSheetSceneLayout(
  project: NoHALProject,
  sheet: SheetDefinition,
): SheetSceneLayout {
  const nodeLayouts = new Map(
    sheet.nodes.map((n) => [n.id, computeNodeLayout(project, sheet, n)]),
  );
  const endpointPoints = new Map<string, XY>();

  for (const port of sheet.ports) {
    endpointPoints.set(endpointKey({ kind: "sheet-port", portId: port.id }), {
      x: port.position.x,
      y: port.position.y,
    });
  }

  for (const node of sheet.nodes) {
    const layout = nodeLayouts.get(node.id);
    if (!layout) continue;
    for (const [pinKey, pt] of Object.entries(layout.pinPositionsLocal)) {
      endpointPoints.set(
        endpointKey({ kind: "node-pin", nodeId: node.id, pinKey }),
        { x: node.position.x + pt.x, y: node.position.y + pt.y },
      );
    }
  }

  return { nodeLayouts, endpointPoints };
}
