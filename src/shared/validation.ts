import { endpointEquals, resolveEndpointInSheet } from "./graph";
import type { DirectConnection, NoHALProject, SheetEndpointRef } from "./types";

export interface ConnectionValidationResult {
  ok: boolean;
  reason?: string;
}

function directionsCompatible(a: "in" | "out" | "io", b: "in" | "out" | "io"): boolean {
  if (a === "in" && b === "in") return false;
  if (a === "out" && b === "out") return false;
  return true;
}

export function validateDirectConnection(
  project: NoHALProject,
  sheetId: string,
  a: SheetEndpointRef,
  b: SheetEndpointRef,
  existing: DirectConnection[]
): ConnectionValidationResult {
  if (endpointEquals(a, b)) return { ok: false, reason: "Cannot connect an endpoint to itself" };

  const duplicate = existing.some(
    (conn) =>
      (endpointEquals(conn.a, a) && endpointEquals(conn.b, b)) ||
      (endpointEquals(conn.a, b) && endpointEquals(conn.b, a))
  );
  if (duplicate) return { ok: false, reason: "Connection already exists" };

  const ra = resolveEndpointInSheet(project, sheetId, a);
  const rb = resolveEndpointInSheet(project, sheetId, b);

  if (ra.type !== rb.type) {
    return { ok: false, reason: `Type mismatch: ${ra.type} vs ${rb.type}` };
  }

  if (!directionsCompatible(ra.direction, rb.direction)) {
    return { ok: false, reason: `Direction mismatch: ${ra.direction} -> ${rb.direction}` };
  }

  return { ok: true };
}
