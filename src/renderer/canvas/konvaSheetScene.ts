import Konva from "konva";
import { endpointKey } from "../../shared/graph";
import type { SheetEndpointRef } from "../../shared/types";
import { SCENE_HEIGHT, SCENE_WIDTH } from "./constants";
import {
  renderLabels,
  renderNodes,
  renderPorts,
} from "./konvaSheetSceneRenderables";
import type { SceneCallbacks, SceneRenderState } from "./konvaSheetSceneTypes";
import {
  deleteSelectedWaypoint as deleteWireSelectedWaypoint,
  type KonvaSheetSceneWiresContext,
  redrawWires as redrawSceneWires,
} from "./konvaSheetSceneWires";
import { buildSheetSceneLayout, type NodeLayout, type Pt } from "./layout";

export type { SceneRenderState } from "./konvaSheetSceneTypes";

const SCENE_POSITION_PADDING = 2400;
const CAMERA_OVERSCROLL_PX = 220;
const MARQUEE_SELECT_THRESHOLD_PX = 4;

type SelectionDragTarget = {
  kind: "node" | "label" | "sheet-port";
  id: string;
};

type GroupDragSession = {
  anchor: SelectionDragTarget;
  nodeStartPositions: Map<string, Pt>;
  labelStartPositions: Map<string, Pt>;
  portStartPositions: Map<string, Pt>;
  anchorStartPos: Pt;
  appliedDx: number;
  appliedDy: number;
};

export class KonvaSheetScene {
  private container: HTMLDivElement;
  private stage: Konva.Stage;
  private wireLayer: Konva.Layer;
  private mainLayer: Konva.Layer;
  private uiLayer: Konva.Layer;
  private wireWorld: Konva.Group;
  private mainWorld: Konva.Group;
  private marqueeRect: Konva.Rect;
  private callbacks: SceneCallbacks;
  private lastState: SceneRenderState | null = null;
  private nodeLayouts = new Map<string, NodeLayout>();
  private liveNodePositions = new Map<string, Pt>();
  private liveLabelPositions = new Map<string, Pt>();
  private livePortPositions = new Map<string, Pt>();
  private nodeGroups = new Map<string, Konva.Group>();
  private labelGroups = new Map<string, Konva.Group>();
  private portGroups = new Map<string, Konva.Group>();
  private cursorPos: Pt | null = null;
  private camera = { x: 0, y: 0, scale: 1 };
  private selectedConnectionId: string | null = null;
  private selectedWaypointIndex: number | null = null;
  private isPanning = false;
  private panLastScreenPos: Pt | null = null;
  private isMarqueeSelecting = false;
  private marqueeStartScreenPos: Pt | null = null;
  private marqueeCurrentScreenPos: Pt | null = null;
  private groupDragSession: GroupDragSession | null = null;
  private spacePressed = false;
  private sceneBounds = {
    minX: 0,
    minY: 0,
    maxX: SCENE_WIDTH,
    maxY: SCENE_HEIGHT,
  };
  private onKeyDown: (evt: KeyboardEvent) => void;
  private onKeyUp: (evt: KeyboardEvent) => void;

