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

export class KonvaSheetScene {
  private container: HTMLDivElement;
  private stage: Konva.Stage;
  private wireLayer: Konva.Layer;
  private mainLayer: Konva.Layer;
  private wireWorld: Konva.Group;
  private mainWorld: Konva.Group;
  private callbacks: SceneCallbacks;
  private lastState: SceneRenderState | null = null;
  private nodeLayouts = new Map<string, NodeLayout>();
  private liveNodePositions = new Map<string, Pt>();
  private liveLabelPositions = new Map<string, Pt>();
  private livePortPositions = new Map<string, Pt>();
  private cursorPos: Pt | null = null;
  private camera = { x: 0, y: 0, scale: 1 };
  private selectedConnectionId: string | null = null;
  private selectedWaypointIndex: number | null = null;
  private isPanning = false;
  private panLastScreenPos: Pt | null = null;
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
    this.wireWorld = new Konva.Group();
    this.mainWorld = new Konva.Group();
    this.wireLayer.add(this.wireWorld);
    this.mainLayer.add(this.mainWorld);
    this.stage.add(this.wireLayer);
    this.stage.add(this.mainLayer);
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

      if (this.lastState?.pendingEndpoint) this.redrawWires();
    });
    this.stage.on("mouseleave", () => {
      this.isPanning = false;
      this.panLastScreenPos = null;
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

      if (!this.shouldStartPan(evt)) return;
      if (!pos) return;
      evt.cancelBubble = true;
      this.isPanning = true;
      this.panLastScreenPos = { x: pos.x, y: pos.y };
      this.container.style.cursor = "grabbing";
      if ("preventDefault" in evt.evt) evt.evt.preventDefault();
    });
    this.stage.on("mouseup touchend", () => {
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

  private estimatePortBox(port: SceneRenderState["sheet"]["ports"][number]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const labelText = `${port.name}  ${port.type}`;
    const width = Math.ceil(labelText.length * 7.2) + 38;
    const height = 24;
    let x = port.position.x + 12;
    let y = port.position.y - height / 2;
    if (port.side === "right") x = port.position.x - width - 12;
    if (port.side === "bottom") {
      x = port.position.x - width / 2;
      y = port.position.y - height - 12;
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

  private shouldStartPan(
    evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ): boolean {
    const onBackground = this.isBackgroundTarget(evt.target);

    if (evt.evt instanceof MouseEvent) {
      if (evt.evt.button === 1) return true;
      if (this.spacePressed && evt.evt.button === 0) return true;
      return onBackground && evt.evt.button === 0;
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
    this.liveNodePositions.clear();
    this.liveLabelPositions.clear();
    this.livePortPositions.clear();
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
    const selectedNodeId = selection?.kind === "node" ? selection.id : null;
    const selectedLabelId = selection?.kind === "label" ? selection.id : null;
    const selectedPortId =
      selection?.kind === "sheet-port" ? selection.id : null;

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
      selectedPortId,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      livePortPositions: this.livePortPositions,
    });
    renderNodes({
      project,
      sheet,
      pendingKey,
      selectedNodeId,
      nodeLayouts,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      liveNodePositions: this.liveNodePositions,
    });
    renderLabels({
      sheet,
      selectedLabelId,
      mainWorld: this.mainWorld,
      callbacks: this.callbacks,
      clampPos: (pos) => this.clampPos(pos),
      redrawWires: () => this.redrawWires(),
      liveLabelPositions: this.liveLabelPositions,
    });

    this.mainLayer.batchDraw();
  }
}
