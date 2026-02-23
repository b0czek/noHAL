import { createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type { ComponentStore } from "../../shared/types";

interface ComponentStoreDialogProps {
  open: boolean;
  componentStore: ComponentStore;
  onImportCompFile: () => void;
  onAddCompDirSource: () => void;
  onRefreshComponentSource: (sourceId: string) => void;
  onDeleteComponentSource: (sourceId: string) => void;
  onRefreshStoredComponent: (componentId: string) => void;
  onClose: () => void;
}

export default function ComponentStoreDialog(props: ComponentStoreDialogProps) {
  const [query, setQuery] = createSignal("");

  const filteredEntries = createMemo(() => {
    const q = query().trim().toLowerCase();
    const entries = Object.values(props.componentStore.components).sort(
      (a, b) =>
        a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
    );
    if (!q) return entries;
    return entries.filter((entry) => {
      const hay =
        `${entry.parsed.halComponentName} ${entry.parsed.name} ${entry.sourceRef.filePath}`.toLowerCase();
      return hay.includes(q);
    });
  });

  const componentSources = createMemo(() =>
    Object.values(props.componentStore.sources).sort((a, b) => {
      const aPath = a.kind === "comp-dir" ? a.dirPath : a.filePath;
      const bPath = b.kind === "comp-dir" ? b.dirPath : b.filePath;
      return aPath.localeCompare(bPath);
    }),
  );

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="modal-backdrop"
          onPointerDown={() => props.onClose()}
          onContextMenu={(evt) => evt.preventDefault()}
        >
          <div
            class="modal component-store-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Component Store"
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">Component Store</div>
                <div class="modal-sub">
                  {Object.keys(props.componentStore.components).length} stored
                  components • {componentSources().length} sources
                </div>
              </div>
              <button class="btn subtle" onClick={props.onClose}>
                Close
              </button>
            </div>

            <div class="modal-body">
              <section class="panel">
                <div class="panel-title">Component Sources</div>
                <div class="component-store-toolbar">
                  <div class="toolbar-group">
                    <button class="btn" onClick={props.onAddCompDirSource}>
                      Add Dir Source
                    </button>
                    <button class="btn" onClick={props.onImportCompFile}>
                      Import .comp
                    </button>
                  </div>
                </div>

                <div class="component-store-source-list list">
                  <For each={componentSources()}>
                    {(source) => {
                      const sourceComponentCount = () =>
                        Object.values(props.componentStore.components).filter(
                          (entry) => entry.sourceRef.sourceId === source.id,
                        ).length;
                      const sourcePath = () =>
                        source.kind === "comp-dir"
                          ? source.dirPath
                          : source.filePath;

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
                                {source.kind === "comp-dir" ? "dir" : ".comp"}
                              </span>
                              {sourceComponentCount()} components
                              {source.lastScanAt
                                ? ` • last scan ${formatDateTime(source.lastScanAt)}`
                                : ""}
                              {source.lastError ? ` • ${source.lastError}` : ""}
                            </div>
                          </div>
                          <div class="component-store-actions">
                            <button
                              class="mini"
                              onClick={() =>
                                props.onRefreshComponentSource(source.id)
                              }
                            >
                              Refresh
                            </button>
                            <button
                              class="mini"
                              onClick={() =>
                                props.onDeleteComponentSource(source.id)
                              }
                            >
                              Delete Source
                            </button>
                          </div>
                        </div>
                      );
                    }}
                  </For>

                  <Show when={componentSources().length === 0}>
                    <div class="muted component-store-empty">
                      No component sources yet.
                    </div>
                  </Show>
                </div>
              </section>

              <section class="panel">
                <div class="panel-title">Stored Components</div>
                <div class="component-store-toolbar">
                  <input
                    type="text"
                    placeholder="Filter stored components..."
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
                            {entry.parsed.pins.length} pins •{" "}
                            {entry.parsed.params.length} params
                            {entry.parsed.parseMeta.warnings.length > 0
                              ? ` • ${entry.parsed.parseMeta.warnings.length} warnings`
                              : ""}
                          </div>
                          <div class="component-sub">
                            {entry.sourceRef.kind === "comp-dir"
                              ? "dir source"
                              : "file import"}
                          </div>
                          <div class="component-sub component-store-path mono">
                            {entry.sourceRef.filePath}
                          </div>
                          <div class="component-sub">
                            Updated {formatDateTime(entry.updatedAt)}
                          </div>
                        </div>
                        <div class="component-store-actions">
                          <button
                            class="mini"
                            onClick={() =>
                              props.onRefreshStoredComponent(entry.componentId)
                            }
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                    )}
                  </For>

                  <Show when={filteredEntries().length === 0}>
                    <div class="muted component-store-empty">
                      {Object.keys(props.componentStore.components).length === 0
                        ? "No stored components yet."
                        : "No matching stored components."}
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
