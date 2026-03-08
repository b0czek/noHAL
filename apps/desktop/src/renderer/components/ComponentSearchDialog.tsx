import { getNodeTitle } from "@nohal/core/src/graph";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type { OverlayDialogProps } from "../app/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import {
  type ComponentSearchScope,
  useEditorUi,
} from "../state/EditorUiProvider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

type ComponentSearchResult = {
  nodeId: string;
  sheetId: string;
  sheetName: string;
  title: string;
  searchText: string;
};

interface ComponentSearchDialogProps extends OverlayDialogProps {
  scope: ComponentSearchScope;
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

export default function ComponentSearchDialog(
  props: ComponentSearchDialogProps,
) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const resultRowElements = new Map<string, HTMLButtonElement>();
  let queryInputEl: HTMLInputElement | undefined;

  const results = createMemo<ComponentSearchResult[]>(() => {
    const allSheets = Object.values(state.project.sheets);
    const sourceSheets =
      props.scope === "sheet"
        ? allSheets.filter((sheet) => sheet.id === state.activeSheetId)
        : allSheets;

    const collected: ComponentSearchResult[] = [];
    for (const sheet of sourceSheets) {
      for (const node of sheet.nodes) {
        if (node.kind !== "component") continue;
        const component = state.project.library.components[node.componentId];
        const componentName = component?.name ?? "";
        const halComponentName = component?.halComponentName ?? "";
        const title = getNodeTitle(state.project, node);
        const searchText = normalizeSearchText(
          `${node.instanceName} ${title} ${componentName} ${halComponentName} ${sheet.name}`,
        );

        collected.push({
          nodeId: node.id,
          sheetId: sheet.id,
          sheetName: sheet.name,
          title,
          searchText,
        });
      }
    }

    if (props.scope === "project") {
      collected.sort(
        (a, b) =>
          a.sheetName.localeCompare(b.sheetName) ||
          a.title.localeCompare(b.title),
      );
    } else {
      collected.sort((a, b) => a.title.localeCompare(b.title));
    }

    return collected;
  });

  const filteredResults = createMemo(() => {
    const q = normalizeSearchText(query());
    if (!q) return results();
    return results().filter((result) => result.searchText.includes(q));
  });

  const activeResultSummary = createMemo(() => {
    const count = filteredResults().length;
    if (count === 0) return "0/0";
    const current = activeIndex();
    if (current < 0) return `0/${count}`;
    return `${current + 1}/${count}`;
  });

  createEffect(() => {
    props.scope;
    setQuery("");
    setActiveIndex(props.scope === "sheet" ? -1 : 0);
    queueMicrotask(() => {
      queryInputEl?.focus();
      queryInputEl?.select();
    });
  });

  createEffect(() => {
    const count = filteredResults().length;
    const current = activeIndex();
    if (count === 0 && current !== -1) {
      setActiveIndex(-1);
      return;
    }
    if (count > 0 && current >= count) {
      setActiveIndex(count - 1);
      return;
    }
    if (count > 0 && current < -1) setActiveIndex(-1);
  });

  createEffect(() => {
    if (props.scope !== "project") return;
    const list = filteredResults();
    const count = list.length;
    if (count === 0) return;
    const current = activeIndex();
    if (current < 0) return;
    const target = ((current % count) + count) % count;
    const result = list[target];
    if (!result) return;
    queueMicrotask(() => {
      resultRowElements.get(result.nodeId)?.scrollIntoView({
        block: "nearest",
      });
    });
  });

  const selectResult = (
    result: ComponentSearchResult | undefined,
    options?: { close?: boolean },
  ) => {
    if (!result) return;
    if (state.activeSheetId !== result.sheetId) {
      actions.setActiveSheet(result.sheetId);
    }
    actions.select({ kind: "node", id: result.nodeId });
    editorUi.requestNodeFocus(result.sheetId, result.nodeId);
    if (options?.close) props.onClose();
  };

  const jumpToResult = (step: number) => {
    const list = filteredResults();
    const count = list.length;
    if (count === 0) return;
    const current = activeIndex();
    const target =
      current < 0
        ? step > 0
          ? 0
          : count - 1
        : (current + step + count) % count;
    setActiveIndex(target);
    selectResult(list[target]);
  };

  const moveProjectActive = (step: number) => {
    const list = filteredResults();
    const count = list.length;
    if (count === 0) return;
    const current = activeIndex();
    if (current < 0) {
      setActiveIndex(step > 0 ? 0 : count - 1);
      return;
    }
    setActiveIndex((current + step + count) % count);
  };

  const scopeLabel =
    props.scope === "project"
      ? t("componentSearch.scope.project")
      : t("componentSearch.scope.sheet");

