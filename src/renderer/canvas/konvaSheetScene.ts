import Konva from "konva";
import { endpointKey, getNodePins, getNodeTitle } from "../../shared/graph";
import type { NoHALProject, SheetDefinition, SheetEndpointRef, XY } from "../../shared/types";
import { BOTTOM_H, HEADER_H, PIN_R, PORT_LABEL_H, SCENE_HEIGHT, SCENE_WIDTH, SIDE_ROW_H } from "./constants";
import { buildSheetSceneLayout, type NodeLayout, type Pt } from "./layout";
import { dirStroke, directionPillFill, labelFill, typeFill } from "./theme";

interface SceneCallbacks {
  onSelect: (selection: { kind: "node"; id: string } | { kind: "label"; id: string } | { kind: "sheet-port"; id: string } | null) => void;
  onOpenNode: (nodeId: string) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onLabelClick: (labelId: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
  onMoveConnectionWaypoints: (connectionId: string, waypoints: XY[]) => void;
  onBackgroundClick?: (point: XY) => void;
  onCameraChange?: (camera: { x: number; y: number; scale: number }) => void;
}

export interface SceneRenderState {
  project: NoHALProject;
  sheet: SheetDefinition;
  selection: { kind: "node"; id: string } | { kind: "label"; id: string } | { kind: "sheet-port"; id: string } | null;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
}

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
  private onKeyDown: (evt: KeyboardEvent) => void;
  private onKeyUp: (evt: KeyboardEvent) => void;

