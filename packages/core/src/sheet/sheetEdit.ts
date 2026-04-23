import { err, ok } from "neverthrow";
import { addfQueueEntryNodeId, normalizeAddfQueueEntries } from "../addfQueue";
import { ensureInstanceName } from "../component/naming";
import {
  getConnectedSheetPortReferenceLocations,
  getSheet,
  resolveEndpointInSheet,
} from "../graph";
import { createId, nextUniqueName } from "../id";
import { createSheet, createSheetPortDraft } from "../project";
import type {
  ChangeResult,
  DuplicateNameFailure,
  EmptyNameFailure,
  ForbiddenFailure,
  InvalidInputFailure,
  NotFoundFailure,
} from "../result";
import type {
  NoHALProject,
  SheetAddfQueueStoredEntry,
  SheetDefinition,
  SheetLabel,
  SheetNode,
  SheetNodeInstance,
  SheetPort,
  SheetThreadOutputDefinition,
} from "../types";
import { itemModelEdits } from "./itemEdit";
import { defaultNodePositionForIndex } from "./layout";
import { nodeModelEdits } from "./nodeEdit";
import { isSingletonReferenceBlocked } from "./singleton";
import { moveItemsIntoSubsheet } from "./subsheetMove";
import { isProtectedSystemNode, isProtectedSystemSheet } from "./system";
import { normalizeSheetThreadOutputs } from "./threads";

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

export type UpdateSheetThreadOutputNameResult = ChangeResult<
  SheetThreadOutputDefinition,
  | NotFoundFailure<"sheet-thread-output">
  | EmptyNameFailure<"sheet-thread-output-name">
  | DuplicateNameFailure<"sheet-thread-output-name", { name: string }>
>;

function updateSheetThreadOutputName(
  sheet: SheetDefinition,
  outputId: string,
  name: string,
): UpdateSheetThreadOutputNameResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return err({
      code: "invalid-input",
      cause: "sheet-thread-output-name",
      detail: "empty-name",
    });
  }
  if (!sheet.hal) sheet.hal = {};
  const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
  const target = current.find((item) => item.id === outputId);
  if (!target) {
    return err({ code: "not-found", cause: "sheet-thread-output" });
  }
  if (target.name === trimmed) {
    sheet.hal.threadOutputs = current;
    return ok({ data: target, changed: false });
  }
  if (current.some((item) => item.id !== outputId && item.name === trimmed)) {
    return err({
      code: "conflict",
      cause: "sheet-thread-output-name",
      detail: "duplicate-name",
      meta: { name: trimmed },
    });
  }
  target.name = trimmed;
  sheet.hal.threadOutputs = current;
  return ok({ data: target, changed: true });
}

export type UpdateSheetThreadOutputHalBindingResult = ChangeResult<
  SheetThreadOutputDefinition,
  NotFoundFailure<"sheet-thread-output">
>;

function updateSheetThreadOutputHalBinding(
  sheet: SheetDefinition,
  outputId: string,
  halThreadId: string | null,
): UpdateSheetThreadOutputHalBindingResult {
  if (!sheet.hal) sheet.hal = {};
  const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
  const target = current.find((item) => item.id === outputId);
  if (!target) {
    return err({ code: "not-found", cause: "sheet-thread-output" });
  }
  const normalizedHalThreadId = halThreadId?.trim() || undefined;
  if (target.halThreadId === normalizedHalThreadId) {
    sheet.hal.threadOutputs = current;
    return ok({ data: target, changed: false });
  }
  if (normalizedHalThreadId) target.halThreadId = normalizedHalThreadId;
  else delete target.halThreadId;
  sheet.hal.threadOutputs = current;
  return ok({ data: target, changed: true });
}

export type ConvertLabelToSheetPortFailure =
  | NotFoundFailure<"sheet">
  | NotFoundFailure<"label">
  | InvalidInputFailure<"label", "not-convertible">;

export type ConvertLabelToSheetPortResult = ChangeResult<
  { labelId: string; port: SheetPort },
  ConvertLabelToSheetPortFailure
