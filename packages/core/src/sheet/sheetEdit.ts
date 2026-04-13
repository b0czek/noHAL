import { addfQueueEntryNodeId, normalizeAddfQueueEntries } from "../addfQueue";
import { ensureInstanceName } from "../componentNaming";
import { getConnectedSheetPortReferenceLocations, getSheet } from "../graph";
import { createId } from "../id";
import { createSheet } from "../project";
import type {
  NoHALProject,
  SheetAddfQueueStoredEntry,
  SheetDefinition,
  SheetNode,
  SheetThreadOutputDefinition,
} from "../types";
import { defaultNodePositionForIndex } from "./layout";
import { normalizeSheetThreadOutputs } from "./threads";

function nextUniqueName(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function pruneSheetNodeReferences(
  sheet: SheetDefinition,
  removedNodeIds: ReadonlySet<string>,
): void {
  if (removedNodeIds.size === 0) return;

  sheet.directConnections = sheet.directConnections.filter(
    (connection) =>
      !(
        connection.a.kind === "node-pin" &&
        removedNodeIds.has(connection.a.nodeId)
      ) &&
      !(
        connection.b.kind === "node-pin" &&
        removedNodeIds.has(connection.b.nodeId)
      ),
  );

  sheet.labelAnchors = sheet.labelAnchors.filter(
    (anchor) =>
      !(
        anchor.endpoint.kind === "node-pin" &&
        removedNodeIds.has(anchor.endpoint.nodeId)
      ),
  );

  if (!sheet.hal?.addfQueue) return;
  sheet.hal.addfQueue = normalizeAddfQueueEntries(
    sheet.hal.addfQueue.filter((entry) => {
      const nodeId = addfQueueEntryNodeId(entry);
      return !(nodeId && removedNodeIds.has(nodeId));
    }),
  );
  if (sheet.hal.addfQueue.length === 0) delete sheet.hal.addfQueue;
  if (Object.keys(sheet.hal).length === 0) delete sheet.hal;
}

function pruneSheetNodePinReferences(
  sheet: SheetDefinition,
  nodeId: string,
  pinKey: string,
): void {
  sheet.directConnections = sheet.directConnections.filter(
    (connection) =>
      !(
        connection.a.kind === "node-pin" &&
        connection.a.nodeId === nodeId &&
        connection.a.pinKey === pinKey
      ) &&
      !(
        connection.b.kind === "node-pin" &&
        connection.b.nodeId === nodeId &&
        connection.b.pinKey === pinKey
      ),
  );

  sheet.labelAnchors = sheet.labelAnchors.filter(
    (anchor) =>
      !(
        anchor.endpoint.kind === "node-pin" &&
        anchor.endpoint.nodeId === nodeId &&
        anchor.endpoint.pinKey === pinKey
      ),
  );
}

function pruneSheetPortReferences(
  sheet: SheetDefinition,
  removedPortIds: ReadonlySet<string>,
): void {
  if (removedPortIds.size === 0) return;

  sheet.directConnections = sheet.directConnections.filter(
    (connection) =>
      !(
        connection.a.kind === "sheet-port" &&
        removedPortIds.has(connection.a.portId)
      ) &&
      !(
        connection.b.kind === "sheet-port" &&
        removedPortIds.has(connection.b.portId)
      ),
  );

  sheet.labelAnchors = sheet.labelAnchors.filter(
    (anchor) =>
      !(
        anchor.endpoint.kind === "sheet-port" &&
        removedPortIds.has(anchor.endpoint.portId)
      ),
  );
}

function cleanupEmptyHal(sheet: SheetDefinition): void {
  if (sheet.hal && Object.keys(sheet.hal).length === 0) delete sheet.hal;
}

function addSheetThreadOutput(
  sheet: SheetDefinition,
): SheetThreadOutputDefinition {
  if (!sheet.hal) sheet.hal = {};
  const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
  const usedNames = new Set(current.map((item) => item.name));
  let name = "thread";
  let index = 2;
  while (usedNames.has(name)) {
    name = `thread-${index}`;
    index += 1;
  }
  const output = { id: createId("sheetthread"), name };
  current.push(output);
  sheet.hal.threadOutputs = current;
  return output;
}

export type UpdateSheetThreadOutputNameResult =
  | { ok: true; changed: boolean; output: SheetThreadOutputDefinition }
  | {
      ok: false;
      reason: "not-found" | "empty-name" | "duplicate-name";
    };

function updateSheetThreadOutputName(
  sheet: SheetDefinition,
  outputId: string,
  name: string,
): UpdateSheetThreadOutputNameResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "empty-name" };
  if (!sheet.hal) sheet.hal = {};
  const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
  const target = current.find((item) => item.id === outputId);
  if (!target) return { ok: false, reason: "not-found" };
  if (target.name === trimmed) {
    sheet.hal.threadOutputs = current;
    return { ok: true, changed: false, output: target };
  }
  if (current.some((item) => item.id !== outputId && item.name === trimmed)) {
    return { ok: false, reason: "duplicate-name" };
  }
  target.name = trimmed;
  sheet.hal.threadOutputs = current;
  return { ok: true, changed: true, output: target };
}