  constructor(container: HTMLDivElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.stage = new Konva.Stage({
      container,
      width: Math.max(320, container.clientWidth || 320),
      height: Math.max(240, container.clientHeight || 240)
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
      if ((evt.key === "Delete" || evt.key === "Backspace") && !this.isEditableTarget(evt.target)) {
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
      this.cursorPos = screenPos ? this.clampPos(this.screenToWorld(screenPos)) : null;

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
        this.callbacks.onBackgroundClick?.(this.clampPos(this.screenToWorld({ x: pos.x, y: pos.y })));
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
      y: clientY - rect.top
    };
    return this.clampPos(this.screenToWorld(screen));
  }

  private clampPos(pos: { x: number; y: number }): { x: number; y: number } {
    return {
      x: Math.max(10, Math.min(SCENE_WIDTH - 10, pos.x)),
      y: Math.max(10, Math.min(SCENE_HEIGHT - 10, pos.y))
    };
  }

  private pendingKey(endpoint: SheetEndpointRef | null): string | null {
    return endpoint ? endpointKey(endpoint) : null;
  }

  private centerCamera(): void {
    const stageW = this.stage.width();
    const stageH = this.stage.height();
    this.camera.scale = 1;
    this.camera.x = Math.round((stageW - SCENE_WIDTH) / 2);
    this.camera.y = Math.round((stageH - SCENE_HEIGHT) / 2);
  }

  private clampCamera(): void {
    const stageW = this.stage.width();
    const stageH = this.stage.height();
    const scaledWorldW = SCENE_WIDTH * this.camera.scale;
    const scaledWorldH = SCENE_HEIGHT * this.camera.scale;

    if (scaledWorldW <= stageW) {
      this.camera.x = Math.round((stageW - scaledWorldW) / 2);
    } else {
      const minX = stageW - scaledWorldW;
      this.camera.x = Math.max(minX, Math.min(0, this.camera.x));
    }

    if (scaledWorldH <= stageH) {
      this.camera.y = Math.round((stageH - scaledWorldH) / 2);
    } else {
      const minY = stageH - scaledWorldH;
      this.camera.y = Math.max(minY, Math.min(0, this.camera.y));
    }
  }

  private applyCamera(): void {
    this.clampCamera();
    const transform = {
      x: this.camera.x,
      y: this.camera.y,
      scaleX: this.camera.scale,
      scaleY: this.camera.scale
    };
    this.wireWorld.setAttrs(transform);
    this.mainWorld.setAttrs(transform);
    this.wireLayer.batchDraw();
    this.mainLayer.batchDraw();
    this.callbacks.onCameraChange?.({ ...this.camera });
  }

  private screenToWorld(pos: Pt): Pt {
    return {
      x: (pos.x - this.camera.x) / this.camera.scale,
      y: (pos.y - this.camera.y) / this.camera.scale
    };
  }

  private shouldStartPan(evt: Konva.KonvaEventObject<MouseEvent | TouchEvent>): boolean {
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
    return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  private getPointerWorldPos(): Pt | null {
    const pos = this.stage.getPointerPosition();
    if (!pos) return null;
    return this.clampPos(this.screenToWorld({ x: pos.x, y: pos.y }));
  }

  private distSqPointToSegment(p: Pt, a: Pt, b: Pt): number {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const abLenSq = abx * abx + aby * aby;
    if (abLenSq <= 1e-9) return apx * apx + apy * apy;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLenSq));
    const cx = a.x + abx * t;
    const cy = a.y + aby * t;
    const dx = p.x - cx;
    const dy = p.y - cy;
    return dx * dx + dy * dy;
  }

  private findNearestSegmentIndex(routePoints: Pt[], point: Pt): number {
    let bestIndex = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < routePoints.length - 1; i += 1) {
      const d = this.distSqPointToSegment(point, routePoints[i], routePoints[i + 1]);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  private deleteSelectedWaypoint(): boolean {
    if (!this.lastState || !this.selectedConnectionId || this.selectedWaypointIndex === null) return false;
    const conn = this.lastState.sheet.directConnections.find((c) => c.id === this.selectedConnectionId);
    if (!conn || !conn.waypoints || this.selectedWaypointIndex < 0 || this.selectedWaypointIndex >= conn.waypoints.length) return false;
    const nextWaypoints = conn.waypoints.filter((_, i) => i !== this.selectedWaypointIndex);
    this.selectedWaypointIndex = nextWaypoints.length === 0 ? null : Math.min(this.selectedWaypointIndex, nextWaypoints.length - 1);
    this.callbacks.onMoveConnectionWaypoints(conn.id, nextWaypoints.map((p) => ({ x: p.x, y: p.y })));
    return true;
  }

  private insertWaypointOnConnection(connectionId: string, routePoints: Pt[], point: Pt): void {
    if (!this.lastState) return;
    const conn = this.lastState.sheet.directConnections.find((c) => c.id === connectionId);
    if (!conn) return;
    const currentWaypoints = (conn.waypoints ?? []).map((p) => ({ x: p.x, y: p.y }));
    const insertAt = this.findNearestSegmentIndex(routePoints, point);
    currentWaypoints.splice(insertAt, 0, { x: point.x, y: point.y });
    this.selectedConnectionId = connectionId;
    this.selectedWaypointIndex = insertAt;
    this.callbacks.onMoveConnectionWaypoints(connectionId, currentWaypoints);
  }

  private sideNormal(side: "left" | "right" | "bottom"): Pt {
    if (side === "left") return { x: -1, y: 0 };
    if (side === "right") return { x: 1, y: 0 };
    return { x: 0, y: 1 };
  }

  private getEndpointNormal(project: NoHALProject, sheet: SheetDefinition, endpoint: SheetEndpointRef): Pt | null {
    if (endpoint.kind === "sheet-port") {
      const port = sheet.ports.find((p) => p.id === endpoint.portId);
      return port ? this.sideNormal(port.side) : null;
    }

    const node = sheet.nodes.find((n) => n.id === endpoint.nodeId);
    if (!node) return null;
    const pin = getNodePins(project, node).find((p) => p.key === endpoint.pinKey);
    if (!pin) return null;
    return this.sideNormal(pin.side);
  }

  private buildDisplayWirePoints(args: {
    project: NoHALProject;
    sheet: SheetDefinition;
    rawPoints: Pt[];
    startEndpoint: SheetEndpointRef;
    endEndpoint?: SheetEndpointRef | null;
  }): Pt[] {
    const { project, sheet, rawPoints, startEndpoint, endEndpoint } = args;
    if (rawPoints.length < 2) return rawPoints;
    const out: Pt[] = [];
    const pushDistinct = (p: Pt) => {
      const prev = out[out.length - 1];
      if (!prev || Math.abs(prev.x - p.x) > 0.01 || Math.abs(prev.y - p.y) > 0.01) out.push(p);
    };
    const stubLen = 14;
    const start = rawPoints[0];
    const end = rawPoints[rawPoints.length - 1];

    pushDistinct(start);
    const startNormal = this.getEndpointNormal(project, sheet, startEndpoint);
    if (startNormal) {
      pushDistinct({ x: start.x + startNormal.x * stubLen, y: start.y + startNormal.y * stubLen });
    }

    for (let i = 1; i < rawPoints.length - 1; i += 1) {
      pushDistinct(rawPoints[i]);
    }

    if (endEndpoint) {
      const endNormal = this.getEndpointNormal(project, sheet, endEndpoint);
      if (endNormal) {
        pushDistinct({ x: end.x + endNormal.x * stubLen, y: end.y + endNormal.y * stubLen });
      }
    }

    pushDistinct(end);
    return out;
  }

  private resetTransientPositions(): void {
    this.liveNodePositions.clear();
    this.liveLabelPositions.clear();
    this.livePortPositions.clear();
  }

  private makeBezierWire(
    a: Pt,
    b: Pt,
    attrs: { stroke: string; strokeWidth: number; dash?: number[]; listening?: boolean; hitStrokeWidth?: number }
  ): Konva.Line {
    const dx = Math.abs(b.x - a.x) * 0.4;
    const c1x = a.x + (b.x >= a.x ? dx : -dx);
    const c2x = b.x - (b.x >= a.x ? dx : -dx);
    return new Konva.Line({
      points: [a.x, a.y, c1x, a.y, c2x, b.y, b.x, b.y],
      bezier: true,
      stroke: attrs.stroke,
      strokeWidth: attrs.strokeWidth,
      dash: attrs.dash,
      listening: attrs.listening ?? false,
      hitStrokeWidth: attrs.hitStrokeWidth,
      lineCap: "round",
      lineJoin: "round"
    });
  }

  private drawWire(a: Pt, b: Pt, attrs: { stroke: string; strokeWidth: number; dash?: number[]; listening?: boolean; hitStrokeWidth?: number }): Konva.Line {
    const line = this.makeBezierWire(a, b, attrs);
    this.wireWorld.add(line);
    return line;
  }

  private updateWirePathShape(line: Konva.Line, points: Pt[]): void {
    if (points.length < 2) return;
    if (points.length === 2) {
      const bez = this.makeBezierWire(points[0], points[1], {
        stroke: line.stroke(),
        strokeWidth: line.strokeWidth(),
        dash: line.dash(),
        listening: line.listening(),
        hitStrokeWidth: line.hitStrokeWidth()
      });
      line.setAttrs({
        points: bez.points(),
        bezier: true,
        tension: 0
      });
      return;
    }
    const flatPoints: number[] = [];
    for (const p of points) flatPoints.push(p.x, p.y);
    line.setAttrs({
      points: flatPoints,
      bezier: false,
      tension: 0.25
    });
  }

  private drawWirePath(
    points: Pt[],
    attrs: { stroke: string; strokeWidth: number; dash?: number[]; listening?: boolean; hitStrokeWidth?: number }
  ): Konva.Line | null {
    if (points.length < 2) return null;
    if (points.length === 2) {
      return this.drawWire(points[0], points[1], attrs);
    }
    const flatPoints: number[] = [];
    for (const p of points) {
      flatPoints.push(p.x, p.y);
    }
    const line = new Konva.Line({
      points: flatPoints,
      tension: 0.25,
      stroke: attrs.stroke,
      strokeWidth: attrs.strokeWidth,
      dash: attrs.dash,
      listening: attrs.listening ?? false,
      hitStrokeWidth: attrs.hitStrokeWidth,
      lineCap: "round",
      lineJoin: "round"
    });
    this.wireWorld.add(line);
    return line;
  }

  private getNodePosition(sheet: SheetDefinition, nodeId: string): Pt | null {
    const live = this.liveNodePositions.get(nodeId);
    if (live) return live;
    const node = sheet.nodes.find((n) => n.id === nodeId);
    return node ? node.position : null;
  }

  private getPortPosition(sheet: SheetDefinition, portId: string): Pt | null {
    const live = this.livePortPositions.get(portId);
    if (live) return live;
    const port = sheet.ports.find((p) => p.id === portId);
    return port ? port.position : null;
  }

  private getLabelPosition(sheet: SheetDefinition, labelId: string): Pt | null {
    const live = this.liveLabelPositions.get(labelId);
    if (live) return live;
    const label = sheet.labels.find((l) => l.id === labelId);
    return label ? label.position : null;
  }

  private getEndpointPoint(sheet: SheetDefinition, endpoint: SheetEndpointRef): Pt | null {
    if (endpoint.kind === "sheet-port") {
      return this.getPortPosition(sheet, endpoint.portId);
    }

    const layout = this.nodeLayouts.get(endpoint.nodeId);
    const local = layout?.pinPositionsLocal[endpoint.pinKey];
    if (!layout || !local) return null;
    const nodePos = this.getNodePosition(sheet, endpoint.nodeId);
    if (!nodePos) return null;
    return { x: nodePos.x + local.x, y: nodePos.y + local.y };
  }

  private getCursorPos(): Pt | null {
    if (this.cursorPos) return this.cursorPos;
    const pos = this.stage.getPointerPosition();
    return pos ? this.clampPos(this.screenToWorld({ x: pos.x, y: pos.y })) : null;
  }

  private redrawWires(): void {
    const state = this.lastState;
    if (!state) return;
    const { sheet, pendingEndpoint, pendingWirePoints } = state;
    const selectedConn = this.selectedConnectionId ? sheet.directConnections.find((c) => c.id === this.selectedConnectionId) : null;
    if (!selectedConn) {
      this.selectedConnectionId = null;
      this.selectedWaypointIndex = null;
    } else if (
      this.selectedWaypointIndex !== null &&
      (selectedConn.waypoints?.length ?? 0) <= this.selectedWaypointIndex
    ) {
      this.selectedWaypointIndex = (selectedConn.waypoints?.length ?? 0) > 0 ? (selectedConn.waypoints!.length - 1) : null;
    }
    this.wireWorld.destroyChildren();

    for (const conn of sheet.directConnections) {
      const a = this.getEndpointPoint(sheet, conn.a);
      const b = this.getEndpointPoint(sheet, conn.b);
      if (!a || !b) continue;
      const routePoints: Pt[] = [a, ...((conn.waypoints ?? []).map((p) => ({ x: p.x, y: p.y }))), b];
      const displayRoutePoints = this.buildDisplayWirePoints({
        project: state.project,
        sheet,
        rawPoints: routePoints,
        startEndpoint: conn.a,
        endEndpoint: conn.b
      });
      const selected = this.selectedConnectionId === conn.id;
      const wire = this.drawWirePath(displayRoutePoints, {
        stroke: selected ? "rgba(140, 244, 224, 0.92)" : "rgba(122, 230, 208, 0.75)",
        strokeWidth: selected ? 2.75 : 2.25,
        listening: true,
        hitStrokeWidth: 14
      });
      wire?.on("click tap", (evt) => {
        evt.cancelBubble = true;
        if (evt.evt instanceof MouseEvent && evt.evt.detail >= 2) {
          const point = this.getPointerWorldPos();
          if (!point) return;
          this.insertWaypointOnConnection(conn.id, routePoints, point);
          return;
        }
        this.selectedConnectionId = conn.id;
        this.selectedWaypointIndex = null;
        this.redrawWires();
      });
      wire?.on("dbltap", (evt) => {
        evt.cancelBubble = true;
        const point = this.getPointerWorldPos();
        if (!point) return;
        this.insertWaypointOnConnection(conn.id, routePoints, point);
      });

      if (selected && (conn.waypoints?.length ?? 0) > 0 && wire) {
        for (let i = 0; i < conn.waypoints!.length; i += 1) {
          const isSelectedWaypoint = this.selectedWaypointIndex === i;
          const waypointIndex = i + 1;
          const p = routePoints[waypointIndex];
          const handle = new Konva.Circle({
            x: p.x,
            y: p.y,
            radius: isSelectedWaypoint ? 7 : 6,
            fill: isSelectedWaypoint ? "rgba(140, 244, 224, 0.22)" : "rgba(8, 18, 22, 0.95)",
            stroke: "rgba(140, 244, 224, 0.95)",
            strokeWidth: 2,
            draggable: true,
            hitStrokeWidth: 14,
            dragBoundFunc: (pos) => this.clampPos(pos)
          });
          handle.on("click tap", (evt) => {
            evt.cancelBubble = true;
            this.selectedConnectionId = conn.id;
            this.selectedWaypointIndex = i;
            this.redrawWires();
          });
          handle.on("dragmove", () => {
            const pos = this.clampPos(handle.position());
            handle.position(pos);
            this.selectedConnectionId = conn.id;
            this.selectedWaypointIndex = i;
            routePoints[waypointIndex] = pos;
            this.updateWirePathShape(
              wire,
              this.buildDisplayWirePoints({
                project: state.project,
                sheet,
                rawPoints: routePoints,
                startEndpoint: conn.a,
                endEndpoint: conn.b
              })
            );
            this.wireLayer.batchDraw();
          });
          handle.on("dragend", () => {
            const pos = this.clampPos(handle.position());
            handle.position(pos);
            this.selectedConnectionId = conn.id;
            this.selectedWaypointIndex = i;
            routePoints[waypointIndex] = pos;
            this.updateWirePathShape(
              wire,
              this.buildDisplayWirePoints({
                project: state.project,
                sheet,
                rawPoints: routePoints,
                startEndpoint: conn.a,
                endEndpoint: conn.b
              })
            );
            this.callbacks.onMoveConnectionWaypoints(
              conn.id,
              routePoints.slice(1, -1).map((pt) => ({ x: pt.x, y: pt.y }))
            );
            this.wireLayer.batchDraw();
          });
          this.wireWorld.add(handle);
        }
      }
    }

    for (const anchor of sheet.labelAnchors) {
      const ep = this.getEndpointPoint(sheet, anchor.endpoint);
      const labelPos = this.getLabelPosition(sheet, anchor.labelId);
      if (!ep || !labelPos) continue;
      this.wireWorld.add(
        new Konva.Line({
          points: [ep.x, ep.y, labelPos.x, labelPos.y],
          stroke: "rgba(242, 185, 75, 0.72)",
          strokeWidth: 1.7,
          dash: [7, 5],
          listening: false
        })
      );
    }

    if (pendingEndpoint) {
      const a = this.getEndpointPoint(sheet, pendingEndpoint);
      const cursor = this.getCursorPos();
      if (a && cursor) {
        const pendingRawPoints = [a, ...pendingWirePoints, cursor];
        const pendingDisplayPoints = this.buildDisplayWirePoints({
          project: state.project,
          sheet,
          rawPoints: pendingRawPoints,
          startEndpoint: pendingEndpoint,
          endEndpoint: null
        });
        this.drawWirePath(pendingDisplayPoints, {
          stroke: "rgba(122, 230, 208, 0.55)",
          strokeWidth: 2,
          dash: [8, 6],
          listening: false
        });
      }
    }

    this.wireLayer.batchDraw();
  }

  private addPinDot(args: {
    parent: Konva.Container;
    x: number;
    y: number;
    direction: string;
    type: string;
    pending: boolean;
    endpoint: SheetEndpointRef;
  }): void {
    if (args.pending) {
      args.parent.add(
        new Konva.Circle({
          x: args.x,
          y: args.y,
          radius: PIN_R + 4,
          fill: "rgba(122, 230, 208, 0.18)",
          listening: false
        })
      );
    }

    const bead = new Konva.Circle({
      x: args.x,
      y: args.y,
      radius: PIN_R,
      fill: typeFill(args.type),
      stroke: dirStroke(args.direction),
      strokeWidth: 2,
      hitStrokeWidth: 10
    });

    bead.on("click tap", (evt) => {
      evt.cancelBubble = true;
      this.callbacks.onEndpointClick(args.endpoint);
    });

    args.parent.add(bead);
  }

  render(state: SceneRenderState): void {
    const { project, sheet, selection, pendingEndpoint } = state;
    const pendingKey = this.pendingKey(pendingEndpoint);
    const selectedNodeId = selection?.kind === "node" ? selection.id : null;
    const selectedLabelId = selection?.kind === "label" ? selection.id : null;
    const selectedPortId = selection?.kind === "sheet-port" ? selection.id : null;

    this.lastState = state;
    this.resetTransientPositions();
    this.mainWorld.destroyChildren();

    const { nodeLayouts } = buildSheetSceneLayout(project, sheet);
    this.nodeLayouts = nodeLayouts;
    this.redrawWires();

    for (const port of sheet.ports) {
      const endpoint: SheetEndpointRef = { kind: "sheet-port", portId: port.id };
      const pending = pendingKey === endpointKey(endpoint);

      const portGroup = new Konva.Group({
        x: port.position.x,
        y: port.position.y,
        draggable: true,
        dragBoundFunc: (pos) => this.clampPos(pos)
      });

      const labelText = `${port.name}  ${port.type}`;
      const measure = new Konva.Text({
        text: labelText,
        fontFamily: "IBM Plex Sans",
        fontSize: 12
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
        cornerRadius: 10,
        fill: "rgba(8, 21, 27, 0.95)",
        stroke: selectedPortId === port.id ? "rgba(122, 230, 208, 0.6)" : "rgba(255, 255, 255, 0.08)",
        strokeWidth: selectedPortId === port.id ? 2 : 1
      });
      portGroup.add(box);

      const nameText = new Konva.Text({
        x: labelRectX + 9,
        y: labelRectY + 5,
        text: port.name,
        fontFamily: "IBM Plex Mono",
        fontSize: 12,
        fill: "#d7eee7"
      });
      portGroup.add(nameText);

      const typeText = new Konva.Text({
        x: labelRectX + 15 + nameText.width(),
        y: labelRectY + 5,
        text: port.type,
        fontFamily: "IBM Plex Sans",
        fontSize: 11,
        fill: "#8ea8a1"
      });
      portGroup.add(typeText);

      const dirRect = new Konva.Rect({
        x: labelRectX + width - 34,
        y: labelRectY + 4,
        width: 28,
        height: h - 8,
        cornerRadius: 999,
        fill: directionPillFill(port.direction),
        stroke: dirStroke(port.direction),
        strokeWidth: 1
      });
      portGroup.add(dirRect);
      portGroup.add(
        new Konva.Text({
          x: dirRect.x() + 5,
          y: dirRect.y() + 6,
          text: port.direction,
          fontFamily: "IBM Plex Sans",
          fontSize: 10,
          fill: "#d7eee7"
        })
      );

      portGroup.on("click tap", (evt) => {
        evt.cancelBubble = true;
        this.callbacks.onSelect({ kind: "sheet-port", id: port.id });
      });
      portGroup.on("dragend", () => {
        const pos = this.clampPos(portGroup.position());
        portGroup.position(pos);
        this.livePortPositions.set(port.id, pos);
        this.redrawWires();
        this.callbacks.onMoveSheetPort(port.id, pos.x, pos.y);
      });
      portGroup.on("dragmove", () => {
        const pos = this.clampPos(portGroup.position());
        portGroup.position(pos);
        this.livePortPositions.set(port.id, pos);
        this.redrawWires();
      });

      this.addPinDot({
        parent: portGroup,
        x: 0,
        y: 0,
        direction: port.direction,
        type: port.type,
        pending,
        endpoint
      });

      this.mainWorld.add(portGroup);
    }

    for (const node of sheet.nodes) {
      const layout = nodeLayouts.get(node.id);
      if (!layout) continue;
      const selected = selectedNodeId === node.id;
      const nodeGroup = new Konva.Group({
        x: node.position.x,
        y: node.position.y,
        draggable: true,
        dragBoundFunc: (pos) => this.clampPos(pos)
      });

      nodeGroup.add(
        new Konva.Rect({
          x: 0,
          y: 0,
          width: layout.width,
          height: layout.height,
          cornerRadius: 14,
          fill: node.kind === "sheet" ? "rgba(17, 14, 9, 0.96)" : "rgba(10, 20, 25, 0.96)",
          stroke: selected
            ? "rgba(122, 230, 208, 0.45)"
            : node.kind === "sheet"
              ? "rgba(242, 185, 75, 0.18)"
              : "rgba(255, 255, 255, 0.08)",
          strokeWidth: selected ? 2 : 1
        })
      );

      const header = new Konva.Rect({
        x: 0,
        y: 0,
        width: layout.width,
        height: HEADER_H,
        cornerRadius: [14, 14, 0, 0],
        fill: "rgba(255, 255, 255, 0.03)"
      });
      nodeGroup.add(header);
      nodeGroup.add(
        new Konva.Line({
          points: [0, HEADER_H, layout.width, HEADER_H],
          stroke: "rgba(255, 255, 255, 0.05)",
          strokeWidth: 1
        })
      );
      nodeGroup.add(
        new Konva.Text({
          x: 10,
          y: 8,
          width: layout.width - 58,
          text: getNodeTitle(project, node),
          fontFamily: "IBM Plex Sans",
          fontSize: 12,
          fill: "#d7eee7"
        })
      );
      nodeGroup.add(
        new Konva.Text({
          x: layout.width - 46,
          y: 8,
          width: 40,
          align: "right",
          text: node.kind,
          fontFamily: "IBM Plex Sans",
          fontSize: 11,
          fill: "#8ea8a1"
        })
      );

      const pins = getNodePins(project, node);
      const leftPins = pins.filter((p) => p.side === "left");
      const rightPins = pins.filter((p) => p.side === "right");
      const bottomPins = pins.filter((p) => p.side === "bottom");
      const rows = Math.max(leftPins.length, rightPins.length, 1);

      for (let i = 0; i < rows; i += 1) {
        nodeGroup.add(
          new Konva.Rect({
            x: 6,
            y: HEADER_H + i * SIDE_ROW_H + 2,
            width: layout.width - 12,
            height: SIDE_ROW_H - 3,
            cornerRadius: 8,
            fill: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "rgba(255,255,255,0.02)",
            listening: false
          })
        );
      }

      for (const pin of leftPins) {
        const p = layout.pinPositionsLocal[pin.key];
        const endpoint: SheetEndpointRef = { kind: "node-pin", nodeId: node.id, pinKey: pin.key };
        const pending = pendingKey === endpointKey(endpoint);

        this.addPinDot({
          parent: nodeGroup,
          x: p.x,
          y: p.y,
          direction: pin.direction,
          type: pin.type,
          pending,
          endpoint
        });

        nodeGroup.add(
          new Konva.Text({
            x: p.x + 11,
            y: p.y - 7,
            text: pin.name,
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            fill: "#d7eee7"
          })
        );
      }

      for (const pin of rightPins) {
        const p = layout.pinPositionsLocal[pin.key];
        const endpoint: SheetEndpointRef = { kind: "node-pin", nodeId: node.id, pinKey: pin.key };
        const pending = pendingKey === endpointKey(endpoint);

        this.addPinDot({
          parent: nodeGroup,
          x: p.x,
          y: p.y,
          direction: pin.direction,
          type: pin.type,
          pending,
          endpoint
        });

        const measure = new Konva.Text({
          text: pin.name,
          fontFamily: "IBM Plex Mono",
          fontSize: 12
        });
        nodeGroup.add(
          new Konva.Text({
            x: p.x - 11 - measure.width(),
            y: p.y - 7,
            text: pin.name,
            fontFamily: "IBM Plex Mono",
            fontSize: 12,
            fill: "#d7eee7"
          })
        );
      }

      if (bottomPins.length > 0) {
        const y = HEADER_H + rows * SIDE_ROW_H + 8;
        for (const pin of bottomPins) {
          const p = layout.pinPositionsLocal[pin.key];
          const endpoint: SheetEndpointRef = { kind: "node-pin", nodeId: node.id, pinKey: pin.key };
          const pending = pendingKey === endpointKey(endpoint);
          const measure = new Konva.Text({
            text: pin.name,
            fontFamily: "IBM Plex Mono",
            fontSize: 11
          });
          const pillW = Math.ceil(measure.width()) + 16;
          const pillX = p.x - pillW / 2;
          const pill = new Konva.Rect({
            x: pillX,
            y,
            width: pillW,
            height: BOTTOM_H - 4,
            cornerRadius: 999,
            fill: "rgba(255,255,255,0.02)",
            stroke: pending ? "rgba(122,230,208,0.45)" : "rgba(255,255,255,0.08)",
            strokeWidth: 1
          });
          nodeGroup.add(pill);
          nodeGroup.add(
            new Konva.Text({
              x: pillX + 8,
              y: y + 4,
              text: pin.name,
              fontFamily: "IBM Plex Mono",
              fontSize: 11,
              fill: "#d7eee7"
            })
          );
          this.addPinDot({
            parent: nodeGroup,
            x: p.x,
            y: y + (BOTTOM_H - 4),
            direction: pin.direction,
            type: pin.type,
            pending,
            endpoint
          });
        }
      }

      nodeGroup.on("click tap", () => {
        this.callbacks.onSelect({ kind: "node", id: node.id });
      });
      nodeGroup.on("dblclick dbltap", (evt) => {
        evt.cancelBubble = true;
        this.callbacks.onSelect({ kind: "node", id: node.id });
        this.callbacks.onOpenNode(node.id);
      });
      nodeGroup.on("dragmove", () => {
        const pos = this.clampPos(nodeGroup.position());
        nodeGroup.position(pos);
        this.liveNodePositions.set(node.id, pos);
        this.redrawWires();
      });
      nodeGroup.on("dragend", () => {
        const pos = this.clampPos(nodeGroup.position());
        nodeGroup.position(pos);
        this.liveNodePositions.set(node.id, pos);
        this.redrawWires();
        this.callbacks.onMoveNode(node.id, pos.x, pos.y);
      });

      this.mainWorld.add(nodeGroup);
    }

    for (const label of sheet.labels) {
      const group = new Konva.Group({
        x: label.position.x,
        y: label.position.y,
        draggable: true,
        dragBoundFunc: (pos) => this.clampPos(pos)
      });
      const scopeMeasure = new Konva.Text({
        text: label.scope,
        fontFamily: "IBM Plex Sans",
        fontSize: 10
      });
      const nameMeasure = new Konva.Text({
        text: label.name,
        fontFamily: "IBM Plex Mono",
        fontSize: 12
      });
      const w = 16 + Math.ceil(scopeMeasure.width()) + 8 + Math.ceil(nameMeasure.width()) + 10;
      const h = 22;
      const box = new Konva.Rect({
        x: 0,
        y: -11,
        width: w,
        height: h,
        cornerRadius: 10,
        fill: labelFill(label.scope),
        stroke: selectedLabelId === label.id ? "rgba(122,230,208,0.5)" : "rgba(255,255,255,0.08)",
        strokeWidth: selectedLabelId === label.id ? 2 : 1
      });
      group.add(box);
      group.add(
        new Konva.Text({
          x: 8,
          y: -4,
          text: label.scope,
          fontFamily: "IBM Plex Sans",
          fontSize: 10,
          fill: "rgba(215,238,231,0.8)"
        })
      );
      group.add(
        new Konva.Text({
          x: 14 + Math.ceil(scopeMeasure.width()) + 6,
          y: -2,
          text: label.name,
          fontFamily: "IBM Plex Mono",
          fontSize: 12,
          fill: "#d7eee7"
        })
      );

      group.on("click tap", (evt) => {
        evt.cancelBubble = true;
        this.callbacks.onLabelClick(label.id);
      });
      group.on("dragend", () => {
        const pos = this.clampPos(group.position());
        group.position(pos);
        this.liveLabelPositions.set(label.id, pos);
        this.redrawWires();
        this.callbacks.onMoveLabel(label.id, pos.x, pos.y);
      });
      group.on("dragmove", () => {
        const pos = this.clampPos(group.position());
        group.position(pos);
        this.liveLabelPositions.set(label.id, pos);
        this.redrawWires();
      });

      this.mainWorld.add(group);
    }

    this.mainLayer.batchDraw();
  }
}
