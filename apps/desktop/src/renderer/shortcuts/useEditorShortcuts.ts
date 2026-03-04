import { onCleanup, onMount } from "solid-js";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

export function useEditorShortcuts(): void {
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();

  onMount(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        if (editorUi.isComponentSearchOpen()) {
          evt.preventDefault();
          editorUi.closeComponentSearch();
          return;
        }
        if (editorUi.componentEditorNodeId() !== null) {
          evt.preventDefault();
          editorUi.closeComponentEditor();
          return;
        }
        if (state.pendingEndpoint !== null) {
          evt.preventDefault();
          actions.clearPendingEndpoint();
          return;
        }
        return;
      }

      if (evt.key === "Delete" && !isEditableTarget(evt.target)) {
        if (state.selection === null) return;
        evt.preventDefault();
        actions.removeSelection();
        return;
      }

      if (isEditableTarget(evt.target)) return;

      const key = evt.key.toLowerCase();
      const primaryModifier = evt.ctrlKey || evt.metaKey;
      if (!primaryModifier || evt.altKey) return;

      const isFindInSheet = key === "f" && !evt.shiftKey;
      const isFindInProject = key === "f" && evt.shiftKey;
      const isUndo = key === "z" && !evt.shiftKey;
      const isRedo = key === "y" || (key === "z" && evt.shiftKey);

      if (isFindInSheet) {
        evt.preventDefault();
        editorUi.openComponentSearch("sheet");
        return;
      }

      if (isFindInProject) {
        evt.preventDefault();
        editorUi.openComponentSearch("project");
        return;
      }

      if (isUndo) {
        if (!actions.undo()) return;
        evt.preventDefault();
        return;
      }

      if (isRedo) {
        if (!actions.redo()) return;
        evt.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown);
    });
  });
}
