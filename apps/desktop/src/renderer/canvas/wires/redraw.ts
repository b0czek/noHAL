import type {
  DirectConnection,
  ProjectWireStyle,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "@nohal/core/types";
import Konva from "konva";
import type {
  MultiSelection,
  Selection,
} from "../../state/store/selectionTypes";
import { wire } from "../constants/wires";
import { isPrimaryScenePointerButton } from "../renderables/shared";
import { clampRuntimePos } from "../scene/bounds";
import type { SceneRuntime } from "../scene/types";
import type { SceneWireContextMenuTarget } from "../types";
import { getLabelAnchorPoint } from "./anchors";
import {
  boundsFromPoints,
  getLabelAnchorCullPadding,
  getWaypointCullPadding,
  setCullBounds,
} from "./culling";
import {
  getCursorPos,
  getEndpointPoint,
  getLabelPosition,
  getPointerWorldPos,
} from "./endpoints";
import { insertWaypointOnConnection } from "./interaction";
import { getSheetLookup } from "./lookup";
import {
  buildDisplayWirePoints,
  drawWirePath,
  updateWirePathShape,
} from "./paths";
import type { SheetLookup } from "./types";

const WAYPOINT_CULL_PADDING = getWaypointCullPadding({
  strokeWidth: wire.waypoint.strokeWidth,
  hitStrokeWidth: wire.waypoint.hitStrokeWidth,
});

const LABEL_ANCHOR_CULL_PADDING = getLabelAnchorCullPadding({
  strokeWidth: wire.labelAnchor.strokeWidth.selected,
  hitStrokeWidth: wire.labelAnchor.strokeWidth.hit,
});

function selectConnection(
  runtime: SceneRuntime,
  connectionId: string,
  waypointIndex: number | null = null,
): void {
  runtime.callbacks.onSelect?.({ kind: "wire-connection", id: connectionId });
  runtime.state.selectedConnectionId = connectionId;
  runtime.state.selectedWaypointIndex = waypointIndex;
}

function selectLabelAnchor(runtime: SceneRuntime, anchorId: string): void {
  runtime.callbacks.onSelect?.({ kind: "label-anchor", id: anchorId });
  runtime.state.selectedConnectionId = null;
  runtime.state.selectedWaypointIndex = null;
}

function syncSelectedConnectionState(runtime: SceneRuntime): void {
  const sheet = runtime.state.lastState?.sheet;
  if (!sheet) return;
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
    return;
  }

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

function buildRoutePoints(a: XY, waypoints: readonly XY[], b: XY): XY[] {
  return [a, ...waypoints.map((p) => ({ x: p.x, y: p.y })), b];
}

function updateRoutePreview(args: {
  runtime: SceneRuntime;
  handle: Konva.Circle;
  routePoints: XY[];
  waypointIndex: number;
  wireLine: Konva.Line;
  lookup: SheetLookup;
  wireStyle: ProjectWireStyle;
  connection: DirectConnection;
}): void {
  const { runtime, handle, routePoints, waypointIndex, wireLine, lookup } =
    args;
  const pos = clampRuntimePos(runtime, handle.position());
  handle.position(pos);
  setCullBounds(handle, boundsFromPoints([pos], WAYPOINT_CULL_PADDING));
  runtime.state.selectedConnectionId = args.connection.id;
  runtime.state.selectedWaypointIndex = waypointIndex;
  routePoints[waypointIndex + 1] = pos;
  updateWirePathShape(
    wireLine,
    buildDisplayWirePoints({
      lookup,
      rawPoints: routePoints,
      startEndpoint: args.connection.a,
      endEndpoint: args.connection.b,
    }),
    args.wireStyle,
  );
}

function openConnectionContextMenu(
  runtime: SceneRuntime,
  evt: MouseEvent,
  target: SceneWireContextMenuTarget,
): void {
  runtime.callbacks.onContextMenuRequest?.({
    clientX: evt.clientX,
    clientY: evt.clientY,
    target,
  });
}

function bindWireLineEvents(args: {
  runtime: SceneRuntime;
  connection: DirectConnection;
  routePoints: XY[];
  wireLine: Konva.Line;
}): void {
  const { runtime, connection, routePoints, wireLine } = args;

  wireLine.on("click tap", (evt) => {
    if (!isPrimaryScenePointerButton(evt.evt)) return;
    evt.cancelBubble = true;
    if (evt.evt instanceof MouseEvent && evt.evt.detail >= 2) {
      const point = getPointerWorldPos(runtime);
      if (!point) return;
      insertWaypointOnConnection(runtime, connection.id, routePoints, point);
      return;
    }
    selectConnection(runtime, connection.id);
    redraw(runtime);
  });

  wireLine.on("dbltap", (evt) => {
    evt.cancelBubble = true;
    const point = getPointerWorldPos(runtime);
    if (!point) return;
    insertWaypointOnConnection(runtime, connection.id, routePoints, point);
  });

  wireLine.on("contextmenu", (evt) => {
    evt.cancelBubble = true;
    if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
    selectConnection(runtime, connection.id);
    redraw(runtime);
    if (evt.evt instanceof MouseEvent) {
      openConnectionContextMenu(runtime, evt.evt, {
        kind: "wire-connection",
        connectionId: connection.id,
      });
    }
  });
}

function renderConnectionWaypoints(args: {
  runtime: SceneRuntime;
  connection: DirectConnection;
  routePoints: XY[];
  waypoints: readonly XY[];
  wireLine: Konva.Line;
  lookup: SheetLookup;
  wireStyle: ProjectWireStyle;
  activeSelectedWaypointIndex: number | null;
}): void {
  const {
    runtime,
    connection,
    routePoints,
    waypoints,
    wireLine,
    lookup,
    wireStyle,
    activeSelectedWaypointIndex,
  } = args;

  for (let i = 0; i < waypoints.length; i += 1) {
    const isSelectedWaypoint = activeSelectedWaypointIndex === i;
    const p = routePoints[i + 1];
    const handle = new Konva.Circle({
      x: p.x,
      y: p.y,
      radius: isSelectedWaypoint
        ? wire.waypoint.selectedRadius
        : wire.waypoint.radius,
      fill: isSelectedWaypoint
        ? wire.waypoint.selectedFill
        : wire.waypoint.fill,
      stroke: wire.waypoint.stroke,
      strokeWidth: wire.waypoint.strokeWidth,
      draggable: true,
      hitStrokeWidth: wire.waypoint.hitStrokeWidth,
      dragBoundFunc: (pos) => clampRuntimePos(runtime, pos),
    });
    setCullBounds(handle, boundsFromPoints([p], WAYPOINT_CULL_PADDING));

    handle.on("click tap", (evt) => {
      if (!isPrimaryScenePointerButton(evt.evt)) return;
      evt.cancelBubble = true;
      selectConnection(runtime, connection.id, i);
      redraw(runtime);
    });

    handle.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      selectConnection(runtime, connection.id, i);
      redraw(runtime);
      if (evt.evt instanceof MouseEvent) {
        openConnectionContextMenu(runtime, evt.evt, {
          kind: "wire-waypoint",
          connectionId: connection.id,
          waypointIndex: i,
        });
      }
    });

    handle.on("dragmove", () => {
      updateRoutePreview({
        runtime,
        handle,
        routePoints,
        waypointIndex: i,
        wireLine,
        lookup,
        wireStyle,
        connection,
      });
      runtime.view.wireLayer.batchDraw();
    });

    handle.on("dragend", () => {
      updateRoutePreview({
        runtime,
        handle,
        routePoints,
        waypointIndex: i,
        wireLine,
        lookup,
        wireStyle,
        connection,
      });
      runtime.callbacks.onMoveConnectionWaypoints(
        connection.id,
        routePoints.slice(1, -1).map((pt) => ({ x: pt.x, y: pt.y })),
      );
      runtime.view.wireLayer.batchDraw();
    });

    runtime.view.wireWorld.add(handle);
  }
}