export type UpdateSheetThreadOutputHalBindingResult =
  | { ok: true; changed: boolean; output: SheetThreadOutputDefinition }
  | { ok: false; reason: "not-found" };

function updateSheetThreadOutputHalBinding(
  sheet: SheetDefinition,
  outputId: string,
  halThreadId: string | null,
): UpdateSheetThreadOutputHalBindingResult {
  if (!sheet.hal) sheet.hal = {};
  const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
  const target = current.find((item) => item.id === outputId);
  if (!target) return { ok: false, reason: "not-found" };
  const normalizedHalThreadId = halThreadId?.trim() || undefined;
  if (target.halThreadId === normalizedHalThreadId) {
    sheet.hal.threadOutputs = current;
    return { ok: true, changed: false, output: target };
  }
  if (normalizedHalThreadId) target.halThreadId = normalizedHalThreadId;
  else delete target.halThreadId;
  sheet.hal.threadOutputs = current;
  return { ok: true, changed: true, output: target };
}

export type RemoveSheetThreadOutputResult =
  | {
      ok: true;
      removedOutputId: string;
      fallbackOutputId: string;
      threadOutputs: SheetThreadOutputDefinition[];
    }
  | { ok: false; reason: "not-found" | "last-output" };

function removeSheetThreadOutput(
  sheet: SheetDefinition,
  outputId: string,
): RemoveSheetThreadOutputResult {
  if (!sheet.hal) sheet.hal = {};
  const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
  if (current.length <= 1) return { ok: false, reason: "last-output" };
  if (!current.some((item) => item.id === outputId)) {
    return { ok: false, reason: "not-found" };
  }

  const next = current.filter((item) => item.id !== outputId);
  const fallbackOutputId = next[0]?.id;
  if (!fallbackOutputId) return { ok: false, reason: "last-output" };

  sheet.hal.threadOutputs = next;

  if (sheet.hal.addfQueue) {
    const normalizedQueue = normalizeAddfQueueEntries(
      sheet.hal.addfQueue.map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry.sheetThreadOutputId !== outputId) return entry;
        return { ...entry, sheetThreadOutputId: fallbackOutputId };
      }),
    );
    if (normalizedQueue.length > 0) sheet.hal.addfQueue = normalizedQueue;
    else delete sheet.hal.addfQueue;
  }

  for (const node of sheet.nodes) {
    if (node.kind !== "sheet" || !node.hal?.threadMap) continue;
    for (const [childOutputId, parentOutputId] of Object.entries(
      node.hal.threadMap,
    )) {
      if (parentOutputId === outputId) delete node.hal.threadMap[childOutputId];
    }
    if (Object.keys(node.hal.threadMap).length === 0) delete node.hal.threadMap;
    if (node.hal && Object.keys(node.hal).length === 0) delete node.hal;
  }

  cleanupEmptyHal(sheet);
  return {
    ok: true,
    removedOutputId: outputId,
    fallbackOutputId,
    threadOutputs: next,
  };
}

