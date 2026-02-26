import {
  HiOutlineCheck,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

export default function IniEditorDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const [isEditMode, setIsEditMode] = createSignal(false);

  const machineConfig = () => state.project.machineConfig;
  const closeIniEditor = () => {
    setIsEditMode(false);
    editorUi.closeIniEditor();
  };
  const toggleEditMode = () => setIsEditMode((enabled) => !enabled);

  const confirmRemoveSection = (sectionName: string, entryCount: number) =>
    window.confirm(
      entryCount > 0
        ? t("iniEditor.confirmRemoveSectionWithFields", {
            name: sectionName,
            count: entryCount,
          })
        : t("iniEditor.confirmRemoveSection", { name: sectionName }),
    );

  const confirmRemoveField = (sectionName: string, key: string) =>
    window.confirm(t("iniEditor.confirmRemoveField", { sectionName, key }));

  return (
    <Show when={editorUi.isIniEditorOpen()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={closeIniEditor}
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
              <button type="button" class="btn subtle" onClick={closeIniEditor}>
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
                    <button
                      type="button"
                      class="btn"
                      onClick={() => actions.ensureMachineConfig()}
                    >
                      {t("iniEditor.createEmptyConfig")}
                    </button>
                  </section>
                }
              >
                {(cfg) => (
                  <>
                    <section class="panel ini-editor-sections-panel">
                      <div class="ini-editor-panel-header">
                        <div class="panel-title">
                          {t("iniEditor.valuesTitle")}
                        </div>
                        <div class="ini-editor-actions">
                          <button
                            type="button"
                            class="btn subtle ini-editor-mode-btn"
                            onClick={toggleEditMode}
                            title={
                              isEditMode()
                                ? t("iniEditor.exitEditMode")
                                : t("iniEditor.enterEditMode")
                            }
                            aria-label={
                              isEditMode()
                                ? t("iniEditor.exitEditMode")
                                : t("iniEditor.enterEditMode")
                            }
                          >
                            <Show
                              when={isEditMode()}
                              fallback={
                                <HiOutlinePencilSquare
                                  size={16}
                                  aria-hidden="true"
                                />
                              }
                            >
                              <HiOutlineCheck size={16} aria-hidden="true" />
                            </Show>
                            {isEditMode()
                              ? t("iniEditor.exitEditMode")
                              : t("iniEditor.enterEditMode")}
                          </button>
                          <Show when={isEditMode()}>
                            <button
                              type="button"
                              class="btn subtle icon-btn"
                              onClick={() => actions.addMachineIniSection()}
                              title={t("iniEditor.addSection")}
                              aria-label={t("iniEditor.addSection")}
                            >
                              <HiOutlinePlus size={16} aria-hidden="true" />
                            </button>
                          </Show>
                        </div>
                      </div>
                      <div class="ini-editor-sections">
                        <Show when={cfg().ini.sections.length === 0}>
                          <div class="muted">
                            {t("iniEditor.emptyDocument")}
                          </div>
                        </Show>
                        <For each={cfg().ini.sections}>
                          {(section, sectionIndex) => (
                            <div class="ini-editor-section">
                              <div class="ini-editor-section-header">
                                <Show
                                  when={isEditMode()}
                                  fallback={
                                    <div class="ini-editor-section-title mono">
                                      [{section.name}]
                                    </div>
                                  }
                                >
                                  <label class="ini-editor-section-title">
                                    <span class="mono">[</span>
                                    <input
                                      type="text"
                                      class="mono"
                                      value={section.name}
                                      onChange={(evt) =>
                                        actions.updateMachineIniSectionName(
                                          sectionIndex(),
                                          evt.currentTarget.value,
                                        )
                                      }
                                    />
                                    <span class="mono">]</span>
                                  </label>
                                </Show>
                                <Show when={isEditMode()}>
                                  <div class="ini-editor-actions">
                                    <button
                                      type="button"
                                      class="btn subtle icon-btn"
                                      onClick={() =>
                                        actions.addMachineIniField(
                                          sectionIndex(),
                                        )
                                      }
                                      title={t("iniEditor.addField")}
                                      aria-label={t("iniEditor.addField")}
                                    >
                                      <HiOutlinePlus
                                        size={16}
                                        aria-hidden="true"
                                      />
                                    </button>
                                    <button
                                      type="button"
                                      class="btn subtle icon-btn"
                                      onClick={() => {
                                        if (
                                          !confirmRemoveSection(
                                            section.name,
                                            section.entries.length,
                                          )
                                        ) {
                                          return;
                                        }
                                        actions.removeMachineIniSection(
                                          sectionIndex(),
                                        );
                                      }}
                                      title={t("iniEditor.removeSection")}
                                      aria-label={t("iniEditor.removeSection")}
                                    >
                                      <HiOutlineTrash
                                        size={16}
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </div>
                                </Show>
                              </div>
                              <div class="ini-editor-rows">
                                <For each={section.entries}>
                                  {(entry, entryIndex) => (
                                    <Show
                                      when={isEditMode()}
                                      fallback={
                                        <div class="ini-editor-row ini-editor-row-view">
                                          <span class="mono ini-editor-key">
                                            {entry.key}
                                          </span>
                                          <div class="ini-editor-value-static">
                                            {entry.value}
                                          </div>
                                        </div>
                                      }
                                    >
                                      <div class="ini-editor-row">
                                        <input
                                          type="text"
                                          class="mono ini-editor-key"
                                          value={entry.key}
                                          onChange={(evt) =>
                                            actions.updateMachineIniKey(
                                              sectionIndex(),
                                              entryIndex(),
                                              evt.currentTarget.value,
                                            )
                                          }
                                        />
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
                                        <button
                                          type="button"
                                          class="btn subtle icon-btn"
                                          onClick={() => {
                                            if (
                                              !confirmRemoveField(
                                                section.name,
                                                entry.key,
                                              )
                                            ) {
                                              return;
                                            }
                                            actions.removeMachineIniField(
                                              sectionIndex(),
                                              entryIndex(),
                                            );
                                          }}
                                          title={t("iniEditor.removeField")}
                                          aria-label={t(
                                            "iniEditor.removeField",
                                          )}
                                        >
                                          <HiOutlineTrash
                                            size={16}
                                            aria-hidden="true"
                                          />
                                        </button>
                                      </div>
                                    </Show>
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
