import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import type { ComponentDefinition } from "../../shared/types";

interface CanvasComponentMenuProps {
  open: boolean;
  x: number;
  y: number;
  components: ComponentDefinition[];
  onAddComponent: (componentId: string) => void;
  onClose: () => void;
}

export default function CanvasComponentMenu(props: CanvasComponentMenuProps) {
  const [query, setQuery] = createSignal("");

  createEffect(() => {
    if (props.open) setQuery("");
  });

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return props.components;
    return props.components.filter((comp) => {
      const hay = `${comp.halComponentName} ${comp.name} ${comp.source}`.toLowerCase();
      return hay.includes(q);
    });
  });

  return (
    <Show when={props.open}>
      <div
        class="canvas-context-backdrop"
        onPointerDown={() => props.onClose()}
        onContextMenu={(evt) => evt.preventDefault()}
      >
        <div
          class="canvas-context-menu"
          style={{ left: `${props.x}px`, top: `${props.y}px` }}
          onPointerDown={(evt) => evt.stopPropagation()}
          onContextMenu={(evt) => evt.preventDefault()}
        >
          <div class="canvas-context-title">Add Component</div>
          <input
            type="text"
            placeholder="Filter components..."
            value={query()}
            onInput={(evt) => setQuery(evt.currentTarget.value)}
          />
          <div class="canvas-context-list">
            <Show when={filtered().length > 0} fallback={<div class="canvas-context-empty">No matching components</div>}>
              <For each={filtered()}>
                {(comp) => (
                  <button
                    class="canvas-context-item"
                    onClick={() => {
                      props.onAddComponent(comp.id);
                      props.onClose();
                    }}
                    title={`${comp.halComponentName} (${comp.pins.length} pins)`}
                  >
                    <span class="canvas-context-item-name">{comp.halComponentName}</span>
                    <span class="canvas-context-item-meta">{comp.source} • {comp.pins.length} pins</span>
                  </button>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
