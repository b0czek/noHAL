import { getNodePins } from "@nohal/core/src/graph";
import type { SplitConnectionLabelPositions } from "@nohal/core/src/sheet";
import type {
  NoHALProject,
  ProjectWireStyle,
  SheetDefinition,
  SheetEndpointRef,
} from "@nohal/core/src/types";
import Konva from "konva";
import {
  FONT_MONO,
  FONT_SANS,
  LABEL_ANCHOR_DASH,
  LABEL_ANCHOR_STROKE,
  LABEL_ANCHOR_STROKE_WIDTH,
  WAYPOINT_HANDLE_FILL,
  WAYPOINT_HANDLE_HIT_STROKE_WIDTH,
  WAYPOINT_HANDLE_RADIUS,
  WAYPOINT_HANDLE_SELECTED_FILL,
  WAYPOINT_HANDLE_SELECTED_RADIUS,
  WAYPOINT_HANDLE_STROKE,
  WAYPOINT_HANDLE_STROKE_WIDTH,
  WIRE_BEZIER_PULL,
  WIRE_DEFAULT_STROKE,
  WIRE_DEFAULT_STROKE_WIDTH,
  WIRE_ENDPOINT_STUB_LEN,
  WIRE_HIT_STROKE_WIDTH,
  WIRE_PATH_TENSION,
  WIRE_PENDING_DASH,
  WIRE_PENDING_STROKE,
  WIRE_PENDING_STROKE_WIDTH,
  WIRE_SELECTED_STROKE,
  WIRE_SELECTED_STROKE_WIDTH,
} from "./constants";
import type { SceneCallbacks, SceneRenderState } from "./konvaSheetSceneTypes";
import type { NodeLayout, Pt } from "./layout";
import {
  clamp,
  computeSplitLabelPositions,
  findNearestSegmentIndex,
  normalForSide,
  rotateVec,
} from "./wireGeometry";

type WireAttrs = {
  stroke: string | CanvasGradient;
  strokeWidth: number;
  dash?: number[];
  listening?: boolean;
  hitStrokeWidth?: number | "auto";
};

type CullBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EndpointSide = "left" | "right" | "top" | "bottom";

export type SheetLookup = {
  nodesById: Map<string, SheetDefinition["nodes"][number]>;
  portsById: Map<string, SheetDefinition["ports"][number]>;
  labelsById: Map<string, SheetDefinition["labels"][number]>;
  nodePinSidesById: Map<string, Map<string, EndpointSide>>;
};

const sheetLookupCache = new WeakMap<SheetDefinition, SheetLookup>();

export function getSheetLookup(
  project: NoHALProject,
  sheet: SheetDefinition,
): SheetLookup {
  const cached = sheetLookupCache.get(sheet);
  if (cached) return cached;

  const lookup: SheetLookup = {
    nodesById: new Map(),
    portsById: new Map(),
    labelsById: new Map(),
    nodePinSidesById: new Map(),
  };

  for (const node of sheet.nodes) {
    lookup.nodesById.set(node.id, node);
    const pinSides = new Map<string, EndpointSide>();
    for (const pin of getNodePins(project, node)) {
      pinSides.set(pin.key, pin.side);
    }
    lookup.nodePinSidesById.set(node.id, pinSides);
  }
  for (const port of sheet.ports) lookup.portsById.set(port.id, port);
  for (const label of sheet.labels) lookup.labelsById.set(label.id, label);

  sheetLookupCache.set(sheet, lookup);
  return lookup;
}

