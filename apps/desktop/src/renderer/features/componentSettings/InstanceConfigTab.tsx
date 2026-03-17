import type { ComponentInstanceConfigFieldDefinition } from "@nohal/core/src/types";
import { createMemo, Index, Show } from "solid-js";
import { Input } from "../../components/ui/input";
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from "../../components/ui/switch";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import type { ComponentSettingsTabProps } from "./types";

export default function InstanceConfigTab(props: ComponentSettingsTabProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const instanceConfigFields = createMemo(() => {
    const currentNode = props.node();
    if (!currentNode) return [];
    return (
      state.project.library.components[currentNode.componentId]?.runtime
        ?.instanceConfig?.fields ?? []
    );
  });
  const defaultInstanceConfigValue = (
    field: ComponentInstanceConfigFieldDefinition,
  ): string =>
    field.defaultValue === undefined ? "" : `${field.defaultValue ?? ""}`;
  const instanceConfigValue = (
    field: ComponentInstanceConfigFieldDefinition,
  ): string =>
    props.node()?.instanceConfigValues?.[field.key] ??
    defaultInstanceConfigValue(field);
  const instanceConfigInputType = (
    field: ComponentInstanceConfigFieldDefinition,
  ) => {
    if (field.type === "integer" || field.type === "number") return "number";
    return "text";
  };
  const instanceConfigInputStep = (
    field: ComponentInstanceConfigFieldDefinition,
  ) => {
    if (field.type === "integer") return "1";
    if (field.type === "number") return "any";
    return undefined;
  };
  const updateInstanceConfigValue = (fieldKey: string, value: string) => {
    const currentNode = props.node();
    if (!currentNode) return;
    actions.updateNodeInstanceConfigValue(currentNode.id, fieldKey, value);
  };

  return (
    <section class="grid gap-3">
      <div class="text-sm font-semibold tracking-tight">
        {t("componentDialog.instanceConfig")}
      </div>
      <Show
        when={instanceConfigFields().length > 0}
        fallback={
          <div class="text-sm text-muted-foreground">
            {t("componentDialog.noInstanceConfig")}
          </div>
        }
      >
        <div class="grid gap-3">
          <Index each={instanceConfigFields()}>
            {(field) => (
              <div
                class="grid gap-2 rounded-xl bg-black/20 p-3"
                title={field().doc ?? ""}
              >
                <span class="mono text-sm">{field().key}</span>
                <Show
                  when={field().type === "boolean"}
                  fallback={
                    <Input
                      type={instanceConfigInputType(field())}
                      step={instanceConfigInputStep(field())}
                      min={
                        field().min !== undefined ? `${field().min}` : undefined
                      }
                      max={
                        field().max !== undefined ? `${field().max}` : undefined
                      }
                      value={instanceConfigValue(field())}
                      onInput={(evt) =>
                        updateInstanceConfigValue(
                          field().key,
                          evt.currentTarget.value,
                        )
                      }
                      placeholder={defaultInstanceConfigValue(field())}
                    />
                  }
                >
                  <Switch
                    checked={instanceConfigValue(field()) === "true"}
                    onChange={(checked) =>
                      updateInstanceConfigValue(
                        field().key,
                        checked ? "true" : "false",
                      )
                    }
                    class="flex items-center justify-between gap-3"
                  >
                    <SwitchLabel class="text-sm">Enabled</SwitchLabel>
                    <SwitchControl>
                      <SwitchThumb />
                    </SwitchControl>
                  </Switch>
                </Show>
              </div>
            )}
          </Index>
        </div>
      </Show>
    </section>
  );
}
