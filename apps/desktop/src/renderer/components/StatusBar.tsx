import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";

export default function StatusBar() {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const currentProjectLabel = () => state.projectPath ?? t("common.unsaved");

  return (
    <footer class="workspace-statusbar">
      <div class="workspace-statusbar-item workspace-statusbar-item-status">
        <span class="workspace-statusbar-label">{t("common.status")}</span>
        <span>{state.status}</span>
      </div>
      <div class="workspace-statusbar-item workspace-statusbar-item-file">
        <span class="workspace-statusbar-label">
          {t("common.project")}
          {state.isDirty ? "*" : ""}
        </span>
        <span
          class="mono workspace-statusbar-value"
          title={currentProjectLabel()}
        >
          {currentProjectLabel()}
        </span>
      </div>
    </footer>
  );
}
