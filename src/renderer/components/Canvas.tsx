import { createEffect, onCleanup, onMount } from "solid-js";
import type { NochalProject, SheetDefinition, SheetEndpointRef } from "../../shared/types";
import type { Selection } from "../state/store";
import { KonvaSheetScene } from "../canvas/konvaSheetScene";

interface CanvasProps {
  project: NochalProject;
  sheet: SheetDefinition;
  activeSheetId: string;
  selection: Selection;
  pendingEndpoint: SheetEndpointRef | null;
  onSelect: (selection: Selection) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onLabelClick: (labelId: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
}

export default function Canvas(props: CanvasProps) {
  let hostEl!: HTMLDivElement;
  let scene: KonvaSheetScene | null = null;
  let resizeObserver: ResizeObserver | null = null;

  onMount(() => {
    scene = new KonvaSheetScene(hostEl, {
      onSelect: props.onSelect,
      onEndpointClick: props.onEndpointClick,
      onLabelClick: props.onLabelClick,
      onMoveNode: props.onMoveNode,
      onMoveLabel: props.onMoveLabel,
      onMoveSheetPort: props.onMoveSheetPort
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
    <div class="canvas-shell">
      <div class="canvas-grid">
        <div
          ref={(el) => {
            hostEl = el;
          }}
          class="scene-konva-host"
        />
      </div>
    </div>
  );
}
