import { createSignal, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import { useEditorUi } from "../../state/EditorUiProvider";
import CustomComponentsTab from "./CustomComponentsTab";
import IniTab from "./IniTab";
import MotmodTab from "./MotmodTab";
import ThreadsTab from "./ThreadsTab";
import "./projectSettings.css";

type ProjectSettingsTab = "motmod" | "threads" | "custom-components" | "ini";

export default function ProjectSettingsDialog() {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const editorUi = useEditorUi();
  const [tab, setTab] = createSignal<ProjectSettingsTab>("motmod");

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
                <div class="list compact">
                  <button
                    type="button"
                    class={`field-menu-item ${tab() === "motmod" ? "is-active" : ""}`}
                    onClick={() => setTab("motmod")}
                  >
                    {t("projectSettings.tabMotmod")}
                  </button>
                  <button
                    type="button"
                    class={`field-menu-item ${tab() === "threads" ? "is-active" : ""}`}
                    onClick={() => setTab("threads")}
                  >
                    {t("projectSettings.tabThreads")}
                  </button>
                  <button
                    type="button"
                    class={`field-menu-item ${tab() === "custom-components" ? "is-active" : ""}`}
                    onClick={() => setTab("custom-components")}
                  >
                    {t("projectSettings.tabCustomComponents")}
                  </button>
                  <button
                    type="button"
                    class={`field-menu-item ${tab() === "ini" ? "is-active" : ""}`}
                    onClick={() => setTab("ini")}
                  >
                    {t("projectSettings.tabIniEditor")}
                  </button>
                </div>
              </aside>

              <section class="panel project-settings-content">
                <Show when={tab() === "motmod"}>
                  <MotmodTab />
                </Show>
                <Show when={tab() === "threads"}>
                  <ThreadsTab />
                </Show>
                <Show when={tab() === "custom-components"}>
                  <CustomComponentsTab />
                </Show>
                <Show when={tab() === "ini"}>
                  <IniTab />
                </Show>
              </section>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
