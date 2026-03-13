import Konva from "konva";
import {
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
  WIRE_DEFAULT_STROKE,
  WIRE_DEFAULT_STROKE_WIDTH,
  WIRE_HIT_STROKE_WIDTH,
  WIRE_PENDING_DASH,
  WIRE_PENDING_STROKE,
  WIRE_PENDING_STROKE_WIDTH,
  WIRE_SELECTED_STROKE,
  WIRE_SELECTED_STROKE_WIDTH,
} from "../constants";
import type { Pt } from "../layout";
import { getLabelAnchorPoint } from "./anchors";
import {
  getCursorPos,
  getEndpointPoint,
  getLabelPosition,
  getPointerWorldPos,
} from "./endpoints";
import { insertWaypointOnConnection } from "./interaction";
import { getSheetLookup } from "./lookup";
import {
  boundsFromPoints,
  buildDisplayWirePoints,
  drawWirePath,
  setCullBounds,
  updateWirePathShape,
} from "./paths";
import type { KonvaSheetSceneWiresContext } from "./types";

export function redraw(ctx: KonvaSheetSceneWiresContext): void {
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
      redraw(ctx);
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
      redraw(ctx);
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
          redraw(ctx);
        });

        handle.on("contextmenu", (evt) => {
          evt.cancelBubble = true;
          if ("preventDefault" in evt.evt) evt.evt.preventDefault();
          if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
          ctx.setSelectedConnectionId(conn.id);
          ctx.setSelectedWaypointIndex(i);
          redraw(ctx);
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