function renderLabelAnchors(
  runtime: SceneRuntime,
  sheet: SheetDefinition,
  lookup: SheetLookup,
  selectedAnchorId: string | null,
): void {
  for (const anchor of sheet.labelAnchors) {
    const ep = getEndpointPoint(runtime, lookup, anchor.endpoint);
    const labelPos = ep
      ? getLabelAnchorPoint(runtime, lookup, anchor.labelId, ep)
      : getLabelPosition(runtime, lookup, anchor.labelId);
    if (!ep || !labelPos) continue;
    const selected = anchor.id === selectedAnchorId;
    runtime.view.wireWorld.add(
      (() => {
        const line = new Konva.Line({
          points: [ep.x, ep.y, labelPos.x, labelPos.y],
          stroke: selected
            ? wire.labelAnchor.stroke.selected
            : wire.labelAnchor.stroke.default,
          strokeWidth: selected
            ? wire.labelAnchor.strokeWidth.selected
            : wire.labelAnchor.strokeWidth.default,
          dash: wire.labelAnchor.dash,
          listening: true,
          hitStrokeWidth: wire.labelAnchor.strokeWidth.hit,
        });
        line.on("click tap", (evt) => {
          if (!isPrimaryScenePointerButton(evt.evt)) return;
          evt.cancelBubble = true;
          selectLabelAnchor(runtime, anchor.id);
          redraw(runtime);
        });
        line.on("contextmenu", (evt) => {
          evt.cancelBubble = true;
          if ("preventDefault" in evt.evt) evt.evt.preventDefault();
          if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
          selectLabelAnchor(runtime, anchor.id);
          redraw(runtime);
          if (evt.evt instanceof MouseEvent) {
            runtime.callbacks.onContextMenuRequest?.({
              clientX: evt.evt.clientX,
              clientY: evt.evt.clientY,
              target: { kind: "label-anchor", anchorId: anchor.id },
            });
          }
        });
        setCullBounds(
          line,
          boundsFromPoints([ep, labelPos], LABEL_ANCHOR_CULL_PADDING),
        );
        return line;
      })(),
    );
  }
}

