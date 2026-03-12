import type { SplitConnectionLabelPositions } from "@nohal/core/src/sheet";
import type { Pt } from "./layout";

export type EndpointSide = "left" | "right" | "top" | "bottom";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function rotateVec(x: number, y: number, radians: number): Pt {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return {
    x: x * c - y * s,
    y: x * s + y * c,
  };
}

export function normalForSide(side: EndpointSide): Pt {
  if (side === "left") return { x: -1, y: 0 };
  if (side === "right") return { x: 1, y: 0 };
  if (side === "top") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

export function distSqPointToSegment(p: Pt, a: Pt, b: Pt): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq <= 1e-9) return apx * apx + apy * apy;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
  const cx = a.x + abx * t;
  const cy = a.y + aby * t;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return dx * dx + dy * dy;
}

export function findNearestSegmentIndex(routePoints: Pt[], point: Pt): number {
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

export function normalizeVector(x: number, y: number): Pt | null {
  const length = Math.hypot(x, y);
  if (length <= 1e-6) return null;
  return { x: x / length, y: y / length };
}

function getLabelPositionNearEndpoint(args: {
  endpoint: Pt;
  normal: Pt | null;
  wireDirection: Pt | null;
}): Pt {
  const { endpoint, normal, wireDirection } = args;
  const outward = normal ?? wireDirection ?? { x: 1, y: 0 };
  const tangent =
    wireDirection ??
    (Math.abs(outward.x) > 0.5 ? { x: 0, y: 1 } : { x: 1, y: 0 });
  const approxLabelWidth = 116;
  const edgeGap = 24;
  const tangentNudge = 18;

  if (Math.abs(outward.x) >= Math.abs(outward.y)) {
    return {
      x:
        outward.x < 0
          ? endpoint.x - approxLabelWidth - edgeGap
          : endpoint.x + edgeGap,
      y: endpoint.y + tangent.y * tangentNudge,
    };
  }

  return {
    x: endpoint.x - approxLabelWidth * 0.5 + tangent.x * tangentNudge,
    y: endpoint.y + (outward.y < 0 ? -32 : 32),
  };
}

export function computeSplitLabelPositions(args: {
  startEndpointPoint: Pt;
  endEndpointPoint: Pt;
  startEndpointNormal: Pt | null;
  endEndpointNormal: Pt | null;
  displayRoutePoints: Pt[];
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
