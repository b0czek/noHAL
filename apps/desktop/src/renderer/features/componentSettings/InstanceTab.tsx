import {
  fixedExportStageForComponent,
  fixedInstanceNameForComponent,
} from "@nohal/core/componentSystem";
import { createMemo, Show } from "solid-js";
import BufferedInput from "../../components/form/BufferedInput";
import StringSelect from "../../components/form/StringSelect";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import { componentUsesLockedCanonicalInstanceNames } from "../../state/store/helpers";
import type { ComponentSettingsTabProps } from "./types";

export default function InstanceTab(props: ComponentSettingsTabProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const component = createMemo(() => {
    const currentNode = props.node();
    if (!currentNode) return undefined;
    return state.project.library.components[currentNode.componentId];
  });
  const fixedExportStage = createMemo(() =>
    fixedExportStageForComponent(component()),
  );
  const instanceNameLocked = createMemo(
    () =>
      componentUsesLockedCanonicalInstanceNames(component()) ||
      !!fixedInstanceNameForComponent(component()),
  );
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div class="grid gap-4">
      <section class="grid gap-3">
        <div class="text-sm font-semibold tracking-tight">
          {t("componentDialog.instance")}
        </div>
        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("componentDialog.instanceName")}
          </span>
          <BufferedInput
            value={props.node()?.instanceName ?? ""}
            disabled={instanceNameLocked()}
            onCommit={(value) => {
              const currentNode = props.node();
              if (!currentNode) return;
              actions.renameNode(currentNode.id, value);
            }}
          />
        </div>
        <Show when={instanceNameLocked()}>
          <div class="text-sm text-muted-foreground">
            {t("componentDialog.instanceNameLocked")}
          </div>
        </Show>
        <Show when={component()}>
          {(comp) => (
            <>
              <div class="grid gap-2 rounded-xl bg-black/20 p-3 text-sm">
                <div class="flex items-start justify-between gap-3">
                  <span class="text-muted-foreground">
                    {t("componentDialog.halComponent")}
                  </span>
                  <span class="mono">{comp().halComponentName}</span>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <span class="text-muted-foreground">
                    {t("componentDialog.source")}
                  </span>
                  <span>{comp().source}</span>
                </div>
                <div class="flex items-start justify-between gap-3">
                  <span class="text-muted-foreground">
                    {t("componentDialog.runtime")}
                  </span>
                  <span>{comp().runtime?.kind ?? t("common.unknown")}</span>
                </div>
              </div>
              <div class="grid gap-2">
                <span class={fieldLabelClass}>
                  {t("componentDialog.exportStage")}
                </span>
                <StringSelect
                  value={
                    fixedExportStage() ?? props.node()?.exportStage ?? "main"
                  }
                  disabled={!!fixedExportStage()}
                  options={[
                    {
                      value: "main",
                      label: t("componentDialog.exportStageMain"),
                    },
                    {
                      value: "postgui",
                      label: t("componentDialog.exportStagePostgui"),
                    },
                  ]}
                  onChange={(value) => {
                    const currentNode = props.node();
                    if (!currentNode) return;
                    actions.updateNodeExportStage(
                      currentNode.id,
                      value as "main" | "postgui",
                    );
                  }}
                />
              </div>
              <Show when={!!fixedExportStage()}>
                <div class="text-sm text-muted-foreground">
                  {t("componentDialog.exportStageLockedPostgui")}
                </div>
              </Show>
            </>
          )}
        </Show>
      </section>
    </div>
  );
}
