import { sortBy, uniqueBy } from "remeda";
import { isSystemComponent } from "../componentSystem";
import type { ComponentDefinition } from "../types";
import type { EndpointRecord, Hint } from "./context";

export function joinInstancePath(parts: string[]): string {
  return parts.join(".");
}

export function resolveExportedInstancePath(
  pathParts: string[],
  instanceName: string,
  component: ComponentDefinition | undefined,
): string {
  if (isSystemComponent(component)) return instanceName;
  return joinInstancePath([...pathParts, instanceName]);
}

export function chooseBoundarySignalName(
  pathParts: string[],
  portName: string,
): string {
  return pathParts.length > 0
    ? `${joinInstancePath(pathParts)}.${portName}`
    : portName;
}

export function chooseNetName(hints: Hint[], fallbackIndex: number): string {
  const unique = uniqueBy(hints, (hint) => `${hint.kind}:${hint.name}`);
  const preferred =
    unique.find((h) => h.kind === "connection") ??
    unique.find((h) => h.kind === "global") ??
    unique.find((h) => h.kind === "boundary") ??
    unique.find((h) => h.kind === "local");
  return preferred?.name ?? `auto_net_${fallbackIndex}`;
}

export function formatNetLine(netName: string, pinPaths: string[]): string {
  return `net ${netName} ${pinPaths.join(" ")}`;
}

export function sortPinsForHal(records: EndpointRecord[]): EndpointRecord[] {
  const rank = (r: EndpointRecord): number => {
    if (r.direction === "out") return 0;
    if (r.direction === "io") return 1;
    return 2;
  };
  return sortBy(records, rank);
}

export function describeEndpointForWarning(record: EndpointRecord): string {
  if (record.halPinPath) return `${record.halPinPath} [${record.type}]`;
  if (record.boundarySignalPath)
    return `${record.boundarySignalPath} (${record.kind}) [${record.type}]`;
  return `${record.kind}:${record.id} [${record.type}]`;
}
