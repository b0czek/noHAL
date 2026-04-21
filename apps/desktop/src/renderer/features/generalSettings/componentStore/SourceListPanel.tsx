import type { ComponentStoreEntry } from "@nohal/core/types";
import { HiOutlinePlus } from "solid-icons/hi";
import { For, Show } from "solid-js";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { useI18n } from "../../../i18n";
import { useEditorStore } from "../../../state/EditorStoreProvider";
import {
  type ComponentStoreSource,
  sourceDescription,
  sourceKindBadge,
  sourceLabel,
} from "./viewModel";

interface SourceListPanelProps {
  componentSources: readonly ComponentStoreSource[];
  versionScopedEntries: readonly ComponentStoreEntry[];
  onSelectSource: (sourceId: string) => void;
}

export default function SourceListPanel(props: SourceListPanelProps) {
  const { t, formatDateTime } = useI18n();
  const { actions } = useEditorStore();

  return (
    <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl bg-black/20 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="grid gap-1">
          <div class="text-sm font-semibold tracking-tight">
            {t("componentStore.sources")}
          </div>
          <div class="text-xs text-muted-foreground">
            {props.componentSources.length} source
            {props.componentSources.length === 1 ? "" : "s"}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button<"button">}
            variant="secondary"
            class="gap-2"
          >
            <HiOutlinePlus size={16} aria-hidden="true" />
            {t("componentStore.addSource")}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => void actions.addComponentDirSource()}
            >
              {t("componentStore.addDirSource")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void actions.importCompFile()}>
              {t("componentStore.importCompFile")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div class="grid min-h-0 auto-rows-max content-start gap-2 overflow-y-auto pr-1">
        <For each={props.componentSources}>
          {(source) => {
            const sourceComponentCount = () =>
              props.versionScopedEntries.filter(
                (entry) => entry.sourceRef.sourceId === source.id,
              ).length;

            return (
              <div class="grid gap-3 rounded-xl bg-white/[0.04] p-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0 text-left">
                    <div class="truncate font-medium">
                      {sourceLabel(t, source)}
                    </div>
                    <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {sourceKindBadge(t, source)}
                      </Badge>
                      <span>{sourceDescription(t, source)}</span>
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
                    <Show
                      when={source.kind === "manual"}
                      fallback={
                        <>
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
                        </>
                      }
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => props.onSelectSource(source.id)}
                      >
                        {t("componentStore.viewStore")}
                      </Button>
                    </Show>
                  </div>
                </div>
              </div>
            );
          }}
        </For>

        <Show when={props.componentSources.length === 0}>
          <div class="px-1 py-2 text-xs text-muted-foreground">
            {t("componentStore.noSources")}
          </div>
        </Show>
      </div>
    </section>
  );
}
