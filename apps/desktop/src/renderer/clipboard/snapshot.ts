import type { XY } from "@nohal/core/types";
import type { EditorSelection } from "../state/store/actions/types";
import type { PastedSelectionIds, SelectionClipboardSnapshot } from "./types";

export const SELECTION_CLIPBOARD_PREFIX = "__NOHAL_SELECTION_V1__\n";

export function serializeClipboardSnapshot(
  snapshot: SelectionClipboardSnapshot,
): string {
  return `${SELECTION_CLIPBOARD_PREFIX}${JSON.stringify(snapshot)}`;
}

export function parseClipboardSnapshot(
  raw: string,
): SelectionClipboardSnapshot | null {
  if (!raw.startsWith(SELECTION_CLIPBOARD_PREFIX)) return null;
  try {
    const parsed = JSON.parse(
      raw.slice(SELECTION_CLIPBOARD_PREFIX.length),
    ) as SelectionClipboardSnapshot;
    if (
      !parsed ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.labels) ||
      !Array.isArray(parsed.comments) ||
      !Array.isArray(parsed.ports) ||
      !Array.isArray(parsed.directConnections) ||
      !Array.isArray(parsed.labelAnchors)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clipboardSnapshotOrigin(
  snapshot: SelectionClipboardSnapshot,
): XY | null {
  const points = [
    ...snapshot.nodes.map((node) => node.position),
    ...snapshot.labels.map((label) => label.position),
    ...snapshot.comments.map((comment) => comment.position),
    ...snapshot.ports.map((port) => port.position),
  ];
  if (points.length === 0) return null;
  let minX = points[0].x;
  let minY = points[0].y;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
  }
  return { x: minX, y: minY };
}

export function buildSelectionForPastedItems(
  args: PastedSelectionIds,
): EditorSelection {
  const { nodeIds, labelIds, commentIds, portIds } = args;
  const total =
    nodeIds.length + labelIds.length + commentIds.length + portIds.length;
  if (total === 0) return null;
  if (total === 1) {
    if (nodeIds.length === 1) return { kind: "node", id: nodeIds[0] };
    if (labelIds.length === 1) return { kind: "label", id: labelIds[0] };
    if (commentIds.length === 1) return { kind: "comment", id: commentIds[0] };
    return { kind: "sheet-port", id: portIds[0] };
  }
  return { kind: "multi", nodeIds, labelIds, commentIds, portIds };
}
