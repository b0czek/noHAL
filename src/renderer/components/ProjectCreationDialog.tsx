import { createMemo, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type {
  ComponentStore,
  HalImportDraft,
  HalImportPlacementHeuristic,
} from "../../shared/types";
import { useI18n } from "../i18n";

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

export default function ProjectCreationDialog(
  props: ProjectCreationDialogProps,
) {
  const { t } = useI18n();
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
  const selectionLabel = (encodedValue: string): string => {
    if (!encodedValue || encodedValue === "local") {
      return t("projectCreation.projectLocalGenerated");
    }
    if (!encodedValue.startsWith("store:")) return encodedValue;
    const componentId = encodedValue.slice("store:".length);
    const entry = props.componentStore.components[componentId];
    if (!entry) return t("projectCreation.storeFallback", { componentId });
    return t("projectCreation.storeEntry", {
      name: entry.parsed.halComponentName,
    });
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
            aria-label={t("projectCreation.ariaCreateProject")}
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">{t("projectCreation.title")}</div>
                <div class="modal-sub">
                  {props.step === "choose"
                    ? t("projectCreation.subtitleChoose")
                    : t("projectCreation.subtitleLink")}
                </div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={props.onClose}
                disabled={props.isBusy}
              >
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body new-project-dialog-body">
              <Show when={props.errorMessage}>
                {(message) => <div class="warning-item">{message()}</div>}
              </Show>

              <Show when={props.step === "choose"}>
                <div class="new-project-choice-grid">
                  <section class="panel">
                    <div class="panel-title">
                      {t("projectCreation.blankProject")}
                    </div>
                    <div class="muted">
                      {t("projectCreation.blankProjectHelp")}
                    </div>
                    <div class="new-project-choice-actions">
                      <button
                        type="button"
                        class="btn accent"
                        onClick={props.onCreateBlank}
                        disabled={props.isBusy}
                      >
                        {t("projectCreation.createBlank")}
                      </button>
                    </div>
                  </section>

                  <section class="panel">
                    <div class="panel-title">
                      {t("projectCreation.importExistingHal")}
                    </div>
                    <div class="muted">
                      {t("projectCreation.importExistingHalHelp")}
                    </div>
                    <div class="new-project-choice-actions">
                      <button
                        type="button"
                        class="btn"
                        onClick={props.onPickHalFile}
                        disabled={props.isBusy}
                      >
                        {t("projectCreation.pickHalFile")}
                      </button>
                    </div>
                  </section>
                </div>
              </Show>

              <Show when={props.step === "link" && props.importDraft}>
                {(draft) => (
                  <>
                    <section class="panel">
                      <div class="panel-title">
                        {t("projectCreation.importSource")}
                      </div>
                      <div class="list compact">
                        <div class="list-row">
                          <span class="muted">{t("common.file")}</span>
                          <span class="mono new-project-path">
                            {draft().sourcePath ?? t("common.unspecified")}
                          </span>
                        </div>
                        <div class="list-row">
                          <span class="muted">
                            {t("projectCreation.components")}
                          </span>
                          <span>{draft().componentGroups.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">{t("projectCreation.nets")}</span>
                          <span>{draft().nets.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">{t("projectCreation.setp")}</span>
                          <span>{draft().setps.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">{t("projectCreation.addf")}</span>
                          <span>{draft().addfs.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">
                            {t("projectCreation.placement")}
                          </span>
                          <select
                            value={props.placementHeuristic}
                            onChange={(evt) =>
                              props.onChangePlacementHeuristic(
                                evt.currentTarget
                                  .value as HalImportPlacementHeuristic,
                              )
                            }
                            disabled={props.isBusy}
                            title={t("projectCreation.placementTitle")}
                          >
                            <option value="related-groups">
                              {t("projectCreation.placementRelatedGroups")}
                            </option>
                            <option value="alphabetical">
                              {t("projectCreation.placementAlphabetical")}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div class="muted">
                        {t("projectCreation.placementHelp")}
                      </div>
                      <div class="new-project-choice-actions">
                        <button
                          type="button"
                          class="mini"
                          onClick={props.onBackToChoice}
                          disabled={props.isBusy}
                        >
                          {t("common.back")}
                        </button>
                        <button
                          type="button"
                          class="mini"
                          onClick={props.onRepickHalFile}
                          disabled={props.isBusy}
                        >
                          {t("projectCreation.pickDifferentFile")}
                        </button>
                      </div>
                    </section>

                    <section class="panel">
                      <div class="panel-title">
                        {t("projectCreation.componentLinking")}
                      </div>
                      <div class="muted new-project-linking-help">
                        {t("projectCreation.componentLinkingHelp")}
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
                                  {t("projectCreation.groupStats", {
                                    instances: group.instances.length,
                                    pins: group.pins.length,
                                    params: group.params.length,
                                    runtime: group.runtimeHint,
                                  })}
                                </div>
                                <Show when={props.linkReasons[group.id]}>
                                  <div class="component-sub">
                                    {t("projectCreation.autoReason", {
                                      reason: props.linkReasons[group.id],
                                    })}
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
                                  {t("projectCreation.linkTarget")}
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
                                    )}
                                  >
                                    <option value="local">
                                      {t(
                                        "projectCreation.projectLocalGenerated",
                                      )}
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
                            {t("projectCreation.noComponentGroups")}
                          </div>
                        </Show>
                      </div>
                    </section>

                    <Show when={draft().warnings.length > 0}>
                      <section class="panel warn">
                        <div class="panel-title">
                          {t("projectCreation.parserWarnings")}
                        </div>
                        <div class="list compact">
                          <For each={draft().warnings.slice(0, 20)}>
                            {(warning) => (
                              <div class="warning-item">{warning}</div>
                            )}
                          </For>
                        </div>
                        <Show when={draft().warnings.length > 20}>
                          <div class="muted">
                            {t("projectCreation.parserWarningsTruncated", {
                              count: draft().warnings.length,
                            })}
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
                        {t("projectCreation.createImportedProject")}
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