function setSheetAddfQueue(
  sheet: SheetDefinition,
  nodeOrder: SheetAddfQueueStoredEntry[],
): SheetAddfQueueStoredEntry[] {
  const normalized = normalizeAddfQueueEntries(nodeOrder);
  if (normalized.length > 0) {
    if (!sheet.hal) sheet.hal = {};
    sheet.hal.addfQueue = normalized;
  } else {
    delete sheet.hal?.addfQueue;
    cleanupEmptyHal(sheet);
  }
  return normalized;
}

export type RemoveSheetPortResult =
  | {
      ok: true;
      removedPortId: string;
      removedReferenceInstanceCount: number;
    }
  | { ok: false; reason: "not-found" };

function removeSheetPort(
  project: NoHALProject,
  sheetId: string,
  portId: string,
): RemoveSheetPortResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return { ok: false, reason: "not-found" };
  if (!sheet.ports.some((port) => port.id === portId)) {
    return { ok: false, reason: "not-found" };
  }

  const referenceLocations = getConnectedSheetPortReferenceLocations(
    project,
    sheetId,
    portId,
  );

  sheet.ports = sheet.ports.filter((port) => port.id !== portId);
  pruneSheetPortReferences(sheet, new Set([portId]));

  for (const reference of referenceLocations) {
    const parentSheet = getSheet(project, reference.parentSheetId);
    pruneSheetNodePinReferences(parentSheet, reference.nodeId, portId);
  }

  return {
    ok: true,
    removedPortId: portId,
    removedReferenceInstanceCount: referenceLocations.length,
  };
}

export interface AddSheetDefinitionResult {
  name: string;
  sheet: SheetDefinition;
  node: SheetNode;
}

export interface AddSheetReferenceResult {
  sheet: SheetDefinition;
  node: SheetNode;
}

export type RenameSheetDefinitionResult =
  | { ok: true; changed: boolean; sheet: SheetDefinition }
  | {
      ok: false;
      reason: "not-found" | "empty-name" | "duplicate-name";
    };

function createSheetDefinition(
  project: NoHALProject,
  baseName = "Sheet",
): SheetDefinition {
  const name = nextUniqueName(
    baseName,
    new Set(Object.values(project.sheets).map((sheet) => sheet.name)),
  );
  const sheet = createSheet(name);
  project.sheets[sheet.id] = sheet;
  return sheet;
}

function renameSheetDefinition(
  project: NoHALProject,
  sheetId: string,
  name: string,
): RenameSheetDefinitionResult {
  const target = project.sheets[sheetId];
  if (!target) return { ok: false, reason: "not-found" };

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "empty-name" };
  if (target.name === trimmed)
    return { ok: true, changed: false, sheet: target };
  if (
    Object.values(project.sheets).some(
      (sheet) => sheet.id !== sheetId && sheet.name === trimmed,
    )
  ) {
    return { ok: false, reason: "duplicate-name" };
  }

  target.name = trimmed;
  return { ok: true, changed: true, sheet: target };
}

function addSheetReference(
  project: NoHALProject,
  parentSheetId: string,
  sheetId: string,
): AddSheetReferenceResult | null {
  const parentSheet = project.sheets[parentSheetId];
  const sheet = project.sheets[sheetId];
  if (!parentSheet) return null;
  if (!sheet) return null;

  const node: SheetNode = {
    id: createId("node"),
    kind: "sheet",
    sheetId: sheet.id,
    instanceName: ensureInstanceName(parentSheet, sheet.name),
    position: defaultNodePositionForIndex(parentSheet.nodes.length),
  };
  parentSheet.nodes.push(node);

  return { sheet, node };
}

function addSheetDefinition(
  project: NoHALProject,
  parentSheetId: string,
): AddSheetDefinitionResult | null {
  const sheet = createSheetDefinition(project);
  const placed = addSheetReference(project, parentSheetId, sheet.id);
  if (!placed) {
    delete project.sheets[sheet.id];
    return null;
  }
  return { name: sheet.name, sheet, node: placed.node };
}

