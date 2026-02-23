import Konva from "konva";
import { endpointKey, getNodePins, getNodeTitle } from "../../shared/graph";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
} from "../../shared/types";
import {
  BASE_STROKE_WIDTH,
  BOTTOM_H,
  BOTTOM_PIN_PILL_W,
  BOTTOM_PIN_TEXT_PAD,
  CHIP_FILL,
  CORNER_RADIUS_MD,
  FONT_MONO,
  FONT_SANS,
  HEADER_DIVIDER,
  HEADER_FILL,
  HEADER_H,
  NEUTRAL_BORDER,
  NODE_FILL,
  PENDING_BORDER,
  PILL_RADIUS,
  PIN_HALO_FILL,
  PIN_HALO_RADIUS_PAD,
  PIN_HIT_STROKE_WIDTH,
  PIN_R,
  PIN_STROKE,
  PORT_LABEL_H,
  PORT_PANEL_FILL,
  SELECTED_BORDER,
  SELECTED_LABEL_BORDER,
  SHEET_NODE_BORDER,
  SHEET_NODE_FILL,
  SIDE_ROW_H,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SOFT,
} from "./constants";
import type { SceneCallbacks } from "./konvaSheetSceneTypes";
import type { NodeLayout, Pt } from "./layout";
import { directionPillFill, dirStroke, labelFill, typeFill } from "./theme";

type ClampPosFn = (pos: Pt) => Pt;

interface RenderSharedArgs {
  mainWorld: Konva.Group;
  callbacks: SceneCallbacks;
  clampPos: ClampPosFn;
  redrawWires: () => void;
}

interface RenderPortsArgs extends RenderSharedArgs {
  sheet: SheetDefinition;
  pendingKey: string | null;
  selectedPortId: string | null;
  livePortPositions: Map<string, Pt>;
}

interface RenderNodesArgs extends RenderSharedArgs {
  project: NoHALProject;
  sheet: SheetDefinition;
  pendingKey: string | null;
  selectedNodeId: string | null;
  nodeLayouts: Map<string, NodeLayout>;
  liveNodePositions: Map<string, Pt>;
}

interface RenderLabelsArgs extends RenderSharedArgs {
  sheet: SheetDefinition;
  selectedLabelId: string | null;
  liveLabelPositions: Map<string, Pt>;
}

function addPinDot(args: {
  callbacks: SceneCallbacks;
  parent: Konva.Container;
  x: number;
  y: number;
  type: string;
  pending: boolean;
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

export function renderPorts(args: RenderPortsArgs): void {
  const {
    sheet,
    pendingKey,
    selectedPortId,
    mainWorld,
    callbacks,
    clampPos,
    redrawWires,
    livePortPositions,
  } = args;

  for (const port of sheet.ports) {
    const endpoint: SheetEndpointRef = {
      kind: "sheet-port",
      portId: port.id,
    };
    const pending = pendingKey === endpointKey(endpoint);

    const portGroup = new Konva.Group({
      x: port.position.x,
      y: port.position.y,
      rotation: port.rotation ?? 0,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });

    const labelText = `${port.name}  ${port.type}`;
    const measure = new Konva.Text({
      text: labelText,
      fontFamily: FONT_SANS,
      fontSize: 12,
    });
    const width = Math.ceil(measure.width()) + 38;
    const h = PORT_LABEL_H;

    let labelRectX = 12;
    let labelRectY = -h / 2;
    if (port.side === "right") labelRectX = -width - 12;
    if (port.side === "bottom") {
      labelRectX = -width / 2;
      labelRectY = -h - 12;
    }

    const box = new Konva.Rect({
      x: labelRectX,
      y: labelRectY,
      width,
      height: h,
      cornerRadius: CORNER_RADIUS_MD,
      fill: PORT_PANEL_FILL,
      stroke: selectedPortId === port.id ? SELECTED_BORDER : NEUTRAL_BORDER,
      strokeWidth: selectedPortId === port.id ? 2 : 1,
    });
    portGroup.add(box);

    const nameText = new Konva.Text({
      x: labelRectX + 9,
      y: labelRectY + 5,
      text: port.name,
      fontFamily: FONT_MONO,
      fontSize: 12,
      fill: TEXT_PRIMARY,
    });
    portGroup.add(nameText);

    const typeText = new Konva.Text({
      x: labelRectX + 15 + nameText.width(),
      y: labelRectY + 5,
      text: port.type,
      fontFamily: FONT_SANS,
      fontSize: 11,
      fill: TEXT_MUTED,
    });
    portGroup.add(typeText);

    const dirRect = new Konva.Rect({
      x: labelRectX + width - 34,
      y: labelRectY + 4,
      width: 28,
      height: h - 8,
      cornerRadius: PILL_RADIUS,
      fill: directionPillFill(port.direction),
      stroke: dirStroke(port.direction),
      strokeWidth: BASE_STROKE_WIDTH,
    });
    portGroup.add(dirRect);
    portGroup.add(
      new Konva.Text({
        x: dirRect.x() + 5,
        y: dirRect.y() + 6,
        text: port.direction,
        fontFamily: FONT_SANS,
        fontSize: 10,
        fill: TEXT_PRIMARY,
      }),
    );

    portGroup.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onSelect({ kind: "sheet-port", id: port.id });
    });
    portGroup.on("dragend", () => {
      const pos = clampPos(portGroup.position());
      portGroup.position(pos);
      livePortPositions.set(port.id, pos);
      redrawWires();
      callbacks.onMoveSheetPort(port.id, pos.x, pos.y);
    });
    portGroup.on("dragmove", () => {
      const pos = clampPos(portGroup.position());
      portGroup.position(pos);
      livePortPositions.set(port.id, pos);
      redrawWires();
    });

    addPinDot({
      callbacks,
      parent: portGroup,
      x: 0,
      y: 0,
      type: port.type,
      pending,
      endpoint,
    });

    mainWorld.add(portGroup);
  }
}

