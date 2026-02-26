import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  type ParentProps,
  useContext,
} from "solid-js";
import { getSheet } from "../../shared/graph";
import { useEditorStore } from "./EditorStoreProvider";

function createEditorUiState() {
  const { state, actions } = useEditorStore();
  const [componentEditorNodeId, setComponentEditorNodeId] = createSignal<
    string | null
  >(null);
  const [isComponentStoreOpen, setIsComponentStoreOpen] = createSignal(false);
  const [isIniEditorOpen, setIsIniEditorOpen] = createSignal(false);
  const [isThreadsDialogOpen, setIsThreadsDialogOpen] = createSignal(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = createSignal(false);
  const [sheetSettingsSheetId, setSheetSettingsSheetId] = createSignal<
    string | null
  >(null);

  const currentSheet = createMemo(() =>
    getSheet(state.project, state.activeSheetId),
  );
  const selectedNode = createMemo(() => {
    const selection = state.selection;
    if (!selection || selection.kind !== "node") return undefined;
    return currentSheet().nodes.find((n) => n.id === selection.id);
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
    setComponentEditorNodeId(node.id);
  };

  const openSelectedComponentEditor = () => {
    const node = selectedNode();
    if (!node || node.kind !== "component") return;
    setComponentEditorNodeId(node.id);
  };

  createEffect(() => {
    state.activeSheetId;
    state.project;
    if (componentEditorNodeId() && !editingComponentNode()) {
      setComponentEditorNodeId(null);
    }
  });

  return {
    currentSheet,
    selectedNode,
    editingComponentNode,
    componentEditorNodeId,
    isComponentStoreOpen,
    isIniEditorOpen,
    isThreadsDialogOpen,
    isProjectSettingsOpen,
    sheetSettingsSheetId,
    labelClick,
    commentClick,
    openComponentEditorForNode,
    openSelectedComponentEditor,
    closeComponentEditor: () => setComponentEditorNodeId(null),
    openComponentStore: () => setIsComponentStoreOpen(true),
    closeComponentStore: () => setIsComponentStoreOpen(false),
    openIniEditor: () => setIsIniEditorOpen(true),
    closeIniEditor: () => setIsIniEditorOpen(false),
    openThreadsDialog: () => setIsThreadsDialogOpen(true),
    closeThreadsDialog: () => setIsThreadsDialogOpen(false),
    openProjectSettings: () => setIsProjectSettingsOpen(true),
    closeProjectSettings: () => setIsProjectSettingsOpen(false),
    openSheetSettings: (sheetId: string) => setSheetSettingsSheetId(sheetId),
    closeSheetSettings: () => setSheetSettingsSheetId(null),
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
