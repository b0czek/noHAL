import { For, Show } from "solid-js";
import { getNodePins, getNodeTitle } from "../../shared/graph";
import type {
  HalValueType,
  LabelScope,
  NoHALProject,
  SheetDefinition,
  SheetNodeInstance,
} from "../../shared/types";
import { useI18n } from "../i18n";
import type { EditorState } from "../state/store";

interface InspectorProps {
  state: EditorState;
  currentSheet: SheetDefinition;
  onOpenSelectedComponentEditor: () => void;
  onRenameNode: (nodeId: string, name: string) => void;
  onUpdateNodeParam: (nodeId: string, key: string, value: string) => void;
  onUpdateLabel: (
    labelId: string,
    patch: { name?: string; scope?: LabelScope; rotation?: number },
  ) => void;
  onUpdateSheetPort: (
    portId: string,
    patch: {
      name?: string;
      direction?: "in" | "out" | "io";
      type?: HalValueType;
      side?: "left" | "right" | "bottom";
      rotation?: number;
    },
  ) => void;
  onRemoveSelection: () => void;
  onRemoveConnection: (id: string) => void;
  onRemoveLabelAnchor: (id: string) => void;
  onEnterSelectedSheet: () => void;
  onRefreshComponentInStore: (componentId: string) => void;
}

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

export default function Inspector(props: InspectorProps) {
  const { t } = useI18n();
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
  const portSideOptions: ReadonlyArray<SelectMenuOption> = [
    { value: "left", label: "left" },
    { value: "right", label: "right" },
    { value: "bottom", label: "bottom" },
  ];
  const selectedNode = () =>
    props.state.selection?.kind === "node"
      ? props.currentSheet.nodes.find((n) => n.id === props.state.selection?.id)
      : undefined;
  const selectedLabel = () =>
    props.state.selection?.kind === "label"
      ? props.currentSheet.labels.find(
          (l) => l.id === props.state.selection?.id,
        )
      : undefined;
  const selectedPort = () =>
    props.state.selection?.kind === "sheet-port"
      ? props.currentSheet.ports.find((p) => p.id === props.state.selection?.id)
      : undefined;

  return (
    <aside class="inspector">
      <section class="panel">
        <div class="panel-title">{t("inspector.session")}</div>
        <div class="kv">
          <span>{t("common.status")}</span>
          <span>{props.state.status}</span>
        </div>
        <div class="kv">
          <span>{t("common.file")}</span>
          <span>{props.state.filePath ?? t("common.unsaved")}</span>
        </div>
      </section>

      <section class="panel">
        <div class="panel-title">{t("inspector.selection")}</div>
        <Show when={!props.state.selection}>
          <div class="muted">{t("inspector.nothingSelected")}</div>
        </Show>

        <Show when={selectedNode()}>
          {(node) => (
            <NodeInspector
              project={props.state.project}
              node={node()}
              onOpenComponentEditor={props.onOpenSelectedComponentEditor}
              onRename={(name) => props.onRenameNode(node().id, name)}
              onEnterSelectedSheet={props.onEnterSelectedSheet}
              onRefreshComponentInStore={props.onRefreshComponentInStore}
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
                    props.onUpdateLabel(label().id, {
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
                    props.onUpdateLabel(label().id, {
                      scope: value as LabelScope,
                    })
                  }
                />
              </div>
              <RotationEditor
                value={label().rotation ?? 0}
                onChange={(rotation) =>
                  props.onUpdateLabel(label().id, { rotation })
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
                    props.onUpdateSheetPort(port().id, {
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
                    props.onUpdateSheetPort(port().id, {
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
                    props.onUpdateSheetPort(port().id, {
                      type: value as HalValueType,
                    })
                  }
                />
              </div>
              <div class="field-label-group">
                {t("common.side")}
                <SelectMenu
                  value={port().side}
                  options={portSideOptions}
                  onChange={(value) =>
                    props.onUpdateSheetPort(port().id, {
                      side: value as "left" | "right" | "bottom",
                    })
                  }
                />
              </div>
              <RotationEditor
                value={port().rotation ?? 0}
                onChange={(rotation) =>
                  props.onUpdateSheetPort(port().id, { rotation })
                }
              />
            </div>
          )}
        </Show>

        <Show when={props.state.selection}>
          <button
            type="button"
            class="btn danger"
            onClick={props.onRemoveSelection}
          >
            {t("inspector.deleteSelection")}
          </button>
        </Show>
      </section>

      <section class="panel">
        <div class="panel-title">{t("inspector.currentSheetNets")}</div>
        <div class="sub-title">{t("inspector.directConnections")}</div>
        <div class="list compact">
          <For each={props.currentSheet.directConnections}>
            {(conn) => (
              <div class="list-row">
                <button
                  type="button"
                  class="linkish"
                  onClick={() => props.onRemoveConnection(conn.id)}
                >
                  {t("common.remove")}
                </button>
                <span class="mono">{conn.id}</span>
              </div>
            )}
          </For>
        </div>

        <div class="sub-title">{t("inspector.labelAnchors")}</div>
        <div class="list compact">
          <For each={props.currentSheet.labelAnchors}>
            {(anchor) => (
              <div class="list-row">
                <button
                  type="button"
                  class="linkish"
                  onClick={() => props.onRemoveLabelAnchor(anchor.id)}
                >
                  {t("common.remove")}
                </button>
                <span class="mono">{anchor.id}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      <Show when={props.state.exportWarnings.length > 0}>
        <section class="panel warn">
          <div class="panel-title">{t("inspector.warnings")}</div>
          <div class="list compact">
            <For each={props.state.exportWarnings}>
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
          {(pin) => (
            <div class="list-row">
              <span class={`chip dir-${pin.direction}`}>{pin.direction}</span>
              <span class="mono">{pin.name}</span>
              <span class="chip type">{pin.type}</span>
            </div>
          )}
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
