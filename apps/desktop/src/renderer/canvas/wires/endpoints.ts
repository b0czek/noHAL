import type { SheetEndpointRef } from "@nohal/core/src/types";
import type { Pt } from "../layout";
import { normalForSide } from "./geometry";
import type { KonvaSheetSceneWiresContext, SheetLookup } from "./types";

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

export function getLabelPosition(
  ctx: KonvaSheetSceneWiresContext,
  lookup: SheetLookup,
  labelId: string,
): Pt | null {
  const live = ctx.getLiveLabelPositions().get(labelId);
  if (live) return live;
  const label = lookup.labelsById.get(labelId);
  return label ? label.position : null;
}

export function getPointerWorldPos(
  ctx: KonvaSheetSceneWiresContext,
): Pt | null {
  const pos = ctx.stage.getPointerPosition();
  if (!pos) return null;
  return ctx.clampPos(ctx.screenToWorld({ x: pos.x, y: pos.y }));
}

export function getEndpointNormal(
  endpoint: SheetEndpointRef,
  lookup: SheetLookup,
): Pt | null {
  if (endpoint.kind === "sheet-port") {
    const port = lookup.portsById.get(endpoint.portId);
    return port ? normalForSide(port.side) : null;
  }

  const pinSide = lookup.nodePinSidesById
    .get(endpoint.nodeId)
    ?.get(endpoint.pinKey);
  if (!pinSide) return null;
  return normalForSide(pinSide);
}

export function getEndpointPoint(
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

export function getCursorPos(ctx: KonvaSheetSceneWiresContext): Pt | null {
  const cached = ctx.getCursorPosCache();
  if (cached) return cached;
  const pos = ctx.stage.getPointerPosition();
  return pos ? ctx.clampPos(ctx.screenToWorld({ x: pos.x, y: pos.y })) : null;
}
