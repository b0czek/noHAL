import { onCleanup, onMount } from "solid-js";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
}

function handleEscapeShortcut(
  evt: KeyboardEvent,
  editorUi: ReturnType<typeof useEditorUi>,
  state: ReturnType<typeof useEditorStore>["state"],
  actions: ReturnType<typeof useEditorStore>["actions"],
): boolean {
  if (evt.key !== "Escape") return false;

  if (editorUi.activeOverlay() !== null) {
    evt.preventDefault();
    editorUi.closeActiveOverlay();
    return true;
  }
  if (state.pendingEndpoint !== null) {
    evt.preventDefault();
    actions.clearPendingEndpoint();
    return true;
  }
  if (editorUi.placementMode() !== null) {
    evt.preventDefault();
    editorUi.cancelPlacementMode();
    return true;
  }
  return true;
}

function handleDeleteShortcut(
  evt: KeyboardEvent,
  state: ReturnType<typeof useEditorStore>["state"],
  actions: ReturnType<typeof useEditorStore>["actions"],
): boolean {
  if (evt.key !== "Delete" || isEditableTarget(evt.target)) return false;
  if (state.selection === null) return true;
  evt.preventDefault();
  actions.removeSelection();
  return true;
}

function handlePrimaryModifierShortcut(
  evt: KeyboardEvent,
  editorUi: ReturnType<typeof useEditorUi>,
  actions: ReturnType<typeof useEditorStore>["actions"],
): boolean {
  const key = evt.key.toLowerCase();
  const primaryModifier = evt.ctrlKey || evt.metaKey;
  if (!primaryModifier || evt.altKey) return false;

  if (key === "s" && !evt.shiftKey) {
    evt.preventDefault();
    void actions.saveProject();
    return true;
  }

  if (isEditableTarget(evt.target)) return true;

  if (key === "f") {
    evt.preventDefault();
    editorUi.openComponentSearch(evt.shiftKey ? "project" : "sheet");
    return true;
  }

  return handleEditorActionShortcut(evt, key, actions);
}

function handleEditorActionShortcut(
  evt: KeyboardEvent,
  key: string,
  actions: ReturnType<typeof useEditorStore>["actions"],
): boolean {
  if (key === "z" && !evt.shiftKey) {
    if (!actions.undo()) return true;
    evt.preventDefault();
    return true;
  }

  if (key === "y" || (key === "z" && evt.shiftKey)) {
    if (!actions.redo()) return true;
    evt.preventDefault();
    return true;
  }

  if (key === "c" && !evt.shiftKey) {
    if (!actions.copySelection()) return true;
    evt.preventDefault();
    return true;
  }

  if (key === "v" && !evt.shiftKey) {
    if (!actions.pasteClipboard()) return true;
    evt.preventDefault();
    return true;
  }

  return false;
}

export function handleRotateShortcut(
  evt: KeyboardEvent,
  actions: ReturnType<typeof useEditorStore>["actions"],
): boolean {
  const primaryModifier = evt.ctrlKey || evt.metaKey;
  if (primaryModifier || evt.altKey) return false;
  if (evt.key.toLowerCase() !== "r" || isEditableTarget(evt.target)) {
    return false;
  }
  if (!actions.rotateSelectionClockwise()) return false;
  evt.preventDefault();
  return true;
}

export function useEditorShortcuts(): void {
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();

  onMount(() => {
    const onKeyDown = (evt: KeyboardEvent) => {
      if (handleEscapeShortcut(evt, editorUi, state, actions)) return;
      if (handleDeleteShortcut(evt, state, actions)) return;
      if (handleRotateShortcut(evt, actions)) return;
      handlePrimaryModifierShortcut(evt, editorUi, actions);
    };

    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown);
    });
  });
}
