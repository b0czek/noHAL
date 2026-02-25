import { createEffect, createMemo, createSignal } from "solid-js";
import { getSheet } from "../../shared/graph";
import { useEditorStore } from "../state/EditorStoreProvider";

export function useEditorUiState() {
  const { state, actions } = useEditorStore();
  const [componentEditorNodeId, setComponentEditorNodeId] = createSignal<
    string | null
  >(null);
  const [isComponentStoreOpen, setIsComponentStoreOpen] = createSignal(false);
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
    sheetSettingsSheetId,
    labelClick,
    commentClick,
    openComponentEditorForNode,
    openSelectedComponentEditor,
    closeComponentEditor: () => setComponentEditorNodeId(null),
    openComponentStore: () => setIsComponentStoreOpen(true),
    closeComponentStore: () => setIsComponentStoreOpen(false),
    openSheetSettings: (sheetId: string) => setSheetSettingsSheetId(sheetId),
    closeSheetSettings: () => setSheetSettingsSheetId(null),
  };
}
