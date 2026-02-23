import { For, Show } from "solid-js";
import { getNodePins, getNodeTitle } from "../../shared/graph";
import type { EditorState } from "../state/store";
import type {
  HalValueType,
  LabelScope,
  NoHALProject,
  SheetDefinition,
  SheetNodeInstance
} from "../../shared/types";

interface InspectorProps {
  state: EditorState;
  currentSheet: SheetDefinition;
  onOpenSelectedComponentEditor: () => void;
  onRenameNode: (nodeId: string, name: string) => void;
  onUpdateNodeParam: (nodeId: string, key: string, value: string) => void;
  onUpdateLabel: (labelId: string, patch: { name?: string; scope?: LabelScope }) => void;
  onUpdateSheetPort: (
    portId: string,
    patch: {
      name?: string;
      direction?: "in" | "out" | "io";
      type?: HalValueType;
      side?: "left" | "right" | "bottom";
    }
  ) => void;
  onRemoveSelection: () => void;
  onRemoveConnection: (id: string) => void;
  onRemoveLabelAnchor: (id: string) => void;
  onEnterSelectedSheet: () => void;
}

type SelectMenuOption = {
  value: string;
  label: string;
};

const LABEL_SCOPE_OPTIONS: ReadonlyArray<SelectMenuOption> = [
  { value: "local", label: "local" },
  { value: "hierarchical", label: "hierarchical" },
  { value: "global", label: "global" }
];

const PORT_DIRECTION_OPTIONS: ReadonlyArray<SelectMenuOption> = [
  { value: "in", label: "in" },
  { value: "out", label: "out" },
  { value: "io", label: "io" }
];

const PORT_TYPE_OPTIONS: ReadonlyArray<SelectMenuOption> = [
  { value: "bit", label: "bit" },
  { value: "float", label: "float" },
  { value: "s32", label: "s32" },
  { value: "u32", label: "u32" },
  { value: "s64", label: "s64" },
  { value: "u64", label: "u64" },
  { value: "port", label: "port" }
];

const PORT_SIDE_OPTIONS: ReadonlyArray<SelectMenuOption> = [
  { value: "left", label: "left" },
  { value: "right", label: "right" },
  { value: "bottom", label: "bottom" }
];

