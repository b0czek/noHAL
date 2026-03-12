import { addfQueueEntryNodeId, normalizeAddfQueueEntries } from "../addfQueue";
import { createId, slugify } from "../id";
import { createSheet } from "../project";
import type {
  NoHALProject,
  SheetAddfQueueStoredEntry,
  SheetDefinition,
  SheetNode,
  SheetThreadOutputDefinition,
} from "../types";
import { normalizeSheetThreadOutputs } from "./threads";

function nextUniqueName(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function defaultNodePosition(sheet: SheetDefinition): { x: number; y: number } {
  const index = sheet.nodes.length;
  return {
    x: 120 + (index % 4) * 280,
    y: 100 + Math.floor(index / 4) * 180,
  };
}

function ensureInstanceName(sheet: SheetDefinition, preferred: string): string {
  const used = new Set(sheet.nodes.map((node) => node.instanceName));
  return nextUniqueName(slugify(preferred).replace(/-/g, "_"), used);
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

function collectSheetSubtreeIds(
  project: NoHALProject,
  rootSheetId: string,
): Set<string> {
  const deleted = new Set<string>();
  const queue = [rootSheetId];
  while (queue.length > 0) {
    const sheetId = queue.shift();
    if (!sheetId || deleted.has(sheetId) || !project.sheets[sheetId]) continue;
    deleted.add(sheetId);
    for (const sheet of Object.values(project.sheets)) {
      if (sheet.parentSheetId === sheetId) queue.push(sheet.id);
    }
  }
  return deleted;
}

function removeSheetNodeReferencesForDeletedSheets(
  project: NoHALProject,
  deletedSheetIds: ReadonlySet<string>,
): void {
  for (const sheet of Object.values(project.sheets)) {
    const removedNodeIds = new Set<string>();
    sheet.nodes = sheet.nodes.filter((node) => {
      if (node.kind !== "sheet") return true;
      if (!deletedSheetIds.has(node.sheetId)) return true;
      removedNodeIds.add(node.id);
      return false;
    });
    pruneSheetNodeReferences(sheet, removedNodeIds);
  }
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

export interface AddSheetDefinitionResult {
  name: string;
  sheet: SheetDefinition;
  node: SheetNode;
}

function addSheetDefinition(
  project: NoHALProject,
  parentSheetId: string,
): AddSheetDefinitionResult | null {
  const parentSheet = project.sheets[parentSheetId];
  if (!parentSheet) return null;

  const name = nextUniqueName(
    "Sheet",
    new Set(Object.values(project.sheets).map((sheet) => sheet.name)),
  );
  const sheet = createSheet(name, parentSheet.id);
  const node: SheetNode = {
    id: createId("node"),
    kind: "sheet",
    sheetId: sheet.id,
    instanceName: ensureInstanceName(parentSheet, name),
    position: defaultNodePosition(parentSheet),
  };

  project.sheets[sheet.id] = sheet;
  parentSheet.nodes.push(node);

  return { name, sheet, node };
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

  const deletedSheetIds = collectSheetSubtreeIds(project, sheetId);
  if (deletedSheetIds.size === 0) return { ok: false, reason: "not-found" };

  removeSheetNodeReferencesForDeletedSheets(project, deletedSheetIds);
  for (const deletedSheetId of deletedSheetIds) {
    delete project.sheets[deletedSheetId];
  }

  let nextActiveSheetId = activeSheetId;
  if (!project.sheets[nextActiveSheetId]) {
    nextActiveSheetId =
      target.parentSheetId && project.sheets[target.parentSheetId]
        ? target.parentSheetId
        : project.rootSheetId;
  }

  return {
    ok: true,
    deletedSheetIds: [...deletedSheetIds],
    deletedSheetName: target.name,
    nextActiveSheetId,
  };
}

export const sheetModelEdits = {
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
    add: addSheetDefinition,
    remove: deleteSheetDefinition,
  },
} as const;
