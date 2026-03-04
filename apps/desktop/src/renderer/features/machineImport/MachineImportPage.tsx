import { listStoreEntriesForLinuxCncVersion } from "@nohal/core/src/componentStoreFilter";
import type { HalImportPlacementHeuristic } from "@nohal/core/src/types";
import {
  HiOutlineFolderOpen,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createMemo, For, Show } from "solid-js";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import "../../components/LandingPage.css";
import "./machineImport.css";
import type { MachineImportController } from "./useMachineImportFlow";

export interface MachineImportPageProps {
  machineImport: MachineImportController;
}

export default function MachineImportPage(props: MachineImportPageProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const machineImport = () => props.machineImport;
  const flow = () => machineImport().machineImportFlow;
  const storeEntries = createMemo(() =>
    listStoreEntriesForLinuxCncVersion(
      state.componentStore,
      machineImport().selectedLinuxCncVersion(),
    ).sort((a, b) =>
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
    return [
      ...exact,
      ...partial,
      ...entries.filter(
        (entry) => !exact.includes(entry) && !partial.includes(entry),
      ),
    ];
  };

  const selectionLabel = (encodedValue: string): string => {
    if (!encodedValue || encodedValue === "local") {
      return t("projectCreation.projectLocalGenerated");
    }
    if (!encodedValue.startsWith("store:")) return encodedValue;
    const componentId = encodedValue.slice("store:".length);
    const entry = state.componentStore.components[componentId];
    if (!entry) return t("projectCreation.storeFallback", { componentId });
    return t("projectCreation.storeEntry", {
      name: entry.parsed.halComponentName,
    });
  };

  const iniKeyCount = createMemo(() =>
    (flow().machineConfigSetup?.ini.sections ?? []).reduce(
      (count, section) => count + section.entries.length,
      0,
    ),
  );

  const pageSubtitle = createMemo(() =>
    flow().step === "machine-files"
      ? t("projectCreation.subtitleMachineFiles")
      : t("projectCreation.subtitleLink"),
  );

  return (
    <div class="landing-shell">
      <div class="landing-backdrop-grid" aria-hidden="true" />
      <main class="landing-main machine-import-main">
        <section class="panel landing-hero machine-import-hero">
          <div class="machine-import-hero-header">
            <div>
              <div class="panel-title">
                {t("projectCreation.importMachineConfig")}
              </div>
              <div class="muted">{pageSubtitle()}</div>
            </div>
            <button
              type="button"
              class="btn subtle"
              onClick={machineImport().closeMachineImportFlow}
              disabled={flow().isBusy}
            >
              {t("common.back")}
            </button>
          </div>
          <div class="machine-import-hero-actions">
            <button
              type="button"
              class="btn"
              onClick={() => void machineImport().pickMachineIniFile()}
              disabled={flow().isBusy}
            >
              {t("projectCreation.pickMachineIniFile")}
            </button>
          </div>
          <Show when={flow().errorMessage}>
            {(message) => <div class="landing-error">{message()}</div>}
          </Show>
        </section>

        <Show
          when={flow().machineConfigSetup}
          fallback={
            <section class="panel">
              <div class="muted">
                {t("projectCreation.importMachineConfigHelp")}
              </div>
            </section>
          }
        >
          {(setup) => (
            <>
              <Show when={flow().step === "machine-files"}>
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
                      <span class="muted">{t("projectCreation.iniKeys")}</span>
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
                        {(warning) => <div class="warning-item">{warning}</div>}
                      </For>
                    </div>
                  </section>
                </Show>

                <section class="panel">
                  <div class="panel-title">
                    {t("projectCreation.selectedHalFilesList")}
                  </div>
                  <Show
                    when={flow().selectedMachineHalFiles.length > 0}
                    fallback={
                      <div class="muted">
                        {t("projectCreation.noSelectedHalFiles")}
                      </div>
                    }
                  >
                    <div class="list machine-hal-file-list">
                      <For each={flow().selectedMachineHalFiles}>
                        {(halFile, index) => (
                          <div class="list-row machine-hal-file-row">
                            <input
                              type="text"
                              class="mono machine-hal-file-input"
                              value={halFile.filePath}
                              onInput={(evt) =>
                                machineImport().updateMachineHalFilePath(
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
                                  aria-checked={halFile.resolveIniSubstitutions}
                                  onClick={() =>
                                    machineImport().updateMachineHalFileResolveIni(
                                      index(),
                                      !halFile.resolveIniSubstitutions,
                                    )
                                  }
                                  disabled={flow().isBusy}
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
                                  void machineImport().pickMachineHalFileForRow(
                                    index(),
                                  )
                                }
                                disabled={flow().isBusy}
                                title={t("projectCreation.browseHalFile")}
                                aria-label={t("projectCreation.browseHalFile")}
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
                                  machineImport().removeMachineHalFilePath(
                                    index(),
                                  )
                                }
                                disabled={flow().isBusy}
                                title={t("projectCreation.removeHalFileRow")}
                                aria-label={t(
                                  "projectCreation.removeHalFileRow",
                                )}
                              >
                                <HiOutlineTrash size={15} aria-hidden="true" />
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
                      onClick={machineImport().addBlankMachineHalFilePath}
                      disabled={flow().isBusy}
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
                    onClick={() => void machineImport().continueToLinkStep()}
                    disabled={flow().isBusy}
                  >
                    {t("projectCreation.continueToComponentLinking")}
                  </button>
                </div>
              </Show>

              <Show when={flow().step === "link" && flow().importDraft}>
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
                            {flow().machineConfigImport?.machineConfig.ini
                              .sourcePath ??
                              draft().sourcePath ??
                              t("common.unspecified")}
                          </span>
                        </div>
                        <Show when={flow().machineConfigImport}>
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
                            value={flow().placementHeuristic}
                            onChange={(evt) =>
                              machineImport().changeHalImportPlacementHeuristic(
                                evt.currentTarget
                                  .value as HalImportPlacementHeuristic,
                              )
                            }
                            disabled={flow().isBusy}
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
                          onClick={machineImport().backToMachineFilesStep}
                          disabled={flow().isBusy}
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
                                <Show when={flow().linkReasons[group.id]}>
                                  <div class="component-sub">
                                    {t("projectCreation.autoReason", {
                                      reason: flow().linkReasons[group.id],
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
                                      flow().linkSelections[group.id] ?? "local"
                                    }
                                    onChange={(evt) =>
                                      machineImport().changeHalImportLinkSelection(
                                        group.id,
                                        evt.currentTarget.value,
                                      )
                                    }
                                    title={selectionLabel(
                                      flow().linkSelections[group.id] ??
                                        "local",
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
                        onClick={() =>
                          void machineImport().createImportedProject()
                        }
                        disabled={flow().isBusy}
                      >
                        {t("projectCreation.createImportedProject")}
                      </button>
                    </div>
                  </>
                )}
              </Show>
            </>
          )}
        </Show>
      </main>
    </div>
  );
}
