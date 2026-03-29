import type { DirectConnection, SheetEndpointRef } from "@nohal/core/types";
import Konva from "konva";
import type { Selection } from "../../state/store/selectionTypes";
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
import { clampRuntimePos } from "../scene/bounds";
import type { SceneRuntime } from "../scene/types";
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

export function redraw(runtime: SceneRuntime): void {
  const state = runtime.state.lastState;
  if (!state) return;

  const { sheet, pendingEndpoint, pendingWirePoints } = state;
  const wireStyle = state.project.ui.wireStyle;
  const lookup = getSheetLookup(state.project, sheet);
  const { selectedConnectionId } = runtime.state;
  const selectedConn = selectedConnectionId
    ? sheet.directConnections.find((c) => c.id === selectedConnectionId)
    : null;
  const selectedConnWaypoints = selectedConn
    ? (runtime.graph.liveConnectionWaypoints.get(selectedConn.id) ??
      selectedConn.waypoints ??
      [])
    : [];

  if (!selectedConn) {
    runtime.state.selectedConnectionId = null;
    runtime.state.selectedWaypointIndex = null;
  } else {
    const { selectedWaypointIndex } = runtime.state;
    if (
      selectedWaypointIndex !== null &&
      selectedConnWaypoints.length <= selectedWaypointIndex
    ) {
      const waypointCount = selectedConnWaypoints.length;
      runtime.state.selectedWaypointIndex =
        waypointCount > 0 ? waypointCount - 1 : null;
    }
  }

  const activeSelectedConnectionId = runtime.state.selectedConnectionId;
  const activeSelectedWaypointIndex = runtime.state.selectedWaypointIndex;
  runtime.view.wireWorld.destroyChildren();

  for (const conn of sheet.directConnections) {
    const a = getEndpointPoint(runtime, lookup, conn.a);
    const b = getEndpointPoint(runtime, lookup, conn.b);
    if (!a || !b) continue;
    const waypoints =
      runtime.graph.liveConnectionWaypoints.get(conn.id) ??
      conn.waypoints ??
      [];

    const routePoints: Pt[] = [
      a,
      ...waypoints.map((p) => ({ x: p.x, y: p.y })),
      b,
    ];
    const displayRoutePoints = buildDisplayWirePoints({
      lookup,
      rawPoints: routePoints,
      startEndpoint: conn.a,
      endEndpoint: conn.b,
    });
    const selected = activeSelectedConnectionId === conn.id;
    const waypointsVisible =
      selected || connectionWaypointsVisibleForSelection(state.selection, conn);
    const wire = drawWirePath(runtime, displayRoutePoints, wireStyle, {
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
        const point = getPointerWorldPos(runtime);
        if (!point) return;
        insertWaypointOnConnection(runtime, conn.id, routePoints, point);
        return;
      }
      runtime.callbacks.onSelect?.({ kind: "wire-connection", id: conn.id });
      runtime.state.selectedConnectionId = conn.id;
      runtime.state.selectedWaypointIndex = null;
      redraw(runtime);
    });

    wire?.on("dbltap", (evt) => {
      evt.cancelBubble = true;
      const point = getPointerWorldPos(runtime);
      if (!point) return;
      insertWaypointOnConnection(runtime, conn.id, routePoints, point);
    });

    wire?.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      runtime.state.selectedConnectionId = conn.id;
      runtime.state.selectedWaypointIndex = null;
      redraw(runtime);
      if (evt.evt instanceof MouseEvent) {
        runtime.callbacks.onContextMenuRequest?.({
          clientX: evt.evt.clientX,
          clientY: evt.evt.clientY,
          target: { kind: "wire-connection", connectionId: conn.id },
        });
      }
    });

    if (waypointsVisible && waypoints.length > 0 && wire) {
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
          dragBoundFunc: (pos) => clampRuntimePos(runtime, pos),
        });
        setCullBounds(
          handle,
          boundsFromPoints([p], WAYPOINT_HANDLE_HIT_STROKE_WIDTH * 0.5 + 12),
        );

        handle.on("click tap", (evt) => {
          evt.cancelBubble = true;
          runtime.callbacks.onSelect?.({
            kind: "wire-connection",
            id: conn.id,
          });
          runtime.state.selectedConnectionId = conn.id;
          runtime.state.selectedWaypointIndex = i;
          redraw(runtime);
        });

        handle.on("contextmenu", (evt) => {
          evt.cancelBubble = true;
          if ("preventDefault" in evt.evt) evt.evt.preventDefault();
          if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
          runtime.state.selectedConnectionId = conn.id;
          runtime.state.selectedWaypointIndex = i;
          redraw(runtime);
          if (evt.evt instanceof MouseEvent) {
            runtime.callbacks.onContextMenuRequest?.({
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
          const pos = clampRuntimePos(runtime, handle.position());
          handle.position(pos);
          setCullBounds(
            handle,
            boundsFromPoints(
              [pos],
              WAYPOINT_HANDLE_HIT_STROKE_WIDTH * 0.5 + 12,
            ),
          );
          runtime.state.selectedConnectionId = conn.id;
          runtime.state.selectedWaypointIndex = i;
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
          runtime.view.wireLayer.batchDraw();
        });

        handle.on("dragend", () => {
          const pos = clampRuntimePos(runtime, handle.position());
          handle.position(pos);
          setCullBounds(
            handle,
            boundsFromPoints(
              [pos],
              WAYPOINT_HANDLE_HIT_STROKE_WIDTH * 0.5 + 12,
            ),
          );
          runtime.state.selectedConnectionId = conn.id;
          runtime.state.selectedWaypointIndex = i;
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
          runtime.callbacks.onMoveConnectionWaypoints(
            conn.id,
            routePoints.slice(1, -1).map((pt) => ({ x: pt.x, y: pt.y })),
          );
          runtime.view.wireLayer.batchDraw();
        });

        runtime.view.wireWorld.add(handle);
      }
    }
  }

  for (const anchor of sheet.labelAnchors) {
    const ep = getEndpointPoint(runtime, lookup, anchor.endpoint);
    const labelPos = ep
      ? getLabelAnchorPoint(runtime, lookup, anchor.labelId, ep)
      : getLabelPosition(runtime, lookup, anchor.labelId);
    if (!ep || !labelPos) continue;
    runtime.view.wireWorld.add(
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
    const a = getEndpointPoint(runtime, lookup, pendingEndpoint);
    const cursor = getCursorPos(runtime);
    if (a && cursor) {
      const pendingRawPoints = [a, ...pendingWirePoints, cursor];
      const pendingDisplayPoints = buildDisplayWirePoints({
        lookup,
        rawPoints: pendingRawPoints,
        startEndpoint: pendingEndpoint,
        endEndpoint: null,
      });
      drawWirePath(runtime, pendingDisplayPoints, wireStyle, {
        stroke: WIRE_PENDING_STROKE,
        strokeWidth: WIRE_PENDING_STROKE_WIDTH,
        dash: WIRE_PENDING_DASH,
        listening: false,
      });
    }
  }

  runtime.view.wireLayer.batchDraw();
}

function connectionWaypointsVisibleForSelection(
  selection: Selection,
  connection: DirectConnection,
): boolean {
  if (!selection || selection.kind !== "multi") return false;
  return (
    endpointIncludedInSelection(connection.a, selection) &&
    endpointIncludedInSelection(connection.b, selection)
  );
}

function endpointIncludedInSelection(
  endpoint: SheetEndpointRef,
  selection: Extract<NonNullable<Selection>, { kind: "multi" }>,
): boolean {
  return endpoint.kind === "node-pin"
    ? selection.nodeIds.includes(endpoint.nodeId)
    : selection.portIds.includes(endpoint.portId);
}
