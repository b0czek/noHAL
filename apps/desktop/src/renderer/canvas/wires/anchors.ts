import type { SplitConnectionLabelPositions } from "@nohal/core/sheet";
import type { Pt } from "../layout";
import { measureLabelBoxForLabel } from "../measurements";
import type { SceneRuntime } from "../scene/types";
import { getEndpointNormal, getEndpointPoint } from "./endpoints";
import { clamp, computeSplitLabelPositions, rotateVec } from "./geometry";
import { getSheetLookup } from "./lookup";
import { buildDisplayWirePoints } from "./paths";
import type { SheetLookup } from "./types";

export function getSplitLabelPositionsForConnection(
  runtime: SceneRuntime,
  connectionId: string,
): SplitConnectionLabelPositions | null {
  const state = runtime.state.lastState;
  if (!state) return null;

  const connection = state.sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) return null;

  const lookup = getSheetLookup(state.project, state.sheet);
  const startEndpointPoint = getEndpointPoint(runtime, lookup, connection.a);
  const endEndpointPoint = getEndpointPoint(runtime, lookup, connection.b);
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

export function getLabelAnchorPoint(
  runtime: SceneRuntime,
  lookup: SheetLookup,
  labelId: string,
  toward: Pt,
): Pt | null {
  const live = runtime.graph.liveLabelPositions.get(labelId);
  const label = lookup.labelsById.get(labelId);
  if (!label) return null;
  const labelForBounds =
    live && (live.x !== label.position.x || live.y !== label.position.y)
      ? { ...label, position: live }
      : label;
  const { width, height } = measureLabelBoxForLabel(labelForBounds);
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
