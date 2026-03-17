import { getNodePins } from "@nohal/core/src/graph";
import { createMemo, createSignal, For, Show } from "solid-js";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import {
  COMPONENT_SETTINGS_PIN_FILTER_MODES,
  type ComponentSettingsPinFilterMode,
  type ComponentSettingsTabProps,
} from "./types";

export default function PinsTab(props: ComponentSettingsTabProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [pinFilter, setPinFilter] =
    createSignal<ComponentSettingsPinFilterMode>("all");
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
  const pins = createMemo(() => {
    const currentNode = props.node();
    if (!currentNode) return [];
    return getNodePins(state.project, currentNode);
  });
  const visiblePins = createMemo(() => {
    const mode = pinFilter();
    return mode === "all"
      ? pins()
      : pins().filter((pin) => pin.direction === mode);
  });
  const pinFilterLabel = (mode: ComponentSettingsPinFilterMode) => {
    switch (mode) {
      case "all":
        return t("componentDialog.pinFilter.all");
      case "in":
        return t("componentDialog.pinFilter.in");
      case "out":
        return t("componentDialog.pinFilter.out");
      case "io":
        return t("componentDialog.pinFilter.io");
    }
  };

  return (
    <section class="grid gap-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="grid gap-1">
          <div class="text-sm font-semibold tracking-tight">
            {t("componentDialog.pins")}
          </div>
          <div class="text-sm text-muted-foreground">
            {t("componentDialog.pinInitialValues")}
          </div>
        </div>
        <div class="inline-flex flex-wrap items-center gap-2 rounded-xl bg-black/20 p-1">
          <For each={COMPONENT_SETTINGS_PIN_FILTER_MODES}>
            {(mode) => (
              <Button
                type="button"
                size="sm"
                variant={pinFilter() === mode ? "default" : "ghost"}
                onClick={() => setPinFilter(mode)}
              >
                {pinFilterLabel(mode)}
              </Button>
            )}
          </For>
        </div>
      </div>
      <Show
        when={pins().length > 0}
        fallback={
          <div class="text-sm text-muted-foreground">
            {t("componentDialog.noPins")}
          </div>
        }
      >
        <div class="grid gap-2">
          <For each={visiblePins()}>
            {(pin) => (
              <div class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[auto_minmax(0,1fr)_auto_minmax(220px,280px)] lg:items-center">
                <Badge
                  variant={
                    pin.direction === "in"
                      ? "outline"
                      : pin.direction === "out"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {pin.direction}
                </Badge>
                <span class="mono min-w-0 truncate">{pin.name}</span>
                <Badge variant="outline">{pin.type}</Badge>
                <div class="grid gap-2">
                  <span class={`${fieldLabelClass} lg:hidden`}>
                    {t("componentDialog.pinInitialValues")}
                  </span>
                  <Input
                    value={props.node()?.pinInitialValues?.[pin.key] ?? ""}
                    onInput={(evt) => {
                      const currentNode = props.node();
                      if (!currentNode) return;
                      actions.updateNodePinInitialValue(
                        currentNode.id,
                        pin.key,
                        evt.currentTarget.value,
                      );
                    }}
                    placeholder={t("componentDialog.optionalPlaceholder")}
                  />
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}
