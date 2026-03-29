import type { ProjectWireStyle, SheetEndpointRef } from "@nohal/core/types";
import Konva from "konva";
import { wire } from "../constants/wires";
import type { Pt } from "../layout";
import type { SceneRuntime } from "../scene/types";
import { boundsFromPoints, getPathCullPadding, setCullBounds } from "./culling";
import { getEndpointNormal } from "./endpoints";
import type { SheetLookup, WireAttrs } from "./types";

const POINT_EPSILON = 0.01;

export function buildDisplayWirePoints(args: {
  lookup: SheetLookup;
  rawPoints: Pt[];
  startEndpoint: SheetEndpointRef;
  endEndpoint?: SheetEndpointRef | null;
}): Pt[] {
  const { lookup, rawPoints, startEndpoint, endEndpoint } = args;
  if (rawPoints.length < 2) return rawPoints;

  const out: Pt[] = [];
  const pushDistinct = (p: Pt) => {
    const prev = out[out.length - 1];
    if (
      !prev ||
      Math.abs(prev.x - p.x) > POINT_EPSILON ||
      Math.abs(prev.y - p.y) > POINT_EPSILON
    ) {
      out.push(p);
    }
  };

  const stubLen = wire.path.endpointStubLength;
  const start = rawPoints[0];
  const end = rawPoints[rawPoints.length - 1];

  pushDistinct(start);
  const startNormal = getEndpointNormal(startEndpoint, lookup);
  if (startNormal) {
    pushDistinct({
      x: start.x + startNormal.x * stubLen,
      y: start.y + startNormal.y * stubLen,
    });
  }

  for (let i = 1; i < rawPoints.length - 1; i += 1) {
    pushDistinct(rawPoints[i]);
  }

  if (endEndpoint) {
    const endNormal = getEndpointNormal(endEndpoint, lookup);
    if (endNormal) {
      pushDistinct({
        x: end.x + endNormal.x * stubLen,
        y: end.y + endNormal.y * stubLen,
      });
    }
  }

  pushDistinct(end);
  return out;
}

function makeBezierWire(a: Pt, b: Pt, attrs: WireAttrs): Konva.Line {
  const dx = Math.abs(b.x - a.x) * wire.path.bezierPull;
  const c1x = a.x + (b.x >= a.x ? dx : -dx);
  const c2x = b.x - (b.x >= a.x ? dx : -dx);
  return new Konva.Line({
    points: [a.x, a.y, c1x, a.y, c2x, b.y, b.x, b.y],
    bezier: true,
    stroke: attrs.stroke,
    strokeWidth: attrs.strokeWidth,
    dash: attrs.dash,
    listening: attrs.listening ?? false,
    hitStrokeWidth: attrs.hitStrokeWidth,
    lineCap: "round",
    lineJoin: "round",
  });
}

function buildRightAngleWirePoints(points: Pt[]): Pt[] {
  if (points.length < 2) return [...points];

  const out: Pt[] = [];
  const pushDistinct = (p: Pt) => {
    const prev = out[out.length - 1];
    if (
      !prev ||
      Math.abs(prev.x - p.x) > POINT_EPSILON ||
      Math.abs(prev.y - p.y) > POINT_EPSILON
    ) {
      out.push(p);
    }
  };

  pushDistinct(points[0]);
  for (let i = 1; i < points.length; i += 1) {
    const next = points[i];
    const prev = out[out.length - 1];
    if (!prev) {
      pushDistinct(next);
      continue;
    }
    if (
      Math.abs(prev.x - next.x) <= POINT_EPSILON ||
      Math.abs(prev.y - next.y) <= POINT_EPSILON
    ) {
      pushDistinct(next);
      continue;
    }

    const prior = out[out.length - 2];
    let elbow = { x: prev.x, y: next.y };
    if (
      prior &&
      Math.abs(prev.x - prior.x) > POINT_EPSILON &&
      Math.abs(prev.y - prior.y) <= POINT_EPSILON
    ) {
      elbow = { x: prev.x, y: next.y };
    } else if (
      prior &&
      Math.abs(prev.y - prior.y) > POINT_EPSILON &&
      Math.abs(prev.x - prior.x) <= POINT_EPSILON
    ) {
      elbow = { x: next.x, y: prev.y };
    } else if (Math.abs(next.x - prev.x) >= Math.abs(next.y - prev.y)) {
      elbow = { x: next.x, y: prev.y };
    } else {
      elbow = { x: prev.x, y: next.y };
    }

    pushDistinct(elbow);
    pushDistinct(next);
  }
  return out;
}

