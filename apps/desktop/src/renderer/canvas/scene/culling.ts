import type Konva from "konva";
import { scene } from "../constants/scene";
import type { NodeLayout, Pt } from "../layout";
import {
  estimateCommentSize,
  estimatePortBox,
  measureLabelBox,
} from "../measurements";
import type { SceneRenderState } from "../types";
import {
  DEGREES_TO_RADIANS,
  expandBoundsWithRotatedRect,
  rectIntersects,
  worldBoundsFromLocalRect,
} from "./geometry";
import type {
  CullGroupMap,
  CullModel,
  Rect,
  SceneBounds,
  SceneGraphState,
} from "./types";

const SCENE_BOUNDS_MARGIN = 160;

export function focusCenterFromCullModel(
  id: string,
  groups: CullGroupMap,
  models: Map<string, CullModel>,
): Pt | null {
  const group = groups.get(id);
  const model = models.get(id);
  if (!group || !model) return null;

  const position = group.position();
  const localCenter = {
    x: model.localRect.x + model.localRect.width / 2,
    y: model.localRect.y + model.localRect.height / 2,
  };
  const rad = model.rotationDeg * DEGREES_TO_RADIANS;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return {
    x: position.x + localCenter.x * c - localCenter.y * s,
    y: position.y + localCenter.x * s + localCenter.y * c,
  };
}

export function updateMainCullVisibility(args: {
  view: Rect;
  graph: SceneGraphState;
}): void {
  const { view, graph } = args;

  for (const [id, group] of graph.nodeGroups) {
    const layout = graph.nodeLayouts.get(id);
    if (!layout) continue;
    const pos = group.position();
    group.visible(
      rectIntersects(view, {
        x: pos.x,
        y: pos.y,
        width: layout.width,
        height: layout.height,
      }),
    );
  }

  for (const [id, group] of graph.labelGroups) {
    const model = graph.labelCullModels.get(id);
    if (!model) continue;
    group.visible(
      rectIntersects(view, worldBoundsFromLocalRect(group.position(), model)),
    );
  }

  for (const [id, group] of graph.commentGroups) {
    const model = graph.commentCullModels.get(id);
    if (!model) continue;
    group.visible(
      rectIntersects(view, worldBoundsFromLocalRect(group.position(), model)),
    );
  }

  for (const [id, group] of graph.portGroups) {
    const model = graph.portCullModels.get(id);
    if (!model) continue;
    group.visible(
      rectIntersects(view, worldBoundsFromLocalRect(group.position(), model)),
    );
  }
}

export function updateWireCullVisibility(
  wireWorld: Konva.Group,
  view: Rect,
): void {
  for (const child of wireWorld.getChildren()) {
    const bounds = child.getAttr("cullBounds") as Rect | undefined;
    if (!bounds) {
      child.visible(true);
      continue;
    }
    child.visible(rectIntersects(view, bounds));
  }
}

export function rebuildCullModels(state: SceneRenderState): {
  labelCullModels: Map<string, CullModel>;
  commentCullModels: Map<string, CullModel>;
  portCullModels: Map<string, CullModel>;
} {
  const labelCullModels = new Map<string, CullModel>();
  const commentCullModels = new Map<string, CullModel>();
  const portCullModels = new Map<string, CullModel>();

  for (const label of state.sheet.labels) {
    const size = measureLabelBox(label.scope, label.name);
    labelCullModels.set(label.id, {
      localRect: {
        x: 0,
        y: -size.height / 2,
        width: size.width,
        height: size.height,
      },
      rotationDeg: label.rotation ?? 0,
    });
  }

  for (const comment of state.sheet.comments) {
    const size = estimateCommentSize(comment.text);
    commentCullModels.set(comment.id, {
      localRect: { x: 0, y: 0, width: size.width, height: size.height },
      rotationDeg: comment.rotation ?? 0,
    });
  }

  for (const port of state.sheet.ports) {
    portCullModels.set(port.id, {
      localRect: estimatePortBox(port, { x: 0, y: 0 }),
      rotationDeg: port.rotation ?? 0,
    });
  }

  return {
    labelCullModels,
    commentCullModels,
    portCullModels,
  };
}