>;

function convertLabelToSheetPort(
  project: NoHALProject,
  sheetId: string,
  labelId: string,
): ConvertLabelToSheetPortResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) {
    return err({
      code: "not-found",
      cause: "sheet",
    });
  }

  const label = sheet.labels.find((entry) => entry.id === labelId);
  if (!label) {
    return err({
      code: "not-found",
      cause: "label",
    });
  }

  const anchors = sheet.labelAnchors.filter(
    (entry) => entry.labelId === labelId,
  );
  if (anchors.length !== 1) {
    return err({
      code: "invalid-input",
      cause: "label",
      detail: "not-convertible",
    });
  }

  const [anchor] = anchors;
  if (anchor.endpoint.kind !== "node-pin") {
    return err({
      code: "invalid-input",
      cause: "label",
      detail: "not-convertible",
    });
  }

  let resolved: ReturnType<typeof resolveEndpointInSheet>;
  try {
    resolved = resolveEndpointInSheet(project, sheetId, anchor.endpoint);
  } catch {
    return err({
      code: "not-found",
      cause: "label",
    });
  }

  const usedPortNames = new Set(sheet.ports.map((entry) => entry.name));
  const portName = nextUniqueName(label.name, usedPortNames);
  const port = createSheetPortDraft(
    portName,
    resolved.direction,
    resolved.type,
  );
  port.name = portName;
  port.position = { ...label.position };

  sheet.ports.push(port);
  sheet.directConnections.push({
    id: createId("conn"),
    a: {
      kind: "node-pin",
      nodeId: anchor.endpoint.nodeId,
      pinKey: anchor.endpoint.pinKey,
    },
    b: { kind: "sheet-port", portId: port.id },
  });
  sheet.labelAnchors = sheet.labelAnchors.filter(
    (entry) => entry.labelId !== labelId,
  );
  sheet.labels = sheet.labels.filter((entry) => entry.id !== labelId);

  return ok({
    data: { labelId, port },
    changed: true,
  });
}

export type RemoveSheetThreadOutputResult = ChangeResult<
  {
    removedOutputId: string;
    fallbackOutputId: string;
    threadOutputs: SheetThreadOutputDefinition[];
  },
  | NotFoundFailure<"sheet-thread-output">
  | ForbiddenFailure<"sheet-thread-output", "last-output">
>;