export function renderNodes(args: RenderNodesArgs): void {
  const {
    project,
    sheet,
    pendingKey,
    selectedNodeId,
    nodeLayouts,
    mainWorld,
    callbacks,
    clampPos,
    redrawWires,
    liveNodePositions,
  } = args;

  for (const node of sheet.nodes) {
    const layout = nodeLayouts.get(node.id);
    if (!layout) continue;
    const selected = selectedNodeId === node.id;
    const nodeGroup = new Konva.Group({
      x: node.position.x,
      y: node.position.y,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });

    nodeGroup.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: layout.width,
        height: layout.height,
        cornerRadius: 14,
        fill: node.kind === "sheet" ? SHEET_NODE_FILL : NODE_FILL,
        stroke: selected
          ? PENDING_BORDER
          : node.kind === "sheet"
            ? SHEET_NODE_BORDER
            : NEUTRAL_BORDER,
        strokeWidth: selected ? 2 : 1,
      }),
    );

    const header = new Konva.Rect({
      x: 0,
      y: 0,
      width: layout.width,
      height: HEADER_H,
      cornerRadius: [14, 14, 0, 0],
      fill: HEADER_FILL,
    });
    nodeGroup.add(header);
    nodeGroup.add(
      new Konva.Line({
        points: [0, HEADER_H, layout.width, HEADER_H],
        stroke: HEADER_DIVIDER,
        strokeWidth: BASE_STROKE_WIDTH,
      }),
    );
    nodeGroup.add(
      new Konva.Text({
        x: 10,
        y: 8,
        width: layout.width - 58,
        text: getNodeTitle(project, node),
        fontFamily: FONT_SANS,
        fontSize: 12,
        fill: TEXT_PRIMARY,
      }),
    );
    nodeGroup.add(
      new Konva.Text({
        x: layout.width - 46,
        y: 8,
        width: 40,
        align: "right",
        text: node.kind === "component" ? "comp" : node.kind,
        fontFamily: FONT_SANS,
        fontSize: 11,
        fill: TEXT_MUTED,
      }),
    );

    const pins = getNodePins(project, node);
    const leftPins = pins.filter((p) => p.side === "left");
    const rightPins = pins.filter((p) => p.side === "right");
    const bottomPins = pins.filter((p) => p.side === "bottom");
    const rows = Math.max(leftPins.length, rightPins.length, 1);

    for (const pin of leftPins) {
      const p = layout.pinPositionsLocal[pin.key];
      const endpoint: SheetEndpointRef = {
        kind: "node-pin",
        nodeId: node.id,
        pinKey: pin.key,
      };
      const pending = pendingKey === endpointKey(endpoint);
      const measure = new Konva.Text({
        text: pin.name,
        fontFamily: FONT_MONO,
        fontSize: 12,
      });
      const bubbleH = SIDE_ROW_H - 6;
      const bubbleX = p.x + 8;
      const bubbleY = p.y - bubbleH / 2;
      const bubbleW = Math.ceil(measure.width()) + 14;
      nodeGroup.add(
        new Konva.Rect({
          x: bubbleX,
          y: bubbleY,
          width: bubbleW,
          height: bubbleH,
          cornerRadius: PILL_RADIUS,
          fill: CHIP_FILL,
          stroke: pending ? PENDING_BORDER : NEUTRAL_BORDER,
          strokeWidth: BASE_STROKE_WIDTH,
          listening: false,
        }),
      );

      addPinDot({
        callbacks,
        parent: nodeGroup,
        x: p.x,
        y: p.y,
        type: pin.type,
        pending,
        endpoint,
      });

      nodeGroup.add(
        new Konva.Text({
          x: bubbleX + 7,
          y: p.y - 7,
          text: pin.name,
          fontFamily: FONT_MONO,
          fontSize: 12,
          fill: TEXT_PRIMARY,
          listening: false,
        }),
      );
    }

    for (const pin of rightPins) {
      const p = layout.pinPositionsLocal[pin.key];
      const endpoint: SheetEndpointRef = {
        kind: "node-pin",
        nodeId: node.id,
        pinKey: pin.key,
      };
      const pending = pendingKey === endpointKey(endpoint);

      addPinDot({
        callbacks,
        parent: nodeGroup,
        x: p.x,
        y: p.y,
        type: pin.type,
        pending,
        endpoint,
      });

      const measure = new Konva.Text({
        text: pin.name,
        fontFamily: FONT_MONO,
        fontSize: 12,
      });
      const bubbleH = SIDE_ROW_H - 6;
      const bubbleW = Math.ceil(measure.width()) + 14;
      const bubbleX = p.x - 8 - bubbleW;
      const bubbleY = p.y - bubbleH / 2;
      nodeGroup.add(
        new Konva.Rect({
          x: bubbleX,
          y: bubbleY,
          width: bubbleW,
          height: bubbleH,
          cornerRadius: PILL_RADIUS,
          fill: CHIP_FILL,
          stroke: pending ? PENDING_BORDER : NEUTRAL_BORDER,
          strokeWidth: BASE_STROKE_WIDTH,
          listening: false,
        }),
      );
      nodeGroup.add(
        new Konva.Text({
          x: bubbleX + 7,
          y: p.y - 7,
          text: pin.name,
          fontFamily: FONT_MONO,
          fontSize: 12,
          fill: TEXT_PRIMARY,
          listening: false,
        }),
      );
    }

    if (bottomPins.length > 0) {
      const bandTop = HEADER_H + rows * SIDE_ROW_H + 8;
      const bandHeight = Math.max(
        layout.bottomBandHeight,
        layout.bottomLabelMode === "vertical"
          ? BOTTOM_PIN_PILL_W + PIN_R
          : BOTTOM_H - 4 + PIN_R,
      );
      for (const pin of bottomPins) {
        const p = layout.pinPositionsLocal[pin.key];
        const endpoint: SheetEndpointRef = {
          kind: "node-pin",
          nodeId: node.id,
          pinKey: pin.key,
        };
        const pending = pendingKey === endpointKey(endpoint);
        const measure = new Konva.Text({
          text: pin.name,
          fontFamily: FONT_MONO,
          fontSize: 11,
        });
        const textW = Math.ceil(measure.width());
        const textH = Math.ceil(measure.height());
        const dotY = p.y;
        if (layout.bottomLabelMode === "vertical") {
          const pillW = BOTTOM_PIN_PILL_W;
          const pillH = Math.min(
            bandHeight - 6,
            Math.max(BOTTOM_PIN_PILL_W, textW + BOTTOM_PIN_TEXT_PAD),
          );
          const pillX = p.x - pillW / 2;
          const pillY = Math.max(bandTop, dotY - 6 - pillH);
          nodeGroup.add(
            new Konva.Rect({
              x: pillX,
              y: pillY,
              width: pillW,
              height: pillH,
              cornerRadius: CORNER_RADIUS_MD,
              fill: CHIP_FILL,
              stroke: pending ? PENDING_BORDER : NEUTRAL_BORDER,
              strokeWidth: BASE_STROKE_WIDTH,
              listening: false,
            }),
          );
          const textX = pillX + pillW / 2 - textH / 2;
          const textY = pillY + pillH / 2 + textW / 2;
          nodeGroup.add(
            new Konva.Text({
              x: textX,
              y: textY,
              text: pin.name,
              fontFamily: FONT_MONO,
              fontSize: 11,
              fill: TEXT_PRIMARY,
              rotation: -90,
              listening: false,
            }),
          );
        } else {
          const pillH = Math.min(bandHeight - 6, BOTTOM_H - 4);
          const pillW = textW + 16;
          const pillX = p.x - pillW / 2;
          const pillY = Math.max(bandTop, dotY - 6 - pillH);
          nodeGroup.add(
            new Konva.Rect({
              x: pillX,
              y: pillY,
              width: pillW,
              height: pillH,
              cornerRadius: PILL_RADIUS,
              fill: CHIP_FILL,
              stroke: pending ? PENDING_BORDER : NEUTRAL_BORDER,
              strokeWidth: BASE_STROKE_WIDTH,
              listening: false,
            }),
          );
          nodeGroup.add(
            new Konva.Text({
              x: pillX + 8,
              y: pillY + 4,
              text: pin.name,
              fontFamily: FONT_MONO,
              fontSize: 11,
              fill: TEXT_PRIMARY,
              listening: false,
            }),
          );
        }
        addPinDot({
          callbacks,
          parent: nodeGroup,
          x: p.x,
          y: dotY,
          type: pin.type,
          pending,
          endpoint,
        });
      }
    }

    nodeGroup.on("click tap", () => {
      callbacks.onSelect({ kind: "node", id: node.id });
    });
    nodeGroup.on("dblclick dbltap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onSelect({ kind: "node", id: node.id });
      callbacks.onOpenNode(node.id);
    });
    nodeGroup.on("dragmove", () => {
      const pos = clampPos(nodeGroup.position());
      nodeGroup.position(pos);
      liveNodePositions.set(node.id, pos);
      redrawWires();
    });
    nodeGroup.on("dragend", () => {
      const pos = clampPos(nodeGroup.position());
      nodeGroup.position(pos);
      liveNodePositions.set(node.id, pos);
      redrawWires();
      callbacks.onMoveNode(node.id, pos.x, pos.y);
    });

    mainWorld.add(nodeGroup);
  }
}

