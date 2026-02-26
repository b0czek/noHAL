import Konva from "konva";
import { getNodePins } from "../../shared/graph";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
} from "../../shared/types";
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

function distSqPointToSegment(p: Pt, a: Pt, b: Pt): number {
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

function findNearestSegmentIndex(routePoints: Pt[], point: Pt): number {
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
  if (side === "left") return { x: -1, y: 0 };
  if (side === "right") return { x: 1, y: 0 };
  if (side === "top") return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

function getEndpointNormal(
  project: NoHALProject,
  sheet: SheetDefinition,
  endpoint: SheetEndpointRef,
): Pt | null {
  if (endpoint.kind === "sheet-port") {
    const port = sheet.ports.find((p) => p.id === endpoint.portId);
    return port ? sideNormal(port.side) : null;
  }

  const node = sheet.nodes.find((n) => n.id === endpoint.nodeId);
  if (!node) return null;
  const pin = getNodePins(project, node).find((p) => p.key === endpoint.pinKey);
  if (!pin) return null;
  return sideNormal(pin.side);
}

function buildDisplayWirePoints(args: {
  project: NoHALProject;
  sheet: SheetDefinition;
  rawPoints: Pt[];
  startEndpoint: SheetEndpointRef;
  endEndpoint?: SheetEndpointRef | null;
}): Pt[] {
  const { project, sheet, rawPoints, startEndpoint, endEndpoint } = args;
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
  const startNormal = getEndpointNormal(project, sheet, startEndpoint);
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
    const endNormal = getEndpointNormal(project, sheet, endEndpoint);
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

function updateWirePathShape(line: Konva.Line, points: Pt[]): void {
  if (points.length < 2) return;
  const rawHitStroke = line.hitStrokeWidth();
  const hitStroke = typeof rawHitStroke === "number" ? rawHitStroke : 0;
  const pad = Math.max(line.strokeWidth(), hitStroke) * 0.5 + 10;
  setCullBounds(line, boundsFromPoints(points, pad));
  if (points.length === 2) {
    const bez = makeBezierWire(points[0], points[1], {
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
  for (const p of points) flatPoints.push(p.x, p.y);
  line.setAttrs({
    points: flatPoints,
    bezier: false,
    tension: WIRE_PATH_TENSION,
  });
}

function drawWirePath(
  ctx: KonvaSheetSceneWiresContext,
  points: Pt[],
  attrs: WireAttrs,
): Konva.Line | null {
  if (points.length < 2) return null;
  if (points.length === 2) return drawWire(ctx, points[0], points[1], attrs);

  const flatPoints: number[] = [];
  for (const p of points) flatPoints.push(p.x, p.y);
  const line = new Konva.Line({
    points: flatPoints,
    tension: WIRE_PATH_TENSION,
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
  setCullBounds(line, boundsFromPoints(points, pad));
  ctx.wireWorld.add(line);
  return line;
}

function getNodePosition(
  ctx: KonvaSheetSceneWiresContext,
  sheet: SheetDefinition,
  nodeId: string,
): Pt | null {
  const live = ctx.getLiveNodePositions().get(nodeId);
  if (live) return live;
  const node = sheet.nodes.find((n) => n.id === nodeId);
  return node ? node.position : null;
}

function getPortPosition(
  ctx: KonvaSheetSceneWiresContext,
  sheet: SheetDefinition,
  portId: string,
): Pt | null {
  const live = ctx.getLivePortPositions().get(portId);
  if (live) return live;
  const port = sheet.ports.find((p) => p.id === portId);
  return port ? port.position : null;
}

function getLabelPosition(
  ctx: KonvaSheetSceneWiresContext,
  sheet: SheetDefinition,
  labelId: string,
): Pt | null {
  const live = ctx.getLiveLabelPositions().get(labelId);
  if (live) return live;
  const label = sheet.labels.find((l) => l.id === labelId);
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

function rotateVec(x: number, y: number, radians: number): Pt {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return {
    x: x * c - y * s,
    y: x * s + y * c,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getLabelAnchorPoint(
  ctx: KonvaSheetSceneWiresContext,
  sheet: SheetDefinition,
  labelId: string,
  toward: Pt,
): Pt | null {
  const live = ctx.getLiveLabelPositions().get(labelId);
  const label = sheet.labels.find((l) => l.id === labelId);
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
  sheet: SheetDefinition,
  endpoint: SheetEndpointRef,
): Pt | null {
  if (endpoint.kind === "sheet-port") {
    return getPortPosition(ctx, sheet, endpoint.portId);
  }

  const layout = ctx.getNodeLayouts().get(endpoint.nodeId);
  const local = layout?.pinPositionsLocal[endpoint.pinKey];
  if (!layout || !local) return null;
  const nodePos = getNodePosition(ctx, sheet, endpoint.nodeId);
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

  ctx.wireWorld.destroyChildren();

  for (const conn of sheet.directConnections) {
    const a = getEndpointPoint(ctx, sheet, conn.a);
    const b = getEndpointPoint(ctx, sheet, conn.b);
    if (!a || !b) continue;

    const routePoints: Pt[] = [
      a,
      ...(conn.waypoints ?? []).map((p) => ({ x: p.x, y: p.y })),
      b,
    ];
    const displayRoutePoints = buildDisplayWirePoints({
      project: state.project,
      sheet,
      rawPoints: routePoints,
      startEndpoint: conn.a,
      endEndpoint: conn.b,
    });
    const selected = ctx.getSelectedConnectionId() === conn.id;
    const wire = drawWirePath(ctx, displayRoutePoints, {
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
        const isSelectedWaypoint = ctx.getSelectedWaypointIndex() === i;
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
              project: state.project,
              sheet,
              rawPoints: routePoints,
              startEndpoint: conn.a,
              endEndpoint: conn.b,
            }),
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
              project: state.project,
              sheet,
              rawPoints: routePoints,
              startEndpoint: conn.a,
              endEndpoint: conn.b,
            }),
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
    const ep = getEndpointPoint(ctx, sheet, anchor.endpoint);
    const labelPos = ep
      ? getLabelAnchorPoint(ctx, sheet, anchor.labelId, ep)
      : getLabelPosition(ctx, sheet, anchor.labelId);
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
    const a = getEndpointPoint(ctx, sheet, pendingEndpoint);
    const cursor = getCursorPos(ctx);
    if (a && cursor) {
      const pendingRawPoints = [a, ...pendingWirePoints, cursor];
      const pendingDisplayPoints = buildDisplayWirePoints({
        project: state.project,
        sheet,
        rawPoints: pendingRawPoints,
        startEndpoint: pendingEndpoint,
        endEndpoint: null,
      });
      drawWirePath(ctx, pendingDisplayPoints, {
        stroke: WIRE_PENDING_STROKE,
        strokeWidth: WIRE_PENDING_STROKE_WIDTH,
        dash: WIRE_PENDING_DASH,
        listening: false,
      });
    }
  }

  ctx.wireLayer.batchDraw();
}