function removeSheetThreadOutput(
  sheet: SheetDefinition,
  outputId: string,
): RemoveSheetThreadOutputResult {
  if (!sheet.hal) sheet.hal = {};
  const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
  if (current.length <= 1) {
    return err({
      code: "forbidden",
      cause: "sheet-thread-output",
      detail: "last-output",
    });
  }
  if (!current.some((item) => item.id === outputId)) {
    return err({ code: "not-found", cause: "sheet-thread-output" });
  }

  const next = current.filter((item) => item.id !== outputId);
  const fallbackOutputId = next[0]?.id;
  if (!fallbackOutputId) {
    return err({
      code: "forbidden",
      cause: "sheet-thread-output",
      detail: "last-output",
    });
  }

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
  return ok({
    data: {
      removedOutputId: outputId,
      fallbackOutputId,
      threadOutputs: next,
    },
    changed: true,
  });
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

export type RemoveSheetPortResult = ChangeResult<
  {
    removedPortId: string;
    removedReferenceInstanceCount: number;
  },
  NotFoundFailure<"sheet" | "sheet-port">
>;

function removeSheetPort(
  project: NoHALProject,
  sheetId: string,
  portId: string,
): RemoveSheetPortResult {
  const sheet = project.sheets[sheetId];
  if (!sheet) return err({ code: "not-found", cause: "sheet" });
  if (!sheet.ports.some((port) => port.id === portId)) {
    return err({ code: "not-found", cause: "sheet-port" });
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

  return ok({
    data: {
      removedPortId: portId,
      removedReferenceInstanceCount: referenceLocations.length,
    },
    changed: true,
  });
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

function wouldCreateRecursiveSheetHierarchy(
  project: NoHALProject,
  parentSheetId: string,
  targetSheetId: string,
): boolean {
  if (parentSheetId === targetSheetId) return true;

  const visited = new Set<string>();
  const stack: string[] = [targetSheetId];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;
    if (currentId === parentSheetId) return true;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const current = project.sheets[currentId];
    if (!current) continue;
    for (const node of current.nodes) {
      if (node.kind !== "sheet") continue;
      stack.push(node.sheetId);
    }
  }

  return false;
}

export type AddSheetReferenceFailure =
  | NotFoundFailure<"sheet">
  | NotFoundFailure<"sheet-definition">
  | InvalidInputFailure<"sheet-reference", "self-reference">
  | InvalidInputFailure<"sheet-reference", "recursive-hierarchy">
  | ForbiddenFailure<"sheet-reference", "already-placed">;

export type RenameSheetDefinitionResult = ChangeResult<
  SheetDefinition,
  | NotFoundFailure<"sheet-definition">
  | EmptyNameFailure<"sheet-definition-name">
  | DuplicateNameFailure<"sheet-definition-name", { name: string }>
>;

export interface SheetItemIds {
  nodeIds: ReadonlySet<string>;
  labelIds: ReadonlySet<string>;
  portIds: ReadonlySet<string>;
}

export type MoveSheetItemsFailureReason =
  | "not-found"
  | "no-movable-items"
  | "only-ports"
  | "protected-system-node"
  | "target-in-items";

interface PreparedSheetItemsMove {
  parentSheet: SheetDefinition;
  movedNodes: SheetNodeInstance[];
  movedLabels: SheetLabel[];
  movedNodeIds: string[];
  movedLabelIds: string[];
}

export interface MoveSheetItemsSuccess {
  name: string;
  sheet: SheetDefinition;
  node: SheetNode;
  movedNodeCount: number;
  movedLabelCount: number;
  createdPortCount: number;
}

export type MoveSheetItemsResult = ChangeResult<
  MoveSheetItemsSuccess,
  | NotFoundFailure<"sheet" | "sheet-node" | "sheet-definition">
  | InvalidInputFailure<
      "selection",
      "no-movable-items" | "only-ports" | "target-in-items"
    >
  | ForbiddenFailure<"selection", "protected-system-node">
>;

export interface RemoveSheetItemsInput {
  nodeIds: ReadonlySet<string>;
  labelIds: ReadonlySet<string>;
  commentIds: ReadonlySet<string>;
  portIds: ReadonlySet<string>;
}

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
  if (!target) return err({ code: "not-found", cause: "sheet-definition" });

  const trimmed = name.trim();
  if (!trimmed) {
    return err({
      code: "invalid-input",
      cause: "sheet-definition-name",
      detail: "empty-name",
    });
  }
  if (target.name === trimmed) return ok({ data: target, changed: false });
  if (
    Object.values(project.sheets).some(
      (sheet) => sheet.id !== sheetId && sheet.name === trimmed,
    )
  ) {
    return err({
      code: "conflict",
      cause: "sheet-definition-name",
      detail: "duplicate-name",
      meta: { name: trimmed },
    });
  }

  target.name = trimmed;
  return ok({ data: target, changed: true });
}

function addSheetReference(
  project: NoHALProject,
  parentSheetId: string,
  sheetId: string,
): ChangeResult<AddSheetReferenceResult, AddSheetReferenceFailure> {
  const parentSheet = project.sheets[parentSheetId];
  const sheet = project.sheets[sheetId];
  if (!parentSheet) return err({ code: "not-found", cause: "sheet" });
  if (!sheet) return err({ code: "not-found", cause: "sheet-definition" });
  if (parentSheetId === sheetId) {
    return err({
      code: "invalid-input",
      cause: "sheet-reference",
      detail: "self-reference",
    });
  }
  if (wouldCreateRecursiveSheetHierarchy(project, parentSheetId, sheetId)) {
    return err({
      code: "invalid-input",
      cause: "sheet-reference",
      detail: "recursive-hierarchy",
    });
  }
  if (isSingletonReferenceBlocked(project, parentSheetId, sheetId)) {
    return err({
      code: "forbidden",
      cause: "sheet-reference",
      detail: "already-placed",
    });
  }

  const node: SheetNode = {
    id: createId("node"),
    kind: "sheet",
    sheetId: sheet.id,
    instanceName: ensureInstanceName(parentSheet, sheet.name),
    position: defaultNodePositionForIndex(parentSheet.nodes.length),
  };
  parentSheet.nodes.push(node);

  return ok({ data: { sheet, node }, changed: true });
}

function addSheetDefinition(
  project: NoHALProject,
  parentSheetId: string,
): ChangeResult<AddSheetDefinitionResult, NotFoundFailure<"sheet">> {
  const parentSheet = project.sheets[parentSheetId];
  if (!parentSheet) return err({ code: "not-found", cause: "sheet" });

  const sheet = createSheetDefinition(project);
  const placed = addSheetReference(project, parentSheetId, sheet.id);
  if (placed.isErr()) {
    delete project.sheets[sheet.id];
    return err({ code: "not-found", cause: "sheet" });
  }
  return ok({
    data: { name: sheet.name, sheet, node: placed.value.data.node },
    changed: true,
  });
}

function prepareSheetItemsMove(
  project: NoHALProject,
  parentSheetId: string,
  items: SheetItemIds,
): PreparedSheetItemsMove | { reason: MoveSheetItemsFailureReason } {
  if (
    items.nodeIds.size === 0 &&
    items.labelIds.size === 0 &&
    items.portIds.size > 0
  ) {
    return { reason: "only-ports" };
  }

  const parentSheet = project.sheets[parentSheetId];
  if (!parentSheet) return { reason: "not-found" };

  const movedNodes = parentSheet.nodes.filter((node) =>
    items.nodeIds.has(node.id),
  );
  const movedLabels = parentSheet.labels.filter((label) =>
    items.labelIds.has(label.id),
  );
  if (movedNodes.some((node) => isProtectedSystemNode(project, node))) {
    return { reason: "protected-system-node" };
  }
  if (movedNodes.length === 0 && movedLabels.length === 0) {
    return { reason: "no-movable-items" };
  }

  return {
    parentSheet,
    movedNodes,
    movedLabels,
    movedNodeIds: movedNodes.map((node) => node.id),
    movedLabelIds: movedLabels.map((label) => label.id),
  };
}

function boundsForNodesAndLabels(
  nodes: { position: { x: number; y: number } }[],
  labels: { position: { x: number; y: number } }[],
): { x: number; y: number } {
  const points = [
    ...nodes.map((node) => node.position),
    ...labels.map((label) => label.position),
  ];
  if (points.length === 0) return defaultNodePositionForIndex(0);
  let minX = points[0].x;
  let minY = points[0].y;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
  }
  return { x: minX, y: minY };
}