  constructor(container: HTMLDivElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.stage = new Konva.Stage({
      container,
      width: Math.max(320, container.clientWidth || 320),
      height: Math.max(240, container.clientHeight || 240),
    });
    this.wireLayer = new Konva.Layer();
    this.mainLayer = new Konva.Layer();
    this.uiLayer = new Konva.Layer({ listening: false });
    this.wireWorld = new Konva.Group();
    this.mainWorld = new Konva.Group();
    this.marqueeRect = new Konva.Rect({
      visible: false,
      listening: false,
      fill: "rgba(120, 180, 255, 0.16)",
      stroke: "rgba(120, 180, 255, 0.92)",
      strokeWidth: 1,
      dash: [6, 4],
      cornerRadius: 2,
    });
    this.wireLayer.add(this.wireWorld);
    this.mainLayer.add(this.mainWorld);
    this.uiLayer.add(this.marqueeRect);
    this.stage.add(this.wireLayer);
    this.stage.add(this.mainLayer);
    this.stage.add(this.uiLayer);
    this.centerCamera();
    this.applyCamera();

    this.onKeyDown = (evt) => {
      if (evt.code === "Space") this.spacePressed = true;
      if (
        (evt.key === "Delete" || evt.key === "Backspace") &&
        !this.isEditableTarget(evt.target)
      ) {
        if (!this.deleteSelectedWaypoint()) return;
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
      }
    };
    this.onKeyUp = (evt) => {
      if (evt.code === "Space") this.spacePressed = false;
    };
    window.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("keyup", this.onKeyUp);

    this.stage.on("mousemove touchmove", () => {
      const pos = this.stage.getPointerPosition();
      const screenPos = pos ? { x: pos.x, y: pos.y } : null;
      this.cursorPos = screenPos
        ? this.clampPos(this.screenToWorld(screenPos))
        : null;

      if (this.isPanning && screenPos && this.panLastScreenPos) {
        const dx = screenPos.x - this.panLastScreenPos.x;
        const dy = screenPos.y - this.panLastScreenPos.y;
        this.panLastScreenPos = screenPos;
        this.camera.x += dx;
        this.camera.y += dy;
        this.applyCamera();
      }

      if (this.isMarqueeSelecting && screenPos) {
        this.marqueeCurrentScreenPos = screenPos;
        this.updateMarqueeRect();
      }

      if (this.lastState?.pendingEndpoint) this.redrawWires();
    });
    this.stage.on("mouseleave", () => {
      this.isPanning = false;
      this.panLastScreenPos = null;
      this.cancelMarqueeSelection();
      this.cursorPos = null;
      if (this.lastState?.pendingEndpoint) this.redrawWires();
    });
    this.stage.on("mousedown touchstart", (evt) => {
      const pos = this.stage.getPointerPosition();
      if (
        pos &&
        this.lastState?.pendingEndpoint &&
        evt.evt instanceof MouseEvent &&
        evt.evt.button === 0 &&
        !this.spacePressed &&
        this.isBackgroundTarget(evt.target)
      ) {
        evt.cancelBubble = true;
        evt.evt.preventDefault();
        this.callbacks.onBackgroundClick?.(
          this.clampPos(this.screenToWorld({ x: pos.x, y: pos.y })),
        );
        return;
      }

      if (this.shouldStartMarquee(evt)) {
        if (!pos) return;
        evt.cancelBubble = true;
        this.startMarqueeSelection({ x: pos.x, y: pos.y });
        if ("preventDefault" in evt.evt) evt.evt.preventDefault();
        return;
      }

      if (!this.shouldStartPan(evt)) return;
      if (!pos) return;
      evt.cancelBubble = true;
      this.isPanning = true;
      this.panLastScreenPos = { x: pos.x, y: pos.y };
      this.container.style.cursor = "grabbing";
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    });
    this.stage.on("mouseup touchend", () => {
      if (this.isMarqueeSelecting) {
        this.finishMarqueeSelection();
        return;
      }
      this.isPanning = false;
      this.panLastScreenPos = null;
      this.container.style.cursor = "";
    });
    this.stage.on("wheel", (evt) => {
      const pointer = this.stage.getPointerPosition();
      if (!pointer) return;
      evt.evt.preventDefault();
      const oldScale = this.camera.scale;
      const zoomFactor = evt.evt.deltaY > 0 ? 1 / 1.08 : 1.08;
      const nextScale = Math.max(0.35, Math.min(2.8, oldScale * zoomFactor));
      if (Math.abs(nextScale - oldScale) < 1e-6) return;
      const worldAtPointer = this.screenToWorld({ x: pointer.x, y: pointer.y });
      this.camera.scale = nextScale;
      this.camera.x = pointer.x - worldAtPointer.x * nextScale;
      this.camera.y = pointer.y - worldAtPointer.y * nextScale;
      this.applyCamera();
      if (this.lastState?.pendingEndpoint) this.redrawWires();
    });
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("keyup", this.onKeyUp);
    this.stage.destroy();
  }

