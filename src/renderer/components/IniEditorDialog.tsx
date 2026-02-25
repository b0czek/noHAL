import { For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

export default function IniEditorDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();

  const machineConfig = () => state.project.machineConfig;

  return (
    <Show when={editorUi.isIniEditorOpen()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={() => editorUi.closeIniEditor()}
        >
          <div
            class="modal ini-editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("iniEditor.ariaLabel")}
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">{t("iniEditor.title")}</div>
                <div class="modal-sub">{t("iniEditor.subtitle")}</div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={editorUi.closeIniEditor}
              >
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body ini-editor-body">
              <Show
                when={machineConfig()}
                fallback={
                  <section class="panel">
                    <div class="panel-title">
                      {t("iniEditor.noConfigTitle")}
                    </div>
                    <div class="muted">{t("iniEditor.noConfigHelp")}</div>
                  </section>
                }
              >
                {(cfg) => (
                  <>
                    <section class="panel">
                      <div class="panel-title">
                        {t("iniEditor.summaryTitle")}
                      </div>
                      <div class="list compact">
                        <div class="list-row">
                          <span class="muted">{t("common.file")}</span>
                          <span class="mono ini-editor-path">
                            {cfg().ini.sourcePath ?? t("common.unspecified")}
                          </span>
                        </div>
                        <div class="list-row">
                          <span class="muted">{t("iniEditor.sections")}</span>
                          <span>{cfg().ini.sections.length}</span>
                        </div>
                        <div class="list-row">
                          <span class="muted">{t("iniEditor.halSources")}</span>
                          <span>
                            {
                              cfg().halSources.filter(
                                (source) => source.status === "loaded",
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                      <div class="muted">{t("iniEditor.substitutionHint")}</div>
                    </section>

                    <section class="panel ini-editor-sections-panel">
                      <div class="panel-title">
                        {t("iniEditor.valuesTitle")}
                      </div>
                      <div class="ini-editor-sections">
                        <For each={cfg().ini.sections}>
                          {(section, sectionIndex) => (
                            <div class="ini-editor-section">
                              <div class="ini-editor-section-title mono">
                                [{section.name}]
                              </div>
                              <div class="ini-editor-rows">
                                <For each={section.entries}>
                                  {(entry, entryIndex) => (
                                    <label class="ini-editor-row">
                                      <span class="mono ini-editor-key">
                                        {entry.key}
                                      </span>
                                      <input
                                        type="text"
                                        value={entry.value}
                                        onChange={(evt) =>
                                          actions.updateMachineIniValue(
                                            sectionIndex(),
                                            entryIndex(),
                                            evt.currentTarget.value,
                                          )
                                        }
                                      />
                                    </label>
                                  )}
                                </For>
                                <Show when={section.entries.length === 0}>
                                  <div class="muted">
                                    {t("iniEditor.emptySection")}
                                  </div>
                                </Show>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </section>
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
