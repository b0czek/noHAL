import {
  HiOutlineArrowsRightLeft,
  HiOutlineCube,
  HiOutlineDocumentDuplicate,
  HiOutlineDocumentText,
  HiOutlineTag,
} from "solid-icons/hi";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type { OverlayDialogProps } from "../app/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import {
  type ComponentSearchScope,
  useEditorUi,
} from "../state/EditorUiProvider";
import {
  buildCanvasSearchResults,
  type CanvasSearchResult,
  normalizeSearchText,
} from "./componentSearch";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface ComponentSearchDialogProps extends OverlayDialogProps {
  scope: ComponentSearchScope;
}

function resultChromeForKind(
  kind: CanvasSearchResult["kind"],
  isActive: boolean,
): string {
  if (kind === "component") {
    return isActive
      ? "border-sky-400/50 bg-sky-500/10 ring-1 ring-inset ring-sky-300/30"
      : "border-sky-500/20 bg-sky-500/[0.06] hover:bg-sky-500/[0.1]";
  }
  if (kind === "subsheet") {
    return isActive
      ? "border-cyan-400/50 bg-cyan-500/10 ring-1 ring-inset ring-cyan-300/30"
      : "border-cyan-500/20 bg-cyan-500/[0.06] hover:bg-cyan-500/[0.1]";
  }
  if (kind === "label") {
    return isActive
      ? "border-amber-400/50 bg-amber-500/10 ring-1 ring-inset ring-amber-300/30"
      : "border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]";
  }
  if (kind === "port") {
    return isActive
      ? "border-violet-400/50 bg-violet-500/10 ring-1 ring-inset ring-violet-300/30"
      : "border-violet-500/20 bg-violet-500/[0.06] hover:bg-violet-500/[0.1]";
  }
  return isActive
    ? "border-emerald-400/50 bg-emerald-500/10 ring-1 ring-inset ring-emerald-300/30"
    : "border-emerald-500/20 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1]";
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

  const results = createMemo<CanvasSearchResult[]>(() =>
    buildCanvasSearchResults(state.project, props.scope, state.activeSheetId),
  );

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
    const list = filteredResults();
    const count = list.length;
    if (count === 0) return;
    const current = activeIndex();
    if (current < 0) return;
    const target = ((current % count) + count) % count;
    const result = list[target];
    if (!result) return;
    queueMicrotask(() => {
      resultRowElements.get(result.key)?.scrollIntoView({
        block: "nearest",
      });
    });
  });

  const selectResult = (
    result: CanvasSearchResult | undefined,
    options?: { close?: boolean },
  ) => {
    if (!result) return;
    if (state.activeSheetId !== result.sheetId) {
      actions.setActiveSheet(result.sheetId);
    }
    actions.select(result.target);
    editorUi.requestCanvasFocus(result.sheetId, result.target);
    if (options?.close) props.onClose();
  };

  const jumpToResult = (step: number) => {
    const list = filteredResults();
    const count = list.length;
    if (count === 0) return;
    const current = activeIndex();
    let target = 0;
    if (current < 0) {
      target = step > 0 ? 0 : count - 1;
    } else {
      target = (current + step + count) % count;
    }
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
  const titleLabel =
    props.scope === "project"
      ? t("componentSearch.title.project")
      : t("componentSearch.title.sheet");
  const kindLabel = (result: CanvasSearchResult) => {
    switch (result.kind) {
      case "component":
        return t("componentSearch.kind.component");
      case "subsheet":
        return t("componentSearch.kind.subsheet");
      case "label":
        return t("componentSearch.kind.label");
      case "port":
        return t("componentSearch.kind.port");
      default:
        return t("componentSearch.kind.comment");
    }
  };
  const resultIcon = (result: CanvasSearchResult) => {
    switch (result.kind) {
      case "component":
        return <HiOutlineCube size={18} aria-hidden="true" />;
      case "subsheet":
        return <HiOutlineDocumentDuplicate size={18} aria-hidden="true" />;
      case "label":
        return <HiOutlineTag size={18} aria-hidden="true" />;
      case "port":
        return <HiOutlineArrowsRightLeft size={18} aria-hidden="true" />;
      default:
        return <HiOutlineDocumentText size={18} aria-hidden="true" />;
    }
  };
  const resultChrome = (result: CanvasSearchResult, isActive: boolean) =>
    resultChromeForKind(result.kind, isActive);
  const resultBadgeClass = (result: CanvasSearchResult) => {
    switch (result.kind) {
      case "component":
        return "border-sky-300/25 bg-sky-400/10 text-sky-100";
      case "subsheet":
        return "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
      case "label":
        return "border-amber-300/25 bg-amber-400/10 text-amber-100";
      case "port":
        return "border-violet-300/25 bg-violet-400/10 text-violet-100";
      default:
        return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
    }
  };
  const resultTitleClass = (result: CanvasSearchResult) => {
    switch (result.kind) {
      case "label":
        return "font-medium tracking-[0.08em] text-amber-50";
      case "port":
        return "mono text-violet-50";
      case "subsheet":
        return "mono text-cyan-50";
      case "comment":
        return "";
      default:
        return "mono";
    }
  };
  const handleQueryKeyDown = (evt: KeyboardEvent) => {
    if (evt.key === "Escape") {
      evt.preventDefault();
      props.onClose();
      return;
    }

    if (evt.key === "ArrowDown") {
      evt.preventDefault();
      props.scope === "project" ? moveProjectActive(1) : jumpToResult(1);
      return;
    }

    if (evt.key === "ArrowUp") {
      evt.preventDefault();
      props.scope === "project" ? moveProjectActive(-1) : jumpToResult(-1);
      return;
    }

    if (evt.key !== "Enter") return;

    evt.preventDefault();
    if (props.scope === "sheet") {
      jumpToResult(evt.shiftKey ? -1 : 1);
      return;
    }

    const list = filteredResults();
    if (list.length === 0) return;
    const index = activeIndex() < 0 ? 0 : activeIndex();
    selectResult(list[index], { close: true });
  };

  const content = (
    <>
      <Input
        ref={(el) => {
          queryInputEl = el;
        }}
        type="text"
        class={props.scope === "sheet" ? "col-span-2" : undefined}
        value={query()}
        placeholder={t("componentSearch.placeholder", {
          scope: scopeLabel,
        })}
        onInput={(evt) => {
          setQuery(evt.currentTarget.value);
          setActiveIndex(props.scope === "project" ? 0 : -1);
        }}
        onKeyDown={handleQueryKeyDown}
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
      <div
        class={
          props.scope === "sheet"
            ? "col-span-2 grid max-h-[min(60vh,28rem)] gap-2 overflow-auto pr-1"
            : "grid max-h-[min(60vh,28rem)] gap-2 overflow-auto pr-1"
        }
      >
        <For each={filteredResults()}>
          {(result, index) => (
            <button
              ref={(el) => {
                resultRowElements.set(result.key, el);
              }}
              type="button"
              class={`focus-ring w-full rounded-xl border px-3 py-2 text-left transition ${resultChrome(
                result,
                index() === activeIndex(),
              )}`}
              onMouseEnter={() => setActiveIndex(index())}
              onClick={() => selectResult(result, { close: true })}
            >
              <div class="flex items-center gap-3">
                <div
                  class={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${resultBadgeClass(
                    result,
                  )}`}
                >
                  {resultIcon(result)}
                </div>
                <div class="min-w-0 flex-1">
                  <div class={`truncate ${resultTitleClass(result)}`}>
                    {result.title}
                  </div>
                  <div class="mt-0.5 text-xs text-muted-foreground">
                    {t("componentSearch.resultMeta", {
                      kind: kindLabel(result),
                      sheet: result.sheetName,
                    })}
                  </div>
                </div>
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
              aria-label={titleLabel}
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
              <DialogTitle>{titleLabel}</DialogTitle>
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
