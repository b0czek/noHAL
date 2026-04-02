import { isComponentShownInCustomComponents } from "@nohal/core/componentVisibility";
import { HiOutlineArrowLeft, HiOutlinePlus } from "solid-icons/hi";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { Button } from "../../components/ui/button";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import CustomComponentEditor from "./CustomComponentEditor";

export default function CustomComponentsTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [selectedComponentId, setSelectedComponentId] = createSignal<
    string | null
  >(null);

  const customComponents = createMemo(() =>
    Object.values(state.project.library.components)
      .filter(
        (component) =>
          component.source !== "comp" &&
          !state.componentStore.components[component.id] &&
          isComponentShownInCustomComponents(component),
      )
      .sort((a, b) => a.halComponentName.localeCompare(b.halComponentName)),
  );

  const instanceCountByComponentId = createMemo(() => {
    const counts: Record<string, number> = {};
    for (const sheet of Object.values(state.project.sheets)) {
      for (const node of sheet.nodes) {
        if (node.kind !== "component") continue;
        const component = state.project.library.components[node.componentId];
        if (
          !component ||
          component.source === "comp" ||
          state.componentStore.components[component.id] ||
          !isComponentShownInCustomComponents(component)
        ) {
          continue;
        }
        counts[node.componentId] = (counts[node.componentId] ?? 0) + 1;
      }
    }
    return counts;
  });

  createEffect(() => {
    const currentId = selectedComponentId();
    if (!currentId) return;
    if (customComponents().some((component) => component.id === currentId))
      return;
    setSelectedComponentId(null);
  });

  const selectedComponent = createMemo(() => {
    const id = selectedComponentId();
    if (!id) return undefined;
    return customComponents().find((component) => component.id === id);
  });

  return (
    <div class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <Show
            when={selectedComponent()}
            fallback={
              <div class="grid gap-1">
                <div class="text-lg font-semibold">
                  {t("customComponents.title")}
                </div>
                <div class="text-sm text-muted-foreground">
                  {t("customComponents.help")}
                </div>
              </div>
            }
          >
            {(component) => (
              <div class="flex items-start gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title={t("common.back")}
                  aria-label={t("common.back")}
                  onClick={() => setSelectedComponentId(null)}
                >
                  <HiOutlineArrowLeft size={16} aria-hidden="true" />
                </Button>
                <div class="min-w-0">
                  <div class="text-lg font-semibold">
                    {t("customComponents.editorTitle")}
                  </div>
                  <div class="mono truncate text-sm text-muted-foreground">
                    {component().halComponentName}
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
        <Show when={!selectedComponent()}>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            title={t("customComponents.addComponent")}
            aria-label={t("customComponents.addComponent")}
            onClick={() => {
              const createdId = actions.addCustomComponent();
              setSelectedComponentId(createdId);
            }}
          >
            <HiOutlinePlus size={16} aria-hidden="true" />
          </Button>
        </Show>
      </div>

      <div class="h-full min-h-0 overflow-hidden">
        <Show
          when={selectedComponent()}
          fallback={
            <section class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 rounded-2xl p-4">
              <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t("customComponents.catalogTitle")}
              </div>
              <Show
                when={customComponents().length > 0}
                fallback={
                  <div class="text-sm text-muted-foreground">
                    {t("customComponents.empty")}
                  </div>
                }
              >
                <div class="grid min-h-0 auto-rows-max content-start gap-2 overflow-auto pr-1">
                  <For each={customComponents()}>
                    {(component) => (
                      <button
                        type="button"
                        class="focus-ring grid gap-1 rounded-2xl bg-black/20 px-4 py-3 text-left transition hover:bg-white/[0.08]"
                        onClick={() => setSelectedComponentId(component.id)}
                      >
                        <div class="mono font-medium">
                          {component.halComponentName}
                        </div>
                        <div class="text-sm text-muted-foreground">
                          {t("customComponents.stats", {
                            pins: component.pins.length,
                            params: component.params.length,
                            instances:
                              instanceCountByComponentId()[component.id] ?? 0,
                          })}
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </section>
          }
        >
          {(component) => (
            <CustomComponentEditor
              component={component()}
              onRemoveComponent={() =>
                actions.removeCustomComponent(component().id)
              }
              removeDisabled={
                (instanceCountByComponentId()[component().id] ?? 0) > 0
              }
              removeTitle={
                (instanceCountByComponentId()[component().id] ?? 0) > 0
                  ? t("customComponents.cannotRemoveInUse", {
                      count: instanceCountByComponentId()[component().id] ?? 0,
                    })
                  : t("customComponents.removeComponent")
              }
              onHalComponentNameChange={(value) =>
                actions.updateCustomComponentHalComponentName(
                  component().id,
                  value,
                )
              }
              onRuntimeKindChange={(value) =>
                actions.updateCustomComponentRuntimeKind(component().id, value)
              }
              onLoadCommandChange={(value) =>
                actions.updateCustomComponentLoadCommand(component().id, value)
              }
              onMaxInstancesChange={(value) =>
                actions.updateCustomComponentMaxInstances(component().id, value)
              }
              onAddPin={() => actions.addCustomComponentPin(component().id)}
              onRemovePin={(pinKey) =>
                actions.removeCustomComponentPin(component().id, pinKey)
              }
              onPinNameChange={(pinKey, value) =>
                actions.updateCustomComponentPinName(
                  component().id,
                  pinKey,
                  value,
                )
              }
              onPinTypeChange={(pinKey, value) =>
                actions.updateCustomComponentPinType(
                  component().id,
                  pinKey,
                  value,
                )
              }
              onPinDirectionChange={(pinKey, value) =>
                actions.updateCustomComponentPinDirection(
                  component().id,
                  pinKey,
                  value,
                )
              }
              onAddParam={() => actions.addCustomComponentParam(component().id)}
              onRemoveParam={(paramKey) =>
                actions.removeCustomComponentParam(component().id, paramKey)
              }
              onParamNameChange={(paramKey, value) =>
                actions.updateCustomComponentParamName(
                  component().id,
                  paramKey,
                  value,
                )
              }
              onParamTypeChange={(paramKey, value) =>
                actions.updateCustomComponentParamType(
                  component().id,
                  paramKey,
                  value,
                )
              }
              onParamDirectionChange={(paramKey, value) =>
                actions.updateCustomComponentParamDirection(
                  component().id,
                  paramKey,
                  value,
                )
              }
              onParamDefaultValueChange={(paramKey, value) =>
                actions.updateCustomComponentParamDefaultValue(
                  component().id,
                  paramKey,
                  value,
                )
              }
            />
          )}
        </Show>
      </div>
    </div>
  );
}
