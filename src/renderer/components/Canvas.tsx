import { For, Show } from "solid-js";
import { getNodePins, getNodeTitle } from "../../shared/graph";
import type {
  NochalProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNodeInstance
} from "../../shared/types";
import type { Selection } from "../state/store";

interface CanvasProps {
  project: NochalProject;
  sheet: SheetDefinition;
  activeSheetId: string;
  selection: Selection;
  pendingEndpoint: SheetEndpointRef | null;
  onSelect: (selection: Selection) => void;
  onEndpointClick: (endpoint: SheetEndpointRef) => void;
  onLabelClick: (labelId: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onMoveLabel: (id: string, x: number, y: number) => void;
  onMoveSheetPort: (id: string, x: number, y: number) => void;
}

const NODE_WIDTH = 240;
const HEADER_H = 28;
const SIDE_ROW_H = 24;
const BOTTOM_H = 26;
const CANVAS_W = 2200;
const CANVAS_H = 1400;

interface NodeLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  pinPositions: Record<string, { x: number; y: number }>;
}

function computeNodeLayout(project: NochalProject, node: SheetNodeInstance): NodeLayout {
  const pins = getNodePins(project, node);
  const left = pins.filter((p) => p.side === "left");
  const right = pins.filter((p) => p.side === "right");
  const bottom = pins.filter((p) => p.side === "bottom");

  const rows = Math.max(left.length, right.length, 1);
  const sideHeight = rows * SIDE_ROW_H;
  const bottomHeight = bottom.length > 0 ? BOTTOM_H + 10 : 0;
  const height = HEADER_H + sideHeight + bottomHeight + 12;
  const pinPositions: Record<string, { x: number; y: number }> = {};

  left.forEach((pin, idx) => {
    pinPositions[pin.key] = { x: node.position.x, y: node.position.y + HEADER_H + idx * SIDE_ROW_H + SIDE_ROW_H / 2 };
  });
  right.forEach((pin, idx) => {
    pinPositions[pin.key] = {
      x: node.position.x + NODE_WIDTH,
      y: node.position.y + HEADER_H + idx * SIDE_ROW_H + SIDE_ROW_H / 2
    };
  });
  bottom.forEach((pin, idx) => {
    const step = NODE_WIDTH / (bottom.length + 1);
    pinPositions[pin.key] = {
      x: node.position.x + step * (idx + 1),
      y: node.position.y + HEADER_H + sideHeight + 12 + BOTTOM_H / 2
    };
  });

  return {
    x: node.position.x,
    y: node.position.y,
    width: NODE_WIDTH,
    height,
    pinPositions
  };
}

