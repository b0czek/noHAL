import {
  endpointKey,
  getNodeTitle,
  getVisibleNodePins,
} from "@nohal/core/graph";
import type {
  ResolvedPin,
  SheetEndpointRef,
  SheetNodeInstance,
} from "@nohal/core/types";
import Konva from "konva";
import { node } from "../constants/nodes";
import { pin as pinConst } from "../constants/pins";
import { surface } from "../constants/surfaces";
import { typography } from "../constants/typography";
import type { NodeLayout } from "../layout";
import {
  addPinDot,
  bindDraggableRenderable,
  componentNodeTint,
  getNodePinSetpValue,
  type RenderNodesArgs,
  type RenderSceneContext,
} from "./shared";

function minimumHorizontalBandHeight(): number {
  return node.bottom.height - pinConst.band.inset + surface.pin.radius;
}

export function renderNodes(
  ctx: RenderSceneContext,
  args: RenderNodesArgs,
): void {
  const { mainWorld, clampPos, redrawWires, dragSelection } = ctx;

  const {
    callbacks,
    project,
    sheet,
    pendingKey,
    selectedNodeIds,
    nodeLayouts,
    liveNodePositions,
    nodeGroups,
  } = args;

  const renderTopPins = (
    nodeGroup: Konva.Group,
    sheetNode: SheetNodeInstance,
    layout: NodeLayout,
    topPins: ResolvedPin[],
    topHeight: number,
  ) => {
    if (topPins.length === 0) return;

    const bandBottom = node.header.height + topHeight;
    const bandHeight = Math.max(
      layout.topBandHeight,
      layout.topLabelMode === "vertical"
        ? pinConst.bottom.width + surface.pin.radius
        : minimumHorizontalBandHeight(),
    );

    for (const pin of topPins) {
      const p = layout.pinPositionsLocal[pin.key];
      const hasSetp = getNodePinSetpValue(sheetNode, pin.key) !== null;
      const endpoint: SheetEndpointRef = {
        kind: "node-pin",
        nodeId: sheetNode.id,
        pinKey: pin.key,
      };
      const pending = pendingKey === endpointKey(endpoint);
      const measure = new Konva.Text({
        text: pin.name,
        fontFamily: typography.family.mono,
        fontSize: pinConst.label.fontSize,
      });
      const textW = Math.ceil(measure.width());
      const textH = Math.ceil(measure.height());
      const dotY = p.y;

      if (layout.topLabelMode === "vertical") {
        const pillW = pinConst.bottom.width;
        const pillH = Math.min(
          bandHeight - pinConst.pill.clearance,
          Math.max(pinConst.bottom.width, textW + pinConst.bottom.textPadding),
        );
        const pillX = p.x - pillW / 2;
        const pillY = Math.min(
          bandBottom - pillH,
          dotY + pinConst.pill.clearance,
        );
        nodeGroup.add(
          new Konva.Rect({
            x: pillX,
            y: pillY,
            width: pillW,
            height: pillH,
            cornerRadius: surface.radius.md,
            fill: surface.chipFill,
            stroke: pending ? surface.border.pending : surface.border.neutral,
            strokeWidth: surface.baseStrokeWidth,
            listening: false,
          }),
        );
        nodeGroup.add(
          new Konva.Text({
            x: pillX + pillW / 2 - textH / 2,
            y: pillY + pillH / 2 + textW / 2,
            text: pin.name,
            fontFamily: typography.family.mono,
            fontSize: pinConst.label.fontSize,
            fill: typography.color.primary,
            rotation: -90,
            listening: false,
          }),
        );
      } else {
        const pillH = Math.min(
          bandHeight - pinConst.pill.clearance,
          minimumHorizontalBandHeight() - surface.pin.radius,
        );
        const pillW = textW + pinConst.pill.widthPadding;
        const pillX = p.x - pillW / 2;
        const pillY = Math.min(
          bandBottom - pillH,
          dotY + pinConst.pill.clearance,
        );
        nodeGroup.add(
          new Konva.Rect({
            x: pillX,
            y: pillY,
            width: pillW,
            height: pillH,
            cornerRadius: surface.radius.pill,
            fill: surface.chipFill,
            stroke: pending ? surface.border.pending : surface.border.neutral,
            strokeWidth: surface.baseStrokeWidth,
            listening: false,
          }),
        );
        nodeGroup.add(
          new Konva.Text({
            x: pillX + pinConst.pill.text.x,
            y: pillY + pinConst.pill.text.y,
            text: pin.name,
            fontFamily: typography.family.mono,
            fontSize: pinConst.label.fontSize,
            fill: typography.color.primary,
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
  };

  const renderSidePins = (
    nodeGroup: Konva.Group,
    sheetNode: SheetNodeInstance,
    pins: ResolvedPin[],
    layout: NodeLayout,
    side: "left" | "right",
  ) => {
    for (const pin of pins) {
      const p = layout.pinPositionsLocal[pin.key];
      const hasSetp = getNodePinSetpValue(sheetNode, pin.key) !== null;
      const endpoint: SheetEndpointRef = {
        kind: "node-pin",
        nodeId: sheetNode.id,
        pinKey: pin.key,
      };
      const pending = pendingKey === endpointKey(endpoint);

      if (side === "right") {
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
      }

      const measure = new Konva.Text({
        text: pin.name,
        fontFamily: typography.family.mono,
        fontSize: node.title.fontSize,
      });
      const bubbleH = node.side.rowHeight - pinConst.bubble.heightReduction;
      const bubbleW = Math.ceil(measure.width()) + pinConst.bubble.widthPadding;
      const bubbleX =
        side === "left"
          ? p.x + pinConst.bubble.offsetX
          : p.x - pinConst.bubble.offsetX - bubbleW;
      const bubbleY = p.y - bubbleH / 2;
      nodeGroup.add(
        new Konva.Rect({
          x: bubbleX,
          y: bubbleY,
          width: bubbleW,
          height: bubbleH,
          cornerRadius: surface.radius.pill,
          fill: surface.chipFill,
          stroke: pending ? surface.border.pending : surface.border.neutral,
          strokeWidth: surface.baseStrokeWidth,
          listening: false,
        }),
      );

      if (side === "left") {
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
      }

      nodeGroup.add(
        new Konva.Text({
          x: bubbleX + pinConst.bubble.text.x,
          y: p.y - pinConst.bubble.text.y,
          text: pin.name,
          fontFamily: typography.family.mono,
          fontSize: node.title.fontSize,
          fill: typography.color.primary,
          listening: false,
        }),
      );
    }
  };

  const renderBottomPins = (
    nodeGroup: Konva.Group,
    sheetNode: SheetNodeInstance,
    layout: NodeLayout,
    bottomPins: ResolvedPin[],
    topHeight: number,
    rows: number,
  ) => {
    if (bottomPins.length === 0) return;

    const bandTop =
      node.header.height +
      topHeight +
      rows * node.side.rowHeight +
      node.bottom.sectionGap;
    const bandHeight = Math.max(
      layout.bottomBandHeight,
      layout.bottomLabelMode === "vertical"
        ? pinConst.bottom.width + surface.pin.radius
        : minimumHorizontalBandHeight(),
    );

    for (const pin of bottomPins) {
      const p = layout.pinPositionsLocal[pin.key];
      const hasSetp = getNodePinSetpValue(sheetNode, pin.key) !== null;
      const endpoint: SheetEndpointRef = {
        kind: "node-pin",
        nodeId: sheetNode.id,
        pinKey: pin.key,
      };
      const pending = pendingKey === endpointKey(endpoint);
      const measure = new Konva.Text({
        text: pin.name,
        fontFamily: typography.family.mono,
        fontSize: pinConst.label.fontSize,
      });
      const textW = Math.ceil(measure.width());
      const textH = Math.ceil(measure.height());
      const dotY = p.y;

      if (layout.bottomLabelMode === "vertical") {
        const pillW = pinConst.bottom.width;
        const pillH = Math.min(
          bandHeight - pinConst.pill.clearance,
          Math.max(pinConst.bottom.width, textW + pinConst.bottom.textPadding),
        );
        const pillX = p.x - pillW / 2;
        const pillY = Math.max(bandTop, dotY - pinConst.pill.clearance - pillH);
        nodeGroup.add(
          new Konva.Rect({
            x: pillX,
            y: pillY,
            width: pillW,
            height: pillH,
            cornerRadius: surface.radius.md,
            fill: surface.chipFill,
            stroke: pending ? surface.border.pending : surface.border.neutral,
            strokeWidth: surface.baseStrokeWidth,
            listening: false,
          }),
        );
        nodeGroup.add(
          new Konva.Text({
            x: pillX + pillW / 2 - textH / 2,
            y: pillY + pillH / 2 + textW / 2,
            text: pin.name,
            fontFamily: typography.family.mono,
            fontSize: pinConst.label.fontSize,
            fill: typography.color.primary,
            rotation: -90,
            listening: false,
          }),
        );
      } else {
        const pillH = Math.min(
          bandHeight - pinConst.pill.clearance,
          minimumHorizontalBandHeight() - surface.pin.radius,
        );
        const pillW = textW + pinConst.pill.widthPadding;
        const pillX = p.x - pillW / 2;
        const pillY = Math.max(bandTop, dotY - pinConst.pill.clearance - pillH);
        nodeGroup.add(
          new Konva.Rect({
            x: pillX,
            y: pillY,
            width: pillW,
            height: pillH,
            cornerRadius: surface.radius.pill,
            fill: surface.chipFill,
            stroke: pending ? surface.border.pending : surface.border.neutral,
            strokeWidth: surface.baseStrokeWidth,
            listening: false,
          }),
        );
        nodeGroup.add(
          new Konva.Text({
            x: pillX + pinConst.pill.text.x,
            y: pillY + pinConst.pill.text.y,
            text: pin.name,
            fontFamily: typography.family.mono,
            fontSize: pinConst.label.fontSize,
            fill: typography.color.primary,
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
  };

  const bindNodeInteractions = (
    nodeGroup: Konva.Group,
    sheetNode: SheetNodeInstance,
  ) => {
    bindDraggableRenderable({
      group: nodeGroup,
      target: { kind: "node", id: sheetNode.id },
      clampPos,
      setLivePosition: (pos) => {
        liveNodePositions.set(sheetNode.id, pos);
      },
      dragSelection,
      redrawWires,
      persistMove: (pos) => {
        callbacks.onMoveNode(sheetNode.id, pos.x, pos.y);
      },
    });
    nodeGroup.on("click tap", (evt) => {
      callbacks.onSelect(
        { kind: "node", id: sheetNode.id },
        {
          mode:
            evt.evt instanceof MouseEvent && evt.evt.shiftKey
              ? "toggle"
              : undefined,
        },
      );
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
            id: sheetNode.id,
            nodeKind: sheetNode.kind === "sheet" ? "sheet" : "component",
          },
        });
      }
    });
    nodeGroup.on("dblclick dbltap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onSelect({ kind: "node", id: sheetNode.id });
      callbacks.onOpenNode(sheetNode.id);
    });
  };

  for (const sheetNode of sheet.nodes) {
    const layout = nodeLayouts.get(sheetNode.id);
    if (!layout) continue;
    const selected = selectedNodeIds.has(sheetNode.id);
    const tint = componentNodeTint(project, sheetNode);
    const nodeGroup = new Konva.Group({
      x: sheetNode.position.x,
      y: sheetNode.position.y,
      draggable: true,
      dragBoundFunc: (pos) => clampPos(pos),
    });
    nodeGroups.set(sheetNode.id, nodeGroup);

    nodeGroup.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: layout.width,
        height: layout.height,
        cornerRadius: node.cornerRadius,
        fill: tint.bodyFill,
        stroke: selected ? surface.border.pending : tint.idleBorder,
        strokeWidth: selected ? 2 : 1,
      }),
    );
    nodeGroup.add(
      new Konva.Text({
        x: node.title.x,
        y: node.title.y,
        width: layout.width - node.title.rightPadding,
        text: getNodeTitle(project, sheetNode),
        fontFamily: typography.family.sans,
        fontSize: node.title.fontSize,
        fill: typography.color.primary,
      }),
    );
    nodeGroup.add(
      new Konva.Text({
        x: layout.width - node.kind.rightX,
        y: node.title.y,
        width: node.kind.width,
        align: "right",
        text: sheetNode.kind === "component" ? "comp" : sheetNode.kind,
        fontFamily: typography.family.sans,
        fontSize: node.kind.fontSize,
        fill: typography.color.muted,
      }),
    );

    const visiblePins = getVisibleNodePins(project, sheet, sheetNode);
    const leftPins = visiblePins.filter((p) => p.side === "left");
    const rightPins = visiblePins.filter((p) => p.side === "right");
    const topPins = visiblePins.filter((p) => p.side === "top");
    const bottomPins = visiblePins.filter((p) => p.side === "bottom");
    const rows = Math.max(leftPins.length, rightPins.length, 1);
    const topHeight =
      topPins.length > 0 ? layout.topBandHeight + node.sectionGap : 0;
    renderTopPins(nodeGroup, sheetNode, layout, topPins, topHeight);
    renderSidePins(nodeGroup, sheetNode, leftPins, layout, "left");
    renderSidePins(nodeGroup, sheetNode, rightPins, layout, "right");
    renderBottomPins(nodeGroup, sheetNode, layout, bottomPins, topHeight, rows);
    bindNodeInteractions(nodeGroup, sheetNode);
    mainWorld.add(nodeGroup);
  }
}
