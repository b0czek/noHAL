import { getSheet } from "@nohal/core/src/graph";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type ParentProps,
  useContext,
} from "solid-js";
import { useEditorStore } from "./EditorStoreProvider";

export type ComponentSearchScope = "sheet" | "project";
export type EditorOverlay =
  | { kind: "component-editor"; nodeId: string }
  | { kind: "component-store" }
  | { kind: "project-settings" }
  | { kind: "sheet-settings"; sheetId: string }
  | { kind: "component-search"; scope: ComponentSearchScope };

type NodeFocusRequest = {
  requestId: number;
  sheetId: string;
  nodeId: string;
};

function createEditorUiState() {
  const { state, actions } = useEditorStore();
  const [overlay, setOverlay] = createSignal<EditorOverlay | null>(null);
  const [nodeFocusRequest, setNodeFocusRequest] =
    createSignal<NodeFocusRequest | null>(null);
  let nextNodeFocusRequestId = 1;

  const currentSheet = createMemo(() =>
    getSheet(state.project, state.activeSheetId),
  );
  const selectedNode = createMemo(() => {
    const selection = state.selection;
    if (!selection || selection.kind !== "node") return undefined;
    return currentSheet().nodes.find((n) => n.id === selection.id);
  });
  const componentEditorNodeId = createMemo(() => {
    const current = overlay();
    return current?.kind === "component-editor" ? current.nodeId : null;
  });
  const isComponentStoreOpen = createMemo(
    () => overlay()?.kind === "component-store",
  );
  const isProjectSettingsOpen = createMemo(
    () => overlay()?.kind === "project-settings",
  );
  const sheetSettingsSheetId = createMemo(() => {
    const current = overlay();
    return current?.kind === "sheet-settings" ? current.sheetId : null;
  });
  const componentSearchScope = createMemo(() => {
    const current = overlay();
    return current?.kind === "component-search" ? current.scope : null;
  });
  const editingComponentNode = createMemo(() => {
    const id = componentEditorNodeId();
    if (!id) return null;
    const node = currentSheet().nodes.find((n) => n.id === id);
    return node && node.kind === "component" ? node : null;
  });

  const labelClick = (labelId: string) => {
    if (state.pendingEndpoint) {
      actions.anchorPendingToLabel(labelId);
      return;
    }
    actions.select({ kind: "label", id: labelId });
  };

  const commentClick = (commentId: string) => {
    actions.select({ kind: "comment", id: commentId });
  };

  const openComponentEditorForNode = (nodeId: string) => {
    const node = currentSheet().nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (node.kind === "sheet") {
      actions.setActiveSheet(node.sheetId);
      return;
    }
    setOverlay({ kind: "component-editor", nodeId: node.id });
  };

  const openSelectedComponentEditor = () => {
    const node = selectedNode();
    if (!node || node.kind !== "component") return;
    setOverlay({ kind: "component-editor", nodeId: node.id });
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

  return {
    activeOverlay: overlay,
    currentSheet,
    selectedNode,
    editingComponentNode,
    componentEditorNodeId,
    isComponentStoreOpen,
    isProjectSettingsOpen,
    sheetSettingsSheetId,
    labelClick,
    commentClick,
    openComponentEditorForNode,
    openSelectedComponentEditor,
    closeActiveOverlay: () => setOverlay(null),
    closeComponentEditor: () =>
      setOverlay((current) =>
        current?.kind === "component-editor" ? null : current,
      ),
    openComponentStore: () => setOverlay({ kind: "component-store" }),
    closeComponentStore: () =>
      setOverlay((current) =>
        current?.kind === "component-store" ? null : current,
      ),
    openProjectSettings: () => setOverlay({ kind: "project-settings" }),
    closeProjectSettings: () =>
      setOverlay((current) =>
        current?.kind === "project-settings" ? null : current,
      ),
    openSheetSettings: (sheetId: string) =>
      setOverlay({ kind: "sheet-settings", sheetId }),
    closeSheetSettings: () =>
      setOverlay((current) =>
        current?.kind === "sheet-settings" ? null : current,
      ),
    componentSearchScope,
    isComponentSearchOpen: () => componentSearchScope() !== null,
    openComponentSearch: (scope: ComponentSearchScope) =>
      setOverlay({ kind: "component-search", scope }),
    closeComponentSearch: () =>
      setOverlay((current) =>
        current?.kind === "component-search" ? null : current,
      ),
    nodeFocusRequest,
    requestNodeFocus: (sheetId: string, nodeId: string) =>
      setNodeFocusRequest({
        requestId: nextNodeFocusRequestId++,
        sheetId,
        nodeId,
      }),
    consumeNodeFocusRequest: (requestId: number) =>
      setNodeFocusRequest((current) =>
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