  resize(width: number, height: number): void {
    const w = Math.max(320, Math.floor(width));
    const h = Math.max(240, Math.floor(height));
    if (this.stage.width() === w && this.stage.height() === h) return;
    this.stage.size({ width: w, height: h });
    this.applyCamera();
    if (this.lastState) {
      this.redrawWires();
      this.mainLayer.batchDraw();
      this.uiLayer.batchDraw();
    }
  }

  clientToWorld(clientX: number, clientY: number): Pt {
    const rect = this.container.getBoundingClientRect();
    const screen = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    return this.clampPos(this.screenToWorld(screen));
  }

  private clampPos(pos: { x: number; y: number }): { x: number; y: number } {
    const minX = -SCENE_POSITION_PADDING;
    const minY = -SCENE_POSITION_PADDING;
    const maxX = this.sceneBounds.maxX + SCENE_POSITION_PADDING;
    const maxY = this.sceneBounds.maxY + SCENE_POSITION_PADDING;
    return {
      x: Math.max(minX, Math.min(maxX, pos.x)),
      y: Math.max(minY, Math.min(maxY, pos.y)),
    };
  }

  private pendingKey(endpoint: SheetEndpointRef | null): string | null {
    return endpoint ? endpointKey(endpoint) : null;
  }

  private centerCamera(): void {
    const stageW = this.stage.width();
    const stageH = this.stage.height();
    const worldW = this.sceneBounds.maxX - this.sceneBounds.minX;
    const worldH = this.sceneBounds.maxY - this.sceneBounds.minY;
    this.camera.scale = 1;
    this.camera.x = Math.round(
      (stageW - worldW) / 2 - this.sceneBounds.minX * this.camera.scale,
    );
    this.camera.y = Math.round(
      (stageH - worldH) / 2 - this.sceneBounds.minY * this.camera.scale,
    );
  }

  private clampCamera(): void {
    const stageW = this.stage.width();
    const stageH = this.stage.height();
    const minWorldX = -SCENE_POSITION_PADDING;
    const minWorldY = -SCENE_POSITION_PADDING;
    const maxWorldX = this.sceneBounds.maxX + SCENE_POSITION_PADDING;
    const maxWorldY = this.sceneBounds.maxY + SCENE_POSITION_PADDING;
    const scaledWorldW = (maxWorldX - minWorldX) * this.camera.scale;
    const scaledWorldH = (maxWorldY - minWorldY) * this.camera.scale;
    const overscrollX = CAMERA_OVERSCROLL_PX;
    const overscrollY = CAMERA_OVERSCROLL_PX;

    if (scaledWorldW <= stageW - overscrollX * 2) {
      this.camera.x = Math.round(
        (stageW - scaledWorldW) / 2 - minWorldX * this.camera.scale,
      );
    } else {
      const minX = stageW - overscrollX - maxWorldX * this.camera.scale;
      const maxX = overscrollX - minWorldX * this.camera.scale;
      this.camera.x = Math.max(minX, Math.min(maxX, this.camera.x));
    }

    if (scaledWorldH <= stageH - overscrollY * 2) {
      this.camera.y = Math.round(
        (stageH - scaledWorldH) / 2 - minWorldY * this.camera.scale,
      );
    } else {
      const minY = stageH - overscrollY - maxWorldY * this.camera.scale;
      const maxY = overscrollY - minWorldY * this.camera.scale;
      this.camera.y = Math.max(minY, Math.min(maxY, this.camera.y));
    }
  }

  private applyCamera(): void {
    this.clampCamera();
    const transform = {
      x: this.camera.x,
      y: this.camera.y,
      scaleX: this.camera.scale,
      scaleY: this.camera.scale,
    };
    this.wireWorld.setAttrs(transform);
    this.mainWorld.setAttrs(transform);
    this.wireLayer.batchDraw();
    this.mainLayer.batchDraw();
    this.uiLayer.batchDraw();
    this.callbacks.onCameraChange?.({ ...this.camera });
  }