function drawPendingWire(args: {
  runtime: SceneRuntime;
  lookup: SheetLookup;
  pendingEndpoint: SheetEndpointRef;
  pendingWirePoints: XY[];
  wireStyle: ProjectWireStyle;
}): void {
  const { runtime, lookup, pendingEndpoint, pendingWirePoints, wireStyle } =
    args;
  const a = getEndpointPoint(runtime, lookup, pendingEndpoint);
  const cursor = getCursorPos(runtime);
  if (!a || !cursor) return;
  const pendingRawPoints = [a, ...pendingWirePoints, cursor];
  const pendingDisplayPoints = buildDisplayWirePoints({
    lookup,
    rawPoints: pendingRawPoints,
    startEndpoint: pendingEndpoint,
    endEndpoint: null,
  });
  drawWirePath(runtime, pendingDisplayPoints, wireStyle, {
    stroke: wire.line.stroke.pending,
    strokeWidth: wire.line.width.pending,
    dash: wire.pending.dash,
    listening: false,
  });
}

export function redraw(runtime: SceneRuntime): void {
  const state = runtime.state.lastState;
  if (!state) return;

  const { sheet, pendingEndpoint, pendingWirePoints } = state;
  const wireStyle = state.project.ui.wireStyle;
  const lookup = getSheetLookup(state.project, sheet);
  syncSelectedConnectionState(runtime);

  const activeSelectedConnectionId = runtime.state.selectedConnectionId;
  const activeSelectedWaypointIndex = runtime.state.selectedWaypointIndex;
  const activeSelectedLabelAnchorId =
    state.selection?.kind === "label-anchor" ? state.selection.id : null;
  runtime.view.wireWorld.destroyChildren();

  for (const conn of sheet.directConnections) {
    const a = getEndpointPoint(runtime, lookup, conn.a);
    const b = getEndpointPoint(runtime, lookup, conn.b);
    if (!a || !b) continue;
    const waypoints =
      runtime.graph.liveConnectionWaypoints.get(conn.id) ??
      conn.waypoints ??
      [];
    const routePoints = buildRoutePoints(a, waypoints, b);
    const displayRoutePoints = buildDisplayWirePoints({
      lookup,
      rawPoints: routePoints,
      startEndpoint: conn.a,
      endEndpoint: conn.b,
    });
    const selected = activeSelectedConnectionId === conn.id;
    const waypointsVisible =
      selected || connectionWaypointsVisibleForSelection(state.selection, conn);
    const wireLine = drawWirePath(runtime, displayRoutePoints, wireStyle, {
      stroke: selected ? wire.line.stroke.selected : wire.line.stroke.default,
      strokeWidth: selected
        ? wire.line.width.selected
        : wire.line.width.default,
      listening: true,
      hitStrokeWidth: wire.line.width.hit,
    });
    if (wireLine) {
      bindWireLineEvents({
        runtime,
        connection: conn,
        routePoints,
        wireLine,
      });
    }
    if (waypointsVisible && waypoints.length > 0 && wireLine) {
      renderConnectionWaypoints({
        runtime,
        connection: conn,
        routePoints,
        waypoints,
        wireLine,
        lookup,
        wireStyle,
        activeSelectedWaypointIndex,
      });
    }
  }

  renderLabelAnchors(runtime, sheet, lookup, activeSelectedLabelAnchorId);

  if (pendingEndpoint) {
    drawPendingWire({
      runtime,
      lookup,
      pendingEndpoint,
      pendingWirePoints,
      wireStyle,
    });
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
  selection: MultiSelection,
): boolean {
  return endpoint.kind === "node-pin"
    ? selection.nodeIds.includes(endpoint.nodeId)
    : selection.portIds.includes(endpoint.portId);
}
