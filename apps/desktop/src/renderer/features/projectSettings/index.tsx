import { createSignal } from "solid-js";
import type { OverlayDialogProps } from "../../app/types";
import SettingsDialogShell from "../../components/settings/SettingsDialogShell";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import CustomComponentsTab from "./CustomComponentsTab";
import IniTab from "./IniTab";
import MotmodTab from "./MotmodTab";
import ThreadsTab from "./ThreadsTab";

type ProjectSettingsTab = "motmod" | "threads" | "custom-components" | "ini";

type ProjectSettingsDialogProps = OverlayDialogProps;

export default function ProjectSettingsDialog(
  props: ProjectSettingsDialogProps,
) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const [tab, setTab] = createSignal<ProjectSettingsTab>("motmod");

  return (
    <SettingsDialogShell
      title={t("projectSettings.title")}
      description={state.project.name}
      value={tab()}
      onChange={(value) => setTab(value as ProjectSettingsTab)}
      onClose={props.onClose}
      tabs={[
        {
          value: "motmod",
          label: t("projectSettings.tabMotmod"),
          content: <MotmodTab />,
        },
        {
          value: "threads",
          label: t("projectSettings.tabThreads"),
          content: <ThreadsTab />,
        },
        {
          value: "custom-components",
          label: t("projectSettings.tabCustomComponents"),
          content: <CustomComponentsTab />,
        },
        {
          value: "ini",
          label: t("projectSettings.tabIniEditor"),
          content: <IniTab />,
        },
      ]}
    />
  );
}