function moveItemsIntoNewSubsheet(
  project: NoHALProject,
  parentSheetId: string,
  items: SheetItemIds,
): MoveSheetItemsResult {
  const prepared = prepareSheetItemsMove(project, parentSheetId, items);
  if ("reason" in prepared) {
    if (prepared.reason === "not-found") {
      return err({ code: "not-found", cause: "sheet" });
    }
    if (prepared.reason === "protected-system-node") {
      return err({
        code: "forbidden",
        cause: "selection",
        detail: "protected-system-node",
      });
    }
    return err({
      code: "invalid-input",
      cause: "selection",
      detail: prepared.reason,
    });
  }

  const sheet = createSheetDefinition(project);
  const node: SheetNode = {
    id: createId("node"),
    kind: "sheet",
    sheetId: sheet.id,
    instanceName: ensureInstanceName(prepared.parentSheet, sheet.name),
    position: boundsForNodesAndLabels(
      prepared.movedNodes,
      prepared.movedLabels,
    ),
  };
  const moveResult = moveItemsIntoSubsheet(project, {
    parentSheetId,
    childSheetId: sheet.id,
    subsheetNode: node,
    movedNodeIds: prepared.movedNodeIds,
    movedLabelIds: prepared.movedLabelIds,
  });

  return ok({
    data: {
      name: sheet.name,
      sheet,
      node,
      movedNodeCount: moveResult.movedNodeCount,
      movedLabelCount: moveResult.movedLabelCount,
      createdPortCount: moveResult.createdPortCount,
    },
    changed: true,
  });
}

