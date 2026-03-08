import {
  listStoreEntriesForLinuxCncVersion,
  listStoreSourcesForLinuxCncVersion,
} from "@nohal/core/src/componentStore";
import type { ComponentStore } from "@nohal/core/src/types";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { OverlayDialogProps } from "../app/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

type ComponentStoreDialogProps = OverlayDialogProps;

export default function ComponentStoreDialog(props: ComponentStoreDialogProps) {
  const { t, formatDateTime } = useI18n();
  const { state, actions } = useEditorStore();
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
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) props.onClose();
      }}
    >
      <DialogContent
        class="grid h-[min(760px,calc(100vh-36px))] w-[min(1080px,calc(100vw-36px))] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.75rem] border-white/10 bg-[linear-gradient(180deg,rgba(11,24,31,0.96),rgba(8,17,22,0.92))] p-5 shadow-2xl shadow-black/30"
        onContextMenu={(evt: MouseEvent) => evt.preventDefault()}
      >
        <DialogHeader class="border-b border-white/8 pb-4 text-left">
          <DialogTitle>{t("componentStore.title")}</DialogTitle>
          <DialogDescription>
            {t("componentStore.summary", {
              components: versionScopedEntries().length,
              sources: componentSources().length,
            })}
          </DialogDescription>
        </DialogHeader>

        <div class="grid min-h-0 items-start gap-4 lg:grid-cols-2">
          <section class="grid min-h-0 gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
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

            <div class="grid min-h-0 flex-1 gap-2 overflow-auto pr-1">
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
                      class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
                      title={sourcePath()}
                    >
                      <div class="min-w-0">
                        <div class="mono truncate font-medium">
                          {sourcePath()}
                        </div>
                        <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">
                            {source.kind === "comp-dir"
                              ? "dir"
                              : source.kind === "comp-file"
                                ? ".comp"
                                : "builtin"}
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
                          disabled={source.kind === "linuxcnc-builtin"}
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
                          disabled={source.kind === "linuxcnc-builtin"}
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

          <section class="grid min-h-0 gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
            <div class="grid gap-3">
              <div class="grid gap-1">
                <div class="text-sm font-semibold tracking-tight">
                  {t("componentStore.storedComponents")}
                </div>
                <div class="text-xs text-muted-foreground">
                  {filteredEntries().length} component
                  {filteredEntries().length === 1 ? "" : "s"}
                </div>
              </div>
              <Input
                type="text"
                placeholder={t("componentStore.filterPlaceholder")}
                value={query()}
                onInput={(evt) => setQuery(evt.currentTarget.value)}
              />
            </div>

            <div class="grid min-h-0 flex-1 gap-2 overflow-auto pr-1">
              <For each={filteredEntries()}>
                {(entry) => (
                  <div
                    class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_auto]"
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
                        {entry.sourceRef.kind === "comp-dir"
                          ? t("componentStore.dirSource")
                          : entry.sourceRef.kind === "comp-file"
                            ? t("componentStore.fileImport")
                            : t("componentStore.builtinSource")}
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
                          void actions.refreshComponentInStore(
                            entry.componentId,
                          )
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
                  {versionScopedEntries().length === 0
                    ? t("componentStore.noStoredComponents")
                    : t("componentStore.noMatchingComponents")}
                </div>
              </Show>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
