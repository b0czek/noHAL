import { onCleanup, onMount } from "solid-js";
import { useEditorStore } from "../state/EditorStoreProvider";

interface EditorShortcutsOptions {
  isComponentDialogOpen: () => boolean;
  closeComponentDialog: () => void;
}

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

export function useEditorShortcuts(options: EditorShortcutsOptions): void {
  const { state, actions } = useEditorStore();

  onMount(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        if (options.isComponentDialogOpen()) {
          evt.preventDefault();
          options.closeComponentDialog();
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

      const isUndo = key === "z" && !evt.shiftKey;
      const isRedo = key === "y" || (key === "z" && evt.shiftKey);

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
