import {
  addfQueueEntryNodeId,
  makeAddfQueueSubsheetOutputEntry,
  normalizeAddfQueueEntries,
} from "../addfQueue";
import { endpointKey, getSheet, resolveEndpointInSheet } from "../graph";
import { createId } from "../id";
import { createSheetPortDraft } from "../project";
import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNode,
  SheetThreadOutputDefinition,
} from "../types";
import { firstSheetThreadOutputId, getSheetThreadOutputs } from "./threads";

function cloneEndpoint(endpoint: SheetEndpointRef): SheetEndpointRef {
  return endpoint.kind === "node-pin"
    ? { kind: "node-pin", nodeId: endpoint.nodeId, pinKey: endpoint.pinKey }
    : { kind: "sheet-port", portId: endpoint.portId };
}

function directConnectionPairKey(
  a: SheetEndpointRef,
  b: SheetEndpointRef,
): string {
  const aKey = endpointKey(a);
  const bKey = endpointKey(b);
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

function defaultPortPosition(
  sheet: SheetDefinition,
  side: "left" | "right" | "top" | "bottom",
): { x: number; y: number } {
  const count = sheet.ports.filter((port) => port.side === side).length;
  if (side === "left") return { x: 20, y: 120 + count * 50 };
  if (side === "right") return { x: 1380, y: 120 + count * 50 };
  if (side === "top") return { x: 220 + count * 120, y: 20 };
  return { x: 220 + count * 120, y: 740 };
}

function nextUniqueName(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function childOutputIdByParentOutputId(
  childOutputs: SheetThreadOutputDefinition[],
  threadMap: Record<string, string>,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const childOutput of childOutputs) {
    const parentOutputId = threadMap[childOutput.id];
    if (parentOutputId) out.set(parentOutputId, childOutput.id);
  }
  return out;
}

function ensureChildOutputForParentOutput(
  childSheet: SheetDefinition,
  parentOutputsById: ReadonlyMap<string, SheetThreadOutputDefinition>,
  threadMap: Record<string, string>,
  parentOutputId: string,
): string {
  const childOutputs = getSheetThreadOutputs(childSheet);
  const mapped = childOutputIdByParentOutputId(childOutputs, threadMap);
  const existing = mapped.get(parentOutputId);
  if (existing) return existing;

  const usedChildOutputIds = new Set(mapped.values());
  const parentOutput = parentOutputsById.get(parentOutputId);
  const reusable = childOutputs.find(
    (childOutput) =>
      !usedChildOutputIds.has(childOutput.id) &&
      (!parentOutput || childOutput.name === parentOutput.name),
  );
  const childOutput =
    reusable ??
    ({
      id: createId("sheetthread"),
      name:
        parentOutput?.name ?? `thread-${Math.max(2, childOutputs.length + 1)}`,
    } satisfies SheetThreadOutputDefinition);
  if (!reusable) childOutputs.push(childOutput);
  if (!childSheet.hal) childSheet.hal = {};
  childSheet.hal.threadOutputs = childOutputs;
  threadMap[childOutput.id] = parentOutputId;
  return childOutput.id;
}

function isMovedNodeEndpoint(
  endpoint: SheetEndpointRef,
  movedNodeIds: ReadonlySet<string>,
): boolean {
  return endpoint.kind === "node-pin" && movedNodeIds.has(endpoint.nodeId);
}

export interface MoveSelectionIntoSubsheetOptions {
  parentSheetId: string;
  childSheetId: string;
  subsheetNode: SheetNode;
  movedNodeIds: readonly string[];
  movedLabelIds?: readonly string[];
}

export interface MoveSelectionIntoSubsheetResult {
  movedNodeCount: number;
  movedLabelCount: number;
  createdPortCount: number;
}

export function moveSelectionIntoSubsheet(
  project: NoHALProject,
  options: MoveSelectionIntoSubsheetOptions,
): MoveSelectionIntoSubsheetResult {
  const parentSheet = getSheet(project, options.parentSheetId);
  const childSheet = getSheet(project, options.childSheetId);
  const movedNodeIdSet = new Set(options.movedNodeIds);
  const movedLabelIdSet = new Set(options.movedLabelIds ?? []);
  const movedNodes = parentSheet.nodes.filter((node) =>
    movedNodeIdSet.has(node.id),
  );
  const movedLabels = parentSheet.labels.filter((label) =>
    movedLabelIdSet.has(label.id),
  );
  const childPortNames = new Set(childSheet.ports.map((port) => port.name));
  const childPortsByEndpointKey = new Map<string, { id: string }>();
  const initialPortCount = childSheet.ports.length;

  const subsheetEndpointForPort = (portId: string): SheetEndpointRef => ({
    kind: "node-pin",
    nodeId: options.subsheetNode.id,
    pinKey: portId,
  });

  const ensureBoundaryPortForEndpoint = (
    endpoint: SheetEndpointRef,
  ): { id: string } => {
    const key = endpointKey(endpoint);
    const existing = childPortsByEndpointKey.get(key);
    if (existing) return existing;

    const resolved = resolveEndpointInSheet(
      project,
      options.parentSheetId,
      endpoint,
    );
    const port = createSheetPortDraft(
      resolved.name || "sig",
      resolved.direction,
      resolved.type,
    );
    if (childPortNames.has(port.name)) {
      port.name = nextUniqueName(port.name, childPortNames);
    }
    childPortNames.add(port.name);
    port.position = defaultPortPosition(childSheet, port.side);
    childSheet.ports.push(port);
    const result = { id: port.id };
    childPortsByEndpointKey.set(key, result);
    return result;
  };

  const parentConnectionsNext: SheetDefinition["directConnections"] = [];
  const childConnectionsNext = [...childSheet.directConnections];
  const childConnectionPairs = new Set(
    childConnectionsNext.map((conn) => directConnectionPairKey(conn.a, conn.b)),
  );
  const parentConnectionPairs = new Set<string>();
  const parentLabelsById = new Map(
    parentSheet.labels.map((label) => [label.id, label]),
  );
  for (const conn of parentSheet.directConnections) {
    const aMoved = isMovedNodeEndpoint(conn.a, movedNodeIdSet);
    const bMoved = isMovedNodeEndpoint(conn.b, movedNodeIdSet);

    if (aMoved && bMoved) {
      childConnectionsNext.push({
        id: conn.id,
        a: cloneEndpoint(conn.a),
        b: cloneEndpoint(conn.b),
        ...(conn.signalName ? { signalName: conn.signalName } : {}),
        ...(conn.waypoints
          ? { waypoints: conn.waypoints.map((point) => ({ ...point })) }
          : {}),
      });
      continue;
    }

    if (!aMoved && !bMoved) {
      parentConnectionsNext.push({
        id: conn.id,
        a: cloneEndpoint(conn.a),
        b: cloneEndpoint(conn.b),
        ...(conn.signalName ? { signalName: conn.signalName } : {}),
        ...(conn.waypoints
          ? { waypoints: conn.waypoints.map((point) => ({ ...point })) }
          : {}),
      });
      parentConnectionPairs.add(directConnectionPairKey(conn.a, conn.b));
      continue;
    }

    const movedEndpoint = aMoved ? conn.a : conn.b;
    const boundaryPort = ensureBoundaryPortForEndpoint(movedEndpoint);
    const subsheetEndpoint = subsheetEndpointForPort(boundaryPort.id);
    const parentConnection = {
      id: conn.id,
      a: aMoved ? subsheetEndpoint : cloneEndpoint(conn.a),
      b: bMoved ? subsheetEndpoint : cloneEndpoint(conn.b),
      ...(conn.signalName ? { signalName: conn.signalName } : {}),
    };
    const pairKey = directConnectionPairKey(
      parentConnection.a,
      parentConnection.b,
    );
    if (!parentConnectionPairs.has(pairKey)) {
      parentConnectionPairs.add(pairKey);
      parentConnectionsNext.push(parentConnection);
    }

    childConnectionsNext.push({
      id: createId("conn"),
      a: aMoved
        ? cloneEndpoint(conn.a)
        : ({ kind: "sheet-port", portId: boundaryPort.id } as const),
      b: bMoved
        ? cloneEndpoint(conn.b)
        : ({ kind: "sheet-port", portId: boundaryPort.id } as const),
      ...(conn.signalName ? { signalName: conn.signalName } : {}),
    });
  }

  const ensureParentBoundaryConnection = (
    externalEndpoint: SheetEndpointRef,
    portId: string,
  ) => {
    const subsheetEndpoint = subsheetEndpointForPort(portId);
    const pairKey = directConnectionPairKey(externalEndpoint, subsheetEndpoint);
    if (parentConnectionPairs.has(pairKey)) return;
    parentConnectionPairs.add(pairKey);
    parentConnectionsNext.push({
      id: createId("conn"),
      a: cloneEndpoint(externalEndpoint),
      b: subsheetEndpoint,
    });
  };

  const ensureChildBoundaryConnection = (
    movedEndpoint: SheetEndpointRef,
    portId: string,
    signalName?: string,
  ) => {
    const portEndpoint = { kind: "sheet-port", portId } as const;
    const pairKey = directConnectionPairKey(movedEndpoint, portEndpoint);
    if (childConnectionPairs.has(pairKey)) return;
    childConnectionPairs.add(pairKey);
    childConnectionsNext.push({
      id: createId("conn"),
      a: portEndpoint,
      b: cloneEndpoint(movedEndpoint),
      ...(signalName ? { signalName } : {}),
    });
  };

  const parentAnchorsNext: SheetDefinition["labelAnchors"] = [];
  const childAnchorsNext = [...childSheet.labelAnchors];
  for (const anchor of parentSheet.labelAnchors) {
    const labelMoved = movedLabelIdSet.has(anchor.labelId);
    const endpointMoved = isMovedNodeEndpoint(anchor.endpoint, movedNodeIdSet);

    if (labelMoved && endpointMoved) {
      childAnchorsNext.push({
        id: anchor.id,
        labelId: anchor.labelId,
        endpoint: cloneEndpoint(anchor.endpoint),
      });
      continue;
    }

    if (labelMoved && !endpointMoved) {
      const boundaryPort = ensureBoundaryPortForEndpoint(anchor.endpoint);
      childAnchorsNext.push({
        id: anchor.id,
        labelId: anchor.labelId,
        endpoint: { kind: "sheet-port", portId: boundaryPort.id },
      });
      ensureParentBoundaryConnection(anchor.endpoint, boundaryPort.id);
      continue;
    }

    if (!labelMoved && endpointMoved) {
      const boundaryPort = ensureBoundaryPortForEndpoint(anchor.endpoint);
      const signalName = parentLabelsById.get(anchor.labelId)?.name;
      parentAnchorsNext.push({
        id: anchor.id,
        labelId: anchor.labelId,
        endpoint: subsheetEndpointForPort(boundaryPort.id),
      });
      ensureChildBoundaryConnection(
        anchor.endpoint,
        boundaryPort.id,
        signalName,
      );
      continue;
    }

    parentAnchorsNext.push({
      id: anchor.id,
      labelId: anchor.labelId,
      endpoint: cloneEndpoint(anchor.endpoint),
    });
  }

  const parentThreadOutputs = getSheetThreadOutputs(parentSheet);
  if (!parentSheet.hal) parentSheet.hal = {};
  parentSheet.hal.threadOutputs = [...parentThreadOutputs];
  const parentOutputsById = new Map(
    parentThreadOutputs.map((output) => [output.id, output]),
  );
  const defaultParentOutputId = firstSheetThreadOutputId(parentSheet);
  const threadMap = { ...(options.subsheetNode.hal?.threadMap ?? {}) };
  const originalParentQueue = parentSheet.hal?.addfQueue
    ? [...parentSheet.hal.addfQueue]
    : [];
  const childQueue = [...(childSheet.hal?.addfQueue ?? [])];
  const parentQueue = originalParentQueue.filter((entry) => {
    const nodeId = addfQueueEntryNodeId(entry);
    return !(nodeId && movedNodeIdSet.has(nodeId));
  });
  const firstMovedIndexByParentOutputId = new Map<string, number>();

  for (const [index, entry] of originalParentQueue.entries()) {
    const nodeId = addfQueueEntryNodeId(entry);
    if (!nodeId || !movedNodeIdSet.has(nodeId)) continue;
    const parentOutputId =
      typeof entry === "string"
        ? defaultParentOutputId
        : (entry.sheetThreadOutputId ?? defaultParentOutputId);
    if (!firstMovedIndexByParentOutputId.has(parentOutputId)) {
      firstMovedIndexByParentOutputId.set(parentOutputId, index);
    }
    const childOutputId = ensureChildOutputForParentOutput(
      childSheet,
      parentOutputsById,
      threadMap,
      parentOutputId,
    );
    if (typeof entry === "string" || entry.kind === "node") {
      childQueue.push({
        kind: "node",
        nodeId,
        sheetThreadOutputId: childOutputId,
      });
      continue;
    }
    if (entry.kind === "component-function") {
      childQueue.push({
        kind: "component-function",
        nodeId,
        functionKey: entry.functionKey,
        sheetThreadOutputId: childOutputId,
      });
    }
  }

  ensureChildOutputForParentOutput(
    childSheet,
    parentOutputsById,
    threadMap,
    defaultParentOutputId,
  );
  options.subsheetNode.hal = { ...(options.subsheetNode.hal ?? {}), threadMap };

  if (!childSheet.hal) childSheet.hal = {};
  childSheet.hal.threadOutputs = [...getSheetThreadOutputs(childSheet)];
  if (childQueue.length > 0) {
    childSheet.hal.addfQueue = normalizeAddfQueueEntries(childQueue);
  } else {
    delete childSheet.hal.addfQueue;
  }

  if (firstMovedIndexByParentOutputId.size > 0) {
    const insertions = [...firstMovedIndexByParentOutputId.entries()]
      .map(([parentOutputId, firstMovedIndex]) => ({
        firstMovedIndex,
        entry: makeAddfQueueSubsheetOutputEntry(
          options.subsheetNode.id,
          ensureChildOutputForParentOutput(
            childSheet,
            parentOutputsById,
            threadMap,
            parentOutputId,
          ),
          parentOutputId,
        ),
      }))
      .sort((a, b) => a.firstMovedIndex - b.firstMovedIndex);

    let inserted = 0;
    for (const insertion of insertions) {
      const insertAt = originalParentQueue
        .slice(0, insertion.firstMovedIndex)
        .filter((entry) => {
          const nodeId = addfQueueEntryNodeId(entry);
          return !(nodeId && movedNodeIdSet.has(nodeId));
        }).length;
      parentQueue.splice(insertAt + inserted, 0, insertion.entry);
      inserted += 1;
    }
  }

  parentSheet.nodes = parentSheet.nodes.filter(
    (node) => !movedNodeIdSet.has(node.id),
  );
  const existingSubsheetNodeIndex = parentSheet.nodes.findIndex(
    (node) => node.id === options.subsheetNode.id,
  );
  if (existingSubsheetNodeIndex < 0) {
    parentSheet.nodes.push(options.subsheetNode);
  } else {
    parentSheet.nodes[existingSubsheetNodeIndex] = options.subsheetNode;
  }
  parentSheet.labels = parentSheet.labels.filter(
    (label) => !movedLabelIdSet.has(label.id),
  );
  parentSheet.directConnections = parentConnectionsNext;
  parentSheet.labelAnchors = parentAnchorsNext;
  if (parentQueue.length > 0) {
    parentSheet.hal.addfQueue = normalizeAddfQueueEntries(parentQueue);
  } else {
    delete parentSheet.hal.addfQueue;
  }
  if (parentSheet.hal && Object.keys(parentSheet.hal).length === 0) {
    delete parentSheet.hal;
  }

  const existingChildNodeIds = new Set(childSheet.nodes.map((node) => node.id));
  for (const movedNode of movedNodes) {
    if (existingChildNodeIds.has(movedNode.id)) continue;
    childSheet.nodes.push(movedNode);
  }
  childSheet.labels.push(
    ...movedLabels.map((label) => ({
      ...label,
      position: { ...label.position },
    })),
  );
  childSheet.directConnections = childConnectionsNext;
  childSheet.labelAnchors = childAnchorsNext;

  return {
    movedNodeCount: movedNodes.length,
    movedLabelCount: movedLabels.length,
    createdPortCount: childSheet.ports.length - initialPortCount,
  };
}