function moveItemsIntoExistingSubsheet(
  project: NoHALProject,
  parentSheetId: string,
  subsheetNodeId: string,
  items: SheetItemIds,
): MoveSheetItemsResult {
  const prepared = prepareSheetItemsMove(project, parentSheetId, items);
  if ("reason" in prepared) {
    if (prepared.reason === "not-found") {
      return err({ code: "not-found", cause: "sheet" });
    }
    if (prepared.reason === "protected-system-node") {
      return err({
        code: "forbidden",
        cause: "selection",
        detail: "protected-system-node",
      });
    }
    return err({
      code: "invalid-input",
      cause: "selection",
      detail: prepared.reason,
    });
  }
  if (items.nodeIds.has(subsheetNodeId)) {
    return err({
      code: "invalid-input",
      cause: "selection",
      detail: "target-in-items",
    });
  }

  const subsheetNode = prepared.parentSheet.nodes.find(
    (node): node is SheetNode =>
      node.kind === "sheet" && node.id === subsheetNodeId,
  );
  if (!subsheetNode) return err({ code: "not-found", cause: "sheet-node" });
  const childSheet = project.sheets[subsheetNode.sheetId];
  if (!childSheet) {
    return err({ code: "not-found", cause: "sheet-definition" });
  }

  const moveResult = moveItemsIntoSubsheet(project, {
    parentSheetId,
    childSheetId: childSheet.id,
    subsheetNode,
    movedNodeIds: prepared.movedNodeIds,
    movedLabelIds: prepared.movedLabelIds,
  });

  return ok({
    data: {
      name: childSheet.name,
      sheet: childSheet,
      node: subsheetNode,
      movedNodeCount: moveResult.movedNodeCount,
      movedLabelCount: moveResult.movedLabelCount,
      createdPortCount: moveResult.createdPortCount,
    },
    changed: true,
  });
}

function removeSheetItems(
  project: NoHALProject,
  sheetId: string,
  items: RemoveSheetItemsInput,
): void {
  const sheet = project.sheets[sheetId];
  if (!sheet) return;

  if (items.nodeIds.size > 0) {
    const removedNodeIds = new Set<string>();
    sheet.nodes = sheet.nodes.filter((node) => {
      if (!items.nodeIds.has(node.id)) return true;
      removedNodeIds.add(node.id);
      return false;
    });
    pruneSheetNodeReferences(sheet, removedNodeIds);
  }

  if (items.labelIds.size > 0) {
    sheet.labels = sheet.labels.filter(
      (label) => !items.labelIds.has(label.id),
    );
    sheet.labelAnchors = sheet.labelAnchors.filter(
      (anchor) => !items.labelIds.has(anchor.labelId),
    );
  }

  if (items.commentIds.size > 0) {
    sheet.comments = sheet.comments.filter(
      (comment) => !items.commentIds.has(comment.id),
    );
  }

  if (items.portIds.size > 0) {
    for (const portId of items.portIds) {
      removeSheetPort(project, sheetId, portId);
    }
  }
}

export type RemoveSheetReferenceResult = ChangeResult<
  { removedNodeId: string },
  | NotFoundFailure<"sheet" | "sheet-node">
  | ForbiddenFailure<"sheet-reference", "protected-system-sheet">
>;

