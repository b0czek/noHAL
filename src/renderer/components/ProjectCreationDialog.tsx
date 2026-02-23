import { createMemo, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type {
  ComponentStore,
  HalImportDraft,
  HalImportPlacementHeuristic,
} from "../../shared/types";

type ProjectCreationDialogStep = "choose" | "link";

export interface ProjectCreationDialogProps {
  open: boolean;
  step: ProjectCreationDialogStep;
  isBusy: boolean;
  componentStore: ComponentStore;
  importDraft: HalImportDraft | null;
  linkSelections: Record<string, string>;
  linkReasons: Record<string, string>;
  placementHeuristic: HalImportPlacementHeuristic;
  errorMessage: string | null;
  onClose: () => void;
  onCreateBlank: () => void;
  onPickHalFile: () => void;
  onBackToChoice: () => void;
  onRepickHalFile: () => void;
  onChangeLinkSelection: (groupId: string, value: string) => void;
  onChangePlacementHeuristic: (value: HalImportPlacementHeuristic) => void;
  onCreateImportedProject: () => void;
}

function selectionLabel(
  encodedValue: string,
  componentStore: ComponentStore,
): string {
  if (!encodedValue || encodedValue === "local")
    return "Project-local (generated)";
  if (!encodedValue.startsWith("store:")) return encodedValue;
  const componentId = encodedValue.slice("store:".length);
  const entry = componentStore.components[componentId];
  if (!entry) return `Store: ${componentId}`;
  return `Store: ${entry.parsed.halComponentName}`;
}

export default function ProjectCreationDialog(
  props: ProjectCreationDialogProps,
) {
  const storeEntries = createMemo(() =>
    Object.values(props.componentStore.components).sort((a, b) =>
      a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
    ),
  );

  const optionListForGroup = (inferredName: string) => {
    const entries = storeEntries();
    const exact: typeof entries = [];
    const partial: typeof entries = [];
    const lower = inferredName.toLowerCase();
    for (const entry of entries) {
      const name = entry.parsed.halComponentName.toLowerCase();
      if (name === lower) exact.push(entry);
      else if (name.includes(lower) || lower.includes(name))
        partial.push(entry);
    }
    const ordered = [
      ...exact,
      ...partial,
      ...entries.filter(
        (entry) => !exact.includes(entry) && !partial.includes(entry),
      ),
    ];
    return ordered;
  };

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={() => (props.isBusy ? undefined : props.onClose())}
        >
          <div
            class="modal new-project-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Create New Project"
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">New Project</div>
                <div class="modal-sub">
                  {props.step === "choose"
                    ? "Choose a blank project or import an existing HAL file."
                    : "Verify component links before building the imported sheet."}
                </div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={props.onClose}
                disabled={props.isBusy}
              >
                Close
              </button>
            </div>

            <div class="modal-body new-project-dialog-body">
              <Show when={props.errorMessage}>
                {(message) => <div class="warning-item">{message()}</div>}
              </Show>

              <Show when={props.step === "choose"}>
                <div class="new-project-choice-grid">
                  <section class="panel">
                    <div class="panel-title">Blank Project</div>
                    <div class="muted">
                      Start with an empty top sheet and existing built-in/store
                      components.
                    </div>
                    <div class="new-project-choice-actions">
                      <button
                        type="button"
                        class="btn accent"
                        onClick={props.onCreateBlank}
                        disabled={props.isBusy}
                      >
                        Create Blank
                      </button>
                    </div>
                  </section>

                  <section class="panel">
                    <div class="panel-title">Import Existing HAL</div>
                    <div class="muted">
                      Parse a `.hal` file, link components to the component
                      store, and generate a project-local sheet.
                    </div>
                    <div class="new-project-choice-actions">
                      <button
                        type="button"
                        class="btn"
                        onClick={props.onPickHalFile}
                        disabled={props.isBusy}
                      >
                        Pick HAL File
                      </button>
                    </div>
                  </section>
                </div>
              </Show>

              <Show when={props.step === "link" && props.importDraft}>
                {(draft) => (
                  <>
                    <section class="panel">
                      <div class="panel-title">Import Source</div>
                      <div class="list compact">
                        <div class="list-row">
                          <span class="muted">File</span>
                          <span class="mono new-project-path">
                            {draft().sourcePath ?? "(unspecified)"}
                          </span>
                        </div>
                        <div class="list-row">
                          <span class="muted">Components</span>
                          <span>{draft().componentGroups.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">Nets</span>
                          <span>{draft().nets.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">setp</span>
                          <span>{draft().setps.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">addf</span>
                          <span>{draft().addfs.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">Placement</span>
                          <select
                            value={props.placementHeuristic}
                            onChange={(evt) =>
                              props.onChangePlacementHeuristic(
                                evt.currentTarget
                                  .value as HalImportPlacementHeuristic,
                              )
                            }
                            disabled={props.isBusy}
                            title="Component placement heuristic"
                          >
                            <option value="related-groups">
                              Related groups (heuristic)
                            </option>
                            <option value="alphabetical">Alphabetical</option>
                          </select>
                        </div>
                      </div>
                      <div class="muted">
                        Groups connected components together before laying out
                        the imported sheet, which usually reduces long crossing
                        wires.
                      </div>
                      <div class="new-project-choice-actions">
                        <button
                          type="button"
                          class="mini"
                          onClick={props.onBackToChoice}
                          disabled={props.isBusy}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          class="mini"
                          onClick={props.onRepickHalFile}
                          disabled={props.isBusy}
                        >
                          Pick Different File
                        </button>
                      </div>
                    </section>

                    <section class="panel">
                      <div class="panel-title">Component Linking</div>
                      <div class="muted new-project-linking-help">
                        Review automatic matches. Any group left as
                        project-local will generate a component definition
                        stored in this project's `.nohal.json`.
                      </div>
                      <div class="new-project-link-list">
                        <For each={draft().componentGroups}>
                          {(group) => (
                            <div class="new-project-link-row">
                              <div class="new-project-link-main">
                                <div class="component-name mono">
                                  {group.inferredHalComponentName}
                                </div>
                                <div class="component-sub">
                                  {group.instances.length} instances •{" "}
                                  {group.pins.length} pins •{" "}
                                  {group.params.length} params • runtime{" "}
                                  {group.runtimeHint}
                                </div>
                                <Show when={props.linkReasons[group.id]}>
                                  <div class="component-sub">
                                    Auto: {props.linkReasons[group.id]}
                                  </div>
                                </Show>
                                <div class="component-sub mono">
                                  {group.instances
                                    .slice(0, 3)
                                    .map((item) => item.instanceName)
                                    .join(", ")}
                                  {group.instances.length > 3 ? " ..." : ""}
                                </div>
                              </div>
                              <div class="new-project-link-select">
                                <label>
                                  Link Target
                                  <select
                                    value={
                                      props.linkSelections[group.id] ?? "local"
                                    }
                                    onChange={(evt) =>
                                      props.onChangeLinkSelection(
                                        group.id,
                                        evt.currentTarget.value,
                                      )
                                    }
                                    title={selectionLabel(
                                      props.linkSelections[group.id] ?? "local",
                                      props.componentStore,
                                    )}
                                  >
                                    <option value="local">
                                      Project-local (generated)
                                    </option>
                                    <For
                                      each={optionListForGroup(
                                        group.inferredHalComponentName,
                                      )}
                                    >
                                      {(entry) => (
                                        <option
                                          value={`store:${entry.componentId}`}
                                        >
                                          {entry.parsed.halComponentName} (
                                          {entry.parsed.pins.length}
                                          p/{entry.parsed.params.length} prm)
                                        </option>
                                      )}
                                    </For>
                                  </select>
                                </label>
                              </div>
                            </div>
                          )}
                        </For>
                        <Show when={draft().componentGroups.length === 0}>
                          <div class="muted">
                            No component groups were detected.
                          </div>
                        </Show>
                      </div>
                    </section>

                    <Show when={draft().warnings.length > 0}>
                      <section class="panel warn">
                        <div class="panel-title">Parser Warnings</div>
                        <div class="list compact">
                          <For each={draft().warnings.slice(0, 20)}>
                            {(warning) => (
                              <div class="warning-item">{warning}</div>
                            )}
                          </For>
                        </div>
                        <Show when={draft().warnings.length > 20}>
                          <div class="muted">
                            Showing first 20 of {draft().warnings.length}{" "}
                            warnings.
                          </div>
                        </Show>
                      </section>
                    </Show>

                    <div class="new-project-dialog-footer">
                      <button
                        type="button"
                        class="btn accent"
                        onClick={props.onCreateImportedProject}
                        disabled={props.isBusy}
                      >
                        Create Imported Project
                      </button>
                    </div>
                  </>
                )}
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
