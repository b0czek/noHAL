import { createMemo, Index, Show } from "solid-js";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import { cloneProject } from "../../state/store/helpers";
import HalValueInput from "./HalValueInput";
import { buildIniReferenceSections } from "./iniReference";
import type { ComponentSettingsTabProps } from "./types";

export default function ParametersTab(props: ComponentSettingsTabProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const projectSnapshot = createMemo(() => cloneProject(state.project));
  const iniReferenceSections = createMemo(() =>
    buildIniReferenceSections(projectSnapshot()),
  );
  const componentParams = createMemo(() => {
    const currentNode = props.node();
    if (!currentNode) return [];
    return (
      state.project.library.components[currentNode.componentId]?.params ?? []
    );
  });

  return (
    <section class="grid gap-3">
      <div class="text-sm font-semibold tracking-tight">
        {t("componentDialog.parameters")}
      </div>
      <Show
        when={componentParams().length > 0}
        fallback={
          <div class="text-sm text-muted-foreground">
            {t("componentDialog.noParameters")}
          </div>
        }
      >
        <div class="grid gap-2">
          <Index each={componentParams()}>
            {(param) => (
              <div class="grid gap-2 rounded-xl bg-black/20 p-3 sm:grid-cols-[minmax(160px,240px)_minmax(0,1fr)] sm:items-center">
                <span class="mono text-sm text-muted-foreground">
                  {param().name}
                </span>
                <HalValueInput
                  value={props.node()?.paramValues[param().key] ?? ""}
                  iniReferenceSections={iniReferenceSections()}
                  onInput={(value) => {
                    const currentNode = props.node();
                    if (!currentNode) return;
                    actions.updateNodeParam(currentNode.id, param().key, value);
                  }}
                  placeholder={param().defaultValue ?? ""}
                />
              </div>
            )}
          </Index>
        </div>
      </Show>
    </section>
  );
}