export interface KonvaSheetSceneWiresContext {
  stage: Konva.Stage;
  wireLayer: Konva.Layer;
  wireWorld: Konva.Group;
  callbacks: Pick<
    SceneCallbacks,
    "onMoveConnectionWaypoints" | "onContextMenuRequest" | "onSelect"
  >;
  clampPos: (pos: Pt) => Pt;
  screenToWorld: (pos: Pt) => Pt;
  getCursorPosCache: () => Pt | null;
  getLastState: () => SceneRenderState | null;
  getNodeLayouts: () => Map<string, NodeLayout>;
  getLiveNodePositions: () => Map<string, Pt>;
  getLiveLabelPositions: () => Map<string, Pt>;
  getLivePortPositions: () => Map<string, Pt>;
  getSelectedConnectionId: () => string | null;
  setSelectedConnectionId: (id: string | null) => void;
  getSelectedWaypointIndex: () => number | null;
  setSelectedWaypointIndex: (index: number | null) => void;
}

function getPointerWorldPos(ctx: KonvaSheetSceneWiresContext): Pt | null {
  const pos = ctx.stage.getPointerPosition();
  if (!pos) return null;
  return ctx.clampPos(ctx.screenToWorld({ x: pos.x, y: pos.y }));
}

export function getSplitLabelPositionsForConnection(
  ctx: KonvaSheetSceneWiresContext,
  connectionId: string,
): SplitConnectionLabelPositions | null {
  const state = ctx.getLastState();
  if (!state) return null;

  const connection = state.sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) return null;

  const lookup = getSheetLookup(state.project, state.sheet);
  const startEndpointPoint = getEndpointPoint(ctx, lookup, connection.a);
  const endEndpointPoint = getEndpointPoint(ctx, lookup, connection.b);
  if (!startEndpointPoint || !endEndpointPoint) return null;

  const displayRoutePoints = buildDisplayWirePoints({
    lookup,
    rawPoints: [
      startEndpointPoint,
      ...(connection.waypoints ?? []).map((point) => ({
        x: point.x,
        y: point.y,
      })),
      endEndpointPoint,
    ],
    startEndpoint: connection.a,
    endEndpoint: connection.b,
  });

  return computeSplitLabelPositions({
    startEndpointPoint,
    endEndpointPoint,
    startEndpointNormal: getEndpointNormal(connection.a, lookup),
    endEndpointNormal: getEndpointNormal(connection.b, lookup),
    displayRoutePoints,
  });
}

export function deleteSelectedWaypoint(
  ctx: KonvaSheetSceneWiresContext,
): boolean {
  const state = ctx.getLastState();
  const selectedConnectionId = ctx.getSelectedConnectionId();
  const selectedWaypointIndex = ctx.getSelectedWaypointIndex();
  if (!state || !selectedConnectionId || selectedWaypointIndex === null) {
    return false;
  }

  const conn = state.sheet.directConnections.find(
    (c) => c.id === selectedConnectionId,
  );
  if (
    !conn ||
    !conn.waypoints ||
    selectedWaypointIndex < 0 ||
    selectedWaypointIndex >= conn.waypoints.length
  ) {
    return false;
  }

  const nextWaypoints = conn.waypoints.filter(
    (_, i) => i !== selectedWaypointIndex,
  );
  ctx.setSelectedWaypointIndex(
    nextWaypoints.length === 0
      ? null
      : Math.min(selectedWaypointIndex, nextWaypoints.length - 1),
  );
  ctx.callbacks.onMoveConnectionWaypoints(
    conn.id,
    nextWaypoints.map((p) => ({ x: p.x, y: p.y })),
  );
  return true;
}

export function insertWaypointOnConnection(
  ctx: KonvaSheetSceneWiresContext,
  connectionId: string,
  routePoints: Pt[],
  point: Pt,
): void {
  const state = ctx.getLastState();
  if (!state) return;

  const conn = state.sheet.directConnections.find((c) => c.id === connectionId);
  if (!conn) return;

  const currentWaypoints = (conn.waypoints ?? []).map((p) => ({
    x: p.x,
    y: p.y,
  }));
  const insertAt = findNearestSegmentIndex(routePoints, point);
  currentWaypoints.splice(insertAt, 0, { x: point.x, y: point.y });
  ctx.setSelectedConnectionId(connectionId);
  ctx.setSelectedWaypointIndex(insertAt);
  ctx.callbacks.onMoveConnectionWaypoints(connectionId, currentWaypoints);
}

