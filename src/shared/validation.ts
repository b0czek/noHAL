import { endpointEquals, endpointKey, resolveEndpointInSheet } from "./graph";
import type { DirectConnection, NoHALProject, SheetEndpointRef } from "./types";

export interface ConnectionValidationResult {
  ok: boolean;
  reason?: string;
}

function directionsCompatible(
  a: "in" | "out" | "io",
  b: "in" | "out" | "io",
): boolean {
  if (a === "in" && b === "in") return false;
  if (a === "out" && b === "out") return false;
  return true;
}

function addUndirectedEdge(
  adjacency: Map<string, Set<string>>,
  a: string,
  b: string,
): void {
  const aList = adjacency.get(a);
  if (aList) aList.add(b);
  else adjacency.set(a, new Set([b]));

  const bList = adjacency.get(b);
  if (bList) bList.add(a);
  else adjacency.set(b, new Set([a]));
}

export function validateDirectConnection(
  project: NoHALProject,
  sheetId: string,
  a: SheetEndpointRef,
  b: SheetEndpointRef,
  existing: DirectConnection[],
): ConnectionValidationResult {
  if (endpointEquals(a, b))
    return { ok: false, reason: "Cannot connect an endpoint to itself" };

  const duplicate = existing.some(
    (conn) =>
      (endpointEquals(conn.a, a) && endpointEquals(conn.b, b)) ||
      (endpointEquals(conn.a, b) && endpointEquals(conn.b, a)),
  );
  if (duplicate) return { ok: false, reason: "Connection already exists" };

  const ra = resolveEndpointInSheet(project, sheetId, a);
  const rb = resolveEndpointInSheet(project, sheetId, b);

  if (ra.type !== rb.type) {
    return { ok: false, reason: `Type mismatch: ${ra.type} vs ${rb.type}` };
  }

  if (!directionsCompatible(ra.direction, rb.direction)) {
    return {
      ok: false,
      reason: `Direction mismatch: ${ra.direction} -> ${rb.direction}`,
    };
  }

  const candidateConnections = [...existing, { id: "__candidate__", a, b }];
  const endpointByKey = new Map<string, SheetEndpointRef>();
  const adjacency = new Map<string, Set<string>>();
  for (const connection of candidateConnections) {
    const aKey = endpointKey(connection.a);
    const bKey = endpointKey(connection.b);
    endpointByKey.set(aKey, connection.a);
    endpointByKey.set(bKey, connection.b);
    addUndirectedEdge(adjacency, aKey, bKey);
  }

  const start = endpointKey(a);
  const stack = [start];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) stack.push(next);
    }
  }

  let outCount = 0;
  let ioCount = 0;
  for (const key of visited) {
    const endpoint = endpointByKey.get(key);
    if (!endpoint) continue;
    const direction = resolveEndpointInSheet(project, sheetId, endpoint).direction;
    if (direction === "out") outCount += 1;
    else if (direction === "io") ioCount += 1;
  }

  if (outCount > 1) {
    return {
      ok: false,
      reason: "HAL net cannot have multiple OUT pins",
    };
  }

  if (outCount > 0 && ioCount > 0) {
    return {
      ok: false,
      reason: "HAL net cannot mix OUT and IO pins",
    };
  }

  return { ok: true };
}
