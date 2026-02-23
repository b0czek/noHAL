import { createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { getNodePins, getNodeTitle } from "../../shared/graph";
import type { ComponentNode, NoHALProject } from "../../shared/types";
import { useI18n } from "../i18n";

interface ComponentNodeDialogProps {
  open: boolean;
  project: NoHALProject;
  node: ComponentNode | null;
  onRename: (name: string) => void;
  onUpdateParam: (key: string, value: string) => void;
  onUpdatePinInitialValue: (key: string, value: string) => void;
  onClose: () => void;
}

export default function ComponentNodeDialog(props: ComponentNodeDialogProps) {
  const { t } = useI18n();
  const component = createMemo(() =>
    props.node
      ? props.project.library.components[props.node.componentId]
      : undefined,
  );
  const pins = createMemo(() =>
    props.node ? getNodePins(props.project, props.node) : [],
  );
  const componentParams = createMemo(() => component()?.params ?? []);
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

  return (
    <Show when={props.open && props.node}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={() => props.onClose()}
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
                <div class="modal-sub mono">
                  {props.node ? getNodeTitle(props.project, props.node) : ""}
                </div>
              </div>
              <button type="button" class="btn subtle" onClick={props.onClose}>
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body">
              <section class="panel">
                <div class="panel-title">{t("componentDialog.instance")}</div>
                <label>
                  {t("componentDialog.instanceName")}
                  <input
                    value={props.node?.instanceName ?? ""}
                    onInput={(evt) => props.onRename(evt.currentTarget.value)}
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
                            value={props.node?.paramValues[param.key] ?? ""}
                            onInput={(evt) =>
                              props.onUpdateParam(
                                param.key,
                                evt.currentTarget.value,
                              )
                            }
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
                            value={
                              props.node?.pinInitialValues?.[pin.key] ?? ""
                            }
                            onInput={(evt) =>
                              props.onUpdatePinInitialValue(
                                pin.key,
                                evt.currentTarget.value,
                              )
                            }
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
