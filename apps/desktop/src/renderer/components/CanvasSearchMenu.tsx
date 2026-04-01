import { createMemo, createSignal, For, type JSX, Show } from "solid-js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export interface CanvasSearchMenuItem {
  id: string;
  searchText: string;
  name: JSX.Element;
  meta?: JSX.Element;
  title?: string;
  disabled?: boolean;
  onSelect: () => void;
}

interface CanvasSearchMenuInlineAction {
  label: string;
  onSelect: () => void;
}

interface CanvasSearchMenuProps {
  items: CanvasSearchMenuItem[];
  placeholder: string;
  emptyLabel: string;
  onClose: () => void;
  listClass?: string;
  inlineAction?: CanvasSearchMenuInlineAction;
}

export default function CanvasSearchMenu(props: CanvasSearchMenuProps) {
  const [query, setQuery] = createSignal("");

  const filtered = createMemo(() => {
    const normalizedQuery = query().trim().toLowerCase();
    if (!normalizedQuery) return props.items;
    return props.items.filter((item) =>
      item.searchText.toLowerCase().includes(normalizedQuery),
    );
  });

  return (
    <>
      <div class="flex items-center gap-2">
        <Input
          type="text"
          class="bg-black/10"
          placeholder={props.placeholder}
          value={query()}
          onInput={(evt) => setQuery(evt.currentTarget.value)}
        />
        <Show when={props.inlineAction}>
          {(inlineAction) => (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              class="shrink-0"
              onClick={() => {
                inlineAction().onSelect();
                props.onClose();
              }}
            >
              {inlineAction().label}
            </Button>
          )}
        </Show>
      </div>
      <div class={`canvas-context-list ${props.listClass ?? ""}`}>
        <Show
          when={filtered().length > 0}
          fallback={<div class="canvas-context-empty">{props.emptyLabel}</div>}
        >
          <For each={filtered()}>
            {(item) => (
              <button
                type="button"
                class="canvas-context-item"
                disabled={item.disabled}
                title={item.title}
                onClick={() => {
                  item.onSelect();
                  props.onClose();
                }}
              >
                <span class="canvas-context-item-name">{item.name}</span>
                <Show when={item.meta}>
                  <span class="canvas-context-item-meta">{item.meta}</span>
                </Show>
              </button>
            )}
          </For>
        </Show>
      </div>
    </>
  );
}
