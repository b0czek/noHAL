import { isSystemComponent } from "@nohal/core/src/componentSystem";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNodeInstance,
} from "@nohal/core/src/types";
import Konva from "konva";
import {
  BASE_STROKE_WIDTH,
  NEUTRAL_BORDER,
  NODE_FILL,
  PIN_HALO_FILL,
  PIN_HALO_RADIUS_PAD,
  PIN_HIT_STROKE_WIDTH,
  PIN_R,
  PIN_STROKE,
  SETP_PIN_RING,
  SETP_PIN_RING_FILL,
  SHEET_NODE_BORDER,
  SHEET_NODE_FILL,
  SYSTEM_NODE_BORDER,
  SYSTEM_NODE_FILL,
} from "../constants";
import type { NodeLayout, Pt } from "../layout";
import { typeFill } from "../theme";
import type { SceneCallbacks } from "../types";

export type ClampPosFn = (pos: Pt) => Pt;

export type DragSelectionTarget = {
  kind: "node" | "label" | "comment" | "sheet-port";
  id: string;
};

export interface RenderRuntimeContext {
  mainWorld: Konva.Group;
  callbacks: SceneCallbacks;
  clampPos: ClampPosFn;
  redrawWires: () => void;
  onSelectionDragStart: (target: DragSelectionTarget, pos: Pt) => boolean;
  onSelectionDragMove: (target: DragSelectionTarget, pos: Pt) => boolean;
  onSelectionDragEnd: (target: DragSelectionTarget, pos: Pt) => boolean;
}

export interface RenderPortsArgs {
  sheet: SheetDefinition;
  pendingKey: string | null;
  selectedPortIds: ReadonlySet<string>;
  livePortPositions: Map<string, Pt>;
  portGroups: Map<string, Konva.Group>;
}

export interface RenderNodesArgs {
  project: NoHALProject;
  sheet: SheetDefinition;
  pendingKey: string | null;
  selectedNodeIds: ReadonlySet<string>;
  nodeLayouts: Map<string, NodeLayout>;
  liveNodePositions: Map<string, Pt>;
  nodeGroups: Map<string, Konva.Group>;
}

export interface RenderLabelsArgs {
  sheet: SheetDefinition;
  selectedLabelIds: ReadonlySet<string>;
  liveLabelPositions: Map<string, Pt>;
  labelGroups: Map<string, Konva.Group>;
}

export interface RenderCommentsArgs {
  sheet: SheetDefinition;
  selectedCommentIds: ReadonlySet<string>;
  liveCommentPositions: Map<string, Pt>;
  commentGroups: Map<string, Konva.Group>;
}

export function addPinDot(args: {
  callbacks: SceneCallbacks;
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
        radius: PIN_R + PIN_HALO_RADIUS_PAD,
        fill: PIN_HALO_FILL,
        listening: false,
      }),
    );
  }

  if (args.hasSetp) {
    args.parent.add(
      new Konva.Circle({
        x: args.x,
        y: args.y,
        radius: PIN_R + 2.5,
        fill: SETP_PIN_RING_FILL,
        stroke: SETP_PIN_RING,
        strokeWidth: BASE_STROKE_WIDTH,
        listening: false,
      }),
    );
  }

  const bead = new Konva.Circle({
    x: args.x,
    y: args.y,
    radius: PIN_R,
    fill: typeFill(args.type),
    stroke: PIN_STROKE,
    strokeWidth: BASE_STROKE_WIDTH,
    hitStrokeWidth: PIN_HIT_STROKE_WIDTH,
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
      bodyFill: SHEET_NODE_FILL,
      idleBorder: SHEET_NODE_BORDER,
    };
  }

  const component = project.library.components[node.componentId];
  if (isSystemComponent(component)) {
    return {
      bodyFill: SYSTEM_NODE_FILL,
      idleBorder: SYSTEM_NODE_BORDER,
    };
  }

  return {
    bodyFill: NODE_FILL,
    idleBorder: NEUTRAL_BORDER,
  };
}
