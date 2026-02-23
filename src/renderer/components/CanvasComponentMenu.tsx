import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import type { ComponentDefinition } from "../../shared/types";
import { useI18n } from "../i18n";

interface CanvasComponentMenuProps {
  open: boolean;
  x: number;
  y: number;
  components: ComponentDefinition[];
  onAddComponent: (componentId: string) => void;
  onClose: () => void;
}

export default function CanvasComponentMenu(props: CanvasComponentMenuProps) {
  const { t } = useI18n();
  const [query, setQuery] = createSignal("");

  createEffect(() => {
    if (props.open) setQuery("");
  });

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    if (!q) return props.components;
    return props.components.filter((comp) => {
      const hay =
        `${comp.halComponentName} ${comp.name} ${comp.source}`.toLowerCase();
      return hay.includes(q);
    });
  });

  return (
    <Show when={props.open}>
      <div
        class="canvas-context-backdrop"
        role="presentation"
        onPointerDown={() => props.onClose()}
      >
        <div
          class="canvas-context-menu"
          role="dialog"
          aria-modal="false"
          aria-label={t("canvasComponentMenu.ariaLabel")}
          style={{ left: `${props.x}px`, top: `${props.y}px` }}
          onPointerDown={(evt) => evt.stopPropagation()}
          onContextMenu={(evt) => evt.preventDefault()}
        >
          <div class="canvas-context-title">
            {t("canvasComponentMenu.title")}
          </div>
          <input
            type="text"
            placeholder={t("canvasComponentMenu.filterPlaceholder")}
            value={query()}
            onInput={(evt) => setQuery(evt.currentTarget.value)}
          />
          <div class="canvas-context-list">
            <Show
              when={filtered().length > 0}
              fallback={
                <div class="canvas-context-empty">
                  {t("canvasComponentMenu.empty")}
                </div>
              }
            >
              <For each={filtered()}>
                {(comp) => (
                  <button
                    type="button"
                    class="canvas-context-item"
                    onClick={() => {
                      props.onAddComponent(comp.id);
                      props.onClose();
                    }}
                    title={t("canvasComponentMenu.itemTitle", {
                      name: comp.halComponentName,
                      pins: comp.pins.length,
                    })}
                  >
                    <span class="canvas-context-item-name">
                      {comp.halComponentName}
                    </span>
                    <span class="canvas-context-item-meta">
                      {t("canvasComponentMenu.itemMeta", {
                        source: comp.source,
                        pins: comp.pins.length,
                      })}
                    </span>
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
