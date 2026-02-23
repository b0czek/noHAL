import { For, Show } from "solid-js";
import { getNodePins, getNodeTitle } from "../../shared/graph";
import type { EditorState } from "../state/store";
import type {
  HalValueType,
  LabelScope,
  NochalProject,
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
                <select
                  value={label().scope}
                  onChange={(e) =>
                    props.onUpdateLabel(label().id, {
                      scope: e.currentTarget.value as LabelScope
                    })
                  }
                >
                  <option value="local">local</option>
                  <option value="hierarchical">hierarchical</option>
                  <option value="global">global</option>
                </select>
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
                <select
                  value={port().direction}
                  onChange={(e) =>
                    props.onUpdateSheetPort(port().id, {
                      direction: e.currentTarget.value as "in" | "out" | "io"
                    })
                  }
                >
                  <option value="in">in</option>
                  <option value="out">out</option>
                  <option value="io">io</option>
                </select>
              </label>
              <label>
                Type
                <select
                  value={port().type}
                  onChange={(e) =>
                    props.onUpdateSheetPort(port().id, {
                      type: e.currentTarget.value as HalValueType
                    })
                  }
                >
                  <For each={["bit", "float", "s32", "u32", "s64", "u64", "port"]}>
                    {(t) => <option value={t}>{t}</option>}
                  </For>
                </select>
              </label>
              <label>
                Side
                <select
                  value={port().side}
                  onChange={(e) =>
                    props.onUpdateSheetPort(port().id, {
                      side: e.currentTarget.value as "left" | "right" | "bottom"
                    })
                  }
                >
                  <option value="left">left</option>
                  <option value="right">right</option>
                  <option value="bottom">bottom</option>
                </select>
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

function NodeInspector(props: {
  project: NochalProject;
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