function removeSheetReference(
  project: NoHALProject,
  parentSheetId: string,
  nodeId: string,
): boolean {
  const parentSheet = project.sheets[parentSheetId];
  if (!parentSheet) return false;
  const removedNodeIds = new Set<string>();
  const nextNodes = parentSheet.nodes.filter((node) => {
    if (node.id !== nodeId) return true;
    removedNodeIds.add(node.id);
    return false;
  });
  if (removedNodeIds.size === 0) return false;
  parentSheet.nodes = nextNodes;
  pruneSheetNodeReferences(parentSheet, removedNodeIds);
  return true;
}

function removeSheetNodeReferencesForDeletedDefinition(
  project: NoHALProject,
  deletedSheetId: string,
): void {
  for (const sheet of Object.values(project.sheets)) {
    const removedNodeIds = new Set<string>();
    sheet.nodes = sheet.nodes.filter((node) => {
      if (node.kind !== "sheet" || node.sheetId !== deletedSheetId) return true;
      removedNodeIds.add(node.id);
      return false;
    });
    pruneSheetNodeReferences(sheet, removedNodeIds);
  }
}

function cloneSheetDefinitionSnapshot(
  source: SheetDefinition,
  name: string,
): SheetDefinition {
  const nodeIdMap = new Map<string, string>();
  const portIdMap = new Map<string, string>();
  const labelIdMap = new Map<string, string>();
  const sourceThreadOutputs = normalizeSheetThreadOutputs(
    source.hal?.threadOutputs,
  );
  const threadOutputIdMap = new Map(
    sourceThreadOutputs.map((output) => [output.id, createId("sheetthread")]),
  );

  const snapshot: SheetDefinition = {
    id: createId("sheet"),
    name,
    nodes: source.nodes.map((node) => {
      const nextId = createId("node");
      nodeIdMap.set(node.id, nextId);
      if (node.kind === "component") {
        return {
          ...structuredClone(node),
          id: nextId,
        };
      }
      const clonedNode = structuredClone(node);
      const threadMap = node.hal?.threadMap
        ? Object.fromEntries(
            Object.entries(node.hal.threadMap).map(
              ([childOutputId, parentOutputId]) => [
                childOutputId,
                threadOutputIdMap.get(parentOutputId) ?? parentOutputId,
              ],
            ),
          )
        : undefined;
      return {
        ...structuredClone(node),
        id: nextId,
        hal: threadMap
          ? { ...(clonedNode.hal ?? {}), threadMap }
          : clonedNode.hal,
      };
    }),
    ports: source.ports.map((port) => {
      const nextId = createId("port");
      portIdMap.set(port.id, nextId);
      return {
        ...structuredClone(port),
        id: nextId,
      };
    }),
    labels: source.labels.map((label) => {
      const nextId = createId("label");
      labelIdMap.set(label.id, nextId);
      return {
        ...structuredClone(label),
        id: nextId,
      };
    }),
    comments: source.comments.map((comment) => ({
      ...structuredClone(comment),
      id: createId("comment"),
    })),
    directConnections: [],
    labelAnchors: [],
  };

  const remapEndpoint = (
    endpoint: SheetDefinition["directConnections"][number]["a"],
  ) => {
    if (endpoint.kind === "node-pin") {
      return {
        kind: "node-pin" as const,
        nodeId: nodeIdMap.get(endpoint.nodeId) ?? endpoint.nodeId,
        pinKey: endpoint.pinKey,
      };
    }
    return {
      kind: "sheet-port" as const,
      portId: portIdMap.get(endpoint.portId) ?? endpoint.portId,
    };
  };

  snapshot.directConnections = source.directConnections.map((connection) => ({
    ...structuredClone(connection),
    id: createId("conn"),
    a: remapEndpoint(connection.a),
    b: remapEndpoint(connection.b),
  }));

  snapshot.labelAnchors = source.labelAnchors.map((anchor) => ({
    ...structuredClone(anchor),
    id: createId("anchor"),
    labelId: labelIdMap.get(anchor.labelId) ?? anchor.labelId,
    endpoint: remapEndpoint(anchor.endpoint),
  }));

  if (source.hal) {
    snapshot.hal = {};
    snapshot.hal.threadOutputs = sourceThreadOutputs.map((output) => ({
      ...structuredClone(output),
      id: threadOutputIdMap.get(output.id) ?? output.id,
    }));
    if (source.hal.addfQueue) {
      snapshot.hal.addfQueue = normalizeAddfQueueEntries(
        source.hal.addfQueue.map((entry) => {
          if (typeof entry === "string") {
            return nodeIdMap.get(entry) ?? entry;
          }
          return {
            ...structuredClone(entry),
            nodeId: nodeIdMap.get(entry.nodeId) ?? entry.nodeId,
            sheetThreadOutputId: entry.sheetThreadOutputId
              ? (threadOutputIdMap.get(entry.sheetThreadOutputId) ??
                entry.sheetThreadOutputId)
              : undefined,
          };
        }),
      );
    }
    cleanupEmptyHal(snapshot);
  }

  return snapshot;
}

