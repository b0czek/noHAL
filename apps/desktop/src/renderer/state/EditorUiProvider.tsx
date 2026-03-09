import { getSheet } from "@nohal/core/src/graph";
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
export type EditorOverlay =
  | { kind: "component-editor"; nodeId: string }
  | { kind: "general-settings"; initialTab?: GeneralSettingsTab }
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
  const editingComponentNode = createMemo(() => {
    const current = overlay();
    if (current?.kind !== "component-editor") return null;
    const node = currentSheet().nodes.find((n) => n.id === current.nodeId);
    return node && node.kind === "component" ? node : null;
  });
  const openOverlay = (next: EditorOverlay) => setOverlay(next);

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

  return {
    activeOverlay: overlay,
    labelClick,
    commentClick,
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
