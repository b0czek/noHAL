import { err, ok } from "neverthrow";
import { isValidHalName } from "../halNames";
import { createId } from "../id";
import type {
  ChangeResult,
  InvalidInputFailure,
  NotFoundFailure,
} from "../result";
import type {
  DirectConnection,
  LabelAnchor,
  SheetDefinition,
  SheetEndpointRef,
  XY,
} from "../types";
import { defaultSplitConnectionLabelPositionsForIndex } from "./layout";

export interface SplitConnectionLabelPositions {
  firstLabelPosition: XY;
  secondLabelPosition: XY;
}

function cloneEndpoint(endpoint: SheetEndpointRef): SheetEndpointRef {
  return endpoint.kind === "node-pin"
    ? { kind: "node-pin", nodeId: endpoint.nodeId, pinKey: endpoint.pinKey }
    : { kind: "sheet-port", portId: endpoint.portId };
}

function endpointEquals(a: SheetEndpointRef, b: SheetEndpointRef): boolean {
  if (a.kind === "node-pin" && b.kind === "node-pin") {
    return a.nodeId === b.nodeId && a.pinKey === b.pinKey;
  }
  if (a.kind === "sheet-port" && b.kind === "sheet-port") {
    return a.portId === b.portId;
  }
  return false;
}

function nextName(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

function chooseLabelName(
  sheet: SheetDefinition,
  preferredName: string | undefined,
): string {
  const usedLocalNames = new Set(
    sheet.labels
      .filter((label) => label.scope === "local")
      .map((label) => label.name),
  );
  const trimmedPreferred = preferredName?.trim();
  if (trimmedPreferred) return nextName(trimmedPreferred, usedLocalNames);
  return nextName("sig", usedLocalNames);
}

function fallbackLabelPositions(
  sheet: SheetDefinition,
): SplitConnectionLabelPositions {
  return defaultSplitConnectionLabelPositionsForIndex(sheet.labels.length);
}

function clonePoint(point: XY): XY {
  return { x: point.x, y: point.y };
}

function cloneWaypoints(waypoints: XY[]): XY[] {
  return waypoints.map(clonePoint);
}

function waypointsEqual(
  a: readonly XY[] | undefined,
  b: readonly XY[],
): boolean {
  if ((a?.length ?? 0) !== b.length) return false;
  return b.every((point, index) => {
    const current = a?.[index];
    return current?.x === point.x && current.y === point.y;
  });
}

function createLabelAnchor(
  labelId: string,
  endpoint: SheetEndpointRef,
): LabelAnchor {
  return {
    id: createId("anchor"),
    labelId,
    endpoint: cloneEndpoint(endpoint),
  };
}

export interface AddDirectConnectionInput {
  a: SheetEndpointRef;
  b: SheetEndpointRef;
  signalName?: string;
  waypoints?: XY[];
}

export type DirectConnectionSignalNameFailure = InvalidInputFailure<
  "direct-connection-signal-name",
  "invalid-name",
  { name: string }
>;

export type AddDirectConnectionResult = ChangeResult<
  DirectConnection,
  DirectConnectionSignalNameFailure
>;

function addDirectConnection(
  sheet: SheetDefinition,
  input: AddDirectConnectionInput,
): AddDirectConnectionResult {
  const signalName = input.signalName?.trim();
  if (signalName && !isValidHalName(signalName)) {
    return err({
      code: "invalid-input",
      cause: "direct-connection-signal-name",
      detail: "invalid-name",
      meta: { name: signalName },
    });
  }

  const connection = {
    id: createId("conn"),
    a: cloneEndpoint(input.a),
    b: cloneEndpoint(input.b),
    ...(signalName ? { signalName } : {}),
    ...(input.waypoints && input.waypoints.length > 0
      ? { waypoints: cloneWaypoints(input.waypoints) }
      : {}),
  };
  sheet.directConnections.push(connection);
  return ok({ data: connection, changed: true });
}

export type RemoveDirectConnectionResult = ChangeResult<
  DirectConnection,
  NotFoundFailure<"direct-connection">
>;

function removeDirectConnection(
  sheet: SheetDefinition,
  connectionId: string,
): RemoveDirectConnectionResult {
  const index = sheet.directConnections.findIndex(
    (item) => item.id === connectionId,
  );
  if (index < 0) return err({ code: "not-found", cause: "direct-connection" });
  const [removed] = sheet.directConnections.splice(index, 1);
  return ok({ data: removed, changed: true });
}

export type UpdateDirectConnectionWaypointsResult = ChangeResult<
  DirectConnection,
  NotFoundFailure<"direct-connection">
>;

function updateDirectConnectionWaypoints(
  sheet: SheetDefinition,
  connectionId: string,
  waypoints: XY[],
): UpdateDirectConnectionWaypointsResult {
  const connection = sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) {
    return err({ code: "not-found", cause: "direct-connection" });
  }
  if (waypointsEqual(connection.waypoints, waypoints)) {
    return ok({ data: connection, changed: false });
  }
  if (waypoints.length === 0) delete connection.waypoints;
  else connection.waypoints = cloneWaypoints(waypoints);
  return ok({ data: connection, changed: true });
}

