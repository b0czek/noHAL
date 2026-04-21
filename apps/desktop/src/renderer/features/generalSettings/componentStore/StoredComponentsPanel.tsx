import {
  type LinuxCncVersion,
  SUPPORTED_LINUXCNC_VERSIONS,
} from "@nohal/core/linuxcncVersion";
import type { ComponentStore, ComponentStoreEntry } from "@nohal/core/types";
import { For, Show } from "solid-js";
import StringSelect from "../../../components/form/StringSelect";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useI18n } from "../../../i18n";
import { useEditorStore } from "../../../state/EditorStoreProvider";
import { entrySourceDetail, sourceKindLabel } from "./viewModel";

interface StoredComponentsPanelProps {
  componentStore: ComponentStore;
  entries: readonly ComponentStoreEntry[];
  query: string;
  isProjectContext: boolean;
  activeLinuxCncVersion: LinuxCncVersion;
  selectedLinuxCncVersion: LinuxCncVersion;
  onQueryChange: (value: string) => void;
  onLinuxCncVersionChange: (value: LinuxCncVersion) => void;
  onEditManualEntry: (componentId: string) => void;
}

export default function StoredComponentsPanel(
  props: StoredComponentsPanelProps,
) {
  const { t, formatDateTime } = useI18n();
  const { actions } = useEditorStore();

  return (
    <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-2xl bg-black/20 p-4">
      <div class="grid gap-3">
        <div class="grid gap-1">
          <div class="text-sm font-semibold tracking-tight">
            {t("componentStore.storedComponents")}
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {props.entries.length} component
              {props.entries.length === 1 ? "" : "s"}
            </span>
            <Show
              when={props.isProjectContext}
              fallback={
                <>
                  <span aria-hidden="true">•</span>
                  <span>{t("componentStore.browseVersion")}</span>
                  <StringSelect
                    value={props.selectedLinuxCncVersion}
                    class="min-w-[8.5rem]"
                    options={SUPPORTED_LINUXCNC_VERSIONS.map((version) => ({
                      value: version,
                      label: `LinuxCNC ${version}`,
                    }))}
                    onChange={(value) =>
                      props.onLinuxCncVersionChange(value as LinuxCncVersion)
                    }
                  />
                </>
              }
            >
              <span aria-hidden="true">•</span>
              <span>
                {t("componentStore.projectVersion", {
                  version: `LinuxCNC ${props.activeLinuxCncVersion}`,
                })}
              </span>
            </Show>
          </div>
        </div>
        <Input
          type="text"
          placeholder={t("componentStore.filterPlaceholder")}
          value={props.query}
          onInput={(evt) => props.onQueryChange(evt.currentTarget.value)}
        />
      </div>

      <div class="grid min-h-0 auto-rows-max content-start gap-2 overflow-y-auto pr-1">
        <For each={props.entries}>
          {(entry) => (
            <div class="grid gap-3 rounded-xl bg-white/[0.04] p-3 lg:grid-cols-[minmax(0,1fr)_auto]">
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
                  {sourceKindLabel(t, entry.sourceRef.kind)}
                </div>
                <div class="mono mt-1 truncate text-xs text-muted-foreground">
                  {entrySourceDetail(t, entry)}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {t("common.updated", {
                    time: formatDateTime(entry.updatedAt),
                  })}
                </div>
              </div>
              <div class="flex items-start justify-end">
                <Show
                  when={entry.sourceRef.kind === "manual"}
                  fallback={
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
                  }
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => props.onEditManualEntry(entry.componentId)}
                  >
                    {t("componentStore.editComponent")}
                  </Button>
                </Show>
              </div>
            </div>
          )}
        </For>

        <Show when={props.entries.length === 0}>
          <div class="px-1 py-2 text-xs text-muted-foreground">
            {props.query.trim()
              ? t("componentStore.noMatchingComponents")
              : t("componentStore.noStoredComponents")}
          </div>
        </Show>
      </div>
    </section>
  );
}
