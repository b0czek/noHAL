import { getNodeTitle } from "@nohal/core/src/graph";
import { createMemo, createSignal, Show } from "solid-js";
import type { OverlayDialogProps } from "../../app/types";
import SettingsDialogShell from "../../components/settings/SettingsDialogShell";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import FunctionsTab from "./FunctionsTab";
import InstanceConfigTab from "./InstanceConfigTab";
import InstanceTab from "./InstanceTab";
import ParametersTab from "./ParametersTab";
import PinsTab from "./PinsTab";
import type { ComponentSettingsTab } from "./types";

interface ComponentSettingsProps extends OverlayDialogProps {
  nodeId: string;
}

export default function ComponentSettings(props: ComponentSettingsProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const [tab, setTab] = createSignal<ComponentSettingsTab>("instance");

  const node = createMemo(() => {
    const currentSheet = state.project.sheets[state.activeSheetId];
    const currentNode = currentSheet?.nodes.find(
      (candidate) => candidate.id === props.nodeId,
    );
    return currentNode?.kind === "component" ? currentNode : null;
  });
  const nodeTitle = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return "";
    return getNodeTitle(state.project, currentNode);
  });

  return (
    <Show when={node()}>
      <SettingsDialogShell
        title={t("componentDialog.title")}
        description={nodeTitle()}
        descriptionClass="mono"
        dialogClass="h-[min(780px,calc(100vh-36px))] w-[min(920px,calc(100vw-36px))]"
        headerClass="border-b border-white/8 pb-4"
        value={tab()}
        onChange={(value) => setTab(value as ComponentSettingsTab)}
        onClose={props.onClose}
        tabs={[
          {
            value: "instance",
            label: t("componentDialog.instance"),
            content: <InstanceTab node={node} />,
          },
          {
            value: "functions",
            label: t("componentDialog.functions"),
            content: <FunctionsTab node={node} />,
          },
          {
            value: "instance-config",
            label: t("componentDialog.instanceConfig"),
            content: <InstanceConfigTab node={node} />,
          },
          {
            value: "parameters",
            label: t("componentDialog.parameters"),
            content: <ParametersTab node={node} />,
          },
          {
            value: "pins",
            label: t("componentDialog.pins"),
            content: <PinsTab node={node} />,
          },
        ]}
      />
    </Show>
  );
}
