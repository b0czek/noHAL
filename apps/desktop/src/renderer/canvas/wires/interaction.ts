import type { XY } from "@nohal/core/types";
import type { SceneRuntime } from "../scene/types";
import { findNearestSegmentIndex } from "./geometry";

export function deleteSelectedWaypoint(runtime: SceneRuntime): boolean {
  const state = runtime.state.lastState;
  const { selectedConnectionId, selectedWaypointIndex } = runtime.state;
  if (!state || !selectedConnectionId || selectedWaypointIndex === null) {
    return false;
  }

  const conn = state.sheet.directConnections.find(
    (c) => c.id === selectedConnectionId,
  );
  if (
    !conn?.waypoints ||
    selectedWaypointIndex < 0 ||
    selectedWaypointIndex >= conn.waypoints.length
  ) {
    return false;
  }

  const nextWaypoints = conn.waypoints.filter(
    (_, i) => i !== selectedWaypointIndex,
  );
  runtime.state.selectedWaypointIndex =
    nextWaypoints.length === 0
      ? null
      : Math.min(selectedWaypointIndex, nextWaypoints.length - 1);
  runtime.callbacks.onMoveConnectionWaypoints(
    conn.id,
    nextWaypoints.map((p) => ({ x: p.x, y: p.y })),
  );
  return true;
}

export function insertWaypointOnConnection(
  runtime: SceneRuntime,
  connectionId: string,
  routePoints: XY[],
  point: XY,
): void {
  const state = runtime.state.lastState;
  if (!state) return;

  const conn = state.sheet.directConnections.find((c) => c.id === connectionId);
  if (!conn) return;

  const currentWaypoints = (conn.waypoints ?? []).map((p) => ({
    x: p.x,
    y: p.y,
  }));
  const insertAt = findNearestSegmentIndex(routePoints, point);
  currentWaypoints.splice(insertAt, 0, { x: point.x, y: point.y });
  runtime.state.selectedConnectionId = connectionId;
  runtime.state.selectedWaypointIndex = insertAt;
  runtime.callbacks.onMoveConnectionWaypoints(connectionId, currentWaypoints);
}