function sideNormal(side: "left" | "right" | "top" | "bottom"): Pt {
  return normalForSide(side);
}

export function getEndpointNormal(
  endpoint: SheetEndpointRef,
  lookup: SheetLookup,
): Pt | null {
  if (endpoint.kind === "sheet-port") {
    const port = lookup.portsById.get(endpoint.portId);
    return port ? sideNormal(port.side) : null;
  }

  const pinSide = lookup.nodePinSidesById
    .get(endpoint.nodeId)
    ?.get(endpoint.pinKey);
  if (!pinSide) return null;
  return sideNormal(pinSide);
}

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
      Math.abs(prev.x - p.x) > 0.01 ||
      Math.abs(prev.y - p.y) > 0.01
    ) {
      out.push(p);
    }
  };

  const stubLen = WIRE_ENDPOINT_STUB_LEN;
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
  const dx = Math.abs(b.x - a.x) * WIRE_BEZIER_PULL;
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
      Math.abs(prev.x - p.x) > 0.01 ||
      Math.abs(prev.y - p.y) > 0.01
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
      Math.abs(prev.x - next.x) <= 0.01 ||
      Math.abs(prev.y - next.y) <= 0.01
    ) {
      pushDistinct(next);
      continue;
    }

    const prior = out[out.length - 2];
    const elbow =
      prior &&
      Math.abs(prev.x - prior.x) > 0.01 &&
      Math.abs(prev.y - prior.y) <= 0.01
        ? { x: prev.x, y: next.y }
        : prior &&
            Math.abs(prev.y - prior.y) > 0.01 &&
            Math.abs(prev.x - prior.x) <= 0.01
          ? { x: next.x, y: prev.y }
          : Math.abs(next.x - prev.x) >= Math.abs(next.y - prev.y)
            ? { x: next.x, y: prev.y }
            : { x: prev.x, y: next.y };

    pushDistinct(elbow);
    pushDistinct(next);
  }
  return out;
}

function buildWireShapePoints(points: Pt[], style: ProjectWireStyle): Pt[] {
  if (style === "right-angle") return buildRightAngleWirePoints(points);
  return points;
}

function boundsFromPoints(points: Pt[], pad = 0): CullBounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

function setCullBounds(node: Konva.Node, bounds: CullBounds): void {
  node.setAttr("cullBounds", bounds);
}

function drawWire(
  ctx: KonvaSheetSceneWiresContext,
  a: Pt,
  b: Pt,
  attrs: WireAttrs,
): Konva.Line {
  const line = makeBezierWire(a, b, attrs);
  const hitStroke =
    typeof attrs.hitStrokeWidth === "number" ? attrs.hitStrokeWidth : 0;
  const pad = Math.max(attrs.strokeWidth, hitStroke) * 0.5 + 10;
  setCullBounds(line, boundsFromPoints([a, b], pad));
  ctx.wireWorld.add(line);
  return line;
}

function updateWirePathShape(
  line: Konva.Line,
  points: Pt[],
  style: ProjectWireStyle,
): void {
  if (points.length < 2) return;
  const shapePoints = buildWireShapePoints(points, style);
  const rawHitStroke = line.hitStrokeWidth();
  const hitStroke = typeof rawHitStroke === "number" ? rawHitStroke : 0;
  const pad = Math.max(line.strokeWidth(), hitStroke) * 0.5 + 10;
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
    tension: style === "curved" ? WIRE_PATH_TENSION : 0,
  });
}

