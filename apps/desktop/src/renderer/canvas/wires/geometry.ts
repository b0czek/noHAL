import type { SplitConnectionLabelPositions } from "@nohal/core/sheet";
import type { XY } from "@nohal/core/types";

export type EndpointSide = "left" | "right" | "top" | "bottom";

const SEGMENT_EPSILON_SQ = 1e-9;
const VECTOR_EPSILON = 1e-6;
const SIDE_AXIS_THRESHOLD = 0.5;
const APPROX_LABEL_WIDTH = 116;
const LABEL_WIDTH_CENTERING = 0.5;
const ENDPOINT_EDGE_GAP = 24;
const LABEL_TANGENT_NUDGE = 18;
const VERTICAL_LABEL_OFFSET = 32;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rotateVec(x: number, y: number, radians: number): XY {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return { x: x * c - y * s, y: x * s + y * c };
}

export function normalForSide(side: EndpointSide): XY {
  if (side === "left") return { x: -1, y: 0 };
  if (side === "right") return { x: 1, y: 0 };
  if (side === "top") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

export function distSqPointToSegment(p: XY, a: XY, b: XY): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq <= SEGMENT_EPSILON_SQ) return apx * apx + apy * apy;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return dx * dx + dy * dy;
}

export function findNearestSegmentIndex(routePoints: XY[], point: XY): number {
  let bestIndex = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < routePoints.length - 1; i += 1) {
    const d = distSqPointToSegment(point, routePoints[i], routePoints[i + 1]);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function normalizeVector(x: number, y: number): XY | null {
  const length = Math.hypot(x, y);
  if (length <= VECTOR_EPSILON) return null;
  return { x: x / length, y: y / length };
}

function getLabelPositionNearEndpoint(args: {
  endpoint: XY;
  normal: XY | null;
  wireDirection: XY | null;
}): XY {
  const { endpoint, normal, wireDirection } = args;
  const outward = normal ?? wireDirection ?? { x: 1, y: 0 };
  const tangent =
    wireDirection ??
    (Math.abs(outward.x) > SIDE_AXIS_THRESHOLD
      ? { x: 0, y: 1 }
      : { x: 1, y: 0 });

  if (Math.abs(outward.x) >= Math.abs(outward.y)) {
    return {
      x:
        outward.x < 0
          ? endpoint.x - APPROX_LABEL_WIDTH - ENDPOINT_EDGE_GAP
          : endpoint.x + ENDPOINT_EDGE_GAP,
      y: endpoint.y + tangent.y * LABEL_TANGENT_NUDGE,
    };
  }

  return {
    x:
      endpoint.x -
      APPROX_LABEL_WIDTH * LABEL_WIDTH_CENTERING +
      tangent.x * LABEL_TANGENT_NUDGE,
    y:
      endpoint.y +
      (outward.y < 0 ? -VERTICAL_LABEL_OFFSET : VERTICAL_LABEL_OFFSET),
  };
}

export function computeSplitLabelPositions(args: {
  startEndpointPoint: XY;
  endEndpointPoint: XY;
  startEndpointNormal: XY | null;
  endEndpointNormal: XY | null;
  displayRoutePoints: XY[];
}): SplitConnectionLabelPositions {
  const {
    startEndpointPoint,
    endEndpointPoint,
    startEndpointNormal,
    endEndpointNormal,
    displayRoutePoints,
  } = args;
  const firstAdjacentPoint = displayRoutePoints[1] ?? endEndpointPoint;
  const lastAdjacentPoint =
    displayRoutePoints[displayRoutePoints.length - 2] ?? startEndpointPoint;
  const startWireDirection = normalizeVector(
    firstAdjacentPoint.x - startEndpointPoint.x,
    firstAdjacentPoint.y - startEndpointPoint.y,
  );
  const endWireDirection = normalizeVector(
    lastAdjacentPoint.x - endEndpointPoint.x,
    lastAdjacentPoint.y - endEndpointPoint.y,
  );

  return {
    firstLabelPosition: getLabelPositionNearEndpoint({
      endpoint: startEndpointPoint,
      normal: startEndpointNormal,
      wireDirection: startWireDirection,
    }),
    secondLabelPosition: getLabelPositionNearEndpoint({
      endpoint: endEndpointPoint,
      normal: endEndpointNormal,
      wireDirection: endWireDirection,
    }),
  };
}
