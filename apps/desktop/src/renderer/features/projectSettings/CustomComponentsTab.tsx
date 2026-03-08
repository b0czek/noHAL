import { isComponentShownInCustomComponents } from "@nohal/core/src/componentVisibility";
import type { HalValueType } from "@nohal/core/src/types";
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import StringSelect from "../../components/form/StringSelect";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

const halValueTypes: HalValueType[] = [
  "bit",
  "float",
  "s32",
  "u32",
  "s64",
  "u64",
  "port",
];

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

  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
  const runtimeOptions = [
    { value: "rt", label: t("customComponents.runtimeRt") },
    { value: "userspace", label: t("customComponents.runtimeUserspace") },
    { value: "unknown", label: t("customComponents.runtimeUnknown") },
  ];
  const pinDirectionOptions = [
    { value: "in", label: t("componentDialog.pinFilter.in") },
    { value: "out", label: t("componentDialog.pinFilter.out") },
    { value: "io", label: t("componentDialog.pinFilter.io") },
  ];
  const halValueTypeOptions = halValueTypes.map((valueType) => ({
    value: valueType,
    label: valueType,
  }));
  const paramDirectionOptions = [
    { value: "r", label: t("customComponents.paramDirectionRead") },
    { value: "rw", label: t("customComponents.paramDirectionReadWrite") },
  ];

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
            <section class="grid h-full min-h-0 auto-rows-max content-start gap-4 overflow-auto pr-1">
              <div class="grid gap-3 rounded-2xl p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                <div class="flex items-start justify-between gap-3 lg:col-span-2">
                  <div class="grid gap-1">
                    <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {t("customComponents.editorTitle")}
                    </div>
                    <div class="mono text-sm text-muted-foreground">
                      {component().halComponentName}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={
                      (instanceCountByComponentId()[component().id] ?? 0) > 0
                    }
                    aria-label={t("customComponents.removeComponent")}
                    title={
                      (instanceCountByComponentId()[component().id] ?? 0) > 0
                        ? t("customComponents.cannotRemoveInUse", {
                            count:
                              instanceCountByComponentId()[component().id] ?? 0,
                          })
                        : t("customComponents.removeComponent")
                    }
                    onClick={() =>
                      actions.removeCustomComponent(component().id)
                    }
                  >
                    <HiOutlineTrash size={16} aria-hidden="true" />
                  </Button>
                </div>

                <div class="grid gap-2">
                  <span class={fieldLabelClass}>
                    {t("customComponents.componentName")}
                  </span>
                  <Input
                    type="text"
                    class="mono"
                    value={component().halComponentName}
                    onChange={(evt) =>
                      actions.updateCustomComponentHalComponentName(
                        component().id,
                        evt.currentTarget.value,
                      )
                    }
                  />
                </div>
                <div class="grid gap-2">
                  <span class={fieldLabelClass}>
                    {t("customComponents.runtime")}
                  </span>
                  <StringSelect
                    value={component().runtime?.kind ?? "unknown"}
                    options={runtimeOptions}
                    onChange={(value) =>
                      actions.updateCustomComponentRuntimeKind(
                        component().id,
                        value as "rt" | "userspace" | "unknown",
                      )
                    }
                  />
                </div>

                <div class="grid gap-2 lg:col-span-2">
                  <span class={fieldLabelClass}>
                    {t("customComponents.loadString")}
                  </span>
                  <Textarea
                    class="mono min-h-[80px]"
                    rows={2}
                    value={component().loadCommand ?? ""}
                    placeholder={t("customComponents.loadStringPlaceholder")}
                    onChange={(evt) =>
                      actions.updateCustomComponentLoadCommand(
                        component().id,
                        evt.currentTarget.value,
                      )
                    }
                  />
                </div>
              </div>

              <div class="grid gap-4 rounded-2xl p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("customComponents.pinsTitle")}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={t("customComponents.addPin")}
                    aria-label={t("customComponents.addPin")}
                    onClick={() =>
                      actions.addCustomComponentPin(component().id)
                    }
                  >
                    <HiOutlinePlus size={16} aria-hidden="true" />
                  </Button>
                </div>
                <Show
                  when={component().pins.length > 0}
                  fallback={
                    <div class="text-sm text-muted-foreground">
                      {t("customComponents.noPins")}
                    </div>
                  }
                >
                  <div class="hidden grid-cols-[minmax(0,1fr)_140px_140px_auto] gap-3 px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground lg:grid">
                    <span>{t("common.name")}</span>
                    <span>{t("common.direction")}</span>
                    <span>{t("common.type")}</span>
                    <span />
                  </div>
                  <div class="grid gap-3">
                    <For each={component().pins}>
                      {(pin) => (
                        <div class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto] lg:items-center">
                          <div class="grid gap-2">
                            <span class={`${fieldLabelClass} lg:hidden`}>
                              {t("common.name")}
                            </span>
                            <Input
                              type="text"
                              class="mono"
                              value={pin.name}
                              onChange={(evt) =>
                                actions.updateCustomComponentPinName(
                                  component().id,
                                  pin.key,
                                  evt.currentTarget.value,
                                )
                              }
                            />
                          </div>
                          <div class="grid gap-2">
                            <span class={`${fieldLabelClass} lg:hidden`}>
                              {t("common.direction")}
                            </span>
                            <StringSelect
                              value={pin.direction}
                              options={pinDirectionOptions}
                              onChange={(value) =>
                                actions.updateCustomComponentPinDirection(
                                  component().id,
                                  pin.key,
                                  value as "in" | "out" | "io",
                                )
                              }
                            />
                          </div>
                          <div class="grid gap-2">
                            <span class={`${fieldLabelClass} lg:hidden`}>
                              {t("common.type")}
                            </span>
                            <StringSelect
                              value={pin.type}
                              options={halValueTypeOptions}
                              onChange={(value) =>
                                actions.updateCustomComponentPinType(
                                  component().id,
                                  pin.key,
                                  value as HalValueType,
                                )
                              }
                            />
                          </div>
                          <div class="flex justify-end lg:self-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={t("common.remove")}
                              aria-label={t("common.remove")}
                              onClick={() =>
                                actions.removeCustomComponentPin(
                                  component().id,
                                  pin.key,
                                )
                              }
                            >
                              <HiOutlineTrash size={16} aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              <div class="grid gap-4 rounded-2xl p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("customComponents.paramsTitle")}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={t("customComponents.addParam")}
                    aria-label={t("customComponents.addParam")}
                    onClick={() =>
                      actions.addCustomComponentParam(component().id)
                    }
                  >
                    <HiOutlinePlus size={16} aria-hidden="true" />
                  </Button>
                </div>
                <Show
                  when={component().params.length > 0}
                  fallback={
                    <div class="text-sm text-muted-foreground">
                      {t("customComponents.noParams")}
                    </div>
                  }
                >
                  <div class="hidden grid-cols-[minmax(0,1fr)_140px_180px_minmax(0,1fr)_auto] gap-3 px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground xl:grid">
                    <span>{t("common.name")}</span>
                    <span>{t("common.type")}</span>
                    <span>{t("customComponents.paramDirection")}</span>
                    <span>{t("customComponents.paramDefaultValue")}</span>
                    <span />
                  </div>
                  <div class="grid gap-3">
                    <For each={component().params}>
                      {(param) => (
                        <div class="grid gap-3 rounded-xl bg-black/20 p-3 xl:grid-cols-[minmax(0,1fr)_140px_180px_minmax(0,1fr)_auto] xl:items-end">
                          <div class="grid gap-2">
                            <span class={`${fieldLabelClass} xl:hidden`}>
                              {t("common.name")}
                            </span>
                            <Input
                              type="text"
                              class="mono"
                              value={param.name}
                              onChange={(evt) =>
                                actions.updateCustomComponentParamName(
                                  component().id,
                                  param.key,
                                  evt.currentTarget.value,
                                )
                              }
                            />
                          </div>
                          <div class="grid gap-2">
                            <span class={`${fieldLabelClass} xl:hidden`}>
                              {t("common.type")}
                            </span>
                            <StringSelect
                              value={param.type}
                              options={halValueTypeOptions}
                              onChange={(value) =>
                                actions.updateCustomComponentParamType(
                                  component().id,
                                  param.key,
                                  value as HalValueType,
                                )
                              }
                            />
                          </div>
                          <div class="grid gap-2">
                            <span class={`${fieldLabelClass} xl:hidden`}>
                              {t("customComponents.paramDirection")}
                            </span>
                            <StringSelect
                              value={param.direction}
                              options={paramDirectionOptions}
                              onChange={(value) =>
                                actions.updateCustomComponentParamDirection(
                                  component().id,
                                  param.key,
                                  value as "r" | "rw",
                                )
                              }
                            />
                          </div>
                          <div class="grid gap-2">
                            <span class={`${fieldLabelClass} xl:hidden`}>
                              {t("customComponents.paramDefaultValue")}
                            </span>
                            <Input
                              type="text"
                              class="mono"
                              value={param.defaultValue ?? ""}
                              placeholder={t("customComponents.optionalValue")}
                              onChange={(evt) =>
                                actions.updateCustomComponentParamDefaultValue(
                                  component().id,
                                  param.key,
                                  evt.currentTarget.value,
                                )
                              }
                            />
                          </div>
                          <div class="flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title={t("common.remove")}
                              aria-label={t("common.remove")}
                              onClick={() =>
                                actions.removeCustomComponentParam(
                                  component().id,
                                  param.key,
                                )
                              }
                            >
                              <HiOutlineTrash size={16} aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </section>
          )}
        </Show>
      </div>
    </div>
  );
}
