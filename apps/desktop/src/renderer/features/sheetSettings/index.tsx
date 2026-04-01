import type { SheetNode } from "@nohal/core/types";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import type { OverlayDialogProps } from "../../app/types";
import SettingsDialogShell from "../../components/settings/SettingsDialogShell";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import AddfQueueTab from "./AddfQueueTab";
import InstanceTab from "./InstanceTab";
import { SheetSettingsProvider } from "./SheetSettingsContext";
import SheetTab from "./SheetTab";
import ThreadOutputsTab from "./ThreadOutputsTab";

type SheetSettingsTab = "sheet" | "instance" | "thread-outputs" | "addf-queue";

interface SheetSettingsDialogProps extends OverlayDialogProps {
  sheetId: string;
  referenceTarget?: {
    parentSheetId: string;
    nodeId: string;
  };
}

export default function SheetSettingsDialog(props: SheetSettingsDialogProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const hasReferenceTarget = () => {
    const target = props.referenceTarget;
    if (!target) return false;
    const parentSheet = state.project.sheets[target.parentSheetId];
    const node = parentSheet?.nodes.find(
      (entry): entry is SheetNode =>
        entry.kind === "sheet" && entry.id === target.nodeId,
    );
    return node?.sheetId === props.sheetId;
  };
  const [tab, setTab] = createSignal<SheetSettingsTab>(
    hasReferenceTarget() ? "instance" : "sheet",
  );
  const sheet = () => state.project.sheets[props.sheetId];
  const hasInstanceTab = createMemo(() => hasReferenceTarget());

  createEffect(() => {
    if (!hasInstanceTab() && tab() === "instance") {
      setTab("sheet");
    }
  });

  return (
    <Show when={sheet()}>
      {(currentSheet) => (
        <SheetSettingsProvider
          sheetId={props.sheetId}
          referenceTarget={props.referenceTarget}
        >
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
              ...(hasInstanceTab()
                ? [
                    {
                      value: "instance",
                      label: t("sheetSettings.tabInstance"),
                      content: <InstanceTab />,
                    },
                  ]
                : []),
              {
                value: "sheet",
                label: t("sheetSettings.tabSheet"),
                content: <SheetTab />,
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