export function renderLabels(args: RenderLabelsArgs): void {
  const {
    sheet,
    selectedLabelId,
    mainWorld,
    callbacks,
    clampPos,
    redrawWires,
    liveLabelPositions,
  } = args;

  for (const label of sheet.labels) {
    const group = new Konva.Group({
      x: label.position.x,
      y: label.position.y,
      rotation: label.rotation ?? 0,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });
    const scopeMeasure = new Konva.Text({
      text: label.scope,
      fontFamily: FONT_SANS,
      fontSize: 10,
    });
    const nameMeasure = new Konva.Text({
      text: label.name,
      fontFamily: FONT_MONO,
      fontSize: 12,
    });
    const w =
      16 +
      Math.ceil(scopeMeasure.width()) +
      8 +
      Math.ceil(nameMeasure.width()) +
      10;
    const h = 22;
    const box = new Konva.Rect({
      x: 0,
      y: -11,
      width: w,
      height: h,
      cornerRadius: CORNER_RADIUS_MD,
      fill: labelFill(label.scope),
      stroke:
        selectedLabelId === label.id ? SELECTED_LABEL_BORDER : NEUTRAL_BORDER,
      strokeWidth: selectedLabelId === label.id ? 2 : 1,
    });
    group.add(box);
    group.add(
      new Konva.Text({
        x: 8,
        y: -4,
        text: label.scope,
        fontFamily: FONT_SANS,
        fontSize: 10,
        fill: TEXT_SOFT,
      }),
    );
    group.add(
      new Konva.Text({
        x: 14 + Math.ceil(scopeMeasure.width()) + 6,
        y: -2,
        text: label.name,
        fontFamily: FONT_MONO,
        fontSize: 12,
        fill: TEXT_PRIMARY,
      }),
    );

    group.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onLabelClick(label.id);
    });
    group.on("dragend", () => {
      const pos = clampPos(group.position());
      group.position(pos);
      liveLabelPositions.set(label.id, pos);
      redrawWires();
      callbacks.onMoveLabel(label.id, pos.x, pos.y);
    });
    group.on("dragmove", () => {
      const pos = clampPos(group.position());
      group.position(pos);
      liveLabelPositions.set(label.id, pos);
      redrawWires();
    });

    mainWorld.add(group);
  }
}
