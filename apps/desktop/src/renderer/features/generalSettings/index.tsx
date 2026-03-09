import type { LinuxCncVersion } from "@nohal/core/src/linuxcncVersion";
import { createSignal } from "solid-js";
import type { OverlayDialogProps } from "../../app/types";
import SettingsDialogShell from "../../components/settings/SettingsDialogShell";
import { useI18n } from "../../i18n";
import ComponentStoreTab from "./ComponentStoreTab";
import InterfaceTab from "./InterfaceTab";
import type { GeneralSettingsTab } from "./types";

interface GeneralSettingsDialogProps extends OverlayDialogProps {
  initialTab?: GeneralSettingsTab;
  linuxcncVersion?: LinuxCncVersion;
}

export default function GeneralSettingsDialog(
  props: GeneralSettingsDialogProps,
) {
  const { t } = useI18n();
  const [tab, setTab] = createSignal<GeneralSettingsTab>(
    props.initialTab ?? "interface",
  );

  return (
    <SettingsDialogShell
      title={t("generalSettings.title")}
      description={t("generalSettings.description")}
      value={tab()}
      onChange={(value) => setTab(value as GeneralSettingsTab)}
      onClose={props.onClose}
      tabs={[
        {
          value: "interface",
          label: t("generalSettings.tabInterface"),
          content: <InterfaceTab />,
        },
        {
          value: "component-store",
          label: t("generalSettings.tabComponentStore"),
          content: (
            <ComponentStoreTab linuxcncVersion={props.linuxcncVersion} />
          ),
        },
      ]}
    />
  );
}
