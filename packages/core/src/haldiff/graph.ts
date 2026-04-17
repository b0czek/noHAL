import { sortBy } from "remeda";
import type { HalImportDraft } from "../types";
import type {
  HalGraphComponent,
  HalGraphSignal,
  HalNetworkGraph,
} from "./internal";
import { attachmentKey, buildComponentTypeByInstance } from "./utils";

function ensureGraphComponent(
  graph: HalNetworkGraph,
  componentId: string,
  componentType?: string,
): HalGraphComponent {
  const existing = graph.components.get(componentId);
  if (existing) return existing;
  const created: HalGraphComponent = {
    id: componentId,
    instanceName: componentId,
    ...(componentType ? { componentType } : {}),
    attachments: [],
  };
  graph.components.set(componentId, created);
  return created;
}

function ensureGraphSignal(
  graph: HalNetworkGraph,
  signalId: string,
): HalGraphSignal {
  const existing = graph.signals.get(signalId);
  if (existing) return existing;
  const created: HalGraphSignal = {
    id: signalId,
    signalName: signalId,
    attachments: [],
  };
  graph.signals.set(signalId, created);
  return created;
}

function sortGraph(graph: HalNetworkGraph): HalNetworkGraph {
  for (const component of graph.components.values()) {
    component.attachments = sortBy(
      component.attachments,
      (attachment) => attachment.pinName,
      (attachment) => attachment.signalId,
    );
  }
  for (const signal of graph.signals.values()) {
    signal.attachments = sortBy(
      signal.attachments,
      (attachment) => attachment.pinName,
      (attachment) => attachment.componentId,
    );
  }
  return graph;
}

export function buildHalNetworkGraph(draft: HalImportDraft): HalNetworkGraph {
  const graph: HalNetworkGraph = {
    components: new Map(),
    signals: new Map(),
  };
  const componentTypeByInstance = buildComponentTypeByInstance(draft);
  const seenAttachmentsBySignal = new Map<string, Set<string>>();

  for (const net of draft.nets) {
    const signal = ensureGraphSignal(graph, net.name);
    const signalAttachmentKeys =
      seenAttachmentsBySignal.get(signal.id) ?? new Set<string>();
    seenAttachmentsBySignal.set(signal.id, signalAttachmentKeys);

    for (const endpoint of net.endpoints) {
      const attachmentId = attachmentKey(
        endpoint.instanceName,
        endpoint.pinName,
      );
      if (signalAttachmentKeys.has(attachmentId)) continue;
      signalAttachmentKeys.add(attachmentId);

      signal.attachments.push({
        componentId: endpoint.instanceName,
        pinName: endpoint.pinName,
      });

      const component = ensureGraphComponent(
        graph,
        endpoint.instanceName,
        componentTypeByInstance.get(endpoint.instanceName),
      );
      component.attachments.push({
        componentId: endpoint.instanceName,
        pinName: endpoint.pinName,
        signalId: signal.id,
      });
    }
  }

  return sortGraph(graph);
}
