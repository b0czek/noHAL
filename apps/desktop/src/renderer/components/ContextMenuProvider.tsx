import type { XY } from "@nohal/core/types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";

export interface ContextMenuActionItem {
  label: string;
  onSelect: () => void;
  icon?: JSX.Element;
  disabled?: boolean;
  meta?: string;
  closeOnSelect?: boolean;
  children?: ContextMenuActionItem[];
  childrenClass?: string;
  renderChildren?: (api: { close: () => void }) => JSX.Element;
}

interface ContextMenuBase extends XY {
  ariaLabel: string;
  title?: string;
  width?: number;
  maxHeight?: number;
  onClose?: () => void;
}

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
const VIEWPORT_MENU_MARGIN = 8;
const DEFAULT_ACTIONS_MENU_WIDTH = 280;
const DEFAULT_VIEWPORT_ESTIMATED_MENU_WIDTH = 360;
const DEFAULT_VIEWPORT_ESTIMATED_MENU_HEIGHT = 460;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, Math.max(min, max)));

function ContextMenuActionNode(props: {
  item: ContextMenuActionItem;
  close: () => void;
}) {
  if (
    (props.item.children?.length ?? 0) > 0 ||
    props.item.renderChildren !== undefined
  ) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          class="canvas-context-item canvas-context-item-with-icon"
          disabled={props.item.disabled}
        >
          <Show when={props.item.icon}>
            {(icon) => (
              <span class="canvas-context-item-icon" aria-hidden="true">
                {icon()}
              </span>
            )}
          </Show>
          <span class="canvas-context-item-name">{props.item.label}</span>
          <Show when={props.item.meta}>
            {(meta) => <span class="canvas-context-item-meta">{meta()}</span>}
          </Show>
          <span class="canvas-context-item-caret" aria-hidden="true">
            {">"}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent
            class={`canvas-context-submenu-surface ${
              props.item.childrenClass ?? ""
            }`}
          >
            <Show
              when={props.item.renderChildren}
              fallback={
                <div class="canvas-context-list canvas-context-list-compact">
                  <For each={props.item.children}>
                    {(child) => (
                      <ContextMenuActionNode item={child} close={props.close} />
                    )}
                  </For>
                </div>
              }
            >
              {(renderChildren) => renderChildren()({ close: props.close })}
            </Show>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenuItem
      class="canvas-context-item canvas-context-item-with-icon"
      disabled={props.item.disabled}
      closeOnSelect={props.item.closeOnSelect}
      onSelect={() => props.item.onSelect()}
    >
      <Show when={props.item.icon}>
        {(icon) => (
          <span class="canvas-context-item-icon" aria-hidden="true">
            {icon()}
          </span>
        )}
      </Show>
      <span class="canvas-context-item-name">{props.item.label}</span>
      <Show when={props.item.meta}>
        {(meta) => <span class="canvas-context-item-meta">{meta()}</span>}
      </Show>
    </DropdownMenuItem>
  );
}

function clampToViewport(spec: ContextMenuSpec): ContextMenuSpec {
  if (typeof window === "undefined") return spec;
  const estimatedWidth = spec.width ?? DEFAULT_VIEWPORT_ESTIMATED_MENU_WIDTH;
  const estimatedHeight =
    spec.maxHeight ?? DEFAULT_VIEWPORT_ESTIMATED_MENU_HEIGHT;
  return {
    ...spec,
    x: clamp(
      spec.x,
      VIEWPORT_MENU_MARGIN,
      window.innerWidth - estimatedWidth - VIEWPORT_MENU_MARGIN,
    ),
    y: clamp(
      spec.y,
      VIEWPORT_MENU_MARGIN,
      window.innerHeight - estimatedHeight - VIEWPORT_MENU_MARGIN,
    ),
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
      {menu()?.kind === "actions"
        ? (() => {
            const current = () => menu() as ContextMenuActionsSpec;
            return (
              <DropdownMenu
                open
                modal={false}
                placement="right-start"
                gutter={0}
                shift={0}
                getAnchorRect={() => ({
                  x: current().x,
                  y: current().y,
                  width: 0,
                  height: 0,
                })}
                onOpenChange={(isOpen: boolean) => {
                  if (!isOpen) close();
                }}
              >
                <DropdownMenuContent
                  class="canvas-context-actions-menu"
                  aria-label={current().ariaLabel}
                  style={{
                    width: `${current().width ?? DEFAULT_ACTIONS_MENU_WIDTH}px`,
                    "max-height":
                      current().maxHeight != null
                        ? `${current().maxHeight}px`
                        : undefined,
                  }}
                >
                  <Show when={current().title}>
                    {(title) => (
                      <div class="canvas-context-title">{title()}</div>
                    )}
                  </Show>
                  <div class="canvas-context-list canvas-context-list-compact">
                    <For each={current().items}>
                      {(item) => (
                        <ContextMenuActionNode item={item} close={close} />
                      )}
                    </For>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()
        : null}
      {menu()?.kind === "custom"
        ? (() => {
            const current = () => menu() as ContextMenuCustomSpec;
            return (
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
                    {current().content({ close })}
                  </div>
                </div>
              </Portal>
            );
          })()
        : null}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error("ContextMenuProvider is missing");
  return ctx;
}
