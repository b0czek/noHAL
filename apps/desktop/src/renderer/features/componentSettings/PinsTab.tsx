import { getNodePins, isNodePinConnected } from "@nohal/core/graph";
import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "solid-icons/hi";
import { createMemo, createSignal, For, Index, Show } from "solid-js";
import {
  createDragReorderController,
  DragReorderHandle,
} from "../../components/reorderable/DragReorder";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
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
  const reorder = createDragReorderController();
  const iniReferenceSections = createMemo(() =>
    buildIniReferenceSections(state.project),
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
  const visiblePinKeys = createMemo(() => visiblePins().map((pin) => pin.key));
  const pinIsVisible = (pinKey: string) =>
    !hiddenPinKeys().has(pinKey) || connectedPinKeys().has(pinKey);
  const rowContainerClass = (pinKey: string) => {
    if (reorder.isDragging(pinKey)) {
      return "border-accent/30 bg-accent/10 opacity-65";
    }
    if (reorder.isDropTarget(`pin:${pinKey}`)) {
      return "border-accent/30 bg-accent/10";
    }
    return "bg-black/20";
  };
  const canMovePin = (pinKey: string, offset: -1 | 1) => {
    const pinIndex = visiblePinKeys().indexOf(pinKey);
    const nextIndex = pinIndex + offset;
    return (
      pinIndex >= 0 && nextIndex >= 0 && nextIndex < visiblePinKeys().length
    );
  };
  const reorderPinRelativeTo = (
    draggedPinKey: string,
    targetPinKey: string,
    position: "before" | "after",
  ) => {
    const currentNode = props.node();
    if (!currentNode) return;
    const nextPinOrder = pins().map((pin) => pin.key);
    const draggedIndex = nextPinOrder.indexOf(draggedPinKey);
    if (draggedIndex < 0 || draggedPinKey === targetPinKey) return;
    const [removedPinKey] = nextPinOrder.splice(draggedIndex, 1);
    if (!removedPinKey) return;
    const targetIndex = nextPinOrder.indexOf(targetPinKey);
    if (targetIndex < 0) return;
    nextPinOrder.splice(
      position === "before" ? targetIndex : targetIndex + 1,
      0,
      removedPinKey,
    );
    actions.updateNodePinOrder(currentNode.id, nextPinOrder);
  };
  const movePinToVisibleEnd = (draggedPinKey: string) => {
    const currentVisiblePinKeys = visiblePinKeys();
    const lastVisiblePinKey = currentVisiblePinKeys.at(-1);
    if (!lastVisiblePinKey || lastVisiblePinKey === draggedPinKey) return;
    reorderPinRelativeTo(draggedPinKey, lastVisiblePinKey, "after");
  };
  const movePin = (pinKey: string, offset: -1 | 1) => {
    const currentVisiblePinKeys = visiblePinKeys();
    const visibleIndex = currentVisiblePinKeys.indexOf(pinKey);
    const targetPinKey = currentVisiblePinKeys[visibleIndex + offset];
    if (visibleIndex < 0 || !targetPinKey) return;
    reorderPinRelativeTo(pinKey, targetPinKey, offset < 0 ? "before" : "after");
  };
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
  const pinDirectionVariant = (direction: "in" | "out" | "io") => {
    switch (direction) {
      case "in":
        return "outline";
      case "out":
        return "warning";
      case "io":
        return "secondary";
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
            {t("componentDialog.pinSettingsDescription")}
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
              <div
                class={`grid gap-3 rounded-xl border border-transparent p-3 transition lg:grid-cols-[auto_minmax(0,1fr)_minmax(220px,280px)_auto_auto] lg:items-center ${rowContainerClass(pin().key)}`}
                role="presentation"
                onPointerEnter={() => {
                  const draggedPin = reorder.draggingItemId();
                  if (!draggedPin || draggedPin === pin().key) return;
                  reorder.setDropTargetId(`pin:${pin().key}`);
                  reorderPinRelativeTo(draggedPin, pin().key, "before");
                }}
                onPointerUp={() => {
                  if (!reorder.draggingItemId()) return;
                  reorder.finishDrag();
                }}
              >
                <DragReorderHandle
                  controller={reorder}
                  itemId={pin().key}
                  label={t("componentDialog.dragToReorder")}
                  dropTargetId={`pin:${pin().key}`}
                />
                <div class="grid min-w-0 gap-2">
                  <span class="mono min-w-0 truncate">{pin().name}</span>
                  <div class="flex flex-wrap items-center gap-2">
                    <Badge variant={pinDirectionVariant(pin().direction)}>
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
                    onCommit={(value) => {
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
                <div class="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="size-9 shrink-0"
                    disabled={!canMovePin(pin().key, -1)}
                    title={t("common.up")}
                    aria-label={t("common.up")}
                    onClick={() => movePin(pin().key, -1)}
                  >
                    <HiOutlineChevronUp size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="size-9 shrink-0"
                    disabled={!canMovePin(pin().key, 1)}
                    title={t("common.down")}
                    aria-label={t("common.down")}
                    onClick={() => movePin(pin().key, 1)}
                  >
                    <HiOutlineChevronDown size={16} aria-hidden="true" />
                  </Button>
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
          <Show when={visiblePins().length > 0}>
            <div
              class={`min-h-[18px] rounded-lg transition ${
                reorder.isDropTarget("pins:end")
                  ? "border border-dashed border-accent/30 bg-accent/10"
                  : "bg-white/[0.03]"
              }`}
              onPointerEnter={() => {
                const draggedPin = reorder.draggingItemId();
                if (!draggedPin) return;
                reorder.setDropTargetId("pins:end");
                movePinToVisibleEnd(draggedPin);
              }}
              onPointerUp={() => {
                if (!reorder.draggingItemId()) return;
                reorder.finishDrag();
              }}
            />
          </Show>
        </div>
      </Show>
    </section>
  );
}
