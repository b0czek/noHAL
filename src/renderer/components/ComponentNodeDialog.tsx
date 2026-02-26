import { createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { getNodePins, getNodeTitle } from "../../shared/graph";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

export default function ComponentNodeDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const node = () => editorUi.editingComponentNode();
  const component = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return undefined;
    return state.project.library.components[currentNode.componentId];
  });
  const pins = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return [];
    return getNodePins(state.project, currentNode);
  });
  const nodeTitle = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return "";
    return getNodeTitle(state.project, currentNode);
  });
  const componentParams = createMemo(() => component()?.params ?? []);
  const componentFunctions = createMemo(() => component()?.functions ?? []);
  const pinFilterModes = ["all", "in", "out", "io"] as const;
  const [pinFilter, setPinFilter] =
    createSignal<(typeof pinFilterModes)[number]>("all");
  const visiblePins = createMemo(() => {
    const mode = pinFilter();
    return mode === "all" ? pins() : pins().filter((p) => p.direction === mode);
  });
  const pinFilterLabel = (mode: (typeof pinFilterModes)[number]) => {
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
  const addfTargetForFunction = (halSuffix: string) => {
    const instanceName = node()?.instanceName ?? "";
    if (!instanceName)
      return halSuffix ? `{instance}.${halSuffix}` : "{instance}";
    return halSuffix ? `${instanceName}.${halSuffix}` : instanceName;
  };

  return (
    <Show when={node()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={() => editorUi.closeComponentEditor()}
        >
          <div
            class="modal component-settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("componentDialog.ariaLabel")}
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">{t("componentDialog.title")}</div>
                <div class="modal-sub mono">{nodeTitle()}</div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={editorUi.closeComponentEditor}
              >
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body">
              <section class="panel">
                <div class="panel-title">{t("componentDialog.instance")}</div>
                <label>
                  {t("componentDialog.instanceName")}
                  <input
                    value={node()?.instanceName ?? ""}
                    onInput={(evt) => {
                      const currentNode = node();
                      if (!currentNode) return;
                      actions.renameNode(
                        currentNode.id,
                        evt.currentTarget.value,
                      );
                    }}
                  />
                </label>
                <Show when={component()}>
                  {(comp) => (
                    <div class="list compact">
                      <div class="list-row">
                        <span class="muted">
                          {t("componentDialog.halComponent")}
                        </span>
                        <span class="mono">{comp().halComponentName}</span>
                      </div>
                      <div class="list-row">
                        <span class="muted">{t("componentDialog.source")}</span>
                        <span>{comp().source}</span>
                      </div>
                      <div class="list-row">
                        <span class="muted">
                          {t("componentDialog.runtime")}
                        </span>
                        <span>
                          {comp().runtime?.kind ?? t("common.unknown")}
                        </span>
                      </div>
                    </div>
                  )}
                </Show>
              </section>

              <section class="panel">
                <div class="panel-title">{t("componentDialog.functions")}</div>
                <Show
                  when={componentFunctions().length > 0}
                  fallback={
                    <div class="muted">{t("componentDialog.noFunctions")}</div>
                  }
                >
                  <div class="list compact">
                    <For each={componentFunctions()}>
                      {(fn) => (
                        <div class="list-row" title={fn.doc ?? ""}>
                          <span class="chip type">{fn.floatMode}</span>
                          <span class="mono">
                            {fn.declaredName === "_"
                              ? t("componentDialog.functionDefault")
                              : fn.halSuffix}
                          </span>
                          <span class="muted">
                            {t("componentDialog.functionAddf")}
                          </span>
                          <span class="mono">
                            {addfTargetForFunction(fn.halSuffix)}
                          </span>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </section>

              <section class="panel">
                <div class="panel-title">{t("componentDialog.parameters")}</div>
                <Show
                  when={componentParams().length > 0}
                  fallback={
                    <div class="muted">{t("componentDialog.noParameters")}</div>
                  }
                >
                  <div class="inspector-group">
                    <For each={componentParams()}>
                      {(param) => (
                        <label>
                          <span class="mono">{param.name}</span>
                          <input
                            value={node()?.paramValues[param.key] ?? ""}
                            onInput={(evt) => {
                              const currentNode = node();
                              if (!currentNode) return;
                              actions.updateNodeParam(
                                currentNode.id,
                                param.key,
                                evt.currentTarget.value,
                              );
                            }}
                            placeholder={param.defaultValue ?? ""}
                          />
                        </label>
                      )}
                    </For>
                  </div>
                </Show>
              </section>

              <section class="panel">
                <div class="panel-title">
                  {t("componentDialog.pinInitialValues")}
                </div>
                <Show
                  when={pins().length > 0}
                  fallback={
                    <div class="muted">{t("componentDialog.noPins")}</div>
                  }
                >
                  <div class="inspector-group">
                    <For each={pins()}>
                      {(pin) => (
                        <label>
                          <span class="mono">{pin.name}</span>
                          <input
                            value={node()?.pinInitialValues?.[pin.key] ?? ""}
                            onInput={(evt) => {
                              const currentNode = node();
                              if (!currentNode) return;
                              actions.updateNodePinInitialValue(
                                currentNode.id,
                                pin.key,
                                evt.currentTarget.value,
                              );
                            }}
                            placeholder={t(
                              "componentDialog.optionalPlaceholder",
                            )}
                          />
                        </label>
                      )}
                    </For>
                  </div>
                </Show>
              </section>

              <section class="panel">
                <div class="panel-title">{t("componentDialog.pins")}</div>
                <div class="toolbar-group pin-filter-row">
                  <For each={pinFilterModes}>
                    {(mode) => (
                      <button
                        type="button"
                        class={`mini ${pinFilter() === mode ? "is-active-filter" : ""}`}
                        onClick={() => setPinFilter(mode)}
                      >
                        {pinFilterLabel(mode)}
                      </button>
                    )}
                  </For>
                </div>
                <div class="list compact">
                  <For each={visiblePins()}>
                    {(pin) => (
                      <div class="list-row">
                        <span class={`chip dir-${pin.direction}`}>
                          {pin.direction}
                        </span>
                        <span class="mono">{pin.name}</span>
                        <span class="chip type">{pin.type}</span>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
