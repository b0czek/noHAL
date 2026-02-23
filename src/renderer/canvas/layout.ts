import { endpointKey, getNodePins } from "../../shared/graph";
import type { NoHALProject, SheetDefinition, SheetEndpointRef, SheetNodeInstance } from "../../shared/types";
import {
  BOTTOM_H,
  BOTTOM_PIN_COLUMN_STEP,
  BOTTOM_PIN_DOT_GAP,
  BOTTOM_PIN_PILL_W,
  BOTTOM_PIN_TEXT_PAD,
  HEADER_H,
  NODE_WIDTH,
  PIN_R,
  SIDE_ROW_H
} from "./constants";

export type Pt = { x: number; y: number };
export type BottomPinLabelMode = "horizontal" | "vertical";

export interface NodeLayout {
  width: number;
  height: number;
  bottomBandHeight: number;
  bottomLabelMode: BottomPinLabelMode;
  pinPositionsLocal: Record<string, Pt>;
}

export interface SheetSceneLayout {
  nodeLayouts: Map<string, NodeLayout>;
  endpointPoints: Map<string, Pt>;
}

const MONO_CHAR_WIDTH_AT_12 = 7.2;
const SIDE_LABEL_CLEARANCE = 50; // side pin bubbles/text start/end ~25px from the node edge
const SIDE_LABEL_GAP = 16;

function estimateMonoTextWidth(text: string, fontSize: number): number {
  return Math.ceil(text.length * MONO_CHAR_WIDTH_AT_12 * (fontSize / 12));
}

function computeSidePinWidth(leftNames: string[], rightNames: string[]): number {
  const leftMax = Math.max(0, ...leftNames.map((name) => estimateMonoTextWidth(name, 12)));
  const rightMax = Math.max(0, ...rightNames.map((name) => estimateMonoTextWidth(name, 12)));
  return leftMax + rightMax + SIDE_LABEL_CLEARANCE + SIDE_LABEL_GAP;
}

function computeBottomPinWidthVertical(bottomNames: string[]): number {
  if (bottomNames.length === 0) return 0;
  return Math.ceil(BOTTOM_PIN_COLUMN_STEP * (bottomNames.length + 1));
}

function computeBottomPinWidthHorizontal(bottomNames: string[]): number {
  if (bottomNames.length === 0) return 0;

  const pillWidths = bottomNames.map((name) => estimateMonoTextWidth(name, 11) + 16);
  const count = pillWidths.length;
  const maxPill = Math.max(...pillWidths);

  if (count === 1) {
    return maxPill + 20;
  }

  let requiredStep = maxPill / 2 + 6;
  for (let i = 0; i < pillWidths.length - 1; i += 1) {
    requiredStep = Math.max(requiredStep, (pillWidths[i] + pillWidths[i + 1]) / 2 + 8);
  }
  return Math.ceil(requiredStep * (count + 1));
}

function computeBottomBandHeightVertical(bottomNames: string[]): number {
  if (bottomNames.length === 0) return 0;

  const maxRotatedTextSpan = Math.max(...bottomNames.map((name) => estimateMonoTextWidth(name, 11)));
  const tallestPill = Math.max(BOTTOM_PIN_PILL_W, maxRotatedTextSpan + BOTTOM_PIN_TEXT_PAD);
  return tallestPill + BOTTOM_PIN_DOT_GAP + PIN_R;
}

function computeBottomBandHeightHorizontal(bottomNames: string[]): number {
  if (bottomNames.length === 0) return 0;
  return (BOTTOM_H - 4) + BOTTOM_PIN_DOT_GAP + PIN_R;
}

export function computeNodeLayout(project: NoHALProject, node: SheetNodeInstance): NodeLayout {
  const pins = getNodePins(project, node);
  const left = pins.filter((p) => p.side === "left");
  const right = pins.filter((p) => p.side === "right");
  const bottom = pins.filter((p) => p.side === "bottom");
  const sideWidth = computeSidePinWidth(
    left.map((pin) => pin.name),
    right.map((pin) => pin.name)
  );

  const rows = Math.max(left.length, right.length, 1);
  const sideHeight = rows * SIDE_ROW_H;
  const bottomNames = bottom.map((pin) => pin.name);

  let bottomLabelMode: BottomPinLabelMode = "horizontal";
  let bottomBandHeight = 0;
  let bottomWidth = 0;

  if (bottomNames.length > 0) {
    const candidates = (["horizontal", "vertical"] as const).map((mode) => {
      const bandHeight =
        mode === "horizontal"
          ? computeBottomBandHeightHorizontal(bottomNames)
          : computeBottomBandHeightVertical(bottomNames);
      const widthRequirement =
        mode === "horizontal"
          ? computeBottomPinWidthHorizontal(bottomNames)
          : computeBottomPinWidthVertical(bottomNames);
      const candidateWidth = Math.max(NODE_WIDTH, sideWidth, widthRequirement);
      const candidateHeight = HEADER_H + sideHeight + bandHeight + 10 + 12;
      return {
        mode,
        bandHeight,
        widthRequirement,
        area: candidateWidth * candidateHeight
      };
    });

    const best = candidates.reduce((acc, item) => {
      if (item.area < acc.area) return item;
      if (item.area === acc.area && item.mode === "horizontal") return item;
      return acc;
    });

    bottomLabelMode = best.mode;
    bottomBandHeight = best.bandHeight;
    bottomWidth = best.widthRequirement;
  }

  const width = Math.max(NODE_WIDTH, sideWidth, bottomWidth);
  const bottomHeight = bottom.length > 0 ? bottomBandHeight + 10 : 0;
  const height = HEADER_H + sideHeight + bottomHeight + 12;
  const pinPositionsLocal: Record<string, Pt> = {};

  left.forEach((pin, idx) => {
    pinPositionsLocal[pin.key] = { x: 10, y: HEADER_H + idx * SIDE_ROW_H + SIDE_ROW_H / 2 };
  });

  right.forEach((pin, idx) => {
    pinPositionsLocal[pin.key] = {
      x: width - 10,
      y: HEADER_H + idx * SIDE_ROW_H + SIDE_ROW_H / 2
    };
  });

  bottom.forEach((pin, idx) => {
    const step = width / (bottom.length + 1);
    pinPositionsLocal[pin.key] = {
      x: step * (idx + 1),
      y: height - 10
    };
  });

  return {
    width,
    height,
    bottomBandHeight,
    bottomLabelMode,
    pinPositionsLocal
  };
}

export function endpointPointOf(
  sheet: SheetDefinition,
  layouts: Map<string, NodeLayout>,
  endpoint: SheetEndpointRef
): Pt | null {
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

export function buildSheetSceneLayout(project: NoHALProject, sheet: SheetDefinition): SheetSceneLayout {
  const nodeLayouts = new Map(sheet.nodes.map((n) => [n.id, computeNodeLayout(project, n)]));
  const endpointPoints = new Map<string, Pt>();

  for (const port of sheet.ports) {
    endpointPoints.set(endpointKey({ kind: "sheet-port", portId: port.id }), {
      x: port.position.x,
      y: port.position.y
    });
  }

  for (const node of sheet.nodes) {
    const layout = nodeLayouts.get(node.id);
    if (!layout) continue;
    for (const [pinKey, pt] of Object.entries(layout.pinPositionsLocal)) {
      endpointPoints.set(endpointKey({ kind: "node-pin", nodeId: node.id, pinKey }), {
        x: node.position.x + pt.x,
        y: node.position.y + pt.y
      });
    }
  }

  return { nodeLayouts, endpointPoints };
}
