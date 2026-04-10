import { listStoreEntriesForLinuxCncVersion } from "@nohal/core/componentStore";
import {
  type LinuxCncVersion,
  SUPPORTED_LINUXCNC_VERSIONS,
} from "@nohal/core/linuxcncVersion";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import ManualComponentEditorView from "./componentStore/ManualComponentEditorView";
import ManualComponentsView from "./componentStore/ManualComponentsView";
import SourceListPanel from "./componentStore/SourceListPanel";
import StoredComponentsPanel from "./componentStore/StoredComponentsPanel";
import {
  entrySourceDetail,
  entrySourceLabel,
  sortComponentSources,
} from "./componentStore/viewModel";
import type { GeneralSettingsContext } from "./types";

interface ComponentStoreTabProps {
  context?: GeneralSettingsContext;
}

export default function ComponentStoreTab(props: ComponentStoreTabProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [query, setQuery] = createSignal("");
  const [selectedSourceId, setSelectedSourceId] = createSignal<string | null>(
    null,
  );
  const [selectedLinuxCncVersion, setSelectedLinuxCncVersion] =
    createSignal<LinuxCncVersion>(
      SUPPORTED_LINUXCNC_VERSIONS[SUPPORTED_LINUXCNC_VERSIONS.length - 1],
    );
  const [selectedManualComponentId, setSelectedManualComponentId] =
    createSignal<string | null>(null);

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
      const hay = [
        entry.parsed.halComponentName,
        entry.parsed.name,
        entrySourceLabel(t, state.componentStore.sources, entry),
        entrySourceDetail(t, entry),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  });

  const componentSources = createMemo(() =>
    sortComponentSources(
      t,
      Object.values(state.componentStore.sources).filter(
        (source) => source.kind !== "linuxcnc-builtin",
      ),
    ),
  );

  const manualSource = createMemo(() =>
    componentSources().find((source) => source.kind === "manual"),
  );

  const selectedSource = createMemo(() => {
    const sourceId = selectedSourceId();
    if (!sourceId) return null;
    return componentSources().find((source) => source.id === sourceId) ?? null;
  });

  const manualEntries = createMemo(() =>
    versionScopedEntries()
      .filter((entry) => entry.sourceRef.kind === "manual")
      .sort((a, b) =>
        a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
      ),
  );

  const selectedManualEntry = createMemo(() => {
    const componentId = selectedManualComponentId();
    if (!componentId) return null;
    return (
      manualEntries().find((entry) => entry.componentId === componentId) ?? null
    );
  });

  createEffect(() => {
    const componentId = selectedManualComponentId();
    if (!componentId) return;
    if (manualEntries().some((entry) => entry.componentId === componentId)) {
      return;
    }
    setSelectedManualComponentId(null);
  });

  createEffect(() => {
    const sourceId = selectedSourceId();
    if (!sourceId) return;
    if (componentSources().some((source) => source.id === sourceId)) return;
    setSelectedSourceId(null);
  });

  const addStoreCustomComponent = async () => {
    const componentId = await actions.addStoreCustomComponent();
    if (!componentId) return;
    setSelectedSourceId(manualSource()?.id ?? null);
    setSelectedManualComponentId(componentId);
  };

  const isViewingManualSource = () => selectedSource()?.kind === "manual";

  return (
    <div class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
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

      <Show
        when={selectedManualEntry()}
        fallback={
          <Show
            when={isViewingManualSource()}
            fallback={
              <div class="grid h-full min-h-0 gap-4 lg:grid-cols-2">
                <SourceListPanel
                  componentSources={componentSources()}
                  versionScopedEntries={versionScopedEntries()}
                  onSelectSource={setSelectedSourceId}
                />
                <StoredComponentsPanel
                  componentStore={state.componentStore}
                  entries={filteredEntries()}
                  query={query()}
                  isProjectContext={isProjectContext()}
                  activeLinuxCncVersion={activeLinuxCncVersion()}
                  selectedLinuxCncVersion={selectedLinuxCncVersion()}
                  onQueryChange={setQuery}
                  onLinuxCncVersionChange={setSelectedLinuxCncVersion}
                  onEditManualEntry={(componentId) => {
                    setSelectedSourceId(manualSource()?.id ?? null);
                    setSelectedManualComponentId(componentId);
                  }}
                />
              </div>
            }
          >
            <ManualComponentsView
              entries={manualEntries()}
              onBack={() => {
                setSelectedSourceId(null);
                setSelectedManualComponentId(null);
              }}
              onAddComponent={addStoreCustomComponent}
              onSelectComponent={setSelectedManualComponentId}
            />
          </Show>
        }
      >
        {(entry) => (
          <ManualComponentEditorView
            entry={entry()}
            onBack={() => setSelectedManualComponentId(null)}
          />
        )}
      </Show>
    </div>
  );
}