export default function Canvas(props: CanvasProps) {
  const dtypeClass = (type: string) => `dtype-${type}`;

  const nodeLayouts = () =>
    new Map(props.sheet.nodes.map((node) => [node.id, computeNodeLayout(props.project, node)]));

  const endpointPosition = (endpoint: SheetEndpointRef): { x: number; y: number } | null => {
    if (endpoint.kind === "sheet-port") {
      const port = props.sheet.ports.find((p) => p.id === endpoint.portId);
      if (!port) return null;
      return { x: port.position.x, y: port.position.y };
    }
    const layout = nodeLayouts().get(endpoint.nodeId);
    if (!layout) return null;
    return layout.pinPositions[endpoint.pinKey] ?? null;
  };

  const pendingKey = () =>
    props.pendingEndpoint
      ? props.pendingEndpoint.kind === "node-pin"
        ? `node:${props.pendingEndpoint.nodeId}:${props.pendingEndpoint.pinKey}`
        : `port:${props.pendingEndpoint.portId}`
      : null;

  const isSelectedNode = (id: string) => props.selection?.kind === "node" && props.selection.id === id;
  const isSelectedLabel = (id: string) => props.selection?.kind === "label" && props.selection.id === id;
  const isSelectedPort = (id: string) => props.selection?.kind === "sheet-port" && props.selection.id === id;

  const dragState = { stop: (() => {}) as () => void };

  const startDrag = (
    kind: "node" | "label" | "port",
    id: string,
    event: PointerEvent,
    offset: { x: number; y: number }
  ) => {
    event.preventDefault();
    dragState.stop();
    const move = (ev: PointerEvent) => {
      const nextX = Math.max(10, ev.clientX - offset.x);
      const nextY = Math.max(10, ev.clientY - offset.y);
      if (kind === "node") props.onMoveNode(id, nextX, nextY);
      else if (kind === "label") props.onMoveLabel(id, nextX, nextY);
      else props.onMoveSheetPort(id, nextX, nextY);
    };
    const up = () => dragState.stop();
    dragState.stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dragState.stop = () => {};
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div class="canvas-shell">
      <div class="canvas-grid" style={{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }}>
        <svg class="wire-layer" width={CANVAS_W} height={CANVAS_H}>
          <For each={props.sheet.directConnections}>
            {(conn) => {
              const a = endpointPosition(conn.a);
              const b = endpointPosition(conn.b);
              if (!a || !b) return null;
              const dx = Math.abs(b.x - a.x) * 0.4;
              const c1x = a.x + (b.x >= a.x ? dx : -dx);
              const c2x = b.x - (b.x >= a.x ? dx : -dx);
              return (
                <path
                  d={`M ${a.x} ${a.y} C ${c1x} ${a.y}, ${c2x} ${b.y}, ${b.x} ${b.y}`}
                  class="wire"
                />
              );
            }}
          </For>

          <For each={props.sheet.labelAnchors}>
            {(anchor) => {
              const endpoint = endpointPosition(anchor.endpoint);
              const label = props.sheet.labels.find((l) => l.id === anchor.labelId);
              if (!endpoint || !label) return null;
              return (
                <line
                  x1={endpoint.x}
                  y1={endpoint.y}
                  x2={label.position.x}
                  y2={label.position.y}
                  class="wire anchor-wire"
                />
              );
            }}
          </For>
        </svg>

        <For each={props.sheet.ports}>
          {(port) => (
            <div
              class={`sheet-port ${port.side} ${isSelectedPort(port.id) ? "is-selected" : ""}`}
              style={{ left: `${port.position.x - 10}px`, top: `${port.position.y - 10}px` }}
              onClick={() => props.onSelect({ kind: "sheet-port", id: port.id })}
            >
              <button
                class={`pin-dot dir-${port.direction} ${dtypeClass(port.type)} ${pendingKey() === `port:${port.id}` ? "is-pending" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onEndpointClick({ kind: "sheet-port", portId: port.id });
                }}
              />
              <div
                class="sheet-port-label"
                onPointerDown={(e) =>
                    startDrag(
                      "port",
                      port.id,
                      e,
                      { x: e.clientX - port.position.x, y: e.clientY - port.position.y }
                    )
                }
              >
                <span class="mono">{port.name}</span>
                <span class="chip type">{port.type}</span>
                <span class={`chip dir-${port.direction}`}>{port.direction}</span>
              </div>
            </div>
          )}
        </For>

        <For each={props.sheet.nodes}>
          {(node) => {
            const layout = () => nodeLayouts().get(node.id)!;
            const pins = () => getNodePins(props.project, node);
            const leftPins = () => pins().filter((p) => p.side === "left");
            const rightPins = () => pins().filter((p) => p.side === "right");
            const bottomPins = () => pins().filter((p) => p.side === "bottom");
            return (
              <div
                class={`graph-node ${node.kind} ${isSelectedNode(node.id) ? "is-selected" : ""}`}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                  width: `${NODE_WIDTH}px`,
                  height: `${layout().height}px`
                }}
                onClick={() => props.onSelect({ kind: "node", id: node.id })}
              >
                <div
                  class="node-header"
                  onPointerDown={(e) =>
                    startDrag(
                      "node",
                      node.id,
                      e,
                      { x: e.clientX - node.position.x, y: e.clientY - node.position.y }
                    )
                  }
                >
                  <span>{getNodeTitle(props.project, node)}</span>
                  <span class="node-kind">{node.kind}</span>
                </div>

                <div class="node-pin-columns">
                  <div class="pin-col left">
                    <For each={leftPins()}>
                      {(pin) => (
                        <PinRow
                          pinName={pin.name}
                          type={pin.type}
                          direction={pin.direction}
                          pending={pendingKey() === `node:${node.id}:${pin.key}`}
                          onClick={() => props.onEndpointClick({ kind: "node-pin", nodeId: node.id, pinKey: pin.key })}
                          side="left"
                        />
                      )}
                    </For>
                  </div>

                  <div class="pin-col right">
                    <For each={rightPins()}>
                      {(pin) => (
                        <PinRow
                          pinName={pin.name}
                          type={pin.type}
                          direction={pin.direction}
                          pending={pendingKey() === `node:${node.id}:${pin.key}`}
                          onClick={() => props.onEndpointClick({ kind: "node-pin", nodeId: node.id, pinKey: pin.key })}
                          side="right"
                        />
                      )}
                    </For>
                  </div>
                </div>

                <Show when={bottomPins().length > 0}>
                  <div class="pin-row-bottom">
                    <For each={bottomPins()}>
                      {(pin) => (
                        <button
                          class={`bottom-pin dir-${pin.direction} ${pendingKey() === `node:${node.id}:${pin.key}` ? "is-pending" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            props.onEndpointClick({ kind: "node-pin", nodeId: node.id, pinKey: pin.key });
                          }}
                          title={`${pin.name} (${pin.type})`}
                        >
                          <span class="mono">{pin.name}</span>
                        </button>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            );
          }}
        </For>

        <For each={props.sheet.labels}>
          {(label) => (
            <button
              class={`net-label scope-${label.scope} ${isSelectedLabel(label.id) ? "is-selected" : ""}`}
              style={{ left: `${label.position.x}px`, top: `${label.position.y}px` }}
              onClick={() => props.onLabelClick(label.id)}
              onPointerDown={(e) =>
                startDrag(
                  "label",
                  label.id,
                  e,
                  { x: e.clientX - label.position.x, y: e.clientY - label.position.y }
                )
              }
            >
              <span class="label-scope">{label.scope}</span>
              <span class="mono">{label.name}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

function PinRow(props: {
  pinName: string;
  type: string;
  direction: string;
  pending: boolean;
  onClick: () => void;
  side: "left" | "right";
}) {
  return (
    <button
      class={`pin-row ${props.side}`}
      title={`${props.pinName} (${props.type})`}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick();
      }}
    >
      <Show when={props.side === "left"}>
        <span class={`pin-dot dir-${props.direction} dtype-${props.type} ${props.pending ? "is-pending" : ""}`} />
      </Show>
      <span class="mono pin-name">{props.pinName}</span>
      <Show when={props.side === "right"}>
        <span class={`pin-dot dir-${props.direction} dtype-${props.type} ${props.pending ? "is-pending" : ""}`} />
      </Show>
    </button>
  );
}