export default function Inspector(props: InspectorProps) {
  const selectedNode = () =>
    props.state.selection?.kind === "node"
      ? props.currentSheet.nodes.find((n) => n.id === props.state.selection?.id)
      : undefined;
  const selectedLabel = () =>
    props.state.selection?.kind === "label"
      ? props.currentSheet.labels.find((l) => l.id === props.state.selection?.id)
      : undefined;
  const selectedPort = () =>
    props.state.selection?.kind === "sheet-port"
      ? props.currentSheet.ports.find((p) => p.id === props.state.selection?.id)
      : undefined;

  return (
    <aside class="inspector">
      <section class="panel">
        <div class="panel-title">Session</div>
        <div class="kv"><span>Status</span><span>{props.state.status}</span></div>
        <div class="kv"><span>File</span><span>{props.state.filePath ?? "(unsaved)"}</span></div>
      </section>

      <section class="panel">
        <div class="panel-title">Selection</div>
        <Show when={!props.state.selection}>
          <div class="muted">Nothing selected.</div>
        </Show>

        <Show when={selectedNode()}>
          {(node) => (
            <NodeInspector
              project={props.state.project}
              node={node()}
              onOpenComponentEditor={props.onOpenSelectedComponentEditor}
              onRename={(name) => props.onRenameNode(node().id, name)}
              onEnterSelectedSheet={props.onEnterSelectedSheet}
            />
          )}
        </Show>

        <Show when={selectedLabel()}>
          {(label) => (
            <div class="inspector-group">
              <label>
                Name
                <input
                  value={label().name}
                  onInput={(e) => props.onUpdateLabel(label().id, { name: e.currentTarget.value })}
                />
              </label>
              <label>
                Scope
                <SelectMenu
                  value={label().scope}
                  options={LABEL_SCOPE_OPTIONS}
                  onChange={(value) =>
                    props.onUpdateLabel(label().id, {
                      scope: value as LabelScope
                    })
                  }
                />
              </label>
            </div>
          )}
        </Show>

        <Show when={selectedPort()}>
          {(port) => (
            <div class="inspector-group">
              <label>
                Name
                <input
                  value={port().name}
                  onInput={(e) => props.onUpdateSheetPort(port().id, { name: e.currentTarget.value })}
                />
              </label>
              <label>
                Direction
                <SelectMenu
                  value={port().direction}
                  options={PORT_DIRECTION_OPTIONS}
                  onChange={(value) =>
                    props.onUpdateSheetPort(port().id, {
                      direction: value as "in" | "out" | "io"
                    })
                  }
                />
              </label>
              <label>
                Type
                <SelectMenu
                  value={port().type}
                  options={PORT_TYPE_OPTIONS}
                  onChange={(value) =>
                    props.onUpdateSheetPort(port().id, {
                      type: value as HalValueType
                    })
                  }
                />
              </label>
              <label>
                Side
                <SelectMenu
                  value={port().side}
                  options={PORT_SIDE_OPTIONS}
                  onChange={(value) =>
                    props.onUpdateSheetPort(port().id, {
                      side: value as "left" | "right" | "bottom"
                    })
                  }
                />
              </label>
            </div>
          )}
        </Show>

        <Show when={props.state.selection}>
          <button class="btn danger" onClick={props.onRemoveSelection}>
            Delete Selection
          </button>
        </Show>
      </section>

      <section class="panel">
        <div class="panel-title">Current Sheet Nets</div>
        <div class="sub-title">Direct Connections</div>
        <div class="list compact">
          <For each={props.currentSheet.directConnections}>
            {(conn) => (
              <div class="list-row">
                <button class="linkish" onClick={() => props.onRemoveConnection(conn.id)}>
                  remove
                </button>
                <span class="mono">{conn.id}</span>
              </div>
            )}
          </For>
        </div>

        <div class="sub-title">Label Anchors</div>
        <div class="list compact">
          <For each={props.currentSheet.labelAnchors}>
            {(anchor) => (
              <div class="list-row">
                <button class="linkish" onClick={() => props.onRemoveLabelAnchor(anchor.id)}>
                  remove
                </button>
                <span class="mono">{anchor.id}</span>
              </div>
            )}
          </For>
        </div>
      </section>

      <Show when={props.state.exportWarnings.length > 0}>
        <section class="panel warn">
          <div class="panel-title">Warnings</div>
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

function SelectMenu(props: {
  value: string;
  options: ReadonlyArray<SelectMenuOption>;
  onChange: (value: string) => void;
}) {
  const currentLabel = () =>
    props.options.find((option) => option.value === props.value)?.label ?? props.value;

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
}) {
  const pins = () => getNodePins(props.project, props.node);
  const component = () =>
    props.node.kind === "component" ? props.project.library.components[props.node.componentId] : undefined;

  return (
    <div class="inspector-group">
      <div class="mono">{getNodeTitle(props.project, props.node)}</div>
      <Show
        when={props.node.kind === "component"}
        fallback={
          <label>
            Instance Name
            <input value={props.node.instanceName} onInput={(e) => props.onRename(e.currentTarget.value)} />
          </label>
        }
      >
        <button class="btn" onClick={props.onOpenComponentEditor}>
          Open Component Settings
        </button>
      </Show>
      <Show when={props.node.kind === "sheet"}>
        <button class="btn" onClick={props.onEnterSelectedSheet}>
          Enter Subsheet
        </button>
      </Show>
      <div class="sub-title">Pins</div>
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
          {component()!.params.length > 0
            ? `${component()!.params.length} parameters available in dialog`
            : "No parameters"}
        </div>
      </Show>
    </div>
  );
}
