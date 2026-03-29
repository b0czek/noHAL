import type { SheetEndpointRef } from "@nohal/core/types";
import type { Pt } from "../layout";
import { clampRuntimePos } from "../scene/bounds";
import { screenToWorld } from "../scene/camera";
import type { SceneRuntime } from "../scene/types";
import { normalForSide } from "./geometry";
import type { SheetLookup } from "./types";

function getNodePosition(
  runtime: SceneRuntime,
  lookup: SheetLookup,
  nodeId: string,
): Pt | null {
  const live = runtime.graph.liveNodePositions.get(nodeId);
  if (live) return live;
  const node = lookup.nodesById.get(nodeId);
  return node ? node.position : null;
}

function getPortPosition(
  runtime: SceneRuntime,
  lookup: SheetLookup,
  portId: string,
): Pt | null {
  const live = runtime.graph.livePortPositions.get(portId);
  if (live) return live;
  const port = lookup.portsById.get(portId);
  return port ? port.position : null;
}

export function getLabelPosition(
  runtime: SceneRuntime,
  lookup: SheetLookup,
  labelId: string,
): Pt | null {
  const live = runtime.graph.liveLabelPositions.get(labelId);
  if (live) return live;
  const label = lookup.labelsById.get(labelId);
  return label ? label.position : null;
}

export function getPointerWorldPos(runtime: SceneRuntime): Pt | null {
  const pos = runtime.view.stage.getPointerPosition();
  if (!pos) return null;
  return clampRuntimePos(
    runtime,
    screenToWorld(runtime.state.camera, { x: pos.x, y: pos.y }),
  );
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
  runtime: SceneRuntime,
  lookup: SheetLookup,
  endpoint: SheetEndpointRef,
): Pt | null {
  if (endpoint.kind === "sheet-port") {
    return getPortPosition(runtime, lookup, endpoint.portId);
  }

  const layout = runtime.graph.nodeLayouts.get(endpoint.nodeId);
  const local = layout?.pinPositionsLocal[endpoint.pinKey];
  if (!layout || !local) return null;
  const nodePos = getNodePosition(runtime, lookup, endpoint.nodeId);
  if (!nodePos) return null;
  return { x: nodePos.x + local.x, y: nodePos.y + local.y };
}

export function getCursorPos(runtime: SceneRuntime): Pt | null {
  const cached = runtime.state.cursorPos;
  if (cached) return cached;
  const pos = runtime.view.stage.getPointerPosition();
  return pos
    ? clampRuntimePos(
        runtime,
        screenToWorld(runtime.state.camera, { x: pos.x, y: pos.y }),
      )
    : null;
}
