import { getSheet } from "@nohal/core/graph";
import type {
  HalValueType,
  LabelScope,
  PinDirection,
  XY,
} from "@nohal/core/types";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type ParentProps,
  useContext,
} from "solid-js";
import type { GeneralSettingsTab } from "../features/generalSettings/types";
import { useEditorStore } from "./EditorStoreProvider";

export type ComponentSearchScope = "sheet" | "project";
export type CanvasFocusTarget = {
  kind: "node" | "label" | "comment" | "sheet-port";
  id: string;
};
export type CanvasPlacement =
  | { kind: "component"; componentId: string }
  | { kind: "subsheet" }
  | { kind: "comment" }
  | { kind: "label"; scope: LabelScope }
  | {
      kind: "sheet-port";
      direction: PinDirection;
      type: HalValueType;
    };
export type ComponentEditorOverlay = {
  kind: "component-editor";
  nodeId: string;
};
export type GeneralSettingsOverlay = {
  kind: "general-settings";
  initialTab?: GeneralSettingsTab;
};
export type ProjectSettingsOverlay = { kind: "project-settings" };
export type SheetSettingsOverlay = { kind: "sheet-settings"; sheetId: string };
export type ComponentSearchOverlay = {
  kind: "component-search";
  scope: ComponentSearchScope;
};
export type EditorOverlay =
  | ComponentEditorOverlay
  | GeneralSettingsOverlay
  | ProjectSettingsOverlay
  | SheetSettingsOverlay
  | ComponentSearchOverlay;

type CanvasFocusRequest = {
  requestId: number;
  sheetId: string;
  target: CanvasFocusTarget;
};

function createEditorUiState() {
  const { state, actions } = useEditorStore();
  const [overlay, setOverlay] = createSignal<EditorOverlay | null>(null);
  const [placementMode, setPlacementMode] =
    createSignal<CanvasPlacement | null>(null);
  const [canvasFocusRequest, setCanvasFocusRequest] =
    createSignal<CanvasFocusRequest | null>(null);
  let nextCanvasFocusRequestId = 1;

  const currentSheet = createMemo(() =>
    getSheet(state.project, state.activeSheetId),
  );
  const selectedNode = createMemo(() => {
    const selection = state.selection;
    if (!selection || selection.kind !== "node") return undefined;
    return currentSheet().nodes.find((n) => n.id === selection.id);
  });
  const editingComponentNode = createMemo(() => {
    const current = overlay();
    if (current?.kind !== "component-editor") return null;
    const node = currentSheet().nodes.find((n) => n.id === current.nodeId);
    return node && node.kind === "component" ? node : null;
  });
  const openOverlay = (next: EditorOverlay) => setOverlay(next);
  const samePlacementMode = (
    left: CanvasPlacement | null,
    right: CanvasPlacement | null,
  ) => {
    if (!left || !right) return left === right;
    if (left.kind !== right.kind) return false;
    if (left.kind === "component" && right.kind === "component") {
      return left.componentId === right.componentId;
    }
    if (left.kind === "label" && right.kind === "label") {
      return left.scope === right.scope;
    }
    if (left.kind === "sheet-port" && right.kind === "sheet-port") {
      return left.direction === right.direction && left.type === right.type;
    }
    return true;
  };

  const openComponentEditorForNode = (nodeId: string) => {
    const node = currentSheet().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.kind === "sheet") {
      actions.setActiveSheet(node.sheetId);
      return;
    }
    openOverlay({ kind: "component-editor", nodeId: node.id });
  };

  const openSelectedComponentEditor = () => {
    const node = selectedNode();
    if (!node || node.kind !== "component") return;
    openOverlay({ kind: "component-editor", nodeId: node.id });
  };

  createEffect(() => {
    state.activeSheetId;
    state.project;
    const current = overlay();
    if (current?.kind === "component-editor" && !editingComponentNode()) {
      setOverlay(null);
      return;
    }
    if (
      current?.kind === "sheet-settings" &&
      !state.project.sheets[current.sheetId]
    ) {
      setOverlay(null);
    }
  });

  createEffect(() => {
    if (state.pendingEndpoint !== null && placementMode() !== null) {
      setPlacementMode(null);
    }
  });

  const beginPlacementMode = (next: CanvasPlacement) => {
    actions.clearPendingEndpoint();
    setPlacementMode(next);
  };

  const togglePlacementMode = (next: CanvasPlacement) => {
    if (samePlacementMode(placementMode(), next)) {
      setPlacementMode(null);
      return;
    }
    beginPlacementMode(next);
  };

  const placeAt = (point: XY) => {
    const current = placementMode();
    if (!current) return false;
    switch (current.kind) {
      case "component":
        actions.addComponentNode(current.componentId, point);
        return true;
      case "subsheet":
        actions.addSheetDefinition(point);
        return true;
      case "comment":
        actions.addComment(point);
        return true;
      case "label":
        actions.addLabel(current.scope, point);
        return true;
      case "sheet-port":
        actions.addSheetPort(current.direction, current.type, point);
        return true;
    }
  };

  return {
    activeOverlay: overlay,
    placementMode,
    openOverlay,
    openComponentEditorForNode,
    openSelectedComponentEditor,
    closeActiveOverlay: () => setOverlay(null),
    openGeneralSettings: (initialTab?: GeneralSettingsTab) =>
      openOverlay({ kind: "general-settings", initialTab }),
    openProjectSettings: () => openOverlay({ kind: "project-settings" }),
    openSheetSettings: (sheetId: string) =>
      openOverlay({ kind: "sheet-settings", sheetId }),
    openComponentSearch: (scope: ComponentSearchScope) =>
      openOverlay({ kind: "component-search", scope }),
    beginPlacementMode,
    togglePlacementMode,
    cancelPlacementMode: () => setPlacementMode(null),
    placeAt,
    canvasFocusRequest,
    requestCanvasFocus: (sheetId: string, target: CanvasFocusTarget) =>
      setCanvasFocusRequest({
        requestId: nextCanvasFocusRequestId++,
        sheetId,
        target,
      }),
    consumeCanvasFocusRequest: (requestId: number) =>
      setCanvasFocusRequest((current) =>
        current?.requestId === requestId ? null : current,
      ),
  };
}

type EditorUiContextValue = ReturnType<typeof createEditorUiState>;

const EditorUiContext = createContext<EditorUiContextValue>();

export function EditorUiProvider(props: ParentProps) {
  const ui = createEditorUiState();
  return (
    <EditorUiContext.Provider value={ui}>
      {props.children}
    </EditorUiContext.Provider>
  );
}

export function useEditorUi() {
  const ctx = useContext(EditorUiContext);
  if (!ctx) throw new Error("EditorUiProvider is missing");
  return ctx;
}
