import type { ComponentDefinition } from "@nohal/core/types";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useI18n } from "../i18n";
import { Input } from "./ui/input";

interface CanvasComponentMenuProps {
  components: ComponentDefinition[];
  onAddComponent: (componentId: string) => void;
  onClose: () => void;
  listClass?: string;
}

export default function CanvasComponentMenu(props: CanvasComponentMenuProps) {
  const { t } = useI18n();
  const [query, setQuery] = createSignal("");

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
    <>
      <Input
        type="text"
        class="bg-black/10"
        placeholder={t("canvasComponentMenu.filterPlaceholder")}
        value={query()}
        onInput={(evt) => setQuery(evt.currentTarget.value)}
      />
      <div class={`canvas-context-list ${props.listClass ?? ""}`}>
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
    </>
  );
}
