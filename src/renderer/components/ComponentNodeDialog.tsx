import { createMemo, createSignal, For, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { getNodePins, getNodeTitle } from "../../shared/graph";
import type { ComponentNode, NoHALProject } from "../../shared/types";

interface ComponentNodeDialogProps {
  open: boolean;
  project: NoHALProject;
  node: ComponentNode | null;
  onRename: (name: string) => void;
  onUpdateParam: (key: string, value: string) => void;
  onClose: () => void;
}

export default function ComponentNodeDialog(props: ComponentNodeDialogProps) {
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
            aria-label="Component Settings"
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">Component Settings</div>
                <div class="modal-sub mono">
                  {props.node ? getNodeTitle(props.project, props.node) : ""}
                </div>
              </div>
              <button type="button" class="btn subtle" onClick={props.onClose}>
                Close
              </button>
            </div>

            <div class="modal-body">
              <section class="panel">
                <div class="panel-title">Instance</div>
                <label>
                  Instance Name
                  <input
                    value={props.node?.instanceName ?? ""}
                    onInput={(evt) => props.onRename(evt.currentTarget.value)}
                  />
                </label>
                <Show when={component()}>
                  {(comp) => (
                    <div class="list compact">
                      <div class="list-row">
                        <span class="muted">HAL Component</span>
                        <span class="mono">{comp().halComponentName}</span>
                      </div>
                      <div class="list-row">
                        <span class="muted">Source</span>
                        <span>{comp().source}</span>
                      </div>
                      <div class="list-row">
                        <span class="muted">Runtime</span>
                        <span>{comp().runtime?.kind ?? "unknown"}</span>
                      </div>
                    </div>
                  )}
                </Show>
              </section>

              <section class="panel">
                <div class="panel-title">Parameters</div>
                <Show
                  when={componentParams().length > 0}
                  fallback={<div class="muted">No parameters.</div>}
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
                <div class="panel-title">Pins</div>
                <div class="toolbar-group pin-filter-row">
                  <For each={pinFilterModes}>
                    {(mode) => (
                      <button
                        type="button"
                        class={`mini ${pinFilter() === mode ? "is-active-filter" : ""}`}
                        onClick={() => setPinFilter(mode)}
                      >
                        {mode}
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
