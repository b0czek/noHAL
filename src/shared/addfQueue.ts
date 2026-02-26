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
  const nodeId = addfQueueEntryNodeId(entry);
  if (!nodeId) return null;
  if (typeof entry === "string" || entry.kind === "node") {
    return `node:${nodeId}`;
  }
  if (entry.kind === "component-function") {
    const functionKey = entry.functionKey?.trim();
    if (!functionKey) return null;
    return `fn:${nodeId}:${functionKey}`;
  }
  return null;
}

export function makeAddfQueueNodeEntry(
  nodeId: string,
): SheetAddfQueueStoredEntry {
  return { kind: "node", nodeId };
}

export function makeAddfQueueFunctionEntry(
  nodeId: string,
  functionKey: string,
): SheetAddfQueueStoredEntry {
  return { kind: "component-function", nodeId, functionKey };
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
      out.push({ kind: "node", nodeId: entry.nodeId.trim() });
      continue;
    }

    if (entry.kind === "component-function") {
      out.push({
        kind: "component-function",
        nodeId: entry.nodeId.trim(),
        functionKey: entry.functionKey.trim(),
      });
    }
  }
  return out;
}
