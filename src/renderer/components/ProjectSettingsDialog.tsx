import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { createDefaultMotmodConfig } from "../../shared/project";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

type ProjectSettingsTab = "motmod";

export default function ProjectSettingsDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const [tab, setTab] = createSignal<ProjectSettingsTab>("motmod");

  const motmod = () => state.project.motmod ?? createDefaultMotmodConfig();

  const setMotmodNumber = (
    key:
      | "numJoints"
      | "numDio"
      | "numAio"
      | "numSpindles"
      | "numMiscError"
      | "trajPeriodNs",
    rawValue: string,
  ) => {
    const next = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(next)) return;
    actions.updateMotmodNumericConfig(key, next);
  };

  return (
    <Show when={editorUi.isProjectSettingsOpen()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={editorUi.closeProjectSettings}
        >
          <div
            class="modal project-settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("projectSettings.ariaLabel")}
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">{t("projectSettings.title")}</div>
                <div class="modal-sub">{state.project.name}</div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={editorUi.closeProjectSettings}
              >
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body project-settings-body">
              <aside class="panel project-settings-sidebar">
                <div class="panel-title">{t("projectSettings.tabs")}</div>
                <div class="list compact">
                  <button
                    type="button"
                    class={`field-menu-item ${tab() === "motmod" ? "is-active" : ""}`}
                    onClick={() => setTab("motmod")}
                  >
                    {t("projectSettings.tabMotmod")}
                  </button>
                </div>
              </aside>

              <section class="panel project-settings-content">
                <Show when={tab() === "motmod"}>
                  <div class="panel-title">
                    {t("projectSettings.motmodTitle")}
                  </div>
                  <div class="muted">{t("projectSettings.motmodHelp")}</div>

                  <div class="project-settings-form-list">
                    <label>
                      <span class="threads-field-label">
                        {t("projectSettings.motmod.numJoints")}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={String(motmod().numJoints)}
                        onChange={(evt) =>
                          setMotmodNumber("numJoints", evt.currentTarget.value)
                        }
                      />
                    </label>

                    <label>
                      <span class="threads-field-label">
                        {t("projectSettings.motmod.numDio")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={String(motmod().numDio)}
                        onChange={(evt) =>
                          setMotmodNumber("numDio", evt.currentTarget.value)
                        }
                      />
                    </label>

                    <label>
                      <span class="threads-field-label">
                        {t("projectSettings.motmod.numAio")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={String(motmod().numAio)}
                        onChange={(evt) =>
                          setMotmodNumber("numAio", evt.currentTarget.value)
                        }
                      />
                    </label>

                    <label>
                      <span class="threads-field-label">
                        {t("projectSettings.motmod.trajPeriodNs")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        class="mono"
                        value={String(motmod().trajPeriodNs)}
                        onChange={(evt) =>
                          setMotmodNumber(
                            "trajPeriodNs",
                            evt.currentTarget.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span class="threads-field-label">
                        {t("projectSettings.motmod.numSpindles")}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={String(motmod().numSpindles)}
                        onChange={(evt) =>
                          setMotmodNumber(
                            "numSpindles",
                            evt.currentTarget.value,
                          )
                        }
                      />
                    </label>

                    <label>
                      <span class="threads-field-label">
                        {t("projectSettings.motmod.numMiscError")}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={String(motmod().numMiscError)}
                        onChange={(evt) =>
                          setMotmodNumber(
                            "numMiscError",
                            evt.currentTarget.value,
                          )
                        }
                      />
                    </label>

                    <div class="project-settings-note">
                      <div class="threads-field-label">
                        {t("projectSettings.motmod.threadsDerived")}
                      </div>
                      <div class="muted mono">
                        {t("projectSettings.motmod.threadsDerivedHelp")}
                      </div>
                    </div>
                  </div>
                </Show>
              </section>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
