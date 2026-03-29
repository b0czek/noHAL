import { isSystemComponent } from "@nohal/core/componentSystem";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNodeInstance,
} from "@nohal/core/types";
import Konva from "konva";
import { surface } from "../constants/surfaces";
import type { NodeLayout, Pt } from "../layout";
import { typeFill } from "../theme";
import type { SceneCallbacks } from "../types";

export type ClampPosFn = (pos: Pt) => Pt;

export type DragSelectionTarget = {
  kind: "node" | "label" | "comment" | "sheet-port";
  id: string;
};

export interface RenderDragSelectionOps {
  onSelectionDragStart: (target: DragSelectionTarget, pos: Pt) => boolean;
  onSelectionDragMove: (target: DragSelectionTarget, pos: Pt) => boolean;
  onSelectionDragEnd: (target: DragSelectionTarget, pos: Pt) => boolean;
}

export interface RenderSceneContext {
  mainWorld: Konva.Group;
  clampPos: ClampPosFn;
  redrawWires: () => void;
  dragSelection: RenderDragSelectionOps;
}

export interface RenderPortsArgs {
  callbacks: Pick<
    SceneCallbacks,
    "onContextMenuRequest" | "onEndpointClick" | "onMoveSheetPort" | "onSelect"
  >;
  sheet: SheetDefinition;
  pendingKey: string | null;
  selectedPortIds: ReadonlySet<string>;
  livePortPositions: Map<string, Pt>;
  portGroups: Map<string, Konva.Group>;
}

export interface RenderNodesArgs {
  callbacks: Pick<
    SceneCallbacks,
    | "onContextMenuRequest"
    | "onEndpointClick"
    | "onMoveNode"
    | "onOpenNode"
    | "onSelect"
  >;
  project: NoHALProject;
  sheet: SheetDefinition;
  pendingKey: string | null;
  selectedNodeIds: ReadonlySet<string>;
  nodeLayouts: Map<string, NodeLayout>;
  liveNodePositions: Map<string, Pt>;
  nodeGroups: Map<string, Konva.Group>;
}

export interface RenderLabelsArgs {
  callbacks: Pick<
    SceneCallbacks,
    "onContextMenuRequest" | "onLabelClick" | "onMoveLabel"
  >;
  sheet: SheetDefinition;
  selectedLabelIds: ReadonlySet<string>;
  liveLabelPositions: Map<string, Pt>;
  labelGroups: Map<string, Konva.Group>;
}

export interface RenderCommentsArgs {
  callbacks: Pick<
    SceneCallbacks,
    "onContextMenuRequest" | "onMoveComment" | "onSelect"
  >;
  sheet: SheetDefinition;
  selectedCommentIds: ReadonlySet<string>;
  liveCommentPositions: Map<string, Pt>;
  commentGroups: Map<string, Konva.Group>;
}

export function bindDraggableRenderable(args: {
  group: Konva.Group;
  target: DragSelectionTarget;
  clampPos: ClampPosFn;
  setLivePosition: (pos: Pt) => void;
  dragSelection: RenderDragSelectionOps;
  redrawWires?: () => void;
  persistMove: (pos: Pt) => void;
}): void {
  const {
    group,
    target,
    clampPos,
    setLivePosition,
    dragSelection,
    redrawWires,
    persistMove,
  } = args;

  const syncPosition = (): Pt => {
    const pos = clampPos(group.position());
    group.position(pos);
    return pos;
  };

  group.on("dragstart", () => {
    const pos = syncPosition();
    setLivePosition(pos);
    dragSelection.onSelectionDragStart(target, pos);
  });

  group.on("dragmove", () => {
    const pos = syncPosition();
    if (dragSelection.onSelectionDragMove(target, pos)) {
      return;
    }
    setLivePosition(pos);
    redrawWires?.();
  });

  group.on("dragend", () => {
    const pos = syncPosition();
    if (dragSelection.onSelectionDragEnd(target, pos)) {
      return;
    }
    setLivePosition(pos);
    redrawWires?.();
    persistMove(pos);
  });
}

export function addPinDot(args: {
  callbacks: Pick<SceneCallbacks, "onEndpointClick">;
  parent: Konva.Container;
  x: number;
  y: number;
  type: string;
  pending: boolean;
  hasSetp?: boolean;
  endpoint: SheetEndpointRef;
}): void {
  if (args.pending) {
    args.parent.add(
      new Konva.Circle({
        x: args.x,
        y: args.y,
        radius: surface.pin.radius + surface.pin.haloRadiusPadding,
        fill: surface.pin.haloFill,
        listening: false,
      }),
    );
  }

  if (args.hasSetp) {
    args.parent.add(
      new Konva.Circle({
        x: args.x,
        y: args.y,
        radius: surface.pin.radius + surface.pin.setpRing.radiusPadding,
        fill: surface.pin.setpRing.fill,
        stroke: surface.pin.setpRing.stroke,
        strokeWidth: surface.baseStrokeWidth,
        listening: false,
      }),
    );
  }

  const bead = new Konva.Circle({
    x: args.x,
    y: args.y,
    radius: surface.pin.radius,
    fill: typeFill(args.type),
    stroke: surface.pin.stroke,
    strokeWidth: surface.baseStrokeWidth,
    hitStrokeWidth: surface.pin.hitStrokeWidth,
  });

  bead.on("click tap", (evt) => {
    evt.cancelBubble = true;
    args.callbacks.onEndpointClick(args.endpoint);
  });

  args.parent.add(bead);
}

export function getNodePinSetpValue(
  node: SheetNodeInstance,
  pinKey: string,
): string | null {
  if (node.kind !== "component") return null;
  const raw = node.pinInitialValues?.[pinKey];
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return value.length > 0 ? value : null;
}

export function componentNodeTint(
  project: NoHALProject,
  node: SheetNodeInstance,
): {
  bodyFill: string;
  idleBorder: string;
} {
  if (node.kind === "sheet") {
    return {
      bodyFill: surface.sheetNode.fill,
      idleBorder: surface.sheetNode.border,
    };
  }

  const component = project.library.components[node.componentId];
  if (isSystemComponent(component)) {
    return {
      bodyFill: surface.systemNode.fill,
      idleBorder: surface.systemNode.border,
    };
  }

  return {
    bodyFill: surface.node.fill,
    idleBorder: surface.border.neutral,
  };
}
