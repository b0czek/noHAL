import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import type { NoHALProject, SheetDefinition, SheetEndpointRef } from "../../shared/types";
import type { Selection } from "../state/store";
import { KonvaSheetScene } from "../canvas/konvaSheetScene";
import CanvasComponentMenu from "./CanvasComponentMenu";

interface CanvasProps {
  project: NoHALProject;
  sheet: SheetDefinition;
  activeSheetId: string;
  selection: Selection;
  pendingEndpoint: SheetEndpointRef | null;
  onSelect: (selection: Selection) => void;
  onOpenNode: (nodeId: string) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onLabelClick: (labelId: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
  onAddComponentAt: (componentId: string, x: number, y: number) => void;
}

export default function Canvas(props: CanvasProps) {
  let hostEl!: HTMLDivElement;
  let scene: KonvaSheetScene | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const [menu, setMenu] = createSignal<{ x: number; y: number; worldX: number; worldY: number } | null>(null);
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
      `--grid-major-offset-y:${wrapOffset(y, majorSpace)}px`
    ].join(";");
  });

  const componentChoices = createMemo(() =>
    Object.values(props.project.library.components).sort((a, b) => a.halComponentName.localeCompare(b.halComponentName))
  );

  onMount(() => {
    scene = new KonvaSheetScene(hostEl, {
      onSelect: props.onSelect,
      onOpenNode: props.onOpenNode,
      onEndpointClick: props.onEndpointClick,
      onLabelClick: props.onLabelClick,
      onMoveNode: props.onMoveNode,
      onMoveLabel: props.onMoveLabel,
      onMoveSheetPort: props.onMoveSheetPort,
      onCameraChange: setCamera
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
      pendingEndpoint: props.pendingEndpoint
    });
  });

  createEffect(() => {
    props.project;
    props.sheet;
    props.selection;
    props.pendingEndpoint;
    scene?.render({
      project: props.project,
      sheet: props.sheet,
      selection: props.selection,
      pendingEndpoint: props.pendingEndpoint
    });
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    scene?.destroy();
    scene = null;
  });

  return (
    <div
      class="canvas-shell"
      onPointerDown={() => {
        if (menu()) setMenu(null);
      }}
    >
      <div class="canvas-grid" style={gridStyle()}>
        <div
          ref={(el) => {
            hostEl = el;
          }}
          class="scene-konva-host"
          onContextMenu={(evt) => {
            evt.preventDefault();
            const rect = hostEl.getBoundingClientRect();
            const localX = Math.max(0, evt.clientX - rect.left);
            const localY = Math.max(0, evt.clientY - rect.top);
            const menuW = 360;
            const menuH = 440;
            const x = Math.max(8, Math.min(localX, rect.width - menuW - 8));
            const y = Math.max(8, Math.min(localY, rect.height - menuH - 8));
            const world = scene?.clientToWorld(evt.clientX, evt.clientY) ?? { x: 120, y: 120 };
            setMenu({ x, y, worldX: world.x, worldY: world.y });
          }}
        />
        <CanvasComponentMenu
          open={menu() !== null}
          x={menu()?.x ?? 0}
          y={menu()?.y ?? 0}
          components={componentChoices()}
          onAddComponent={(componentId) => {
            const m = menu();
            props.onAddComponentAt(componentId, m?.worldX ?? 120, m?.worldY ?? 120);
          }}
          onClose={() => setMenu(null)}
        />
      </div>
    </div>
  );
}
