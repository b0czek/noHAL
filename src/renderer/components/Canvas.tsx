import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { getSheet } from "../../shared/graph";
import { KonvaSheetScene } from "../canvas/konvaSheetScene";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useCanvasContextMenu } from "./useCanvasContextMenu";

interface CanvasProps {
  onOpenNode: (nodeId: string) => void;
  onLabelClick: (labelId: string) => void;
  onCommentClick: (commentId: string) => void;
}

export default function Canvas(props: CanvasProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  let hostEl!: HTMLDivElement;
  let scene: KonvaSheetScene | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const [camera, setCamera] = createSignal({ x: 0, y: 0, scale: 1 });
  const sheet = createMemo(() => getSheet(state.project, state.activeSheetId));

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
    onOpenNode: props.onOpenNode,
  });

  onMount(() => {
    scene = new KonvaSheetScene(hostEl, {
      onSelect: actions.select,
      onOpenNode: props.onOpenNode,
      onEndpointClick: actions.endpointClick,
      onBackgroundClick: actions.addPendingWirePoint,
      onLabelClick: props.onLabelClick,
      onCommentClick: props.onCommentClick,
      onMoveNode: actions.moveNode,
      onMoveLabel: actions.moveLabel,
      onMoveComment: actions.moveComment,
      onMoveSheetPort: actions.moveSheetPort,
      onMoveConnectionWaypoints: actions.updateDirectConnectionWaypoints,
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
      project: state.project,
      sheet: sheet(),
      selection: state.selection,
      pendingEndpoint: state.pendingEndpoint,
      pendingWirePoints: state.pendingWirePoints,
    });
  });

  createEffect(() => {
    state.project;
    sheet();
    state.selection;
    state.pendingEndpoint;
    state.pendingWirePoints;
    scene?.render({
      project: state.project,
      sheet: sheet(),
      selection: state.selection,
      pendingEndpoint: state.pendingEndpoint,
      pendingWirePoints: state.pendingWirePoints,
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
