import { onCleanup, onMount } from "solid-js";

interface EditorShortcutsOptions {
  isComponentDialogOpen: () => boolean;
  closeComponentDialog: () => void;
  hasPendingWire: () => boolean;
  cancelPendingWire: () => void;
  hasSelection: () => boolean;
  deleteSelection: () => void;
  undo: () => boolean;
  redo: () => boolean;
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
  onMount(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        if (options.isComponentDialogOpen()) {
          evt.preventDefault();
          options.closeComponentDialog();
          return;
        }
        if (options.hasPendingWire()) {
          evt.preventDefault();
          options.cancelPendingWire();
          return;
        }
        return;
      }

      if (evt.key === "Delete" && !isEditableTarget(evt.target)) {
        if (!options.hasSelection()) return;
        evt.preventDefault();
        options.deleteSelection();
        return;
      }

      if (isEditableTarget(evt.target)) return;

      const key = evt.key.toLowerCase();
      const primaryModifier = evt.ctrlKey || evt.metaKey;
      if (!primaryModifier || evt.altKey) return;

      const isUndo = key === "z" && !evt.shiftKey;
      const isRedo = key === "y" || (key === "z" && evt.shiftKey);

      if (isUndo) {
        if (!options.undo()) return;
        evt.preventDefault();
        return;
      }

      if (isRedo) {
        if (!options.redo()) return;
        evt.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown);
    });
  });
}
