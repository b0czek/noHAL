import type { Accessor } from "solid-js";
import { createEffect, createSignal, onCleanup } from "solid-js";

export interface DragReorderController {
  draggingItemId: Accessor<string | null>;
  dropTargetId: Accessor<string | null>;
  startDrag: (itemId: string, initialDropTargetId?: string) => void;
  finishDrag: () => void;
  setDropTargetId: (dropTargetId: string | null) => void;
  isDragging: (itemId: string) => boolean;
  isDropTarget: (dropTargetId: string) => boolean;
}

export function createDragReorderController(): DragReorderController {
  const [draggingItemId, setDraggingItemId] = createSignal<string | null>(null);
  const [dropTargetId, setDropTargetId] = createSignal<string | null>(null);

  const finishDrag = () => {
    setDraggingItemId(null);
    setDropTargetId(null);
  };

  createEffect(() => {
    if (!draggingItemId()) return;
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    onCleanup(() => {
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    });
  });

  return {
    draggingItemId,
    dropTargetId,
    startDrag(itemId, initialDropTargetId) {
      setDraggingItemId(itemId);
      setDropTargetId(initialDropTargetId ?? null);
    },
    finishDrag,
    setDropTargetId,
    isDragging(itemId) {
      return draggingItemId() === itemId;
    },
    isDropTarget(targetId) {
      return dropTargetId() === targetId;
    },
  };
}

interface DragReorderHandleProps {
  controller: DragReorderController;
  itemId: string;
  label: string;
  dropTargetId?: string;
}

export function DragReorderHandle(props: DragReorderHandleProps) {
  return (
    <button
      type="button"
      class={`grid h-10 w-10 place-items-center rounded-lg transition ${
        props.controller.isDragging(props.itemId)
          ? "bg-accent/10"
          : "hover:bg-accent/5"
      }`}
      title={props.label}
      aria-label={props.label}
      onPointerDown={(evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        props.controller.startDrag(
          props.itemId,
          props.dropTargetId ?? props.itemId,
        );
      }}
    >
      <span class="grid grid-cols-2 gap-1" aria-hidden="true">
        <span class="h-1 w-1 rounded-full bg-foreground/70" />
        <span class="h-1 w-1 rounded-full bg-foreground/70" />
        <span class="h-1 w-1 rounded-full bg-foreground/70" />
        <span class="h-1 w-1 rounded-full bg-foreground/70" />
      </span>
    </button>
  );
}