export function computeSceneBounds(args: {
  state: SceneRenderState;
  nodeLayouts: Map<string, NodeLayout>;
}): SceneBounds {
  const { state, nodeLayouts } = args;
  const bounds: SceneBounds = {
    minX: 0,
    minY: 0,
    maxX: scene.width,
    maxY: scene.height,
  };
  const margin = SCENE_BOUNDS_MARGIN;

  for (const node of state.sheet.nodes) {
    const layout = nodeLayouts.get(node.id);
    if (!layout) continue;
    bounds.minX = Math.min(bounds.minX, node.position.x - margin);
    bounds.minY = Math.min(bounds.minY, node.position.y - margin);
    bounds.maxX = Math.max(
      bounds.maxX,
      node.position.x + layout.width + margin,
    );
    bounds.maxY = Math.max(
      bounds.maxY,
      node.position.y + layout.height + margin,
    );
  }

  for (const label of state.sheet.labels) {
    const size = measureLabelBox(label.scope, label.name);
    expandBoundsWithRotatedRect(
      bounds,
      {
        x: label.position.x,
        y: label.position.y - size.height / 2,
        width: size.width,
        height: size.height,
      },
      label.rotation ?? 0,
      { x: label.position.x, y: label.position.y },
    );
    bounds.minX = Math.min(bounds.minX, label.position.x - margin);
    bounds.minY = Math.min(bounds.minY, label.position.y - margin);
    bounds.maxX = Math.max(bounds.maxX, label.position.x + margin);
    bounds.maxY = Math.max(bounds.maxY, label.position.y + margin);
  }

  for (const comment of state.sheet.comments) {
    const size = estimateCommentSize(comment.text);
    expandBoundsWithRotatedRect(
      bounds,
      {
        x: comment.position.x,
        y: comment.position.y,
        width: size.width,
        height: size.height,
      },
      comment.rotation ?? 0,
      comment.position,
    );
    bounds.minX = Math.min(bounds.minX, comment.position.x - margin);
    bounds.minY = Math.min(bounds.minY, comment.position.y - margin);
    bounds.maxX = Math.max(
      bounds.maxX,
      comment.position.x + size.width + margin,
    );
    bounds.maxY = Math.max(
      bounds.maxY,
      comment.position.y + size.height + margin,
    );
  }

  for (const port of state.sheet.ports) {
    const rect = estimatePortBox(port);
    expandBoundsWithRotatedRect(
      bounds,
      rect,
      port.rotation ?? 0,
      port.position,
    );
    bounds.minX = Math.min(bounds.minX, port.position.x - margin);
    bounds.minY = Math.min(bounds.minY, port.position.y - margin);
    bounds.maxX = Math.max(bounds.maxX, port.position.x + margin);
    bounds.maxY = Math.max(bounds.maxY, port.position.y + margin);
  }

  for (const connection of state.sheet.directConnections) {
    for (const waypoint of connection.waypoints ?? []) {
      bounds.minX = Math.min(bounds.minX, waypoint.x - margin);
      bounds.minY = Math.min(bounds.minY, waypoint.y - margin);
      bounds.maxX = Math.max(bounds.maxX, waypoint.x + margin);
      bounds.maxY = Math.max(bounds.maxY, waypoint.y + margin);
    }
  }

  for (const waypoint of state.pendingWirePoints) {
    bounds.minX = Math.min(bounds.minX, waypoint.x - margin);
    bounds.minY = Math.min(bounds.minY, waypoint.y - margin);
    bounds.maxX = Math.max(bounds.maxX, waypoint.x + margin);
    bounds.maxY = Math.max(bounds.maxY, waypoint.y + margin);
  }

  return bounds;
}
