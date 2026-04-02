import { getSheet } from "@nohal/core/graph";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { createKonvaSheetScene, type SheetScene } from "../canvas";
import { useI18n } from "../i18n";
import { useAppSettings } from "../state/AppSettingsProvider";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import { useCanvasContextMenu } from "./useCanvasContextMenu";

const GRID_MAJOR_SPACING_MULTIPLIER = 5;

export default function Canvas() {
  const { t } = useI18n();
  const { state, setState, actions } = useEditorStore();
  const { settings } = useAppSettings();
  const editorUi = useEditorUi();
  let hostEl!: HTMLDivElement;
  let scene: SheetScene | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const [camera, setCamera] = createSignal({ x: 0, y: 0, scale: 1 });
  const sheet = createMemo(() => getSheet(state.project, state.activeSheetId));
  const placementMode = createMemo(() => editorUi.placementMode());
  const gridResolution = createMemo(() =>
    settings.canvasGridResolution > 0 ? settings.canvasGridResolution : null,
  );

  const wrapOffset = (value: number, spacing: number) => {
    if (spacing <= 0) return 0;
    return ((value % spacing) + spacing) % spacing;
  };

  const gridStyle = createMemo(() => {
    const resolution = gridResolution();
    if (!resolution) return "";
    const { x, y, scale } = camera();
    const minorSpace = resolution * scale;
    const majorSpace = minorSpace * GRID_MAJOR_SPACING_MULTIPLIER;
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
  });
  const handleSelect = (
    selection: typeof state.selection,
    options?: { mode?: "add" | "toggle" },
  ) => {
    if (options?.mode === "toggle") {
      actions.toggleSelection(selection);
      return;
    }
    if (options?.mode === "add") {
      actions.extendSelection(selection);
      return;
    }
    actions.select(selection);
  };

  const handleBackgroundClick = (
    point: { x: number; y: number },
    _options?: { mode?: "add" | "toggle" },
  ) => {
    if (placementMode()) {
      editorUi.placeAt(point);
      return;
    }
    actions.addPendingWirePoint(point);
  };

  const handleLabelClick = (
    labelId: string,
    options?: { mode?: "add" | "toggle" },
  ) => {
    if (state.pendingEndpoint) {
      actions.anchorPendingToLabel(labelId);
      return;
    }
    handleSelect({ kind: "label", id: labelId }, options);
  };

  onMount(() => {
    scene = createKonvaSheetScene(hostEl, {
      onSelect: handleSelect,
      onOpenNode: editorUi.openComponentEditorForNode,
      onEndpointClick: actions.endpointClick,
      onBackgroundClick: handleBackgroundClick,
      onLabelClick: handleLabelClick,
      onMoveNode: actions.moveNode,
      onMoveLabel: actions.moveLabel,
      onMoveComment: actions.moveComment,
      onMoveSheetPort: actions.moveSheetPort,
      onMoveSelectionGroup: actions.moveSelectionGroup,
      onMoveConnectionWaypoints: actions.updateDirectConnectionWaypoints,
      onCameraChange: setCamera,
      onCursorPosChange: (point) => {
        const current = state.canvasCursorPos;
        if (current?.x === point?.x && current?.y === point?.y) return;
        setState("canvasCursorPos", point);
      },
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
      gridResolution: gridResolution(),
      selection: state.selection,
      pendingEndpoint: state.pendingEndpoint,
      pendingWirePoints: state.pendingWirePoints,
      placement: placementMode(),
    });
  });

  createEffect(() => {
    state.project;
    sheet();
    gridResolution();
    state.selection;
    state.pendingEndpoint;
    state.pendingWirePoints;
    placementMode();
    scene?.render({
      project: state.project,
      sheet: sheet(),
      gridResolution: gridResolution(),
      selection: state.selection,
      pendingEndpoint: state.pendingEndpoint,
      pendingWirePoints: state.pendingWirePoints,
      placement: placementMode(),
    });
  });

  createEffect(() => {
    const request = editorUi.canvasFocusRequest();
    if (!request) return;
    if (request.sheetId !== state.activeSheetId) return;
    if (!scene?.focusTarget(request.target)) return;
    editorUi.consumeCanvasFocusRequest(request.requestId);
  });

  onCleanup(() => {
    setState("canvasCursorPos", null);
    resizeObserver?.disconnect();
    resizeObserver = null;
    scene?.destroy();
    scene = null;
  });

  return (
    <div class="canvas-shell absolute inset-0" role="presentation">
      <div
        class={`canvas-grid ${gridResolution() ? "" : "canvas-grid-hidden"}`}
        style={gridStyle()}
      >
        <div
          ref={(el) => {
            hostEl = el;
          }}
          class={`scene-konva-host ${
            placementMode() ? "cursor-crosshair" : ""
          }`}
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
