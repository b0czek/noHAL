import { createSignal, Show } from "solid-js";
import type { OverlayDialogProps } from "../../app/types";
import SettingsDialogShell from "../../components/settings/SettingsDialogShell";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import AddfQueueTab from "./AddfQueueTab";
import InstanceTab from "./InstanceTab";
import { SheetSettingsProvider } from "./SheetSettingsContext";
import ThreadOutputsTab from "./ThreadOutputsTab";

type SheetSettingsTab = "instance" | "thread-outputs" | "addf-queue";

interface SheetSettingsDialogProps extends OverlayDialogProps {
  sheetId: string;
}

export default function SheetSettingsDialog(props: SheetSettingsDialogProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const [tab, setTab] = createSignal<SheetSettingsTab>("instance");
  const sheet = () => state.project.sheets[props.sheetId];

  return (
    <Show when={sheet()}>
      {(currentSheet) => (
        <SheetSettingsProvider sheetId={props.sheetId}>
          <SettingsDialogShell
            title={t("sheetSettings.title")}
            description={currentSheet().name}
            value={tab()}
            onChange={(value) => setTab(value as SheetSettingsTab)}
            onClose={props.onClose}
            dialogClass="h-[min(780px,calc(100vh-36px))] w-[min(1040px,calc(100vw-36px))]"
            headerClass="border-b border-white/8 pb-4"
            descriptionClass="mono"
            tabs={[
              {
                value: "instance",
                label: t("sheetSettings.tabInstance"),
                content: <InstanceTab />,
              },
              {
                value: "thread-outputs",
                label: t("sheetSettings.tabThreadOutputs"),
                content: <ThreadOutputsTab />,
              },
              {
                value: "addf-queue",
                label: t("sheetSettings.tabAddfQueue"),
                content: <AddfQueueTab />,
              },
            ]}
          />
        </SheetSettingsProvider>
      )}
    </Show>
  );
}
