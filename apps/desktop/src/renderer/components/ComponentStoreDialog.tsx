import {
  listStoreEntriesForLinuxCncVersion,
  listStoreSourcesForLinuxCncVersion,
} from "@nohal/core/src/componentStore";
import type { ComponentStore } from "@nohal/core/src/types";
import { createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

export default function ComponentStoreDialog() {
  const { t, formatDateTime } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const [query, setQuery] = createSignal("");
  const versionScopedEntries = createMemo(() =>
    listStoreEntriesForLinuxCncVersion(
      state.componentStore,
      state.project.target.linuxcncVersion,
    ),
  );

  const filteredEntries = createMemo(() => {
    const q = query().trim().toLowerCase();
    const entries = [...versionScopedEntries()].sort((a, b) =>
      a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
    );
    if (!q) return entries;
    return entries.filter((entry) => {
      const hay =
        `${entry.parsed.halComponentName} ${entry.parsed.name} ${entry.sourceRef.filePath}`.toLowerCase();
      return hay.includes(q);
    });
  });

  const sourcePathForSort = (source: ComponentStore["sources"][string]) => {
    if (source.kind === "comp-dir") return source.dirPath;
    if (source.kind === "comp-file") return source.filePath;
    return `${source.linuxcncVersion} ${source.refName}`;
  };

  const componentSources = createMemo(() =>
    listStoreSourcesForLinuxCncVersion(
      state.componentStore,
      state.project.target.linuxcncVersion,
    ).sort((a, b) => {
      const aPath = sourcePathForSort(a);
      const bPath = sourcePathForSort(b);
      return aPath.localeCompare(bPath);
    }),
  );

  return (
    <Show when={editorUi.isComponentStoreOpen()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={() => editorUi.closeComponentStore()}
        >
          <div
            class="modal component-store-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("componentStore.ariaLabel")}
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">{t("componentStore.title")}</div>
                <div class="modal-sub">
                  {t("componentStore.summary", {
                    components: versionScopedEntries().length,
                    sources: componentSources().length,
                  })}
                </div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={editorUi.closeComponentStore}
              >
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body">
              <section class="panel">
                <div class="panel-title">{t("componentStore.sources")}</div>
                <div class="component-store-toolbar">
                  <div class="toolbar-group">
                    <button
                      type="button"
                      class="btn"
                      onClick={() => void actions.addComponentDirSource()}
                    >
                      {t("componentStore.addDirSource")}
                    </button>
                    <button
                      type="button"
                      class="btn"
                      onClick={() => void actions.importCompFile()}
                    >
                      {t("componentStore.importCompFile")}
                    </button>
                  </div>
                </div>

                <div class="component-store-source-list list">
                  <For each={componentSources()}>
                    {(source) => {
                      const sourceComponentCount = () =>
                        versionScopedEntries().filter(
                          (entry) => entry.sourceRef.sourceId === source.id,
                        ).length;
                      const sourcePath = () =>
                        source.kind === "comp-dir"
                          ? source.dirPath
                          : source.kind === "comp-file"
                            ? source.filePath
                            : `LinuxCNC ${source.linuxcncVersion} built-ins (${source.refName})`;

                      return (
                        <div
                          class="component-row component-store-row"
                          title={sourcePath()}
                        >
                          <div class="component-store-main">
                            <div class="component-name mono">
                              {sourcePath()}
                            </div>
                            <div class="component-sub">
                              <span class="chip type">
                                {source.kind === "comp-dir"
                                  ? "dir"
                                  : source.kind === "comp-file"
                                    ? ".comp"
                                    : "builtin"}
                              </span>
                              {t("componentStore.sourceComponentsCount", {
                                count: sourceComponentCount(),
                              })}
                              {source.lastScanAt
                                ? ` • ${t("componentStore.lastScan", {
                                    time: formatDateTime(source.lastScanAt),
                                  })}`
                                : ""}
                              {source.lastError ? ` • ${source.lastError}` : ""}
                            </div>
                          </div>
                          <div class="component-store-actions">
                            <button
                              type="button"
                              class="mini"
                              onClick={() =>
                                void actions.refreshComponentSource(source.id)
                              }
                              disabled={source.kind === "linuxcnc-builtin"}
                            >
                              {t("componentStore.refresh")}
                            </button>
                            <button
                              type="button"
                              class="mini"
                              onClick={() =>
                                void actions.deleteComponentSource(source.id)
                              }
                              disabled={source.kind === "linuxcnc-builtin"}
                            >
                              {t("componentStore.deleteSource")}
                            </button>
                          </div>
                        </div>
                      );
                    }}
                  </For>

                  <Show when={componentSources().length === 0}>
                    <div class="muted component-store-empty">
                      {t("componentStore.noSources")}
                    </div>
                  </Show>
                </div>
              </section>

              <section class="panel">
                <div class="panel-title">
                  {t("componentStore.storedComponents")}
                </div>
                <div class="component-store-toolbar">
                  <input
                    type="text"
                    placeholder={t("componentStore.filterPlaceholder")}
                    value={query()}
                    onInput={(evt) => setQuery(evt.currentTarget.value)}
                  />
                </div>

                <div class="component-store-list">
                  <For each={filteredEntries()}>
                    {(entry) => (
                      <div
                        class="component-row component-store-row"
                        title={entry.sourceRef.filePath}
                      >
                        <div class="component-store-main">
                          <div class="component-name">
                            {entry.parsed.halComponentName}
                          </div>
                          <div class="component-sub">
                            {t("componentStore.componentStats", {
                              pins: entry.parsed.pins.length,
                              params: entry.parsed.params.length,
                            })}
                            {entry.parsed.parseMeta.warnings.length > 0
                              ? ` • ${t("componentStore.componentWarnings", {
                                  count: entry.parsed.parseMeta.warnings.length,
                                })}`
                              : ""}
                          </div>
                          <div class="component-sub">
                            {entry.sourceRef.kind === "comp-dir"
                              ? t("componentStore.dirSource")
                              : entry.sourceRef.kind === "comp-file"
                                ? t("componentStore.fileImport")
                                : t("componentStore.builtinSource")}
                          </div>
                          <div class="component-sub component-store-path mono">
                            {entry.sourceRef.filePath}
                          </div>
                          <div class="component-sub">
                            {t("common.updated", {
                              time: formatDateTime(entry.updatedAt),
                            })}
                          </div>
                        </div>
                        <div class="component-store-actions">
                          <button
                            type="button"
                            class="mini"
                            onClick={() =>
                              void actions.refreshComponentInStore(
                                entry.componentId,
                              )
                            }
                            disabled={
                              entry.sourceRef.kind === "linuxcnc-builtin"
                            }
                          >
                            {t("componentStore.refresh")}
                          </button>
                        </div>
                      </div>
                    )}
                  </For>

                  <Show when={filteredEntries().length === 0}>
                    <div class="muted component-store-empty">
                      {versionScopedEntries().length === 0
                        ? t("componentStore.noStoredComponents")
                        : t("componentStore.noMatchingComponents")}
                    </div>
                  </Show>
                </div>
              </section>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
