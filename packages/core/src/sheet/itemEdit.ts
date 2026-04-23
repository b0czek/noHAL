import { err, ok } from "neverthrow";
import { isValidHalName } from "../halNames";
import { createId, nextUniqueName } from "../id";
import type {
  Change,
  ChangeResult,
  ConflictFailure,
  InvalidInputFailure,
  NotFoundFailure,
} from "../result";
import type {
  HalValueType,
  LabelScope,
  PinDirection,
  PortSide,
  SheetComment,
  SheetDefinition,
  SheetEndpointRef,
  SheetLabel,
  SheetPort,
  XY,
} from "../types";
import {
  defaultCommentPositionForIndex,
  defaultLabelPositionForIndex,
  defaultPortPositionForIndex,
  normalizeRotationDegrees,
} from "./layout";

function nextName(base: string, used: ReadonlySet<string>): string {
  return nextUniqueName(base, used);
}

function defaultLabelPosition(sheet: SheetDefinition): XY {
  return defaultLabelPositionForIndex(sheet.labels.length);
}

function defaultCommentPosition(sheet: SheetDefinition): XY {
  return defaultCommentPositionForIndex(sheet.comments.length);
}

function forcedPortSideForDirection(direction: PinDirection): PortSide {
  if (direction === "in") return "right";
  if (direction === "out") return "left";
  return "top";
}

function defaultPortPosition(sheet: SheetDefinition, side: PortSide): XY {
  const count = sheet.ports.filter((port) => port.side === side).length;
  return defaultPortPositionForIndex(count, side);
}

function endpointMovesWithGroup(
  endpoint: SheetEndpointRef,
  movedNodeIds: ReadonlySet<string>,
  movedPortIds: ReadonlySet<string>,
): boolean {
  return endpoint.kind === "node-pin"
    ? movedNodeIds.has(endpoint.nodeId)
    : movedPortIds.has(endpoint.portId);
}

function captureMoveDelta(
  moveDelta: XY | null,
  currentPosition: XY,
  nextPosition: XY,
): XY | null {
  return (
    moveDelta ?? {
      x: nextPosition.x - currentPosition.x,
      y: nextPosition.y - currentPosition.y,
    }
  );
}

function applyPositionUpdates<T extends { id: string; position: XY }>(
  entries: T[],
  updates: Map<string, XY>,
  moveDelta: XY | null,
): XY | null {
  let nextMoveDelta = moveDelta;
  for (const entry of entries) {
    const next = updates.get(entry.id);
    if (!next) continue;
    nextMoveDelta = captureMoveDelta(nextMoveDelta, entry.position, next);
    entry.position = { x: next.x, y: next.y };
  }
  return nextMoveDelta;
}

function moveConnectionWaypointsWithGroup(
  sheet: SheetDefinition,
  movedNodeIds: ReadonlySet<string>,
  movedPortIds: ReadonlySet<string>,
  moveDelta: XY | null,
): void {
  if (
    !moveDelta ||
    (moveDelta.x === 0 && moveDelta.y === 0) ||
    (movedNodeIds.size === 0 && movedPortIds.size === 0)
  ) {
    return;
  }

  for (const connection of sheet.directConnections) {
    if (!connection.waypoints || connection.waypoints.length === 0) {
      continue;
    }
    if (
      !endpointMovesWithGroup(connection.a, movedNodeIds, movedPortIds) ||
      !endpointMovesWithGroup(connection.b, movedNodeIds, movedPortIds)
    ) {
      continue;
    }
    connection.waypoints = connection.waypoints.map((point) => ({
      x: point.x + moveDelta.x,
      y: point.y + moveDelta.y,
    }));
  }
}

export type AddLabelResult = Change<SheetLabel>;

function addLabel(
  sheet: SheetDefinition,
  scope: LabelScope,
  position?: XY,
): AddLabelResult {
  const used = new Set(sheet.labels.map((label) => label.name));
  const base = scope === "global" ? "global_sig" : "sig";
  const label: SheetLabel = {
    id: createId("label"),
    name: nextName(base, used),
    scope,
    position: position ?? defaultLabelPosition(sheet),
    rotation: 0,
  };
  sheet.labels.push(label);
  return { data: label, changed: true };
}

