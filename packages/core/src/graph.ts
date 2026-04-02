import { resolveComponentPinsForInstance } from "./componentInstance";
import type {
  ComponentNode,
  NoHALProject,
  PinDirection,
  PortSide,
  ResolvedEndpoint,
  ResolvedPin,
  SheetDefinition,
  SheetEndpointRef,
  SheetNode,
  SheetNodeInstance,
} from "./types";

export function invertDirection(direction: PinDirection): PinDirection {
  if (direction === "in") return "out";
  if (direction === "out") return "in";
  return "io";
}

export function pinDirectionToSide(direction: PinDirection): PortSide {
  if (direction === "in") return "left";
  if (direction === "out") return "right";
  return "bottom";
}

export function getSheet(
  project: NoHALProject,
  sheetId: string,
): SheetDefinition {
  const sheet = project.sheets[sheetId];
  if (!sheet) throw new Error(`Sheet not found: ${sheetId}`);
  return sheet;
}

export interface SheetReferenceLocation {
  parentSheetId: string;
  parentSheetName: string;
  nodeId: string;
  instanceName: string;
}

export interface ReferencedSheetLocation extends SheetReferenceLocation {
  sheetId: string;
  sheetName: string;
}

export function getSheetReferenceLocations(
  project: NoHALProject,
  sheetId: string,
): SheetReferenceLocation[] {
  const references: SheetReferenceLocation[] = [];
  for (const parentSheet of Object.values(project.sheets)) {
    for (const node of parentSheet.nodes) {
      if (node.kind !== "sheet" || node.sheetId !== sheetId) continue;
      references.push({
        parentSheetId: parentSheet.id,
        parentSheetName: parentSheet.name,
        nodeId: node.id,
        instanceName: node.instanceName,
      });
    }
  }
  return references.sort((left, right) => {
    const parentNameCompare = left.parentSheetName.localeCompare(
      right.parentSheetName,
    );
    if (parentNameCompare !== 0) return parentNameCompare;
    return left.instanceName.localeCompare(right.instanceName);
  });
}

export function getReferencedSheetLocations(
  project: NoHALProject,
  parentSheetId: string,
): ReferencedSheetLocation[] {
  const parentSheet = getSheet(project, parentSheetId);
  return parentSheet.nodes
    .flatMap((node) => {
      if (node.kind !== "sheet") return [];
      const childSheet = project.sheets[node.sheetId];
      if (!childSheet) return [];
      return [
        {
          parentSheetId,
          parentSheetName: parentSheet.name,
          nodeId: node.id,
          instanceName: node.instanceName,
          sheetId: childSheet.id,
          sheetName: childSheet.name,
        },
      ];
    })
    .sort((left, right) => {
      const sheetNameCompare = left.sheetName.localeCompare(right.sheetName);
      if (sheetNameCompare !== 0) return sheetNameCompare;
      return left.instanceName.localeCompare(right.instanceName);
    });
}

export function isSheetPlacedInProject(
  project: NoHALProject,
  sheetId: string,
): boolean {
  return getSheetReferenceLocations(project, sheetId).length > 0;
}

export function getNode(
  sheet: SheetDefinition,
  nodeId: string,
): SheetNodeInstance {
  const node = sheet.nodes.find((item) => item.id === nodeId);
  if (!node) throw new Error(`Node not found: ${nodeId}`);
  return node;
}

export function getComponentNodePins(
  project: NoHALProject,
  node: ComponentNode,
): ResolvedPin[] {
  const component = project.library.components[node.componentId];
  if (!component)
    throw new Error(`Component definition missing: ${node.componentId}`);
  return resolveComponentPinsForInstance(
    component,
    node.instanceConfigValues,
  ).map((pin) => ({
    key: pin.key,
    name: pin.name,
    direction: pin.direction,
    type: pin.type,
    side: pinDirectionToSide(pin.direction),
    doc: pin.doc,
  }));
}

export function getSheetNodePins(
  project: NoHALProject,
  node: SheetNode,
): ResolvedPin[] {
  const targetSheet = getSheet(project, node.sheetId);
  return targetSheet.ports.map((port) => ({
    key: port.id,
    name: port.name,
    direction: port.direction,
    type: port.type,
    side: pinDirectionToSide(port.direction),
  }));
}

export function getNodePins(
  project: NoHALProject,
  node: SheetNodeInstance,
): ResolvedPin[] {
  return node.kind === "component"
    ? getComponentNodePins(project, node)
    : getSheetNodePins(project, node);
}

export function isNodePinConnected(
  sheet: SheetDefinition,
  nodeId: string,
  pinKey: string,
): boolean {
  const isTargetEndpoint = (endpoint: SheetEndpointRef): boolean =>
    endpoint.kind === "node-pin" &&
    endpoint.nodeId === nodeId &&
    endpoint.pinKey === pinKey;

  return (
    sheet.directConnections.some(
      (connection) =>
        isTargetEndpoint(connection.a) || isTargetEndpoint(connection.b),
    ) || sheet.labelAnchors.some((anchor) => isTargetEndpoint(anchor.endpoint))
  );
}

export function getVisibleNodePins(
  project: NoHALProject,
  sheet: SheetDefinition,
  node: SheetNodeInstance,
): ResolvedPin[] {
  const pins = getNodePins(project, node);
  if (node.kind !== "component" || (node.hiddenPinKeys?.length ?? 0) === 0) {
    return pins;
  }

  const hiddenPinKeys = new Set(node.hiddenPinKeys);
  return pins.filter(
    (pin) =>
      !hiddenPinKeys.has(pin.key) ||
      isNodePinConnected(sheet, node.id, pin.key),
  );
}

export function resolveEndpointInSheet(
  project: NoHALProject,
  sheetId: string,
  endpoint: SheetEndpointRef,
): ResolvedEndpoint {
  const sheet = getSheet(project, sheetId);

  if (endpoint.kind === "sheet-port") {
    const port = sheet.ports.find((item) => item.id === endpoint.portId);
    if (!port) throw new Error(`Sheet port not found: ${endpoint.portId}`);
    return {
      endpoint,
      name: port.name,
      direction: invertDirection(port.direction),
      type: port.type,
      side: port.side,
    };
  }

  const node = getNode(sheet, endpoint.nodeId);
  const pins = getNodePins(project, node);
  const pin = pins.find((item) => item.key === endpoint.pinKey);
  if (!pin)
    throw new Error(
      `Pin ${endpoint.pinKey} not found on node ${endpoint.nodeId}`,
    );

  return {
    endpoint,
    name: pin.name,
    direction: pin.direction,
    type: pin.type,
    side: pin.side,
  };
}

export function getNodeTitle(
  project: NoHALProject,
  node: SheetNodeInstance,
): string {
  if (node.kind === "component") {
    const comp = project.library.components[node.componentId];
    return `${node.instanceName} : ${comp?.halComponentName ?? "missing"}`;
  }
  const sheet = project.sheets[node.sheetId];
  return `${node.instanceName} : [${sheet?.name ?? "missing sheet"}]`;
}

export function endpointKey(endpoint: SheetEndpointRef): string {
  return endpoint.kind === "node-pin"
    ? `node:${endpoint.nodeId}:${endpoint.pinKey}`
    : `port:${endpoint.portId}`;
}

export function endpointEquals(
  a: SheetEndpointRef,
  b: SheetEndpointRef,
): boolean {
  return endpointKey(a) === endpointKey(b);
}
