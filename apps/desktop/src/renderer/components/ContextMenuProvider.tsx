import {
  type Accessor,
  createContext,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  type ParentProps,
  Show,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";

export interface ContextMenuActionItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  meta?: string;
  closeOnSelect?: boolean;
}

type ContextMenuBase = {
  x: number;
  y: number;
  ariaLabel: string;
  title?: string;
  width?: number;
  maxHeight?: number;
  onClose?: () => void;
};

export type ContextMenuActionsSpec = ContextMenuBase & {
  kind: "actions";
  items: ContextMenuActionItem[];
};

export type ContextMenuCustomSpec = ContextMenuBase & {
  kind: "custom";
  content: (api: { close: () => void }) => JSX.Element;
};

export type ContextMenuSpec = ContextMenuActionsSpec | ContextMenuCustomSpec;

interface ContextMenuContextValue {
  isOpen: Accessor<boolean>;
  open: (spec: ContextMenuSpec) => void;
  openActions: (spec: Omit<ContextMenuActionsSpec, "kind">) => void;
  openCustom: (spec: Omit<ContextMenuCustomSpec, "kind">) => void;
  close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue>();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, Math.max(min, max)));

function clampToViewport(spec: ContextMenuSpec): ContextMenuSpec {
  if (typeof window === "undefined") return spec;
  const margin = 8;
  const estimatedWidth = spec.width ?? 360;
  const estimatedHeight = spec.maxHeight ?? 460;
  return {
    ...spec,
    x: clamp(spec.x, margin, window.innerWidth - estimatedWidth - margin),
    y: clamp(spec.y, margin, window.innerHeight - estimatedHeight - margin),
  };
}

export function ContextMenuProvider(props: ParentProps) {
  const [menu, setMenu] = createSignal<ContextMenuSpec | null>(null);

  const close = () => {
    const current = menu();
    if (!current) return;
    setMenu(null);
    current.onClose?.();
  };

  const open = (spec: ContextMenuSpec) => {
    setMenu(clampToViewport(spec));
  };

  const value: ContextMenuContextValue = {
    isOpen: () => menu() !== null,
    open,
    openActions: (spec) => open({ kind: "actions", ...spec }),
    openCustom: (spec) => open({ kind: "custom", ...spec }),
    close,
  };

  onMount(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
  });

  return (
    <ContextMenuContext.Provider value={value}>
      {props.children}
      <Show when={menu()}>
        {(current) => (
          <Portal>
            <div
              class="app-context-menu-backdrop"
              role="presentation"
              onPointerDown={() => close()}
            >
              <div
                class="canvas-context-menu app-context-menu-surface"
                role="dialog"
                aria-modal="false"
                aria-label={current().ariaLabel}
                style={(() => {
                  const m = current();
                  const style: JSX.CSSProperties = {
                    left: `${m.x}px`,
                    top: `${m.y}px`,
                  };
                  if (m.width != null) style.width = `${m.width}px`;
                  if (m.maxHeight != null)
                    style["max-height"] = `${m.maxHeight}px`;
                  return style;
                })()}
                onPointerDown={(evt) => evt.stopPropagation()}
                onContextMenu={(evt) => evt.preventDefault()}
              >
                {(() => {
                  const m = current();
                  if (m.kind === "actions") {
                    return (
                      <>
                        <Show when={m.title}>
                          {(title) => (
                            <div class="canvas-context-title">{title()}</div>
                          )}
                        </Show>
                        <div class="canvas-context-list canvas-context-list-compact">
                          <For each={m.items}>
                            {(item) => (
                              <button
                                type="button"
                                class="canvas-context-item"
                                disabled={item.disabled}
                                onClick={() => {
                                  item.onSelect();
                                  if (item.closeOnSelect !== false) close();
                                }}
                              >
                                <span class="canvas-context-item-name">
                                  {item.label}
                                </span>
                                <Show when={item.meta}>
                                  {(meta) => (
                                    <span class="canvas-context-item-meta">
                                      {meta()}
                                    </span>
                                  )}
                                </Show>
                              </button>
                            )}
                          </For>
                        </div>
                      </>
                    );
                  }
                  return m.content({ close });
                })()}
              </div>
            </div>
          </Portal>
        )}
      </Show>
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error("ContextMenuProvider is missing");
  return ctx;
}
