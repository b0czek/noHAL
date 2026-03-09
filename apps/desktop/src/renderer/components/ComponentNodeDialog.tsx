import { getNodeTitle } from "@nohal/core/src/graph";
import { createMemo, createSignal, Show } from "solid-js";
import type { OverlayDialogProps } from "../app/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import ComponentNodeFunctionsTab from "./componentNodeDialog/FunctionsTab";
import ComponentNodeInstanceConfigTab from "./componentNodeDialog/InstanceConfigTab";
import ComponentNodeInstanceTab from "./componentNodeDialog/InstanceTab";
import ComponentNodeParametersTab from "./componentNodeDialog/ParametersTab";
import ComponentNodePinsTab from "./componentNodeDialog/PinsTab";
import type { ComponentNodeTab } from "./componentNodeDialog/types";
import SettingsDialogShell from "./settings/SettingsDialogShell";

interface ComponentNodeDialogProps extends OverlayDialogProps {
  nodeId: string;
}

export default function ComponentNodeDialog(props: ComponentNodeDialogProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const [tab, setTab] = createSignal<ComponentNodeTab>("instance");

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
        onChange={(value) => setTab(value as ComponentNodeTab)}
        onClose={props.onClose}
        tabs={[
          {
            value: "instance",
            label: t("componentDialog.instance"),
            content: <ComponentNodeInstanceTab node={node} />,
          },
          {
            value: "functions",
            label: t("componentDialog.functions"),
            content: <ComponentNodeFunctionsTab node={node} />,
          },
          {
            value: "instance-config",
            label: t("componentDialog.instanceConfig"),
            content: <ComponentNodeInstanceConfigTab node={node} />,
          },
          {
            value: "parameters",
            label: t("componentDialog.parameters"),
            content: <ComponentNodeParametersTab node={node} />,
          },
          {
            value: "pins",
            label: t("componentDialog.pins"),
            content: <ComponentNodePinsTab node={node} />,
          },
        ]}
      />
    </Show>
  );
}