  const content = (
    <>
      <Input
        ref={(el) => {
          queryInputEl = el;
        }}
        type="text"
        value={query()}
        placeholder={t("componentSearch.placeholder", {
          scope: scopeLabel,
        })}
        onInput={(evt) => {
          setQuery(evt.currentTarget.value);
          setActiveIndex(props.scope === "project" ? 0 : -1);
        }}
        onKeyDown={(evt) => {
          if (props.scope === "sheet" && evt.key === "Enter") {
            evt.preventDefault();
            jumpToResult(evt.shiftKey ? -1 : 1);
            return;
          }
          if (evt.key === "ArrowDown") {
            evt.preventDefault();
            props.scope === "project" ? moveProjectActive(1) : jumpToResult(1);
            return;
          }
          if (evt.key === "ArrowUp") {
            evt.preventDefault();
            props.scope === "project"
              ? moveProjectActive(-1)
              : jumpToResult(-1);
            return;
          }
          if (props.scope === "project" && evt.key === "Enter") {
            evt.preventDefault();
            const list = filteredResults();
            if (list.length === 0) return;
            const index = activeIndex() < 0 ? 0 : activeIndex();
            selectResult(list[index], { close: true });
            return;
          }
          if (evt.key === "Escape") {
            evt.preventDefault();
            props.onClose();
          }
        }}
      />
      <Show
        when={props.scope === "sheet"}
        fallback={
          <div class="text-xs text-muted-foreground">
            {t("componentSearch.resultsCount", {
              count: filteredResults().length,
            })}
          </div>
        }
      >
        <div class="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={t("common.up")}
            onClick={() => jumpToResult(-1)}
          >
            ↑
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={t("common.down")}
            onClick={() => jumpToResult(1)}
          >
            ↓
          </Button>
          <span class="mono text-xs text-muted-foreground">
            {activeResultSummary()}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={t("common.close")}
            onClick={props.onClose}
          >
            ×
          </Button>
        </div>
      </Show>
      <div class="grid max-h-[min(60vh,28rem)] gap-2 overflow-auto pr-1">
        <For each={filteredResults()}>
          {(result, index) => (
            <button
              ref={(el) => {
                resultRowElements.set(result.nodeId, el);
              }}
              type="button"
              class={`focus-ring w-full rounded-xl px-3 py-2 text-left transition ${
                index() === activeIndex()
                  ? "bg-accent/10 ring-1 ring-inset ring-accent/30"
                  : "bg-black/20 hover:bg-white/[0.08]"
              }`}
              onMouseEnter={() => setActiveIndex(index())}
              onClick={() => selectResult(result, { close: true })}
            >
              <div class="mono truncate">{result.title}</div>
              <div class="mt-0.5 text-xs text-muted-foreground">
                {t("componentSearch.sheetMeta", {
                  sheet: result.sheetName,
                })}
              </div>
            </button>
          )}
        </For>
        <Show when={filteredResults().length === 0}>
          <div class="px-1 py-2 text-xs text-muted-foreground">
            {t("componentSearch.noResults")}
          </div>
        </Show>
      </div>
    </>
  );

  return (
    <Portal>
      <Show
        when={props.scope === "project"}
        fallback={
          <div class="pointer-events-none fixed inset-0 z-[2147483000] flex items-start justify-end p-4">
            <div
              class="pointer-events-auto grid w-[min(35rem,calc(100vw-1.75rem))] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl bg-card/90 p-3 shadow-2xl shadow-black/30 backdrop-blur"
              role="dialog"
              aria-modal="true"
              aria-label={t("componentSearch.ariaLabel")}
              onPointerDown={(evt) => evt.stopPropagation()}
              onContextMenu={(evt) => evt.preventDefault()}
            >
              {content}
            </div>
          </div>
        }
      >
        <Dialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) props.onClose();
          }}
        >
          <DialogContent
            class="w-[min(760px,calc(100vw-36px))] max-w-none rounded-[1.5rem] border-white/10 bg-[linear-gradient(180deg,rgba(8,18,22,0.98),rgba(5,11,14,0.97))] p-0"
            onContextMenu={(evt: MouseEvent) => evt.preventDefault()}
          >
            <DialogHeader class="bg-white/[0.04] px-4 py-3 text-left">
              <DialogTitle>{t("componentSearch.title")}</DialogTitle>
              <DialogDescription>
                {t("componentSearch.subtitle", { scope: scopeLabel })}
              </DialogDescription>
            </DialogHeader>
            <div class="grid gap-3 p-4">{content}</div>
          </DialogContent>
        </Dialog>
      </Show>
    </Portal>
  );
}
