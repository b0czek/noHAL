import { useI18n } from "../i18n";

interface StatusBarProps {
  status: string;
  projectPath?: string | null;
  isDirty: boolean;
}

export default function StatusBar(props: StatusBarProps) {
  const { t } = useI18n();
  const currentProjectLabel = () => props.projectPath ?? t("common.unsaved");

  return (
    <footer class="workspace-statusbar">
      <div class="workspace-statusbar-item workspace-statusbar-item-status">
        <span class="workspace-statusbar-label">{t("common.status")}</span>
        <span>{props.status}</span>
      </div>
      <div class="workspace-statusbar-item workspace-statusbar-item-file">
        <span class="workspace-statusbar-label">
          {t("common.project")}
          {props.isDirty ? "*" : ""}
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
