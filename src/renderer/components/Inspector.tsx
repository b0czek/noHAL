import { For, Show } from "solid-js";
import { getNodePins, getNodeTitle, getSheet } from "../../shared/graph";
import type {
  HalValueType,
  LabelScope,
  NoHALProject,
  SheetNodeInstance,
} from "../../shared/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

type SelectMenuOption = {
  value: string;
  label: string;
};

const PORT_TYPE_OPTIONS: ReadonlyArray<SelectMenuOption> = [
  { value: "bit", label: "bit" },
  { value: "float", label: "float" },
  { value: "s32", label: "s32" },
  { value: "u32", label: "u32" },
  { value: "s64", label: "s64" },
  { value: "u64", label: "u64" },
  { value: "port", label: "port" },
];

export default function Inspector() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const currentSheet = () => getSheet(state.project, state.activeSheetId);
  const labelScopeOptions: ReadonlyArray<SelectMenuOption> = [
    { value: "local", label: "local" },
    { value: "hierarchical", label: "hierarchical" },
    { value: "global", label: "global" },
  ];
  const portDirectionOptions: ReadonlyArray<SelectMenuOption> = [
    { value: "in", label: "in" },
    { value: "out", label: "out" },
    { value: "io", label: "io" },
  ];
  const selectedNode = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "node") return undefined;
      return currentSheet().nodes.find((n) => n.id === selection.id);
    })();
  const selectedLabel = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "label") return undefined;
      return currentSheet().labels.find((l) => l.id === selection.id);
    })();
  const selectedPort = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "sheet-port") return undefined;
      return currentSheet().ports.find((p) => p.id === selection.id);
    })();
  const selectedComment = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "comment") return undefined;
      return currentSheet().comments.find((c) => c.id === selection.id);
    })();
  const selectedConnection = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "wire-connection") return undefined;
      return currentSheet().directConnections.find(
        (c) => c.id === selection.id,
      );
    })();

  return (
    <aside class="inspector">
      <section class="panel">
        <div class="panel-title">{t("inspector.selection")}</div>
        <Show when={!state.selection}>
          <div class="muted">{t("inspector.nothingSelected")}</div>
        </Show>

        <Show when={selectedNode()}>
          {(node) => (
            <NodeInspector
              project={state.project}
              node={node()}
              onOpenComponentEditor={editorUi.openSelectedComponentEditor}
              onRename={(name) => actions.renameNode(node().id, name)}
              onEnterSelectedSheet={actions.enterSelectedSheet}
              onRefreshComponentInStore={(componentId) =>
                void actions.refreshComponentInStore(componentId)
              }
            />
          )}
        </Show>

        <Show when={selectedLabel()}>
          {(label) => (
            <div class="inspector-group">
              <label>
                {t("common.name")}
                <input
                  value={label().name}
                  onInput={(e) =>
                    actions.updateLabel(label().id, {
                      name: e.currentTarget.value,
                    })
                  }
                />
              </label>
              <div class="field-label-group">
                {t("common.scope")}
                <SelectMenu
                  value={label().scope}
                  options={labelScopeOptions}
                  onChange={(value) =>
                    actions.updateLabel(label().id, {
                      scope: value as LabelScope,
                    })
                  }
                />
              </div>
              <RotationEditor
                value={label().rotation ?? 0}
                onChange={(rotation) =>
                  actions.updateLabel(label().id, { rotation })
                }
              />
            </div>
          )}
        </Show>

        <Show when={selectedComment()}>
          {(comment) => (
            <div class="inspector-group">
              <label>
                {t("common.text")}
                <textarea
                  rows={4}
                  value={comment().text}
                  onInput={(e) =>
                    actions.updateComment(comment().id, {
                      text: e.currentTarget.value,
                    })
                  }
                />
              </label>
              <RotationEditor
                value={comment().rotation ?? 0}
                onChange={(rotation) =>
                  actions.updateComment(comment().id, { rotation })
                }
              />
            </div>
          )}
        </Show>

        <Show when={selectedPort()}>
          {(port) => (
            <div class="inspector-group">
              <label>
                {t("common.name")}
                <input
                  value={port().name}
                  onInput={(e) =>
                    actions.updateSheetPort(port().id, {
                      name: e.currentTarget.value,
                    })
                  }
                />
              </label>
              <div class="field-label-group">
                {t("common.direction")}
                <SelectMenu
                  value={port().direction}
                  options={portDirectionOptions}
                  onChange={(value) =>
                    actions.updateSheetPort(port().id, {
                      direction: value as "in" | "out" | "io",
                    })
                  }
                />
              </div>
              <div class="field-label-group">
                {t("common.type")}
                <SelectMenu
                  value={port().type}
                  options={PORT_TYPE_OPTIONS}
                  onChange={(value) =>
                    actions.updateSheetPort(port().id, {
                      type: value as HalValueType,
                    })
                  }
                />
              </div>
              <RotationEditor
                value={port().rotation ?? 0}
                onChange={(rotation) =>
                  actions.updateSheetPort(port().id, { rotation })
                }
              />
            </div>
          )}
        </Show>

        <Show when={selectedConnection()}>
          {(conn) => (
            <div class="inspector-group">
              <label>
                {t("common.signalName")}
                <input
                  value={conn().signalName ?? ""}
                  placeholder={t("componentDialog.optionalPlaceholder")}
                  onInput={(e) =>
                    actions.updateDirectConnectionSignalName(
                      conn().id,
                      e.currentTarget.value,
                    )
                  }
                />
              </label>
              <div class="field-label-group">
                {t("inspector.directConnections")}
                <div class="mono">{conn().id}</div>
              </div>
            </div>
          )}
        </Show>

        <Show when={state.selection}>
          <Show when={state.selection?.kind === "multi"}>
            <div class="muted">{t("inspector.multipleSelected")}</div>
          </Show>
          <button
            type="button"
            class="btn danger"
            onClick={actions.removeSelection}
          >
            {t("inspector.deleteSelection")}
          </button>
        </Show>
      </section>

      <section class="panel">
        <div class="panel-title">{t("inspector.currentSheetNets")}</div>
        <div class="sub-title">{t("inspector.directConnections")}</div>
        <div class="list compact">
          <For each={currentSheet().directConnections}>
            {(conn) => (
              <div
                class={`list-row ${
                  state.selection?.kind === "wire-connection" &&
                  state.selection.id === conn.id
                    ? "is-active"
                    : ""
                }`}
              >
                <button
                  type="button"
                  class="linkish"
                  onClick={() => actions.removeDirectConnection(conn.id)}
                >
                  {t("common.remove")}
                </button>
                <span class="mono">{conn.signalName?.trim() || conn.id}</span>
              </div>
            )}
          </For>
        </div>

        <div class="sub-title">{t("inspector.labelAnchors")}</div>
        <div class="list compact">
          <For each={currentSheet().labelAnchors}>
            {(anchor) => (
              <div class="list-row">
                <button
                  type="button"
                  class="linkish"
                  onClick={() => actions.removeLabelAnchor(anchor.id)}
                >
                  {t("common.remove")}
                </button>
                <span class="mono">{anchor.id}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      <Show when={state.exportWarnings.length > 0}>
        <section class="panel warn">
          <div class="panel-title">{t("inspector.warnings")}</div>
          <div class="list compact">
            <For each={state.exportWarnings}>
              {(warning) => <div class="warning-item">{warning}</div>}
            </For>
          </div>
        </section>
      </Show>
    </aside>
  );
}

function RotationEditor(props: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div class="field-label-group">
      {t("common.rotation")}
      <div style={{ display: "flex", gap: "6px", "align-items": "center" }}>
        <button
          type="button"
          class="btn"
          onClick={() => props.onChange((props.value || 0) - 90)}
          title={t("inspector.rotateNeg90")}
        >
          -90
        </button>
        <input
          type="number"
          step="15"
          value={Number.isFinite(props.value) ? props.value : 0}
          onInput={(e) => {
            const next = Number.parseFloat(e.currentTarget.value);
            if (Number.isFinite(next)) props.onChange(next);
          }}
        />
        <button
          type="button"
          class="btn"
          onClick={() => props.onChange((props.value || 0) + 90)}
          title={t("inspector.rotatePos90")}
        >
          +90
        </button>
        <button
          type="button"
          class="btn"
          onClick={() => props.onChange(0)}
          title={t("inspector.resetRotation")}
        >
          0
        </button>
      </div>
    </div>
  );
}

