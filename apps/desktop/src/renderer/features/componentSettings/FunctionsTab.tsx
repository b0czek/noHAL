import { createMemo, For, Show } from "solid-js";
import { Badge } from "../../components/ui/badge";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import type { ComponentSettingsTabProps } from "./types";

export default function FunctionsTab(props: ComponentSettingsTabProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const componentFunctions = createMemo(() => {
    const currentNode = props.node();
    if (!currentNode) return [];
    return (
      state.project.library.components[currentNode.componentId]?.functions ?? []
    );
  });
  const addfTargetForFunction = (halSuffix: string) => {
    const instanceName = props.node()?.instanceName ?? "";
    if (!instanceName) {
      return halSuffix ? `{instance}.${halSuffix}` : "{instance}";
    }
    return halSuffix ? `${instanceName}.${halSuffix}` : instanceName;
  };

  return (
    <section class="grid gap-3">
      <div class="text-sm font-semibold tracking-tight">
        {t("componentDialog.functions")}
      </div>
      <Show
        when={componentFunctions().length > 0}
        fallback={
          <div class="text-sm text-muted-foreground">
            {t("componentDialog.noFunctions")}
          </div>
        }
      >
        <div class="grid gap-2">
          <For each={componentFunctions()}>
            {(fn) => (
              <div
                class="grid gap-2 rounded-xl bg-black/20 p-3 text-sm"
                title={fn.doc ?? ""}
              >
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{fn.floatMode}</Badge>
                  <span class="mono">
                    {fn.declaredName === "_"
                      ? t("componentDialog.functionDefault")
                      : fn.halSuffix}
                  </span>
                </div>
                <div class="text-xs text-muted-foreground">
                  {t("componentDialog.functionAddf")}
                </div>
                <div class="mono text-sm">
                  {addfTargetForFunction(fn.halSuffix)}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}