export type AddCommentResult = Change<SheetComment>;

function addComment(sheet: SheetDefinition, position?: XY): AddCommentResult {
  const comment: SheetComment = {
    id: createId("comment"),
    text: "Comment",
    position: position ?? defaultCommentPosition(sheet),
    rotation: 0,
  };
  sheet.comments.push(comment);
  return { data: comment, changed: true };
}

export type AddSheetPortResult = Change<SheetPort>;

function addSheetPort(
  sheet: SheetDefinition,
  direction: PinDirection,
  type: HalValueType,
  position?: XY,
): AddSheetPortResult {
  const used = new Set(sheet.ports.map((port) => port.name));
  let base = "io_sig";
  if (direction === "in") base = "in_sig";
  else if (direction === "out") base = "out_sig";
  const side = forcedPortSideForDirection(direction);
  const port: SheetPort = {
    id: createId("port"),
    name: nextName(base, used),
    direction,
    type,
    side,
    position: position ?? defaultPortPosition(sheet, side),
  };
  sheet.ports.push(port);
  return { data: port, changed: true };
}

type PositionResult<C extends string> = ChangeResult<XY, NotFoundFailure<C>>;

function moveNode(
  sheet: SheetDefinition,
  nodeId: string,
  x: number,
  y: number,
): PositionResult<"node"> {
  const node = sheet.nodes.find((entry) => entry.id === nodeId);
  if (!node) return err({ code: "not-found", cause: "node" });
  if (node.position.x === x && node.position.y === y) {
    return ok({ data: node.position, changed: false });
  }
  node.position = { x, y };
  return ok({ data: node.position, changed: true });
}

function moveLabel(
  sheet: SheetDefinition,
  labelId: string,
  x: number,
  y: number,
): PositionResult<"label"> {
  const label = sheet.labels.find((entry) => entry.id === labelId);
  if (!label) return err({ code: "not-found", cause: "label" });
  if (label.position.x === x && label.position.y === y) {
    return ok({ data: label.position, changed: false });
  }
  label.position = { x, y };
  return ok({ data: label.position, changed: true });
}

function moveComment(
  sheet: SheetDefinition,
  commentId: string,
  x: number,
  y: number,
): PositionResult<"comment"> {
  const comment = sheet.comments.find((entry) => entry.id === commentId);
  if (!comment) return err({ code: "not-found", cause: "comment" });
  if (comment.position.x === x && comment.position.y === y) {
    return ok({ data: comment.position, changed: false });
  }
  comment.position = { x, y };
  return ok({ data: comment.position, changed: true });
}

function movePort(
  sheet: SheetDefinition,
  portId: string,
  x: number,
  y: number,
): PositionResult<"sheet-port"> {
  const port = sheet.ports.find((entry) => entry.id === portId);
  if (!port) return err({ code: "not-found", cause: "sheet-port" });
  if (port.position.x === x && port.position.y === y) {
    return ok({ data: port.position, changed: false });
  }
  port.position = { x, y };
  return ok({ data: port.position, changed: true });
}

export type MoveSelectionGroupResult = Change<{
  movedNodeCount: number;
  movedLabelCount: number;
  movedCommentCount: number;
  movedPortCount: number;
}>;

