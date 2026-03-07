import type { SheetAddfQueueStoredEntry } from "./types";

export function addfQueueEntryNodeId(
  entry: SheetAddfQueueStoredEntry,
): string | null {
  if (typeof entry === "string") {
    const nodeId = entry.trim();
    return nodeId || null;
  }
  if (!entry || typeof entry !== "object") return null;
  if (!entry.nodeId || typeof entry.nodeId !== "string") return null;
  const nodeId = entry.nodeId.trim();
  return nodeId || null;
}

export function addfQueueEntryKey(
  entry: SheetAddfQueueStoredEntry,
): string | null {
  const threadSuffix =
    typeof entry === "string"
      ? ""
      : entry.sheetThreadOutputId?.trim()
        ? `@${entry.sheetThreadOutputId.trim()}`
        : "";
  const nodeId = addfQueueEntryNodeId(entry);
  if (!nodeId) return null;
  if (typeof entry === "string" || entry.kind === "node") {
    return `node:${nodeId}${threadSuffix}`;
  }
  if (entry.kind === "component-function") {
    const functionKey = entry.functionKey?.trim();
    if (!functionKey) return null;
    return `fn:${nodeId}:${functionKey}${threadSuffix}`;
  }
  if (entry.kind === "subsheet-output") {
    const childThreadOutputId = entry.childThreadOutputId?.trim();
    if (!childThreadOutputId) return null;
    return `subsheet:${nodeId}:${childThreadOutputId}${threadSuffix}`;
  }
  return null;
}

export function makeAddfQueueNodeEntry(
  nodeId: string,
  sheetThreadOutputId?: string,
): SheetAddfQueueStoredEntry {
  return {
    kind: "node",
    nodeId,
    ...(sheetThreadOutputId ? { sheetThreadOutputId } : {}),
  };
}

export function makeAddfQueueFunctionEntry(
  nodeId: string,
  functionKey: string,
  sheetThreadOutputId?: string,
): SheetAddfQueueStoredEntry {
  return {
    kind: "component-function",
    nodeId,
    functionKey,
    ...(sheetThreadOutputId ? { sheetThreadOutputId } : {}),
  };
}

export function makeAddfQueueSubsheetOutputEntry(
  nodeId: string,
  childThreadOutputId: string,
  sheetThreadOutputId?: string,
): SheetAddfQueueStoredEntry {
  return {
    kind: "subsheet-output",
    nodeId,
    childThreadOutputId,
    ...(sheetThreadOutputId ? { sheetThreadOutputId } : {}),
  };
}

export function normalizeAddfQueueEntries(
  entries: readonly SheetAddfQueueStoredEntry[],
): SheetAddfQueueStoredEntry[] {
  const out: SheetAddfQueueStoredEntry[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = addfQueueEntryKey(entry);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    if (typeof entry === "string") {
      const nodeId = entry.trim();
      if (!nodeId) continue;
      out.push({ kind: "node", nodeId });
      continue;
    }

    if (entry.kind === "node") {
      const sheetThreadOutputId = entry.sheetThreadOutputId?.trim();
      out.push({
        kind: "node",
        nodeId: entry.nodeId.trim(),
        ...(sheetThreadOutputId ? { sheetThreadOutputId } : {}),
      });
      continue;
    }

    if (entry.kind === "component-function") {
      const sheetThreadOutputId = entry.sheetThreadOutputId?.trim();
      out.push({
        kind: "component-function",
        nodeId: entry.nodeId.trim(),
        functionKey: entry.functionKey.trim(),
        ...(sheetThreadOutputId ? { sheetThreadOutputId } : {}),
      });
      continue;
    }

    if (entry.kind === "subsheet-output") {
      const sheetThreadOutputId = entry.sheetThreadOutputId?.trim();
      const childThreadOutputId = entry.childThreadOutputId?.trim();
      if (!childThreadOutputId) continue;
      out.push({
        kind: "subsheet-output",
        nodeId: entry.nodeId.trim(),
        childThreadOutputId,
        ...(sheetThreadOutputId ? { sheetThreadOutputId } : {}),
      });
    }
  }
  return out;
}