  private estimateLabelSize(
    scope: string,
    name: string,
  ): { width: number; height: number } {
    // Cheap estimate for bounds expansion; exact rendering uses Konva text measurement.
    const scopeW = Math.ceil(scope.length * 5.8);
    const nameW = Math.ceil(name.length * 7.2);
    return {
      width: 16 + scopeW + 8 + nameW + 10,
      height: 22,
    };
  }

  private estimatePortBox(
    port: SceneRenderState["sheet"]["ports"][number],
    position?: Pt,
  ): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const pos = position ?? port.position;
    const labelText = `${port.name}  ${port.type}`;
    const width = Math.ceil(labelText.length * 7.2) + 38;
    const height = 24;
    let x = pos.x + 12;
    let y = pos.y - height / 2;
    if (port.side === "right") x = pos.x - width - 12;
    if (port.side === "bottom") {
      x = pos.x - width / 2;
      y = pos.y - height - 12;
    }
    return { x, y, width, height };
  }

  private expandBoundsWithRotatedRect(
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    rect: { x: number; y: number; width: number; height: number },
    rotationDeg: number,
    pivot: Pt,
  ): void {
    const rad = (rotationDeg * Math.PI) / 180;
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    const corners: Pt[] = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ];
    for (const p of corners) {
      const dx = p.x - pivot.x;
      const dy = p.y - pivot.y;
      const x = pivot.x + dx * c - dy * s;
      const y = pivot.y + dx * s + dy * c;
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
  }

  private computeSceneBounds(state: SceneRenderState): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    const bounds = {
      minX: 0,
      minY: 0,
      maxX: SCENE_WIDTH,
      maxY: SCENE_HEIGHT,
    };
    const margin = 160;

    for (const node of state.sheet.nodes) {
      const layout = this.nodeLayouts.get(node.id);
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
      const size = this.estimateLabelSize(label.scope, label.name);
      this.expandBoundsWithRotatedRect(
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

    for (const port of state.sheet.ports) {
      const rect = this.estimatePortBox(port);
      this.expandBoundsWithRotatedRect(
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

    for (const conn of state.sheet.directConnections) {
      for (const wp of conn.waypoints ?? []) {
        bounds.minX = Math.min(bounds.minX, wp.x - margin);
        bounds.minY = Math.min(bounds.minY, wp.y - margin);
        bounds.maxX = Math.max(bounds.maxX, wp.x + margin);
        bounds.maxY = Math.max(bounds.maxY, wp.y + margin);
      }
    }

    for (const wp of state.pendingWirePoints) {
      bounds.minX = Math.min(bounds.minX, wp.x - margin);
      bounds.minY = Math.min(bounds.minY, wp.y - margin);
      bounds.maxX = Math.max(bounds.maxX, wp.x + margin);
      bounds.maxY = Math.max(bounds.maxY, wp.y + margin);
    }

    return bounds;
  }

  private screenToWorld(pos: Pt): Pt {
    return {
      x: (pos.x - this.camera.x) / this.camera.scale,
      y: (pos.y - this.camera.y) / this.camera.scale,
    };
  }

  private startMarqueeSelection(screenPos: Pt): void {
    this.isMarqueeSelecting = true;
    this.marqueeStartScreenPos = screenPos;
    this.marqueeCurrentScreenPos = screenPos;
    this.container.style.cursor = "crosshair";
    this.updateMarqueeRect();
  }

  private cancelMarqueeSelection(): void {
    if (!this.isMarqueeSelecting && !this.marqueeRect.visible()) return;
    this.isMarqueeSelecting = false;
    this.marqueeStartScreenPos = null;
    this.marqueeCurrentScreenPos = null;
    this.marqueeRect.hide();
    this.uiLayer.batchDraw();
    if (!this.isPanning) this.container.style.cursor = "";
  }

  private finishMarqueeSelection(): void {
    const start = this.marqueeStartScreenPos;
    const end = this.marqueeCurrentScreenPos ?? start;
    this.cancelMarqueeSelection();
    if (!start || !end) return;

    const screenRect = this.normalizedRect(start, end);
    if (
      screenRect.width < MARQUEE_SELECT_THRESHOLD_PX &&
      screenRect.height < MARQUEE_SELECT_THRESHOLD_PX
    ) {
      this.callbacks.onSelect(null);
      return;
    }

    const worldA = this.clampPos(
      this.screenToWorld({ x: screenRect.x, y: screenRect.y }),
    );
    const worldB = this.clampPos(
      this.screenToWorld({
        x: screenRect.x + screenRect.width,
        y: screenRect.y + screenRect.height,
      }),
    );
    const worldRect = this.normalizedRect(worldA, worldB);
    this.selectItemsInWorldRect(worldRect);
  }

  private updateMarqueeRect(): void {
    const start = this.marqueeStartScreenPos;
    const end = this.marqueeCurrentScreenPos;
    if (!start || !end) return;
    const rect = this.normalizedRect(start, end);
    this.marqueeRect.setAttrs({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      visible: true,
    });
    this.uiLayer.batchDraw();
  }

  private normalizedRect(
    a: Pt,
    b: Pt,
  ): { x: number; y: number; width: number; height: number } {
    const x1 = Math.min(a.x, b.x);
    const y1 = Math.min(a.y, b.y);
    const x2 = Math.max(a.x, b.x);
    const y2 = Math.max(a.y, b.y);
    return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  }

  private rectContainsRect(
    outer: { x: number; y: number; width: number; height: number },
    inner: { x: number; y: number; width: number; height: number },
  ): boolean {
    return (
      inner.x >= outer.x &&
      inner.y >= outer.y &&
      inner.x + inner.width <= outer.x + outer.width &&
      inner.y + inner.height <= outer.y + outer.height
    );
  }

  private rotatedRectBounds(
    rect: { x: number; y: number; width: number; height: number },
    rotationDeg: number,
    pivot: Pt,
  ): { x: number; y: number; width: number; height: number } {
    const bounds = {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    };
    this.expandBoundsWithRotatedRect(bounds, rect, rotationDeg, pivot);
    return {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
    };
  }

  private selectItemsInWorldRect(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): void {
    const state = this.lastState;
    if (!state) return;

    const nodeIds: string[] = [];
    const labelIds: string[] = [];
    const portIds: string[] = [];

    for (const node of state.sheet.nodes) {
      const layout = this.nodeLayouts.get(node.id);
      if (!layout) continue;
      const pos = this.liveNodePositions.get(node.id) ?? node.position;
      const nodeRect = {
        x: pos.x,
        y: pos.y,
        width: layout.width,
        height: layout.height,
      };
      if (this.rectContainsRect(rect, nodeRect)) nodeIds.push(node.id);
    }

    for (const label of state.sheet.labels) {
      const pos = this.liveLabelPositions.get(label.id) ?? label.position;
      const size = this.estimateLabelSize(label.scope, label.name);
      const labelRect = this.rotatedRectBounds(
        {
          x: pos.x,
          y: pos.y - size.height / 2,
          width: size.width,
          height: size.height,
        },
        label.rotation ?? 0,
        pos,
      );
      if (this.rectContainsRect(rect, labelRect)) labelIds.push(label.id);
    }

    for (const port of state.sheet.ports) {
      const pos = this.livePortPositions.get(port.id) ?? port.position;
      const portRect = this.rotatedRectBounds(
        this.estimatePortBox(port, pos),
        port.rotation ?? 0,
        pos,
      );
      if (this.rectContainsRect(rect, portRect)) portIds.push(port.id);
    }

    const total = nodeIds.length + labelIds.length + portIds.length;
    if (total === 0) {
      this.callbacks.onSelect(null);
      return;
    }
    if (total === 1) {
      if (nodeIds.length === 1)
        this.callbacks.onSelect({ kind: "node", id: nodeIds[0] });
      else if (labelIds.length === 1)
        this.callbacks.onSelect({ kind: "label", id: labelIds[0] });
      else this.callbacks.onSelect({ kind: "sheet-port", id: portIds[0] });
      return;
    }
    this.callbacks.onSelect({
      kind: "multi",
      nodeIds,
      labelIds,
      portIds,
    });
  }

  private shouldStartMarquee(
    evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ): boolean {
    return (
      !this.lastState?.pendingEndpoint &&
      evt.evt instanceof MouseEvent &&
      evt.evt.button === 0 &&
      !this.spacePressed &&
      this.isBackgroundTarget(evt.target)
    );
  }

  private selectionContainsTarget(
    selection: SceneRenderState["selection"],
    target: SelectionDragTarget,
  ): boolean {
    if (!selection) return false;
    if (selection.kind === target.kind) return selection.id === target.id;
    if (selection.kind !== "multi") return false;
    if (target.kind === "node") return selection.nodeIds.includes(target.id);
    if (target.kind === "label") return selection.labelIds.includes(target.id);
    return selection.portIds.includes(target.id);
  }

  private buildGroupDragSession(
    target: SelectionDragTarget,
    anchorPos: Pt,
  ): GroupDragSession | null {
    const selection = this.lastState?.selection;
    const state = this.lastState;
    if (!state || !selection || selection.kind !== "multi") return null;
    if (!this.selectionContainsTarget(selection, target)) return null;

    const total =
      selection.nodeIds.length +
      selection.labelIds.length +
      selection.portIds.length;
    if (total <= 1) return null;

    const nodeStartPositions = new Map<string, Pt>();
    const labelStartPositions = new Map<string, Pt>();
    const portStartPositions = new Map<string, Pt>();

    for (const nodeId of selection.nodeIds) {
      const node = state.sheet.nodes.find((n) => n.id === nodeId);
      if (!node) continue;
      nodeStartPositions.set(
        nodeId,
        this.liveNodePositions.get(nodeId) ?? node.position,
      );
    }
    for (const labelId of selection.labelIds) {
      const label = state.sheet.labels.find((l) => l.id === labelId);
      if (!label) continue;
      labelStartPositions.set(
        labelId,
        this.liveLabelPositions.get(labelId) ?? label.position,
      );
    }
    for (const portId of selection.portIds) {
      const port = state.sheet.ports.find((p) => p.id === portId);
      if (!port) continue;
      portStartPositions.set(
        portId,
        this.livePortPositions.get(portId) ?? port.position,
      );
    }

    if (
      nodeStartPositions.size +
        labelStartPositions.size +
        portStartPositions.size <=
      1
    ) {
      return null;
    }

    return {
      anchor: target,
      nodeStartPositions,
      labelStartPositions,
      portStartPositions,
      anchorStartPos: { x: anchorPos.x, y: anchorPos.y },
      appliedDx: 0,
      appliedDy: 0,
    };
  }

  private setRenderedGroupPosition(target: SelectionDragTarget, pos: Pt): void {
    const group =
      target.kind === "node"
        ? this.nodeGroups.get(target.id)
        : target.kind === "label"
          ? this.labelGroups.get(target.id)
          : this.portGroups.get(target.id);
    if (group) group.position(pos);
  }

  private applyGroupDragLivePosition(
    target: SelectionDragTarget,
    pos: Pt,
  ): void {
    if (target.kind === "node") this.liveNodePositions.set(target.id, pos);
    else if (target.kind === "label")
      this.liveLabelPositions.set(target.id, pos);
    else this.livePortPositions.set(target.id, pos);
  }

  private constrainGroupDragDelta(
    session: GroupDragSession,
    dx: number,
    dy: number,
  ): Pt {
    let nextDx = dx;
    let nextDy = dy;

    const applyConstraint = (start: Pt) => {
      const clamped = this.clampPos({ x: start.x + dx, y: start.y + dy });
      const allowedDx = clamped.x - start.x;
      const allowedDy = clamped.y - start.y;
      if (dx > 0) nextDx = Math.min(nextDx, allowedDx);
      else if (dx < 0) nextDx = Math.max(nextDx, allowedDx);
      if (dy > 0) nextDy = Math.min(nextDy, allowedDy);
      else if (dy < 0) nextDy = Math.max(nextDy, allowedDy);
    };

    for (const start of session.nodeStartPositions.values())
      applyConstraint(start);
    for (const start of session.labelStartPositions.values())
      applyConstraint(start);
    for (const start of session.portStartPositions.values())
      applyConstraint(start);

    return { x: nextDx, y: nextDy };
  }

  private applyGroupDragSessionPositions(session: GroupDragSession): void {
    const moveAll = (
      entries: IterableIterator<[string, Pt]>,
      kind: SelectionDragTarget["kind"],
    ) => {
      for (const [id, start] of entries) {
        const next = this.clampPos({
          x: start.x + session.appliedDx,
          y: start.y + session.appliedDy,
        });
        this.setRenderedGroupPosition({ kind, id }, next);
        this.applyGroupDragLivePosition({ kind, id }, next);
      }
    };

    moveAll(session.nodeStartPositions.entries(), "node");
    moveAll(session.labelStartPositions.entries(), "label");
    moveAll(session.portStartPositions.entries(), "sheet-port");
  }

  private onSelectionDragStart = (
    target: SelectionDragTarget,
    pos: Pt,
  ): boolean => {
    const session = this.buildGroupDragSession(target, pos);
    this.groupDragSession = session;
    return session !== null;
  };

  private onSelectionDragMove = (
    target: SelectionDragTarget,
    pos: Pt,
  ): boolean => {
    const session = this.groupDragSession;
    if (!session) return false;
    if (
      session.anchor.kind !== target.kind ||
      session.anchor.id !== target.id
    ) {
      return false;
    }
    const desiredDx = pos.x - session.anchorStartPos.x;
    const desiredDy = pos.y - session.anchorStartPos.y;
    const constrained = this.constrainGroupDragDelta(
      session,
      desiredDx,
      desiredDy,
    );
    session.appliedDx = constrained.x;
    session.appliedDy = constrained.y;
    this.applyGroupDragSessionPositions(session);
    this.redrawWires();
    return true;
  };

  private onSelectionDragEnd = (
    target: SelectionDragTarget,
    pos: Pt,
  ): boolean => {
    const session = this.groupDragSession;
    if (!session) return false;
    if (
      session.anchor.kind !== target.kind ||
      session.anchor.id !== target.id
    ) {
      return false;
    }

    this.onSelectionDragMove(target, pos);
    this.groupDragSession = null;

    const commitEntries = (
      entries: IterableIterator<[string, Pt]>,
      onCommit: (id: string, x: number, y: number) => void,
    ) => {
      for (const [id, start] of entries) {
        const next = this.clampPos({
          x: start.x + session.appliedDx,
          y: start.y + session.appliedDy,
        });
        onCommit(id, next.x, next.y);
      }
    };

    commitEntries(session.nodeStartPositions.entries(), (id, x, y) =>
      this.callbacks.onMoveNode(id, x, y),
    );
    commitEntries(session.labelStartPositions.entries(), (id, x, y) =>
      this.callbacks.onMoveLabel(id, x, y),
    );
    commitEntries(session.portStartPositions.entries(), (id, x, y) =>
      this.callbacks.onMoveSheetPort(id, x, y),
    );
    return true;
  };

  private shouldStartPan(
    evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ): boolean {
    const onBackground = this.isBackgroundTarget(evt.target);

    if (evt.evt instanceof MouseEvent) {
      if (evt.evt.button === 1) return true;
      if (this.spacePressed && evt.evt.button === 0) return true;
      return false;
    }

    return this.spacePressed || onBackground;
  }

  private isBackgroundTarget(target: Konva.Node): boolean {
    const className = target.getClassName();
    return target === this.stage || className === "Layer";
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
      target.isContentEditable ||
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT"
    );
  }

  private resetTransientPositions(): void {
    this.groupDragSession = null;
    this.liveNodePositions.clear();
    this.liveLabelPositions.clear();
    this.livePortPositions.clear();
    this.nodeGroups.clear();
    this.labelGroups.clear();
    this.portGroups.clear();
  }
  private wireContext(): KonvaSheetSceneWiresContext {
    return {
      stage: this.stage,
      wireLayer: this.wireLayer,
      wireWorld: this.wireWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      screenToWorld: (pos) => this.screenToWorld(pos),
      getCursorPosCache: () => this.cursorPos,
      getLastState: () => this.lastState,
      getNodeLayouts: () => this.nodeLayouts,
      getLiveNodePositions: () => this.liveNodePositions,
      getLiveLabelPositions: () => this.liveLabelPositions,
      getLivePortPositions: () => this.livePortPositions,
      getSelectedConnectionId: () => this.selectedConnectionId,
      setSelectedConnectionId: (id) => {
        this.selectedConnectionId = id;
      },
      getSelectedWaypointIndex: () => this.selectedWaypointIndex,
      setSelectedWaypointIndex: (index) => {
        this.selectedWaypointIndex = index;
      },
    };
  }

  private deleteSelectedWaypoint(): boolean {
    return deleteWireSelectedWaypoint(this.wireContext());
  }

  private redrawWires(): void {
    redrawSceneWires(this.wireContext());
  }

  render(state: SceneRenderState): void {
    const { project, sheet, selection, pendingEndpoint } = state;
    const pendingKey = this.pendingKey(pendingEndpoint);
    const selectedNodeIds = new Set<string>();
    const selectedLabelIds = new Set<string>();
    const selectedPortIds = new Set<string>();
    if (selection?.kind === "node") selectedNodeIds.add(selection.id);
    else if (selection?.kind === "label") selectedLabelIds.add(selection.id);
    else if (selection?.kind === "sheet-port")
      selectedPortIds.add(selection.id);
    else if (selection?.kind === "multi") {
      for (const id of selection.nodeIds) selectedNodeIds.add(id);
      for (const id of selection.labelIds) selectedLabelIds.add(id);
      for (const id of selection.portIds) selectedPortIds.add(id);
    }
    const nextSelectedConnectionId =
      selection?.kind === "wire-connection" ? selection.id : null;
    if (this.selectedConnectionId !== nextSelectedConnectionId) {
      this.selectedWaypointIndex = null;
    }
    this.selectedConnectionId = nextSelectedConnectionId;

    this.lastState = state;
    this.resetTransientPositions();
    this.mainWorld.destroyChildren();

    const { nodeLayouts } = buildSheetSceneLayout(project, sheet);
    this.nodeLayouts = nodeLayouts;
    this.sceneBounds = this.computeSceneBounds(state);
    this.applyCamera();
    this.redrawWires();

    renderPorts({
      sheet,
      pendingKey,
      selectedPortIds,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      onSelectionDragStart: this.onSelectionDragStart,
      onSelectionDragMove: this.onSelectionDragMove,
      onSelectionDragEnd: this.onSelectionDragEnd,
      livePortPositions: this.livePortPositions,
      portGroups: this.portGroups,
    });
    renderNodes({
      project,
      sheet,
      pendingKey,
      selectedNodeIds,
      nodeLayouts,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      onSelectionDragStart: this.onSelectionDragStart,
      onSelectionDragMove: this.onSelectionDragMove,
      onSelectionDragEnd: this.onSelectionDragEnd,
      liveNodePositions: this.liveNodePositions,
      nodeGroups: this.nodeGroups,
    });
    renderLabels({
      sheet,
      selectedLabelIds,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      onSelectionDragStart: this.onSelectionDragStart,
      onSelectionDragMove: this.onSelectionDragMove,
      onSelectionDragEnd: this.onSelectionDragEnd,
      liveLabelPositions: this.liveLabelPositions,
      labelGroups: this.labelGroups,
    });

    this.mainLayer.batchDraw();
  }
}
