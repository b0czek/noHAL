import { endpointKey } from "@nohal/core/src/graph";
import type { SheetEndpointRef } from "@nohal/core/src/types";
import Konva from "konva";
import {
  CORNER_RADIUS_MD,
  FONT_MONO,
  FONT_SANS,
  NEUTRAL_BORDER,
  PORT_LABEL_H,
  PORT_PANEL_FILL,
  SELECTED_BORDER,
  TEXT_PRIMARY,
} from "../constants";
import {
  addPinDot,
  bindDraggableRenderable,
  type RenderPortsArgs,
  type RenderRuntimeContext,
} from "./shared";

export function renderPorts(
  ctx: RenderRuntimeContext,
  args: RenderPortsArgs,
): void {
  const {
    mainWorld,
    callbacks,
    clampPos,
    redrawWires,
    onSelectionDragStart,
    onSelectionDragMove,
    onSelectionDragEnd,
  } = ctx;

  const { sheet, pendingKey, selectedPortIds, livePortPositions, portGroups } =
    args;

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
    portGroups.set(port.id, portGroup);

    const measure = new Konva.Text({
      text: port.name,
      fontFamily: FONT_SANS,
      fontSize: 12,
    });
    const width = Math.ceil(measure.width()) + 20;
    const h = PORT_LABEL_H;

    let labelRectX = 12;
    let labelRectY = -h / 2;
    if (port.side === "right") labelRectX = -width - 12;
    if (port.side === "top") {
      labelRectX = -width / 2;
      labelRectY = 12;
    }
    if (port.side === "bottom") {
      labelRectX = -width / 2;
      labelRectY = -h - 12;
    }

    portGroup.add(
      new Konva.Rect({
        x: labelRectX,
        y: labelRectY,
        width,
        height: h,
        cornerRadius: CORNER_RADIUS_MD,
        fill: PORT_PANEL_FILL,
        stroke: selectedPortIds.has(port.id) ? SELECTED_BORDER : NEUTRAL_BORDER,
        strokeWidth: selectedPortIds.has(port.id) ? 2 : 1,
      }),
    );

    portGroup.add(
      new Konva.Text({
        x: labelRectX + 9,
        y: labelRectY + 5,
        text: port.name,
        fontFamily: FONT_MONO,
        fontSize: 12,
        fill: TEXT_PRIMARY,
      }),
    );

    bindDraggableRenderable({
      group: portGroup,
      target: { kind: "sheet-port", id: port.id },
      clampPos,
      setLivePosition: (pos) => {
        livePortPositions.set(port.id, pos);
      },
      onSelectionDragStart,
      onSelectionDragMove,
      onSelectionDragEnd,
      redrawWires,
      persistMove: (pos) => {
        callbacks.onMoveSheetPort(port.id, pos.x, pos.y);
      },
    });
    portGroup.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onSelect({ kind: "sheet-port", id: port.id });
    });
    portGroup.on("contextmenu", (evt) => {
      evt.cancelBubble = true;
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
      if ("stopPropagation" in evt.evt) evt.evt.stopPropagation();
      if (evt.evt instanceof MouseEvent) {
        callbacks.onContextMenuRequest?.({
          clientX: evt.evt.clientX,
          clientY: evt.evt.clientY,
          target: { kind: "sheet-port", id: port.id },
        });
      }
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