export interface DetachSheetReferenceResult {
  originalSheetId: string;
  detachedSheet: SheetDefinition;
  node: SheetNode;
}

function detachSheetReference(
  project: NoHALProject,
  parentSheetId: string,
  nodeId: string,
): DetachSheetReferenceResult | null {
  const parentSheet = project.sheets[parentSheetId];
  if (!parentSheet) return null;
  const node = parentSheet.nodes.find(
    (entry): entry is SheetNode =>
      entry.kind === "sheet" && entry.id === nodeId,
  );
  if (!node) return null;
  const source = project.sheets[node.sheetId];
  if (!source) return null;

  const detachedName = nextUniqueName(
    `${source.name} Copy`,
    new Set(Object.values(project.sheets).map((sheet) => sheet.name)),
  );
  const detachedSheet = cloneSheetDefinitionSnapshot(source, detachedName);
  project.sheets[detachedSheet.id] = detachedSheet;
  const originalSheetId = node.sheetId;
  node.sheetId = detachedSheet.id;
  return { originalSheetId, detachedSheet, node };
}

export type DeleteSheetDefinitionResult =
  | {
      ok: true;
      deletedSheetIds: string[];
      deletedSheetName: string;
      nextActiveSheetId: string;
    }
  | { ok: false; reason: "not-found" | "root-sheet" };

function deleteSheetDefinition(
  project: NoHALProject,
  sheetId: string,
  activeSheetId: string,
): DeleteSheetDefinitionResult {
  const target = project.sheets[sheetId];
  if (!target) return { ok: false, reason: "not-found" };
  if (sheetId === project.rootSheetId) {
    return { ok: false, reason: "root-sheet" };
  }

  const referenceParentSheetIds = new Set<string>();
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "sheet" || node.sheetId !== sheetId) continue;
      referenceParentSheetIds.add(sheet.id);
    }
  }

  removeSheetNodeReferencesForDeletedDefinition(project, sheetId);
  delete project.sheets[sheetId];

  let nextActiveSheetId = activeSheetId;
  if (!project.sheets[nextActiveSheetId]) {
    nextActiveSheetId =
      [...referenceParentSheetIds].find(
        (candidateId) => project.sheets[candidateId],
      ) ?? project.rootSheetId;
  }

  return {
    ok: true,
    deletedSheetIds: [sheetId],
    deletedSheetName: target.name,
    nextActiveSheetId,
  };
}

export const sheetModelEdits = {
  port: {
    remove: removeSheetPort,
  },
  threadOutput: {
    add: addSheetThreadOutput,
    remove: removeSheetThreadOutput,
    name: {
      update: updateSheetThreadOutputName,
    },
    halBinding: {
      update: updateSheetThreadOutputHalBinding,
    },
  },
  addfQueue: {
    set: setSheetAddfQueue,
  },
  definition: {
    create: createSheetDefinition,
    add: addSheetDefinition,
    rename: renameSheetDefinition,
    remove: deleteSheetDefinition,
  },
  reference: {
    add: addSheetReference,
    remove: removeSheetReference,
    detach: detachSheetReference,
  },
} as const;
