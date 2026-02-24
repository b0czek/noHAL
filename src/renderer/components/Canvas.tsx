import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "../../shared/types";
import { KonvaSheetScene } from "../canvas/konvaSheetScene";
import { useI18n } from "../i18n";
import type { Selection } from "../state/store";
import { useCanvasContextMenu } from "./useCanvasContextMenu";

interface CanvasProps {
  project: NoHALProject;
  sheet: SheetDefinition;
  activeSheetId: string;
  selection: Selection;
  pendingEndpoint: SheetEndpointRef | null;
  pendingWirePoints: XY[];
  onSelect: (selection: Selection) => void;
  onOpenNode: (nodeId: string) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onCanvasBackgroundClick: (point: XY) => void;
  onLabelClick: (labelId: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
  onMoveConnectionWaypoints: (connectionId: string, waypoints: XY[]) => void;
  onAddComponentAt: (componentId: string, x: number, y: number) => void;
  onRemoveSelection: () => void;
  onRemoveConnection: (connectionId: string) => void;
  onRefreshComponentInStore: (componentId: string) => void;
}

export default function Canvas(props: CanvasProps) {
  const { t } = useI18n();
  let hostEl!: HTMLDivElement;
  let scene: KonvaSheetScene | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const [camera, setCamera] = createSignal({ x: 0, y: 0, scale: 1 });

  const wrapOffset = (value: number, spacing: number) => {
    if (spacing <= 0) return 0;
    return ((value % spacing) + spacing) % spacing;
  };

  const gridStyle = createMemo(() => {
    const { x, y, scale } = camera();
    const minorSpace = 24 * scale;
    const majorSpace = minorSpace * 5;
    return [
      `--grid-space:${minorSpace}px`,
      `--grid-major-space:${majorSpace}px`,
      `--grid-offset-x:${wrapOffset(x, minorSpace)}px`,
      `--grid-offset-y:${wrapOffset(y, minorSpace)}px`,
      `--grid-major-offset-x:${wrapOffset(x, majorSpace)}px`,
      `--grid-major-offset-y:${wrapOffset(y, majorSpace)}px`,
    ].join(";");
  });

  const canvasContextMenu = useCanvasContextMenu({
    getHostEl: () => hostEl,
    getScene: () => scene,
    getProject: () => props.project,
    getSheet: () => props.sheet,
    getSelection: () => props.selection,
    onSelect: props.onSelect,
    onOpenNode: props.onOpenNode,
    onMoveConnectionWaypoints: props.onMoveConnectionWaypoints,
    onAddComponentAt: props.onAddComponentAt,
    onRemoveSelection: props.onRemoveSelection,
    onRemoveConnection: props.onRemoveConnection,
    onRefreshComponentInStore: props.onRefreshComponentInStore,
  });

  onMount(() => {
    scene = new KonvaSheetScene(hostEl, {
      onSelect: props.onSelect,
      onOpenNode: props.onOpenNode,
      onEndpointClick: props.onEndpointClick,
      onBackgroundClick: props.onCanvasBackgroundClick,
      onLabelClick: props.onLabelClick,
      onMoveNode: props.onMoveNode,
      onMoveLabel: props.onMoveLabel,
      onMoveSheetPort: props.onMoveSheetPort,
      onMoveConnectionWaypoints: props.onMoveConnectionWaypoints,
      onCameraChange: setCamera,
      onContextMenuRequest: canvasContextMenu.handleSceneContextMenuRequest,
    });
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      scene?.resize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(hostEl);
    scene.render({
      project: props.project,
      sheet: props.sheet,
      selection: props.selection,
      pendingEndpoint: props.pendingEndpoint,
      pendingWirePoints: props.pendingWirePoints,
    });
  });

  createEffect(() => {
    props.project;
    props.sheet;
    props.selection;
    props.pendingEndpoint;
    props.pendingWirePoints;
    scene?.render({
      project: props.project,
      sheet: props.sheet,
      selection: props.selection,
      pendingEndpoint: props.pendingEndpoint,
      pendingWirePoints: props.pendingWirePoints,
    });
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    scene?.destroy();
    scene = null;
  });

  return (
    <div class="canvas-shell" role="presentation">
      <div class="canvas-grid" style={gridStyle()}>
        <div
          ref={(el) => {
            hostEl = el;
          }}
          class="scene-konva-host"
          role="application"
          aria-label={t("canvas.ariaWorkspace")}
          onContextMenu={(evt) => {
            if (evt.defaultPrevented) return;
            evt.preventDefault();
            canvasContextMenu.openBackgroundMenu(evt.clientX, evt.clientY);
          }}
        />
      </div>
    </div>
  );
}