function buildWireShapePoints(points: Pt[], style: ProjectWireStyle): Pt[] {
  if (style === "right-angle") return buildRightAngleWirePoints(points);
  return points;
}

function drawWire(
  runtime: SceneRuntime,
  a: Pt,
  b: Pt,
  attrs: WireAttrs,
): Konva.Line {
  const line = makeBezierWire(a, b, attrs);
  const hitStroke =
    typeof attrs.hitStrokeWidth === "number" ? attrs.hitStrokeWidth : 0;
  const pad = getPathCullPadding({
    strokeWidth: attrs.strokeWidth,
    hitStrokeWidth: hitStroke,
  });
  setCullBounds(line, boundsFromPoints([a, b], pad));
  runtime.view.wireWorld.add(line);
  return line;
}

export function updateWirePathShape(
  line: Konva.Line,
  points: Pt[],
  style: ProjectWireStyle,
): void {
  if (points.length < 2) return;
  const shapePoints = buildWireShapePoints(points, style);
  const rawHitStroke = line.hitStrokeWidth();
  const hitStroke = typeof rawHitStroke === "number" ? rawHitStroke : 0;
  const pad = getPathCullPadding({
    strokeWidth: line.strokeWidth(),
    hitStrokeWidth: hitStroke,
  });
  setCullBounds(line, boundsFromPoints(shapePoints, pad));
  if (style === "curved" && shapePoints.length === 2) {
    const bez = makeBezierWire(shapePoints[0], shapePoints[1], {
      stroke: line.stroke(),
      strokeWidth: line.strokeWidth(),
      dash: line.dash(),
      listening: line.listening(),
      hitStrokeWidth: line.hitStrokeWidth(),
    });
    line.setAttrs({
      points: bez.points(),
      bezier: true,
      tension: 0,
    });
    return;
  }

  const flatPoints: number[] = [];
  for (const p of shapePoints) flatPoints.push(p.x, p.y);
  line.setAttrs({
    points: flatPoints,
    bezier: false,
    tension: style === "curved" ? wire.path.tension : 0,
  });
}

export function drawWirePath(
  runtime: SceneRuntime,
  points: Pt[],
  style: ProjectWireStyle,
  attrs: WireAttrs,
): Konva.Line | null {
  if (points.length < 2) return null;
  const shapePoints = buildWireShapePoints(points, style);
  if (style === "curved" && shapePoints.length === 2) {
    return drawWire(runtime, shapePoints[0], shapePoints[1], attrs);
  }

  const flatPoints: number[] = [];
  for (const p of shapePoints) flatPoints.push(p.x, p.y);
  const line = new Konva.Line({
    points: flatPoints,
    tension: style === "curved" ? wire.path.tension : 0,
    stroke: attrs.stroke,
    strokeWidth: attrs.strokeWidth,
    dash: attrs.dash,
    listening: attrs.listening ?? false,
    hitStrokeWidth: attrs.hitStrokeWidth,
    lineCap: "round",
    lineJoin: "round",
  });
  const hitStroke =
    typeof attrs.hitStrokeWidth === "number" ? attrs.hitStrokeWidth : 0;
  const pad = getPathCullPadding({
    strokeWidth: attrs.strokeWidth,
    hitStrokeWidth: hitStroke,
  });
  setCullBounds(line, boundsFromPoints(shapePoints, pad));
  runtime.view.wireWorld.add(line);
  return line;
}
