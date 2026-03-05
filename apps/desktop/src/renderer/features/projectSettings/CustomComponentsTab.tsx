import type { HalValueType } from "@nohal/core/src/types";
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
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
          !state.componentStore.components[component.id],
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
          state.componentStore.components[component.id]
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
    <div class="custom-components-tab">
      <div class="custom-components-header">
        <div>
          <Show
            when={selectedComponent()}
            fallback={
              <>
                <div class="panel-title">{t("customComponents.title")}</div>
                <div class="muted">{t("customComponents.help")}</div>
              </>
            }
          >
            {(component) => (
              <div class="custom-components-header-main">
                <button
                  type="button"
                  class="btn subtle icon-btn"
                  title={t("common.back")}
                  aria-label={t("common.back")}
                  onClick={() => setSelectedComponentId(null)}
                >
                  <HiOutlineArrowLeft size={16} aria-hidden="true" />
                </button>
                <div>
                  <div class="panel-title">
                    {t("customComponents.editorTitle")}
                  </div>
                  <div class="muted mono">{component().halComponentName}</div>
                </div>
              </div>
            )}
          </Show>
        </div>
        <Show when={!selectedComponent()}>
          <button
            type="button"
            class="btn subtle icon-btn"
            title={t("customComponents.addComponent")}
            aria-label={t("customComponents.addComponent")}
            onClick={() => {
              const createdId = actions.addCustomComponent();
              setSelectedComponentId(createdId);
            }}
          >
            <HiOutlinePlus size={16} aria-hidden="true" />
          </button>
        </Show>
      </div>

      <div class="custom-components-content">
        <Show
          when={selectedComponent()}
          fallback={
            <section class="custom-components-catalog custom-components-catalog-view">
              <div class="sub-title">{t("customComponents.catalogTitle")}</div>
              <Show
                when={customComponents().length > 0}
                fallback={
                  <div class="muted">{t("customComponents.empty")}</div>
                }
              >
                <div class="custom-components-catalog-list">
                  <For each={customComponents()}>
                    {(component) => (
                      <button
                        type="button"
                        class="component-row custom-component-catalog-item"
                        onClick={() => setSelectedComponentId(component.id)}
                      >
                        <div class="custom-component-main">
                          <div class="component-name mono">
                            {component.halComponentName}
                          </div>
                          <div class="component-sub">
                            {t("customComponents.stats", {
                              pins: component.pins.length,
                              params: component.params.length,
                              instances:
                                instanceCountByComponentId()[component.id] ?? 0,
                            })}
                          </div>
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
            <section class="custom-components-editor custom-components-editor-view">
              <div class="custom-components-editor-header">
                <div class="sub-title">{t("customComponents.editorTitle")}</div>
                <button
                  type="button"
                  class="btn subtle icon-btn"
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
                  onClick={() => actions.removeCustomComponent(component().id)}
                >
                  <HiOutlineTrash size={16} aria-hidden="true" />
                </button>
              </div>

              <div class="project-settings-form-list custom-component-core-fields">
                <label>
                  <span class="threads-field-label">
                    {t("customComponents.componentName")}
                  </span>
                  <input
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
                </label>
                <label>
                  <span class="threads-field-label">
                    {t("customComponents.runtime")}
                  </span>
                  <select
                    value={component().runtime?.kind ?? "unknown"}
                    onChange={(evt) =>
                      actions.updateCustomComponentRuntimeKind(
                        component().id,
                        evt.currentTarget.value as
                          | "rt"
                          | "userspace"
                          | "unknown",
                      )
                    }
                  >
                    <option value="rt">
                      {t("customComponents.runtimeRt")}
                    </option>
                    <option value="userspace">
                      {t("customComponents.runtimeUserspace")}
                    </option>
                    <option value="unknown">
                      {t("customComponents.runtimeUnknown")}
                    </option>
                  </select>
                </label>
              </div>

              <label class="threads-field custom-component-load-field">
                <span class="threads-field-label">
                  {t("customComponents.loadString")}
                </span>
                <textarea
                  class="mono custom-component-load-input"
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
              </label>

              <div class="custom-component-pins">
                <div class="custom-component-section-header">
                  <div class="sub-title">{t("customComponents.pinsTitle")}</div>
                  <button
                    type="button"
                    class="btn subtle icon-btn"
                    title={t("customComponents.addPin")}
                    aria-label={t("customComponents.addPin")}
                    onClick={() =>
                      actions.addCustomComponentPin(component().id)
                    }
                  >
                    <HiOutlinePlus size={16} aria-hidden="true" />
                  </button>
                </div>
                <Show
                  when={component().pins.length > 0}
                  fallback={
                    <div class="muted">{t("customComponents.noPins")}</div>
                  }
                >
                  <div class="custom-component-pin-list-head">
                    <span>{t("common.name")}</span>
                    <span>{t("common.direction")}</span>
                    <span>{t("common.type")}</span>
                    <span />
                  </div>
                  <div class="custom-component-pin-list">
                    <For each={component().pins}>
                      {(pin) => (
                        <div class="custom-component-pin-row custom-component-pin-row-dense">
                          <input
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
                          <select
                            value={pin.direction}
                            onChange={(evt) =>
                              actions.updateCustomComponentPinDirection(
                                component().id,
                                pin.key,
                                evt.currentTarget.value as "in" | "out" | "io",
                              )
                            }
                          >
                            <option value="in">
                              {t("componentDialog.pinFilter.in")}
                            </option>
                            <option value="out">
                              {t("componentDialog.pinFilter.out")}
                            </option>
                            <option value="io">
                              {t("componentDialog.pinFilter.io")}
                            </option>
                          </select>
                          <select
                            value={pin.type}
                            onChange={(evt) =>
                              actions.updateCustomComponentPinType(
                                component().id,
                                pin.key,
                                evt.currentTarget.value as HalValueType,
                              )
                            }
                          >
                            <For each={halValueTypes}>
                              {(valueType) => (
                                <option value={valueType}>{valueType}</option>
                              )}
                            </For>
                          </select>
                          <div class="custom-component-row-actions">
                            <button
                              type="button"
                              class="btn subtle icon-btn"
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
                            </button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>

              <div class="custom-component-pins">
                <div class="custom-component-section-header">
                  <div class="sub-title">
                    {t("customComponents.paramsTitle")}
                  </div>
                  <button
                    type="button"
                    class="btn subtle icon-btn"
                    title={t("customComponents.addParam")}
                    aria-label={t("customComponents.addParam")}
                    onClick={() =>
                      actions.addCustomComponentParam(component().id)
                    }
                  >
                    <HiOutlinePlus size={16} aria-hidden="true" />
                  </button>
                </div>
                <Show
                  when={component().params.length > 0}
                  fallback={
                    <div class="muted">{t("customComponents.noParams")}</div>
                  }
                >
                  <div class="custom-component-pin-list">
                    <For each={component().params}>
                      {(param) => (
                        <div class="custom-component-pin-row">
                          <label class="threads-field">
                            <span class="threads-field-label">
                              {t("common.name")}
                            </span>
                            <input
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
                          </label>
                          <label class="threads-field">
                            <span class="threads-field-label">
                              {t("common.type")}
                            </span>
                            <select
                              value={param.type}
                              onChange={(evt) =>
                                actions.updateCustomComponentParamType(
                                  component().id,
                                  param.key,
                                  evt.currentTarget.value as HalValueType,
                                )
                              }
                            >
                              <For each={halValueTypes}>
                                {(valueType) => (
                                  <option value={valueType}>{valueType}</option>
                                )}
                              </For>
                            </select>
                          </label>
                          <label class="threads-field">
                            <span class="threads-field-label">
                              {t("customComponents.paramDirection")}
                            </span>
                            <select
                              value={param.direction}
                              onChange={(evt) =>
                                actions.updateCustomComponentParamDirection(
                                  component().id,
                                  param.key,
                                  evt.currentTarget.value as "r" | "rw",
                                )
                              }
                            >
                              <option value="r">
                                {t("customComponents.paramDirectionRead")}
                              </option>
                              <option value="rw">
                                {t("customComponents.paramDirectionReadWrite")}
                              </option>
                            </select>
                          </label>
                          <label class="threads-field">
                            <span class="threads-field-label">
                              {t("customComponents.paramDefaultValue")}
                            </span>
                            <input
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
                          </label>
                          <div class="custom-component-row-actions">
                            <button
                              type="button"
                              class="btn subtle icon-btn"
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
                            </button>
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