function SelectMenu(props: {
  value: string;
  options: ReadonlyArray<SelectMenuOption>;
  onChange: (value: string) => void;
}) {
  const currentLabel = () =>
    props.options.find((option) => option.value === props.value)?.label ??
    props.value;

  return (
    <details class="field-menu">
      <summary class="field-menu-trigger">{currentLabel()}</summary>
      <div class="field-menu-popover">
        <For each={props.options}>
          {(option) => (
            <button
              type="button"
              class={`field-menu-item ${option.value === props.value ? "is-active" : ""}`}
              onClick={(evt) => {
                props.onChange(option.value);
                const host = evt.currentTarget.closest("details");
                if (host instanceof HTMLDetailsElement) host.open = false;
              }}
            >
              {option.label}
            </button>
          )}
        </For>
      </div>
    </details>
  );
}

function NodeInspector(props: {
  project: NoHALProject;
  node: SheetNodeInstance;
  onOpenComponentEditor: () => void;
  onRename: (name: string) => void;
  onEnterSelectedSheet: () => void;
  onRefreshComponentInStore: (componentId: string) => void;
}) {
  const { t } = useI18n();
  const pins = () => getNodePins(props.project, props.node);
  const component = () =>
    props.node.kind === "component"
      ? props.project.library.components[props.node.componentId]
      : undefined;
  const componentParamCount = () => component()?.params.length ?? 0;
  const pinSetpValue = (pinKey: string) => {
    if (props.node.kind !== "component") return undefined;
    const raw = props.node.pinInitialValues?.[pinKey];
    if (typeof raw !== "string") return undefined;
    const value = raw.trim();
    return value.length > 0 ? value : undefined;
  };

  return (
    <div class="inspector-group">
      <div class="mono">{getNodeTitle(props.project, props.node)}</div>
      <Show
        when={props.node.kind === "component"}
        fallback={
          <label>
            {t("componentDialog.instanceName")}
            <input
              value={props.node.instanceName}
              onInput={(e) => props.onRename(e.currentTarget.value)}
            />
          </label>
        }
      >
        <button type="button" class="btn" onClick={props.onOpenComponentEditor}>
          {t("inspector.openComponentSettings")}
        </button>
      </Show>
      <Show
        when={
          props.node.kind === "component" &&
          component()?.source === "comp" &&
          component()
        }
      >
        <button
          type="button"
          class="btn subtle"
          onClick={() => {
            const comp = component();
            if (!comp) return;
            props.onRefreshComponentInStore(comp.id);
          }}
        >
          {t("inspector.refreshComponentDefinition")}
        </button>
      </Show>
      <Show when={props.node.kind === "sheet"}>
        <button type="button" class="btn" onClick={props.onEnterSelectedSheet}>
          {t("inspector.enterSubsheet")}
        </button>
      </Show>
      <div class="sub-title">{t("inspector.pins")}</div>
      <div class="list compact">
        <For each={pins()}>
          {(pin) => {
            const setpValue = pinSetpValue(pin.key);
            return (
              <div class="list-row pin-list-row">
                <span class={`chip dir-${pin.direction}`}>{pin.direction}</span>
                <span class="mono pin-list-row-name">{pin.name}</span>
                <div class="pin-list-row-meta">
                  <Show when={setpValue}>
                    {(value) => (
                      <span
                        class="chip setp mono"
                        title={`setp ${props.node.instanceName}.${pin.name} ${value()}`}
                      >
                        setp {value()}
                      </span>
                    )}
                  </Show>
                  <span class="chip type">{pin.type}</span>
                </div>
              </div>
            );
          }}
        </For>
      </div>
      <Show when={props.node.kind === "component" && component()}>
        <div class="muted">
          {componentParamCount() > 0
            ? t("inspector.parametersAvailableInDialog", {
                count: componentParamCount(),
              })
            : t("inspector.noParameters")}
        </div>
      </Show>
    </div>
  );
}
