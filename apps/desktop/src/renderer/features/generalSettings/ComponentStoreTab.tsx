import { listStoreEntriesForLinuxCncVersion } from "@nohal/core/componentStore";
import {
  type LinuxCncVersion,
  SUPPORTED_LINUXCNC_VERSIONS,
} from "@nohal/core/linuxcncVersion";
import type { ComponentStore } from "@nohal/core/types";
import { createMemo, createSignal, For, Show } from "solid-js";
import StringSelect from "../../components/form/StringSelect";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import type { GeneralSettingsContext } from "./types";

interface ComponentStoreTabProps {
  context?: GeneralSettingsContext;
}

export default function ComponentStoreTab(props: ComponentStoreTabProps) {
  const { t, formatDateTime } = useI18n();
  const { state, actions } = useEditorStore();
  const [query, setQuery] = createSignal("");
  const [selectedLinuxCncVersion, setSelectedLinuxCncVersion] =
    createSignal<LinuxCncVersion>(
      SUPPORTED_LINUXCNC_VERSIONS[SUPPORTED_LINUXCNC_VERSIONS.length - 1],
    );

  const isProjectContext = () => props.context !== "standalone";
  const activeLinuxCncVersion = () =>
    isProjectContext()
      ? state.project.target.linuxcncVersion
      : selectedLinuxCncVersion();

  const versionScopedEntries = createMemo(() =>
    listStoreEntriesForLinuxCncVersion(
      state.componentStore,
      activeLinuxCncVersion(),
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
  const sourceKindLabel = (
    kind: ComponentStore["components"][string]["sourceRef"]["kind"],
  ) => {
    switch (kind) {
      case "comp-dir":
        return t("componentStore.dirSource");
      case "comp-file":
        return t("componentStore.fileImport");
      case "linuxcnc-builtin":
        return t("componentStore.builtinSource");
    }
  };

  const componentSources = createMemo(() =>
    Object.values(state.componentStore.sources)
      .filter((source) => source.kind !== "linuxcnc-builtin")
      .sort((a, b) => {
        const aPath = sourcePathForSort(a);
        const bPath = sourcePathForSort(b);
        return aPath.localeCompare(bPath);
      }),
  );

  return (
    <div class="grid h-full min-h-0 gap-4">
      <div class="grid gap-2">
        <h2 class="text-lg font-semibold tracking-tight">
          {t("componentStore.title")}
        </h2>
        <p class="max-w-2xl text-sm text-muted-foreground">
          {t("componentStore.summary", {
            components: versionScopedEntries().length,
            sources: componentSources().length,
          })}
        </p>
      </div>

      <div class="grid h-full min-h-0 gap-4 lg:grid-cols-2">
        <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl bg-black/20 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="grid gap-1">
              <div class="text-sm font-semibold tracking-tight">
                {t("componentStore.sources")}
              </div>
              <div class="text-xs text-muted-foreground">
                {componentSources().length} source
                {componentSources().length === 1 ? "" : "s"}
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void actions.addComponentDirSource()}
              >
                {t("componentStore.addDirSource")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void actions.importCompFile()}
              >
                {t("componentStore.importCompFile")}
              </Button>
            </div>
          </div>

          <div class="grid min-h-0 auto-rows-max content-start gap-2 overflow-y-auto pr-1">
            <For each={componentSources()}>
              {(source) => {
                const sourceComponentCount = () =>
                  versionScopedEntries().filter(
                    (entry) => entry.sourceRef.sourceId === source.id,
                  ).length;
                const sourcePath = () => {
                  if (source.kind === "comp-dir") return source.dirPath;
                  return source.filePath;
                };

                return (
                  <div
                    class="grid gap-3 rounded-xl bg-white/[0.04] p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
                    title={sourcePath()}
                  >
                    <div class="min-w-0">
                      <div class="mono truncate font-medium">
                        {sourcePath()}
                      </div>
                      <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {source.kind === "comp-dir" ? "dir" : ".comp"}
                        </Badge>
                        <span>
                          {t("componentStore.sourceComponentsCount", {
                            count: sourceComponentCount(),
                          })}
                        </span>
                        <Show when={source.lastScanAt}>
                          <span>
                            {t("componentStore.lastScan", {
                              time: formatDateTime(source.lastScanAt ?? 0),
                            })}
                          </span>
                        </Show>
                        <Show when={source.lastError}>
                          <span>{source.lastError}</span>
                        </Show>
                      </div>
                    </div>
                    <div class="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void actions.refreshComponentSource(source.id)
                        }
                      >
                        {t("componentStore.refresh")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void actions.deleteComponentSource(source.id)
                        }
                      >
                        {t("componentStore.deleteSource")}
                      </Button>
                    </div>
                  </div>
                );
              }}
            </For>

            <Show when={componentSources().length === 0}>
              <div class="px-1 py-2 text-xs text-muted-foreground">
                {t("componentStore.noSources")}
              </div>
            </Show>
          </div>
        </section>

        <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl bg-black/20 p-4">
          <div class="grid gap-3">
            <div class="grid gap-1">
              <div class="text-sm font-semibold tracking-tight">
                {t("componentStore.storedComponents")}
              </div>
              <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {filteredEntries().length} component
                  {filteredEntries().length === 1 ? "" : "s"}
                </span>
                <Show
                  when={isProjectContext()}
                  fallback={
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{t("componentStore.browseVersion")}</span>
                      <StringSelect
                        value={activeLinuxCncVersion()}
                        class="min-w-[8.5rem]"
                        options={SUPPORTED_LINUXCNC_VERSIONS.map((version) => ({
                          value: version,
                          label: `LinuxCNC ${version}`,
                        }))}
                        onChange={(value) =>
                          setSelectedLinuxCncVersion(value as LinuxCncVersion)
                        }
                      />
                    </>
                  }
                >
                  <span aria-hidden="true">•</span>
                  <span>
                    {t("componentStore.projectVersion", {
                      version: `LinuxCNC ${activeLinuxCncVersion()}`,
                    })}
                  </span>
                </Show>
              </div>
            </div>
            <Input
              type="text"
              placeholder={t("componentStore.filterPlaceholder")}
              value={query()}
              onInput={(evt) => setQuery(evt.currentTarget.value)}
            />
          </div>

          <div class="grid min-h-0 auto-rows-max content-start gap-2 overflow-y-auto pr-1">
            <For each={filteredEntries()}>
              {(entry) => (
                <div
                  class="grid gap-3 rounded-xl bg-white/[0.04] p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
                  title={entry.sourceRef.filePath}
                >
                  <div class="min-w-0">
                    <div class="truncate font-medium">
                      {entry.parsed.halComponentName}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
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
                    <div class="mt-1 text-xs text-muted-foreground">
                      {sourceKindLabel(entry.sourceRef.kind)}
                    </div>
                    <div class="mono mt-1 truncate text-xs text-muted-foreground">
                      {entry.sourceRef.filePath}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {t("common.updated", {
                        time: formatDateTime(entry.updatedAt),
                      })}
                    </div>
                  </div>
                  <div class="flex items-start justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void actions.refreshComponentInStore(entry.componentId)
                      }
                      disabled={entry.sourceRef.kind === "linuxcnc-builtin"}
                    >
                      {t("componentStore.refresh")}
                    </Button>
                  </div>
                </div>
              )}
            </For>

            <Show when={filteredEntries().length === 0}>
              <div class="px-1 py-2 text-xs text-muted-foreground">
                {query().trim()
                  ? t("componentStore.noMatchingComponents")
                  : t("componentStore.noStoredComponents")}
              </div>
            </Show>
          </div>
        </section>
      </div>
    </div>
  );
}