function removeSheetReference(
  project: NoHALProject,
  parentSheetId: string,
  nodeId: string,
): RemoveSheetReferenceResult {
  const parentSheet = project.sheets[parentSheetId];
  if (!parentSheet) return err({ code: "not-found", cause: "sheet" });
  const target = parentSheet.nodes.find(
    (node): node is SheetNode => node.kind === "sheet" && node.id === nodeId,
  );
  if (!target) return err({ code: "not-found", cause: "sheet-node" });
  if (isProtectedSystemSheet(project, target.sheetId)) {
    return err({
      code: "forbidden",
      cause: "sheet-reference",
      detail: "protected-system-sheet",
    });
  }
  const removedNodeIds = new Set<string>();
  const nextNodes = parentSheet.nodes.filter((node) => {
    if (node.id !== nodeId) return true;
    removedNodeIds.add(node.id);
    return false;
  });
  parentSheet.nodes = nextNodes;
  pruneSheetNodeReferences(parentSheet, removedNodeIds);
  return ok({ data: { removedNodeId: nodeId }, changed: true });
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

export type DetachSheetReferenceEditResult = ChangeResult<
  DetachSheetReferenceResult,
  | NotFoundFailure<"sheet" | "sheet-node" | "sheet-definition">
  | ForbiddenFailure<"sheet-reference", "protected-system-sheet">
>;

function detachSheetReference(
  project: NoHALProject,
  parentSheetId: string,
  nodeId: string,
): DetachSheetReferenceEditResult {
  const parentSheet = project.sheets[parentSheetId];
  if (!parentSheet) return err({ code: "not-found", cause: "sheet" });
  const node = parentSheet.nodes.find(
    (entry): entry is SheetNode =>
      entry.kind === "sheet" && entry.id === nodeId,
  );
  if (!node) return err({ code: "not-found", cause: "sheet-node" });
  if (isProtectedSystemSheet(project, node.sheetId)) {
    return err({
      code: "forbidden",
      cause: "sheet-reference",
      detail: "protected-system-sheet",
    });
  }
  const source = project.sheets[node.sheetId];
  if (!source) return err({ code: "not-found", cause: "sheet-definition" });

  const detachedName = nextUniqueName(
    `${source.name} Copy`,
    new Set(Object.values(project.sheets).map((sheet) => sheet.name)),
  );
  const detachedSheet = cloneSheetDefinitionSnapshot(source, detachedName);
  project.sheets[detachedSheet.id] = detachedSheet;
  const originalSheetId = node.sheetId;
  node.sheetId = detachedSheet.id;
  return ok({
    data: { originalSheetId, detachedSheet, node },
    changed: true,
  });
}

export type DeleteSheetDefinitionResult = ChangeResult<
  {
    deletedSheetIds: string[];
    deletedSheetName: string;
    nextActiveSheetId: string;
  },
  | NotFoundFailure<"sheet-definition">
  | ForbiddenFailure<
      "sheet-definition",
      "root-sheet" | "protected-system-sheet"
    >
>;

function deleteSheetDefinition(
  project: NoHALProject,
  sheetId: string,
  activeSheetId: string,
): DeleteSheetDefinitionResult {
  const target = project.sheets[sheetId];
  if (!target) return err({ code: "not-found", cause: "sheet-definition" });
  if (sheetId === project.rootSheetId) {
    return err({
      code: "forbidden",
      cause: "sheet-definition",
      detail: "root-sheet",
    });
  }
  if (isProtectedSystemSheet(project, sheetId)) {
    return err({
      code: "forbidden",
      cause: "sheet-definition",
      detail: "protected-system-sheet",
    });
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

  return ok({
    data: {
      deletedSheetIds: [sheetId],
      deletedSheetName: target.name,
      nextActiveSheetId,
    },
    changed: true,
  });
}

export const sheetModelEdits = {
  node: nodeModelEdits,
  item: itemModelEdits,
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
  label: {
    convertToPort: convertLabelToSheetPort,
  },
  definition: {
    create: createSheetDefinition,
    add: addSheetDefinition,
    rename: renameSheetDefinition,
    remove: deleteSheetDefinition,
  },
  items: {
    moveIntoNewSubsheet: moveItemsIntoNewSubsheet,
    moveIntoExistingSubsheet: moveItemsIntoExistingSubsheet,
    remove: removeSheetItems,
  },
  reference: {
    add: addSheetReference,
    remove: removeSheetReference,
    detach: detachSheetReference,
  },
} as const;