function moveSelectionGroup(
  sheet: SheetDefinition,
  updates: {
    nodePositions: Array<{ id: string; x: number; y: number }>;
    labelPositions: Array<{ id: string; x: number; y: number }>;
    commentPositions: Array<{ id: string; x: number; y: number }>;
    portPositions: Array<{ id: string; x: number; y: number }>;
  },
): MoveSelectionGroupResult {
  if (
    updates.nodePositions.length === 0 &&
    updates.labelPositions.length === 0 &&
    updates.commentPositions.length === 0 &&
    updates.portPositions.length === 0
  ) {
    return {
      data: {
        movedNodeCount: 0,
        movedLabelCount: 0,
        movedCommentCount: 0,
        movedPortCount: 0,
      },
      changed: false,
    };
  }

  const nodeUpdates = new Map(
    updates.nodePositions.map((entry) => [
      entry.id,
      { x: entry.x, y: entry.y },
    ]),
  );
  const labelUpdates = new Map(
    updates.labelPositions.map((entry) => [
      entry.id,
      { x: entry.x, y: entry.y },
    ]),
  );
  const commentUpdates = new Map(
    updates.commentPositions.map((entry) => [
      entry.id,
      { x: entry.x, y: entry.y },
    ]),
  );
  const portUpdates = new Map(
    updates.portPositions.map((entry) => [
      entry.id,
      { x: entry.x, y: entry.y },
    ]),
  );
  const movedNodeIds = new Set(nodeUpdates.keys());
  const movedPortIds = new Set(portUpdates.keys());
  let moveDelta: XY | null = null;

  moveDelta = applyPositionUpdates(sheet.nodes, nodeUpdates, moveDelta);
  moveDelta = applyPositionUpdates(sheet.labels, labelUpdates, moveDelta);
  moveDelta = applyPositionUpdates(sheet.comments, commentUpdates, moveDelta);
  moveDelta = applyPositionUpdates(sheet.ports, portUpdates, moveDelta);
  moveConnectionWaypointsWithGroup(
    sheet,
    movedNodeIds,
    movedPortIds,
    moveDelta,
  );

  return {
    data: {
      movedNodeCount: updates.nodePositions.length,
      movedLabelCount: updates.labelPositions.length,
      movedCommentCount: updates.commentPositions.length,
      movedPortCount: updates.portPositions.length,
    },
    changed: true,
  };
}

export type UpdateLabelFailure =
  | NotFoundFailure<"label">
  | InvalidInputFailure<"label", "invalid-name">;

export type UpdateLabelResult = ChangeResult<SheetLabel, UpdateLabelFailure>;

function updateLabel(
  sheet: SheetDefinition,
  labelId: string,
  patch: { name?: string; scope?: LabelScope; rotation?: number },
): UpdateLabelResult {
  const label = sheet.labels.find((entry) => entry.id === labelId);
  if (!label) {
    return err({
      code: "not-found",
      cause: "label",
    });
  }

  const normalizedName =
    patch.name !== undefined ? patch.name.trim() : undefined;
  if (normalizedName !== undefined && normalizedName.length > 0) {
    if (!isValidHalName(normalizedName)) {
      return err({
        code: "invalid-input",
        cause: "label",
        detail: "invalid-name",
      });
    }
  }

  const before = JSON.stringify(label);
  if (normalizedName !== undefined && normalizedName.length > 0) {
    label.name = normalizedName;
  }
  if (patch.scope !== undefined) label.scope = patch.scope;
  if (patch.rotation !== undefined) {
    label.rotation = normalizeRotationDegrees(patch.rotation);
  }

  return ok({ data: label, changed: JSON.stringify(label) !== before });
}

export type UpdateCommentFailure = NotFoundFailure<"comment">;

export type UpdateCommentResult = ChangeResult<
  SheetComment,
  UpdateCommentFailure
>;

function updateComment(
  sheet: SheetDefinition,
  commentId: string,
  patch: { text?: string; rotation?: number },
): UpdateCommentResult {
  const comment = sheet.comments.find((entry) => entry.id === commentId);
  if (!comment) {
    return err({
      code: "not-found",
      cause: "comment",
    });
  }
  const before = JSON.stringify(comment);
  if (patch.text !== undefined) comment.text = patch.text;
  if (patch.rotation !== undefined) {
    comment.rotation = normalizeRotationDegrees(patch.rotation);
  }
  return ok({ data: comment, changed: JSON.stringify(comment) !== before });
}

export type UpdateSheetPortFailure =
  | NotFoundFailure<"sheet-port">
  | InvalidInputFailure<"sheet-port", "invalid-name", { name: string }>
  | ConflictFailure<"sheet-port", "duplicate-name", { name: string }>;

export type UpdateSheetPortResult = ChangeResult<
  SheetPort,
  UpdateSheetPortFailure
>;

