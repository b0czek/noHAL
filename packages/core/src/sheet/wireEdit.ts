import { createId } from "../id";
import type { SheetDefinition, SheetEndpointRef, XY } from "../types";
import { defaultSplitConnectionLabelPositionsForIndex } from "./layout";

export interface SplitConnectionLabelPositions {
  firstLabelPosition: XY;
  secondLabelPosition: XY;
}

export interface AddDirectConnectionInput {
  a: SheetEndpointRef;
  b: SheetEndpointRef;
  signalName?: string;
  waypoints?: XY[];
}

export interface SplitDirectConnectionIntoLabelsResult {
  labelName: string;
  labelIds: [string, string];
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

function addDirectConnection(
  sheet: SheetDefinition,
  input: AddDirectConnectionInput,
): SheetDefinition["directConnections"][number] {
  const connection = {
    id: createId("conn"),
    a: cloneEndpoint(input.a),
    b: cloneEndpoint(input.b),
    ...(input.signalName?.trim()
      ? { signalName: input.signalName.trim() }
      : {}),
    ...(input.waypoints && input.waypoints.length > 0
      ? {
          waypoints: input.waypoints.map((point) => ({
            x: point.x,
            y: point.y,
          })),
        }
      : {}),
  };
  sheet.directConnections.push(connection);
  return connection;
}

function removeDirectConnection(
  sheet: SheetDefinition,
  connectionId: string,
): boolean {
  const next = sheet.directConnections.filter(
    (item) => item.id !== connectionId,
  );
  if (next.length === sheet.directConnections.length) return false;
  sheet.directConnections = next;
  return true;
}

function updateDirectConnectionWaypoints(
  sheet: SheetDefinition,
  connectionId: string,
  waypoints: XY[],
): boolean {
  const connection = sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) return false;
  if (waypoints.length === 0) delete connection.waypoints;
  else {
    connection.waypoints = waypoints.map((point) => ({
      x: point.x,
      y: point.y,
    }));
  }
  return true;
}

function updateDirectConnectionSignalName(
  sheet: SheetDefinition,
  connectionId: string,
  signalName: string,
): boolean {
  const connection = sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) return false;
  const normalized = signalName.trim();
  if ((connection.signalName ?? "") === normalized) return false;
  if (normalized.length > 0) connection.signalName = normalized;
  else delete connection.signalName;
  return true;
}

function addLabelAnchor(
  sheet: SheetDefinition,
  labelId: string,
  endpoint: SheetEndpointRef,
): boolean {
  const exists = sheet.labelAnchors.some(
    (anchor) =>
      anchor.labelId === labelId && endpointEquals(anchor.endpoint, endpoint),
  );
  if (exists) return false;
  sheet.labelAnchors.push({
    id: createId("anchor"),
    labelId,
    endpoint: cloneEndpoint(endpoint),
  });
  return true;
}

function removeLabelAnchor(sheet: SheetDefinition, anchorId: string): boolean {
  const next = sheet.labelAnchors.filter((item) => item.id !== anchorId);
  if (next.length === sheet.labelAnchors.length) return false;
  sheet.labelAnchors = next;
  return true;
}

function splitDirectConnectionIntoLabels(
  sheet: SheetDefinition,
  connectionId: string,
  labelPositions?: SplitConnectionLabelPositions,
): SplitDirectConnectionIntoLabelsResult | null {
  const connection = sheet.directConnections.find(
    (item) => item.id === connectionId,
  );
  if (!connection) return null;

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

  addLabelAnchor(sheet, firstLabelId, connection.a);
  addLabelAnchor(sheet, secondLabelId, connection.b);
  removeDirectConnection(sheet, connectionId);

  return {
    labelName,
    labelIds: [firstLabelId, secondLabelId],
  };
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
