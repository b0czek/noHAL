import { endpointKey, getNodePins, getNodeTitle } from "@nohal/core/src/graph";
import type { SheetEndpointRef } from "@nohal/core/src/types";
import Konva from "konva";
import {
  BASE_STROKE_WIDTH,
  BOTTOM_H,
  BOTTOM_PIN_PILL_W,
  BOTTOM_PIN_TEXT_PAD,
  CHIP_FILL,
  CORNER_RADIUS_MD,
  FONT_MONO,
  FONT_SANS,
  HEADER_H,
  NEUTRAL_BORDER,
  PENDING_BORDER,
  PILL_RADIUS,
  PIN_R,
  SIDE_ROW_H,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from "../constants";
import {
  addPinDot,
  componentNodeTint,
  getNodePinSetpValue,
  type RenderNodesArgs,
} from "./shared";

export function renderNodes(args: RenderNodesArgs): void {
  const {
    project,
    sheet,
    pendingKey,
    selectedNodeIds,
    nodeLayouts,
    mainWorld,
    callbacks,
    clampPos,
    redrawWires,
    liveNodePositions,
    nodeGroups,
  } = args;

  for (const node of sheet.nodes) {
    const layout = nodeLayouts.get(node.id);
    if (!layout) continue;
    const selected = selectedNodeIds.has(node.id);
    const tint = componentNodeTint(project, node);
    const nodeGroup = new Konva.Group({
      x: node.position.x,
      y: node.position.y,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });
    nodeGroups.set(node.id, nodeGroup);

    nodeGroup.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: layout.width,
        height: layout.height,
        cornerRadius: 14,
        fill: tint.bodyFill,
        stroke: selected ? PENDING_BORDER : tint.idleBorder,
        strokeWidth: selected ? 2 : 1,
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
    const topPins = pins.filter((p) => p.side === "top");
    const bottomPins = pins.filter((p) => p.side === "bottom");
    const rows = Math.max(leftPins.length, rightPins.length, 1);
    const topHeight = topPins.length > 0 ? layout.topBandHeight + 10 : 0;

    if (topPins.length > 0) {
      const bandBottom = HEADER_H + topHeight;
      const bandHeight = Math.max(
        layout.topBandHeight,
        layout.topLabelMode === "vertical"
          ? BOTTOM_PIN_PILL_W + PIN_R
          : BOTTOM_H - 4 + PIN_R,
      );
      for (const pin of topPins) {
        const p = layout.pinPositionsLocal[pin.key];
        const hasSetp = getNodePinSetpValue(node, pin.key) !== null;
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
        if (layout.topLabelMode === "vertical") {
          const pillW = BOTTOM_PIN_PILL_W;
          const pillH = Math.min(
            bandHeight - 6,
            Math.max(BOTTOM_PIN_PILL_W, textW + BOTTOM_PIN_TEXT_PAD),
          );
          const pillX = p.x - pillW / 2;
          const pillY = Math.min(bandBottom - pillH, dotY + 6);
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
          const pillY = Math.min(bandBottom - pillH, dotY + 6);
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
          hasSetp,
          endpoint,
        });
      }
    }

    for (const pin of leftPins) {
      const p = layout.pinPositionsLocal[pin.key];
      const hasSetp = getNodePinSetpValue(node, pin.key) !== null;
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
        hasSetp,
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
      const hasSetp = getNodePinSetpValue(node, pin.key) !== null;
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
        hasSetp,
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
      const bandTop = HEADER_H + topHeight + rows * SIDE_ROW_H + 8;
      const bandHeight = Math.max(
        layout.bottomBandHeight,
        layout.bottomLabelMode === "vertical"
          ? BOTTOM_PIN_PILL_W + PIN_R
          : BOTTOM_H - 4 + PIN_R,
      );
      for (const pin of bottomPins) {
        const p = layout.pinPositionsLocal[pin.key];
        const hasSetp = getNodePinSetpValue(node, pin.key) !== null;
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
          hasSetp,
          endpoint,
        });
      }
    }

    nodeGroup.on("dragstart", () => {
      const pos = clampPos(nodeGroup.position());
      nodeGroup.position(pos);
      liveNodePositions.set(node.id, pos);
      args.onSelectionDragStart({ kind: "node", id: node.id }, pos);
    });
    nodeGroup.on("click tap", () => {
      callbacks.onSelect({ kind: "node", id: node.id });
    });
    nodeGroup.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      if (evt.evt instanceof MouseEvent) {
        callbacks.onContextMenuRequest?.({
          clientX: evt.evt.clientX,
          clientY: evt.evt.clientY,
          target: {
            kind: "node",
            id: node.id,
            nodeKind: node.kind === "sheet" ? "sheet" : "component",
          },
        });
      }
    });
    nodeGroup.on("dblclick dbltap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onSelect({ kind: "node", id: node.id });
      callbacks.onOpenNode(node.id);
    });
    nodeGroup.on("dragmove", () => {
      const pos = clampPos(nodeGroup.position());
      nodeGroup.position(pos);
      if (args.onSelectionDragMove({ kind: "node", id: node.id }, pos)) {
        return;
      }
      liveNodePositions.set(node.id, pos);
      redrawWires();
    });
    nodeGroup.on("dragend", () => {
      const pos = clampPos(nodeGroup.position());
      nodeGroup.position(pos);
      if (args.onSelectionDragEnd({ kind: "node", id: node.id }, pos)) {
        return;
      }
      liveNodePositions.set(node.id, pos);
      redrawWires();
      callbacks.onMoveNode(node.id, pos.x, pos.y);
    });

    mainWorld.add(nodeGroup);
  }
}
