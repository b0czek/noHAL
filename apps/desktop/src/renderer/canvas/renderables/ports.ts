import { endpointKey } from "@nohal/core/graph";
import type { SheetEndpointRef } from "@nohal/core/types";
import Konva from "konva";
import { port as portConst } from "../constants/ports";
import { surface } from "../constants/surfaces";
import { typography } from "../constants/typography";
import { estimatePortBox } from "../measurements";
import {
  addPinDot,
  bindDraggableRenderable,
  type RenderPortsArgs,
  type RenderSceneContext,
} from "./shared";

export function renderPorts(
  ctx: RenderSceneContext,
  args: RenderPortsArgs,
): void {
  const { mainWorld, clampPos, redrawWires, dragSelection } = ctx;
  const {
    callbacks,
    sheet,
    pendingKey,
    selectedPortIds,
    livePortPositions,
    portGroups,
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
    portGroups.set(port.id, portGroup);

    const {
      x: labelRectX,
      y: labelRectY,
      width,
      height: h,
    } = estimatePortBox(port, { x: 0, y: 0 });

    portGroup.add(
      new Konva.Rect({
        x: labelRectX,
        y: labelRectY,
        width,
        height: h,
        cornerRadius: surface.radius.md,
        fill: surface.portPanelFill,
        stroke: selectedPortIds.has(port.id)
          ? surface.border.selected
          : surface.border.neutral,
        strokeWidth: selectedPortIds.has(port.id) ? 2 : 1,
      }),
    );

    portGroup.add(
      new Konva.Text({
        x: labelRectX + portConst.text.x,
        y: labelRectY + portConst.text.y,
        text: port.name,
        fontFamily: typography.family.mono,
        fontSize: portConst.text.fontSize,
        fill: typography.color.primary,
      }),
    );

    bindDraggableRenderable({
      group: portGroup,
      target: { kind: "sheet-port", id: port.id },
      clampPos,
      setLivePosition: (pos) => {
        livePortPositions.set(port.id, pos);
      },
      dragSelection,
      redrawWires,
      persistMove: (pos) => {
        callbacks.onMoveSheetPort(port.id, pos.x, pos.y);
      },
    });
    portGroup.on("click tap", (evt) => {
      evt.cancelBubble = true;
      callbacks.onSelect(
        { kind: "sheet-port", id: port.id },
        {
          mode:
            evt.evt instanceof MouseEvent && evt.evt.shiftKey
              ? "toggle"
              : undefined,
        },
      );
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