function drawWirePath(
  ctx: KonvaSheetSceneWiresContext,
  points: Pt[],
  style: ProjectWireStyle,
  attrs: WireAttrs,
): Konva.Line | null {
  if (points.length < 2) return null;
  const shapePoints = buildWireShapePoints(points, style);
  if (style === "curved" && shapePoints.length === 2) {
    return drawWire(ctx, shapePoints[0], shapePoints[1], attrs);
  }

  const flatPoints: number[] = [];
  for (const p of shapePoints) flatPoints.push(p.x, p.y);
  const line = new Konva.Line({
    points: flatPoints,
    tension: style === "curved" ? WIRE_PATH_TENSION : 0,
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
  const pad = Math.max(attrs.strokeWidth, hitStroke) * 0.5 + 10;
  setCullBounds(line, boundsFromPoints(shapePoints, pad));
  ctx.wireWorld.add(line);
  return line;
}

function getNodePosition(
  ctx: KonvaSheetSceneWiresContext,
  lookup: SheetLookup,
  nodeId: string,
): Pt | null {
  const live = ctx.getLiveNodePositions().get(nodeId);
  if (live) return live;
  const node = lookup.nodesById.get(nodeId);
  return node ? node.position : null;
}

function getPortPosition(
  ctx: KonvaSheetSceneWiresContext,
  lookup: SheetLookup,
  portId: string,
): Pt | null {
  const live = ctx.getLivePortPositions().get(portId);
  if (live) return live;
  const port = lookup.portsById.get(portId);
  return port ? port.position : null;
}

function getLabelPosition(
  ctx: KonvaSheetSceneWiresContext,
  lookup: SheetLookup,
  labelId: string,
): Pt | null {
  const live = ctx.getLiveLabelPositions().get(labelId);
  if (live) return live;
  const label = lookup.labelsById.get(labelId);
  return label ? label.position : null;
}

const labelWidthMeasureCache = new Map<
  string,
  { scopeW: number; nameW: number }
>();

function getLabelBoxSize(label: SheetDefinition["labels"][number]): {
  width: number;
  height: number;
} {
  const cacheKey = `${label.scope}\u0000${label.name}`;
  let m = labelWidthMeasureCache.get(cacheKey);
  if (!m) {
    const scopeMeasure = new Konva.Text({
      text: label.scope,
      fontFamily: FONT_SANS,
      fontSize: 10,
    });
    const nameMeasure = new Konva.Text({
      text: label.name,
      fontFamily: FONT_MONO,
      fontSize: 12,
    });
    m = {
      scopeW: Math.ceil(scopeMeasure.width()),
      nameW: Math.ceil(nameMeasure.width()),
    };
    labelWidthMeasureCache.set(cacheKey, m);
    scopeMeasure.destroy();
    nameMeasure.destroy();
  }
  const width = 16 + m.scopeW + 8 + m.nameW + 10;
  const height = 22;
  return { width, height };
}

function getLabelAnchorPoint(
  ctx: KonvaSheetSceneWiresContext,
  lookup: SheetLookup,
  labelId: string,
  toward: Pt,
): Pt | null {
  const live = ctx.getLiveLabelPositions().get(labelId);
  const label = lookup.labelsById.get(labelId);
  if (!label) return null;
  const labelForBounds =
    live && (live.x !== label.position.x || live.y !== label.position.y)
      ? { ...label, position: live }
      : label;
  const { width, height } = getLabelBoxSize(labelForBounds);
  const localBounds = {
    left: 0,
    right: width,
    top: -height / 2,
    bottom: height / 2,
  };
  const rotationRad = ((labelForBounds.rotation ?? 0) * Math.PI) / 180;
  const towardLocal =
    rotationRad === 0
      ? {
          x: toward.x - labelForBounds.position.x,
          y: toward.y - labelForBounds.position.y,
        }
      : rotateVec(
          toward.x - labelForBounds.position.x,
          toward.y - labelForBounds.position.y,
          -rotationRad,
        );

  const outside =
    towardLocal.x < localBounds.left ||
    towardLocal.x > localBounds.right ||
    towardLocal.y < localBounds.top ||
    towardLocal.y > localBounds.bottom;

  const localAnchor = outside
    ? {
        x: clamp(towardLocal.x, localBounds.left, localBounds.right),
        y: clamp(towardLocal.y, localBounds.top, localBounds.bottom),
      }
    : (() => {
        const dLeft = Math.abs(towardLocal.x - localBounds.left);
        const dRight = Math.abs(localBounds.right - towardLocal.x);
        const dTop = Math.abs(towardLocal.y - localBounds.top);
        const dBottom = Math.abs(localBounds.bottom - towardLocal.y);
        const minDist = Math.min(dLeft, dRight, dTop, dBottom);

        if (minDist === dLeft) return { x: localBounds.left, y: towardLocal.y };
        if (minDist === dRight)
          return { x: localBounds.right, y: towardLocal.y };
        if (minDist === dTop) return { x: towardLocal.x, y: localBounds.top };
        return { x: towardLocal.x, y: localBounds.bottom };
      })();

  const worldAnchor =
    rotationRad === 0
      ? localAnchor
      : rotateVec(localAnchor.x, localAnchor.y, rotationRad);
  return {
    x: labelForBounds.position.x + worldAnchor.x,
    y: labelForBounds.position.y + worldAnchor.y,
  };
}

function getEndpointPoint(
  ctx: KonvaSheetSceneWiresContext,
  lookup: SheetLookup,
  endpoint: SheetEndpointRef,
): Pt | null {
  if (endpoint.kind === "sheet-port") {
    return getPortPosition(ctx, lookup, endpoint.portId);
  }

  const layout = ctx.getNodeLayouts().get(endpoint.nodeId);
  const local = layout?.pinPositionsLocal[endpoint.pinKey];
  if (!layout || !local) return null;
  const nodePos = getNodePosition(ctx, lookup, endpoint.nodeId);
  if (!nodePos) return null;
  return { x: nodePos.x + local.x, y: nodePos.y + local.y };
}

function getCursorPos(ctx: KonvaSheetSceneWiresContext): Pt | null {
  const cached = ctx.getCursorPosCache();
  if (cached) return cached;
  const pos = ctx.stage.getPointerPosition();
  return pos ? ctx.clampPos(ctx.screenToWorld({ x: pos.x, y: pos.y })) : null;
}

export function redrawWires(ctx: KonvaSheetSceneWiresContext): void {
  const state = ctx.getLastState();
  if (!state) return;

  const { sheet, pendingEndpoint, pendingWirePoints } = state;
  const wireStyle = state.project.ui.wireStyle;
  const lookup = getSheetLookup(state.project, sheet);
  const selectedConnectionId = ctx.getSelectedConnectionId();
  const selectedConn = selectedConnectionId
    ? sheet.directConnections.find((c) => c.id === selectedConnectionId)
    : null;

  if (!selectedConn) {
    ctx.setSelectedConnectionId(null);
    ctx.setSelectedWaypointIndex(null);
  } else {
    const selectedWaypointIndex = ctx.getSelectedWaypointIndex();
    if (
      selectedWaypointIndex !== null &&
      (selectedConn.waypoints?.length ?? 0) <= selectedWaypointIndex
    ) {
      const waypointCount = selectedConn.waypoints?.length ?? 0;
      ctx.setSelectedWaypointIndex(
        waypointCount > 0 ? waypointCount - 1 : null,
      );
    }
  }

  const activeSelectedConnectionId = ctx.getSelectedConnectionId();
  const activeSelectedWaypointIndex = ctx.getSelectedWaypointIndex();
  ctx.wireWorld.destroyChildren();

  for (const conn of sheet.directConnections) {
    const a = getEndpointPoint(ctx, lookup, conn.a);
    const b = getEndpointPoint(ctx, lookup, conn.b);
    if (!a || !b) continue;

    const routePoints: Pt[] = [
      a,
      ...(conn.waypoints ?? []).map((p) => ({ x: p.x, y: p.y })),
      b,
    ];
    const displayRoutePoints = buildDisplayWirePoints({
      lookup,
      rawPoints: routePoints,
      startEndpoint: conn.a,
      endEndpoint: conn.b,
    });
    const selected = activeSelectedConnectionId === conn.id;
    const wire = drawWirePath(ctx, displayRoutePoints, wireStyle, {
      stroke: selected ? WIRE_SELECTED_STROKE : WIRE_DEFAULT_STROKE,
      strokeWidth: selected
        ? WIRE_SELECTED_STROKE_WIDTH
        : WIRE_DEFAULT_STROKE_WIDTH,
      listening: true,
      hitStrokeWidth: WIRE_HIT_STROKE_WIDTH,
    });

    wire?.on("click tap", (evt) => {
      evt.cancelBubble = true;
      if (evt.evt instanceof MouseEvent && evt.evt.detail >= 2) {
        const point = getPointerWorldPos(ctx);
        if (!point) return;
        insertWaypointOnConnection(ctx, conn.id, routePoints, point);
        return;
      }
      ctx.callbacks.onSelect?.({ kind: "wire-connection", id: conn.id });
      ctx.setSelectedConnectionId(conn.id);
      ctx.setSelectedWaypointIndex(null);
      redrawWires(ctx);
    });

    wire?.on("dbltap", (evt) => {
      evt.cancelBubble = true;
      const point = getPointerWorldPos(ctx);
      if (!point) return;
      insertWaypointOnConnection(ctx, conn.id, routePoints, point);
    });

    wire?.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      ctx.setSelectedConnectionId(conn.id);
      ctx.setSelectedWaypointIndex(null);
      redrawWires(ctx);
      if (evt.evt instanceof MouseEvent) {
        ctx.callbacks.onContextMenuRequest?.({
          clientX: evt.evt.clientX,
          clientY: evt.evt.clientY,
          target: { kind: "wire-connection", connectionId: conn.id },
        });
      }
    });

    if (selected && (conn.waypoints?.length ?? 0) > 0 && wire) {
      const waypoints = conn.waypoints ?? [];
      for (let i = 0; i < waypoints.length; i += 1) {
        const isSelectedWaypoint = activeSelectedWaypointIndex === i;
        const waypointIndex = i + 1;
        const p = routePoints[waypointIndex];
        const handle = new Konva.Circle({
          x: p.x,
          y: p.y,
          radius: isSelectedWaypoint
            ? WAYPOINT_HANDLE_SELECTED_RADIUS
            : WAYPOINT_HANDLE_RADIUS,
          fill: isSelectedWaypoint
            ? WAYPOINT_HANDLE_SELECTED_FILL
            : WAYPOINT_HANDLE_FILL,
          stroke: WAYPOINT_HANDLE_STROKE,
          strokeWidth: WAYPOINT_HANDLE_STROKE_WIDTH,
          draggable: true,
          hitStrokeWidth: WAYPOINT_HANDLE_HIT_STROKE_WIDTH,
          dragBoundFunc: (pos) => ctx.clampPos(pos),
        });
        setCullBounds(
          handle,
          boundsFromPoints([p], WAYPOINT_HANDLE_HIT_STROKE_WIDTH * 0.5 + 12),
        );

        handle.on("click tap", (evt) => {
          evt.cancelBubble = true;
          ctx.callbacks.onSelect?.({ kind: "wire-connection", id: conn.id });
          ctx.setSelectedConnectionId(conn.id);
          ctx.setSelectedWaypointIndex(i);
          redrawWires(ctx);
        });

        handle.on("contextmenu", (evt) => {
          evt.cancelBubble = true;
          if ("preventDefault" in evt.evt) evt.evt.preventDefault();
          if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
          ctx.setSelectedConnectionId(conn.id);
          ctx.setSelectedWaypointIndex(i);
          redrawWires(ctx);
          if (evt.evt instanceof MouseEvent) {
            ctx.callbacks.onContextMenuRequest?.({
              clientX: evt.evt.clientX,
              clientY: evt.evt.clientY,
              target: {
                kind: "wire-waypoint",
                connectionId: conn.id,
                waypointIndex: i,
              },
            });
          }
        });

        handle.on("dragmove", () => {
          const pos = ctx.clampPos(handle.position());
          handle.position(pos);
          setCullBounds(
            handle,
            boundsFromPoints(
              [pos],
              WAYPOINT_HANDLE_HIT_STROKE_WIDTH * 0.5 + 12,
            ),
          );
          ctx.setSelectedConnectionId(conn.id);
          ctx.setSelectedWaypointIndex(i);
          routePoints[waypointIndex] = pos;
          updateWirePathShape(
            wire,
            buildDisplayWirePoints({
              lookup,
              rawPoints: routePoints,
              startEndpoint: conn.a,
              endEndpoint: conn.b,
            }),
            wireStyle,
          );
          ctx.wireLayer.batchDraw();
        });

        handle.on("dragend", () => {
          const pos = ctx.clampPos(handle.position());
          handle.position(pos);
          setCullBounds(
            handle,
            boundsFromPoints(
              [pos],
              WAYPOINT_HANDLE_HIT_STROKE_WIDTH * 0.5 + 12,
            ),
          );
          ctx.setSelectedConnectionId(conn.id);
          ctx.setSelectedWaypointIndex(i);
          routePoints[waypointIndex] = pos;
          updateWirePathShape(
            wire,
            buildDisplayWirePoints({
              lookup,
              rawPoints: routePoints,
              startEndpoint: conn.a,
              endEndpoint: conn.b,
            }),
            wireStyle,
          );
          ctx.callbacks.onMoveConnectionWaypoints(
            conn.id,
            routePoints.slice(1, -1).map((pt) => ({ x: pt.x, y: pt.y })),
          );
          ctx.wireLayer.batchDraw();
        });

        ctx.wireWorld.add(handle);
      }
    }
  }

  for (const anchor of sheet.labelAnchors) {
    const ep = getEndpointPoint(ctx, lookup, anchor.endpoint);
    const labelPos = ep
      ? getLabelAnchorPoint(ctx, lookup, anchor.labelId, ep)
      : getLabelPosition(ctx, lookup, anchor.labelId);
    if (!ep || !labelPos) continue;
    ctx.wireWorld.add(
      (() => {
        const line = new Konva.Line({
          points: [ep.x, ep.y, labelPos.x, labelPos.y],
          stroke: LABEL_ANCHOR_STROKE,
          strokeWidth: LABEL_ANCHOR_STROKE_WIDTH,
          dash: LABEL_ANCHOR_DASH,
          listening: false,
        });
        setCullBounds(
          line,
          boundsFromPoints([ep, labelPos], LABEL_ANCHOR_STROKE_WIDTH * 0.5 + 8),
        );
        return line;
      })(),
    );
  }

  if (pendingEndpoint) {
    const a = getEndpointPoint(ctx, lookup, pendingEndpoint);
    const cursor = getCursorPos(ctx);
    if (a && cursor) {
      const pendingRawPoints = [a, ...pendingWirePoints, cursor];
      const pendingDisplayPoints = buildDisplayWirePoints({
        lookup,
        rawPoints: pendingRawPoints,
        startEndpoint: pendingEndpoint,
        endEndpoint: null,
      });
      drawWirePath(ctx, pendingDisplayPoints, wireStyle, {
        stroke: WIRE_PENDING_STROKE,
        strokeWidth: WIRE_PENDING_STROKE_WIDTH,
        dash: WIRE_PENDING_DASH,
        listening: false,
      });
    }
  }

  ctx.wireLayer.batchDraw();
}
