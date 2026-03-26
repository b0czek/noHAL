import { getNodePins, isNodePinConnected } from "@nohal/core/src/graph";
import { HiOutlineEye, HiOutlineEyeSlash } from "solid-icons/hi";
import { createMemo, createSignal, For, Index, Show } from "solid-js";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import { cloneProject } from "../../state/store/helpers";
import HalValueInput from "./HalValueInput";
import { buildIniReferenceSections } from "./iniReference";
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
  const projectSnapshot = createMemo(() => cloneProject(state.project));
  const iniReferenceSections = createMemo(() =>
    buildIniReferenceSections(projectSnapshot()),
  );
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
  const pins = createMemo(() => {
    const currentNode = props.node();
    if (!currentNode) return [];
    return getNodePins(state.project, currentNode);
  });
  const hiddenPinKeys = createMemo(
    () => new Set(props.node()?.hiddenPinKeys ?? []),
  );
  const connectedPinKeys = createMemo(() => {
    const currentNode = props.node();
    const sheet = state.project.sheets[state.activeSheetId];
    if (!currentNode || !sheet) return new Set<string>();
    return new Set(
      pins()
        .filter((pin) => isNodePinConnected(sheet, currentNode.id, pin.key))
        .map((pin) => pin.key),
    );
  });
  const visiblePins = createMemo(() => {
    const mode = pinFilter();
    return mode === "all"
      ? pins()
      : pins().filter((pin) => pin.direction === mode);
  });
  const pinIsVisible = (pinKey: string) =>
    !hiddenPinKeys().has(pinKey) || connectedPinKeys().has(pinKey);
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
    <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
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
        <div class="grid min-h-0 content-start gap-2 overflow-auto pr-1">
          <Index each={visiblePins()}>
            {(pin) => (
              <div class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)_auto] lg:items-center">
                <div class="grid min-w-0 gap-2">
                  <span class="mono min-w-0 truncate">{pin().name}</span>
                  <div class="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        pin().direction === "in"
                          ? "outline"
                          : pin().direction === "out"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {pin().direction}
                    </Badge>
                    <Badge variant="outline">{pin().type}</Badge>
                  </div>
                </div>
                <div class="grid gap-2">
                  <span class={`${fieldLabelClass} lg:hidden`}>
                    {t("componentDialog.pinInitialValues")}
                  </span>
                  <HalValueInput
                    class="w-full"
                    value={props.node()?.pinInitialValues?.[pin().key] ?? ""}
                    iniReferenceSections={iniReferenceSections()}
                    onInput={(value) => {
                      const currentNode = props.node();
                      if (!currentNode) return;
                      actions.updateNodePinInitialValue(
                        currentNode.id,
                        pin().key,
                        value,
                      );
                    }}
                    placeholder={t("componentDialog.optionalPlaceholder")}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-9 shrink-0"
                  title={
                    connectedPinKeys().has(pin().key)
                      ? t("componentDialog.pinVisibilityConnectedHint")
                      : t("componentDialog.pinVisibility")
                  }
                  aria-label={t("componentDialog.pinVisibility")}
                  disabled={connectedPinKeys().has(pin().key)}
                  onClick={() => {
                    const currentNode = props.node();
                    if (!currentNode) return;
                    actions.updateNodePinVisibility(
                      currentNode.id,
                      pin().key,
                      !pinIsVisible(pin().key),
                    );
                  }}
                >
                  <Show
                    when={pinIsVisible(pin().key)}
                    fallback={<HiOutlineEyeSlash size={16} />}
                  >
                    <HiOutlineEye size={16} />
                  </Show>
                </Button>
              </div>
            )}
          </Index>
        </div>
      </Show>
    </section>
  );
}
