import { getNodeTitle } from "@nohal/core/src/graph";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

type ComponentSearchResult = {
  nodeId: string;
  sheetId: string;
  sheetName: string;
  title: string;
  searchText: string;
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

export default function ComponentSearchDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const resultRowElements = new Map<string, HTMLButtonElement>();
  let queryInputEl: HTMLInputElement | undefined;

  const results = createMemo<ComponentSearchResult[]>(() => {
    const scope = editorUi.componentSearchScope();
    if (!scope) return [];

    const allSheets = Object.values(state.project.sheets);
    const sourceSheets =
      scope === "sheet"
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

    if (scope === "project") {
      collected.sort(
        (a, b) =>
          a.sheetName.localeCompare(b.sheetName) || a.title.localeCompare(b.title),
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
    const scope = editorUi.componentSearchScope();
    if (!scope) return;
    setQuery("");
    setActiveIndex(scope === "sheet" ? -1 : 0);
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
    if (count > 0 && current < -1) {
      setActiveIndex(-1);
    }
  });
  createEffect(() => {
    const scope = editorUi.componentSearchScope();
    if (scope !== "project") return;
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
    if (options?.close) {
      editorUi.closeComponentSearch();
    }
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

  return (
    <Show when={editorUi.componentSearchScope()} keyed>
      {(scope) => {
        const scopeLabel =
          scope === "project"
            ? t("componentSearch.scope.project")
            : t("componentSearch.scope.sheet");

        return (
          <Portal>
            <div
              class={scope === "project" ? "modal-backdrop" : "component-search-sheet-overlay"}
              role="presentation"
              onPointerDown={scope === "project" ? editorUi.closeComponentSearch : undefined}
            >
              <Show
                when={scope === "project"}
                fallback={
                  <div
                    class="component-search-sheet-find"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("componentSearch.ariaLabel")}
                    onPointerDown={(evt) => evt.stopPropagation()}
                    onContextMenu={(evt) => evt.preventDefault()}
                  >
                    <input
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
                        setActiveIndex(-1);
                      }}
                      onKeyDown={(evt) => {
                        if (evt.key === "Enter") {
                          evt.preventDefault();
                          jumpToResult(evt.shiftKey ? -1 : 1);
                          return;
                        }
                        if (evt.key === "ArrowDown") {
                          evt.preventDefault();
                          jumpToResult(1);
                          return;
                        }
                        if (evt.key === "ArrowUp") {
                          evt.preventDefault();
                          jumpToResult(-1);
                          return;
                        }
                        if (evt.key === "Escape") {
                          evt.preventDefault();
                          editorUi.closeComponentSearch();
                        }
                      }}
                    />
                    <button
                      type="button"
                      class="mini icon-btn"
                      title={t("common.up")}
                      onClick={() => jumpToResult(-1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class="mini icon-btn"
                      title={t("common.down")}
                      onClick={() => jumpToResult(1)}
                    >
                      ↓
                    </button>
                    <span class="component-search-sheet-count mono">
                      {activeResultSummary()}
                    </span>
                    <button
                      type="button"
                      class="mini icon-btn"
                      title={t("common.close")}
                      onClick={editorUi.closeComponentSearch}
                    >
                      ×
                    </button>
                  </div>
                }
              >
                <div
                  class="modal component-search-dialog"
                  role="dialog"
                  aria-modal="true"
                  aria-label={t("componentSearch.ariaLabel")}
                  onPointerDown={(evt) => evt.stopPropagation()}
                  onContextMenu={(evt) => evt.preventDefault()}
                >
                  <div class="modal-header">
                    <div>
                      <div class="modal-title">{t("componentSearch.title")}</div>
                      <div class="modal-sub">
                        {t("componentSearch.subtitle", { scope: scopeLabel })}
                      </div>
                    </div>
                    <button
                      type="button"
                      class="btn subtle"
                      onClick={editorUi.closeComponentSearch}
                    >
                      {t("common.close")}
                    </button>
                  </div>
                  <div class="modal-body component-search-body">
                    <input
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
                        setActiveIndex(0);
                      }}
                      onKeyDown={(evt) => {
                        if (evt.key === "ArrowDown") {
                          evt.preventDefault();
                          moveProjectActive(1);
                          return;
                        }
                        if (evt.key === "ArrowUp") {
                          evt.preventDefault();
                          moveProjectActive(-1);
                          return;
                        }
                        if (evt.key === "Enter") {
                          evt.preventDefault();
                          const list = filteredResults();
                          if (list.length === 0) return;
                          const index = activeIndex() < 0 ? 0 : activeIndex();
                          selectResult(list[index], { close: true });
                          return;
                        }
                        if (evt.key === "Escape") {
                          evt.preventDefault();
                          editorUi.closeComponentSearch();
                        }
                      }}
                    />

                    <div class="component-search-summary">
                      {t("componentSearch.resultsCount", {
                        count: filteredResults().length,
                      })}
                    </div>

                    <div class="component-search-list">
                      <For each={filteredResults()}>
                        {(result, index) => (
                          <button
                            ref={(el) => {
                              resultRowElements.set(result.nodeId, el);
                            }}
                            type="button"
                            class={`component-search-item ${index() === activeIndex() ? "is-active" : ""}`}
                            onMouseEnter={() => setActiveIndex(index())}
                            onClick={() => selectResult(result, { close: true })}
                          >
                            <div class="component-search-item-title mono">
                              {result.title}
                            </div>
                            <div class="component-search-item-meta">
                              {t("componentSearch.sheetMeta", {
                                sheet: result.sheetName,
                              })}
                            </div>
                          </button>
                        )}
                      </For>

                      <Show when={filteredResults().length === 0}>
                        <div class="muted component-search-empty">
                          {t("componentSearch.noResults")}
                        </div>
                      </Show>
                    </div>
                  </div>
                </div>
              </Show>
            </div>
          </Portal>
        );
      }}
    </Show>
  );
}
