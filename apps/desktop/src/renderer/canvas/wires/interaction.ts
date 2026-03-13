import type { Pt } from "../layout";
import { findNearestSegmentIndex } from "./geometry";
import type { KonvaSheetSceneWiresContext } from "./types";

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