export type UpdateDirectConnectionSignalNameResult = ChangeResult<
  DirectConnection,
  NotFoundFailure<"direct-connection"> | DirectConnectionSignalNameFailure
>;

function updateDirectConnectionSignalName(
  sheet: SheetDefinition,
  connectionId: string,
  signalName: string,
): UpdateDirectConnectionSignalNameResult {
  const connection = sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) {
    return err({ code: "not-found", cause: "direct-connection" });
  }
  const normalized = signalName.trim();
  if (normalized.length > 0 && !isValidHalName(normalized)) {
    return err({
      code: "invalid-input",
      cause: "direct-connection-signal-name",
      detail: "invalid-name",
      meta: { name: normalized },
    });
  }
  if ((connection.signalName ?? "") === normalized) {
    return ok({ data: connection, changed: false });
  }
  if (normalized.length > 0) connection.signalName = normalized;
  else delete connection.signalName;
  return ok({ data: connection, changed: true });
}

export type AddLabelAnchorResult = ChangeResult<
  LabelAnchor,
  NotFoundFailure<"label">
>;

function addLabelAnchor(
  sheet: SheetDefinition,
  labelId: string,
  endpoint: SheetEndpointRef,
): AddLabelAnchorResult {
  if (!sheet.labels.some((label) => label.id === labelId)) {
    return err({ code: "not-found", cause: "label" });
  }
  const existing = sheet.labelAnchors.find(
    (anchor) =>
      anchor.labelId === labelId && endpointEquals(anchor.endpoint, endpoint),
  );
  if (existing) return ok({ data: existing, changed: false });
  const anchor = createLabelAnchor(labelId, endpoint);
  sheet.labelAnchors.push(anchor);
  return ok({ data: anchor, changed: true });
}

export type RemoveLabelAnchorResult = ChangeResult<
  LabelAnchor,
  NotFoundFailure<"label-anchor">
>;

function removeLabelAnchor(
  sheet: SheetDefinition,
  anchorId: string,
): RemoveLabelAnchorResult {
  const index = sheet.labelAnchors.findIndex((item) => item.id === anchorId);
  if (index < 0) return err({ code: "not-found", cause: "label-anchor" });
  const [removed] = sheet.labelAnchors.splice(index, 1);
  return ok({ data: removed, changed: true });
}

export interface SplitDirectConnectionIntoLabelsResult {
  labelName: string;
  labelIds: [string, string];
}

export type SplitDirectConnectionIntoLabelsEditResult = ChangeResult<
  SplitDirectConnectionIntoLabelsResult,
  NotFoundFailure<"direct-connection">
>;

function splitDirectConnectionIntoLabels(
  sheet: SheetDefinition,
  connectionId: string,
  labelPositions?: SplitConnectionLabelPositions,
): SplitDirectConnectionIntoLabelsEditResult {
  const connection = sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) {
    return err({ code: "not-found", cause: "direct-connection" });
  }

  const labelName = chooseLabelName(sheet, connection.signalName);
  const positions = labelPositions ?? fallbackLabelPositions(sheet);
  const firstLabelId = createId("label");
  const secondLabelId = createId("label");

  sheet.labels.push(
    {
      id: firstLabelId,
      name: labelName,
      scope: "local",
      position: {
        x: positions.firstLabelPosition.x,
        y: positions.firstLabelPosition.y,
      },
      rotation: 0,
    },
    {
      id: secondLabelId,
      name: labelName,
      scope: "local",
      position: {
        x: positions.secondLabelPosition.x,
        y: positions.secondLabelPosition.y,
      },
      rotation: 0,
    },
  );

  sheet.labelAnchors.push(
    createLabelAnchor(firstLabelId, connection.a),
    createLabelAnchor(secondLabelId, connection.b),
  );
  removeDirectConnection(sheet, connectionId);

  return ok({
    data: {
      labelName,
      labelIds: [firstLabelId, secondLabelId],
    },
    changed: true,
  });
}

export const sheetEdits = {
  connection: {
    add: addDirectConnection,
    remove: removeDirectConnection,
    splitIntoLabels: splitDirectConnectionIntoLabels,
    waypoints: {
      update: updateDirectConnectionWaypoints,
    },
    signalName: {
      update: updateDirectConnectionSignalName,
    },
  },
  labelAnchor: {
    add: addLabelAnchor,
    remove: removeLabelAnchor,
  },
} as const;
