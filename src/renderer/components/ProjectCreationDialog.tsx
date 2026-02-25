import {
  HiOutlineFolderOpen,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createMemo, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import type {
  ComponentStore,
  HalImportDraft,
  HalImportPlacementHeuristic,
  MachineConfigHalFileSelection,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
} from "../../shared/types";
import { useI18n } from "../i18n";

type ProjectCreationDialogStep = "choose" | "machine-files" | "link";

export interface ProjectCreationDialogProps {
  open: boolean;
  step: ProjectCreationDialogStep;
  isBusy: boolean;
  componentStore: ComponentStore;
  importDraft: HalImportDraft | null;
  machineConfigImport: MachineConfigImportDraft | null;
  machineConfigSetup: MachineConfigImportSetupDraft | null;
  selectedMachineHalFiles: MachineConfigHalFileSelection[];
  linkSelections: Record<string, string>;
  linkReasons: Record<string, string>;
  placementHeuristic: HalImportPlacementHeuristic;
  errorMessage: string | null;
  onClose: () => void;
  onCreateBlank: () => void;
  onPickMachineIniFile: () => void;
  onAddBlankMachineHalFile: () => void;
  onRemoveMachineHalFile: (index: number) => void;
  onUpdateMachineHalFile: (index: number, value: string) => void;
  onToggleMachineHalFileResolveIni: (index: number, value: boolean) => void;
  onPickMachineHalFileAtRow: (index: number) => void;
  onContinueMachineConfig: () => void;
  onBackToChoice: () => void;
  onBackToMachineConfig: () => void;
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

  const iniKeyCount = createMemo(() =>
    (props.machineConfigSetup?.ini.sections ?? []).reduce(
      (count, section) => count + section.entries.length,
      0,
    ),
  );

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
                    : props.step === "machine-files"
                      ? t("projectCreation.subtitleMachineFiles")
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
                      {t("projectCreation.importMachineConfig")}
                    </div>
                    <div class="muted">
                      {t("projectCreation.importMachineConfigHelp")}
                    </div>
                    <div class="new-project-choice-actions">
                      <button
                        type="button"
                        class="btn"
                        onClick={props.onPickMachineIniFile}
                        disabled={props.isBusy}
                      >
                        {t("projectCreation.pickMachineIniFile")}
                      </button>
                    </div>
                  </section>
                </div>
              </Show>

              <Show
                when={
                  props.step === "machine-files" && props.machineConfigSetup
                }
              >
                {(setup) => (
                  <>
                    <section class="panel">
                      <div class="panel-title">
                        {t("projectCreation.machineConfigIniSource")}
                      </div>
                      <div class="list compact">
                        <div class="list-row">
                          <span class="muted">{t("common.file")}</span>
                          <span class="mono new-project-path">
                            {setup().ini.sourcePath ?? t("common.unspecified")}
                          </span>
                        </div>
                        <div class="list-row">
                          <span class="muted">
                            {t("projectCreation.iniKeys")}
                          </span>
                          <span>{iniKeyCount()}</span>
                        </div>
                      </div>
                    </section>

                    <Show when={setup().warnings.length > 0}>
                      <section class="panel warn">
                        <div class="panel-title">
                          {t("projectCreation.parserWarnings")}
                        </div>
                        <div class="list compact">
                          <For each={setup().warnings.slice(0, 20)}>
                            {(warning) => (
                              <div class="warning-item">{warning}</div>
                            )}
                          </For>
                        </div>
                      </section>
                    </Show>

                    <section class="panel">
                      <div class="panel-title">
                        {t("projectCreation.selectedHalFilesList")}
                      </div>
                      <Show
                        when={props.selectedMachineHalFiles.length > 0}
                        fallback={
                          <div class="muted">
                            {t("projectCreation.noSelectedHalFiles")}
                          </div>
                        }
                      >
                        <div class="list machine-hal-file-list">
                          <For each={props.selectedMachineHalFiles}>
                            {(halFile, index) => (
                              <div class="list-row machine-hal-file-row">
                                <input
                                  type="text"
                                  class="mono machine-hal-file-input"
                                  value={halFile.filePath}
                                  onInput={(evt) =>
                                    props.onUpdateMachineHalFile(
                                      index(),
                                      evt.currentTarget.value,
                                    )
                                  }
                                />
                                <div class="machine-hal-file-actions">
                                  <div class="machine-hal-file-toggle-control">
                                    <span class="machine-hal-file-toggle-label">
                                      {t("projectCreation.resolveIniInHalFile")}
                                    </span>
                                    <button
                                      type="button"
                                      class={`machine-hal-file-switch${
                                        halFile.resolveIniSubstitutions
                                          ? " is-on"
                                          : ""
                                      }`}
                                      role="switch"
                                      aria-checked={
                                        halFile.resolveIniSubstitutions
                                      }
                                      onClick={() =>
                                        props.onToggleMachineHalFileResolveIni(
                                          index(),
                                          !halFile.resolveIniSubstitutions,
                                        )
                                      }
                                      disabled={props.isBusy}
                                      title={t(
                                        "projectCreation.resolveIniInHalFile",
                                      )}
                                      aria-label={t(
                                        "projectCreation.resolveIniInHalFile",
                                      )}
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    class="mini icon-btn"
                                    onClick={() =>
                                      props.onPickMachineHalFileAtRow(index())
                                    }
                                    disabled={props.isBusy}
                                    title={t("projectCreation.browseHalFile")}
                                    aria-label={t(
                                      "projectCreation.browseHalFile",
                                    )}
                                  >
                                    <HiOutlineFolderOpen
                                      size={15}
                                      aria-hidden="true"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    class="mini icon-btn"
                                    onClick={() =>
                                      props.onRemoveMachineHalFile(index())
                                    }
                                    disabled={props.isBusy}
                                    title={t(
                                      "projectCreation.removeHalFileRow",
                                    )}
                                    aria-label={t(
                                      "projectCreation.removeHalFileRow",
                                    )}
                                  >
                                    <HiOutlineTrash
                                      size={15}
                                      aria-hidden="true"
                                    />
                                  </button>
                                </div>
                              </div>
                            )}
                          </For>
                        </div>
                      </Show>
                      <div class="machine-hal-file-list-footer">
                        <button
                          type="button"
                          class="btn"
                          onClick={props.onAddBlankMachineHalFile}
                          disabled={props.isBusy}
                        >
                          <HiOutlinePlus size={16} aria-hidden="true" />
                          {t("projectCreation.addHalFileRow")}
                        </button>
                      </div>
                    </section>

                    <div class="new-project-dialog-footer">
                      <button
                        type="button"
                        class="btn accent"
                        onClick={props.onContinueMachineConfig}
                        disabled={props.isBusy}
                      >
                        {t("projectCreation.continueToComponentLinking")}
                      </button>
                    </div>
                  </>
                )}
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
                            {props.machineConfigImport?.machineConfig.ini
                              .sourcePath ??
                              draft().sourcePath ??
                              t("common.unspecified")}
                          </span>
                        </div>
                        <Show when={props.machineConfigImport}>
                          {(machineImport) => (
                            <div class="list-row">
                              <span class="muted">
                                {t("projectCreation.halFiles")}
                              </span>
                              <span>
                                {
                                  machineImport().machineConfig.halSources.filter(
                                    (source) => source.status === "loaded",
                                  ).length
                                }
                              </span>
                            </div>
                          )}
                        </Show>
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
                          onClick={props.onBackToMachineConfig}
                          disabled={props.isBusy}
                        >
                          {t("common.back")}
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