function updateSheetPort(
  sheet: SheetDefinition,
  portId: string,
  patch: {
    name?: string;
    direction?: PinDirection;
    type?: HalValueType;
    rotation?: number;
  },
): UpdateSheetPortResult {
  const port = sheet.ports.find((entry) => entry.id === portId);
  if (!port) {
    return err({
      code: "not-found",
      cause: "sheet-port",
    });
  }

  const normalizedName =
    patch.name !== undefined ? patch.name.trim() : undefined;
  if (normalizedName !== undefined && normalizedName.length > 0) {
    if (!isValidHalName(normalizedName)) {
      return err({
        code: "invalid-input",
        cause: "sheet-port",
        detail: "invalid-name",
        meta: { name: normalizedName },
      });
    }
    const duplicate = sheet.ports.some(
      (candidate) =>
        candidate.id !== portId && candidate.name === normalizedName,
    );
    if (duplicate) {
      return err({
        code: "conflict",
        cause: "sheet-port",
        detail: "duplicate-name",
        meta: { name: normalizedName },
      });
    }
  }

  const before = JSON.stringify(port);
  if (normalizedName !== undefined && normalizedName.length > 0) {
    port.name = normalizedName;
  }
  if (patch.direction !== undefined) {
    port.direction = patch.direction;
    port.side = forcedPortSideForDirection(patch.direction);
    port.position = defaultPortPosition(sheet, port.side);
  }
  if (patch.type !== undefined) port.type = patch.type;
  if (patch.rotation !== undefined) {
    port.rotation = normalizeRotationDegrees(patch.rotation);
  }

  return ok({ data: port, changed: JSON.stringify(port) !== before });
}

export type RotateSelectionResult = Change<{
  rotatedLabelCount: number;
  rotatedCommentCount: number;
  rotatedPortCount: number;
}>;

function rotateSelection(
  sheet: SheetDefinition,
  selection: {
    labelIds: ReadonlySet<string>;
    commentIds: ReadonlySet<string>;
    portIds: ReadonlySet<string>;
  },
  stepDegrees: number,
): RotateSelectionResult {
  if (!Number.isFinite(stepDegrees) || stepDegrees === 0) {
    return {
      data: {
        rotatedLabelCount: 0,
        rotatedCommentCount: 0,
        rotatedPortCount: 0,
      },
      changed: false,
    };
  }

  const hasEligibleSelection =
    sheet.labels.some((label) => selection.labelIds.has(label.id)) ||
    sheet.comments.some((comment) => selection.commentIds.has(comment.id)) ||
    sheet.ports.some((port) => selection.portIds.has(port.id));
  if (!hasEligibleSelection) {
    return {
      data: {
        rotatedLabelCount: 0,
        rotatedCommentCount: 0,
        rotatedPortCount: 0,
      },
      changed: false,
    };
  }

  let rotatedLabelCount = 0;
  let rotatedCommentCount = 0;
  let rotatedPortCount = 0;

  for (const label of sheet.labels) {
    if (!selection.labelIds.has(label.id)) continue;
    label.rotation = normalizeRotationDegrees(
      (label.rotation ?? 0) + stepDegrees,
    );
    rotatedLabelCount += 1;
  }
  for (const comment of sheet.comments) {
    if (!selection.commentIds.has(comment.id)) continue;
    comment.rotation = normalizeRotationDegrees(
      (comment.rotation ?? 0) + stepDegrees,
    );
    rotatedCommentCount += 1;
  }
  for (const port of sheet.ports) {
    if (!selection.portIds.has(port.id)) continue;
    port.rotation = normalizeRotationDegrees(
      (port.rotation ?? 0) + stepDegrees,
    );
    rotatedPortCount += 1;
  }

  return {
    data: {
      rotatedLabelCount,
      rotatedCommentCount,
      rotatedPortCount,
    },
    changed: true,
  };
}

export const itemModelEdits = {
  label: {
    add: addLabel,
    move: moveLabel,
    update: updateLabel,
  },
  comment: {
    add: addComment,
    move: moveComment,
    update: updateComment,
  },
  port: {
    add: addSheetPort,
    move: movePort,
    update: updateSheetPort,
  },
  node: {
    move: moveNode,
  },
  selectionGroup: {
    move: moveSelectionGroup,
    rotate: rotateSelection,
  },
} as const;
