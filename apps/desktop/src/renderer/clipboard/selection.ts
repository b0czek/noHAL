import { getSheet } from "@nohal/core/graph";
import {
  isProtectedSystemNode,
  isProtectedSystemSheet,
} from "@nohal/core/sheet";
import type { SheetEndpointRef, XY } from "@nohal/core/types";
import { unwrap } from "solid-js/store";
import type {
  EditorSelection,
  EditorStoreActionContext,
} from "../state/store/actions/types";
import { selectionIdBuckets } from "../state/store/selection";
import { pasteSelectionClipboardSnapshot } from "./paste";
import { parseClipboardSnapshot, serializeClipboardSnapshot } from "./snapshot";
import type { SelectionClipboardSnapshot } from "./types";

export function createSelectionClipboard(deps: EditorStoreActionContext) {
  let pasteSequence = 0;
  let lastClipboardPayload: string | null = null;

  const cloneValue = <T>(value: T): T => structuredClone(unwrap(value));

  const endpointUsesCopiedItems = (
    endpoint: SheetEndpointRef,
    nodeIds: ReadonlySet<string>,
    portIds: ReadonlySet<string>,
  ): boolean =>
    endpoint.kind === "node-pin"
      ? nodeIds.has(endpoint.nodeId)
      : portIds.has(endpoint.portId);

  const snapshotSelection = (
    selection: EditorSelection,
  ): {
    snapshot: SelectionClipboardSnapshot | null;
    skippedProtected: number;
  } => {
    const resolved = selectionIdBuckets(selection);
    if (!resolved) return { snapshot: null, skippedProtected: 0 };

    const currentSheet = getSheet(deps.state.project, deps.state.activeSheetId);
    const nodeIds = new Set(resolved.nodeIds);
    let skippedProtected = 0;

    for (const node of currentSheet.nodes) {
      if (!nodeIds.has(node.id)) continue;
      if (
        isProtectedSystemNode(deps.state.project, node) ||
        (node.kind === "sheet" &&
          isProtectedSystemSheet(deps.state.project, node.sheetId))
      ) {
        nodeIds.delete(node.id);
        skippedProtected += 1;
      }
    }

    const nodes = cloneValue(
      currentSheet.nodes.filter((node) => nodeIds.has(node.id)),
    );
    const labels = cloneValue(
      currentSheet.labels.filter((label) => resolved.labelIds.has(label.id)),
    );
    const comments = cloneValue(
      currentSheet.comments.filter((comment) =>
        resolved.commentIds.has(comment.id),
      ),
    );
    const ports = cloneValue(
      currentSheet.ports.filter((port) => resolved.portIds.has(port.id)),
    );

    const copiedNodeIds = new Set(nodes.map((node) => node.id));
    const copiedPortIds = new Set(ports.map((port) => port.id));
    const copiedLabelIds = new Set(labels.map((label) => label.id));

    const directConnections = cloneValue(
      currentSheet.directConnections.filter(
        (connection) =>
          endpointUsesCopiedItems(connection.a, copiedNodeIds, copiedPortIds) &&
          endpointUsesCopiedItems(connection.b, copiedNodeIds, copiedPortIds),
      ),
    );
    const labelAnchors = cloneValue(
      currentSheet.labelAnchors.filter(
        (anchor) =>
          copiedLabelIds.has(anchor.labelId) &&
          endpointUsesCopiedItems(
            anchor.endpoint,
            copiedNodeIds,
            copiedPortIds,
          ),
      ),
    );

    if (
      nodes.length === 0 &&
      labels.length === 0 &&
      comments.length === 0 &&
      ports.length === 0
    ) {
      return { snapshot: null, skippedProtected };
    }

    return {
      snapshot: {
        nodes,
        labels,
        comments,
        ports,
        directConnections,
        labelAnchors,
      },
      skippedProtected,
    };
  };

  return {
    copySelection(): boolean {
      const { snapshot, skippedProtected } = snapshotSelection(
        deps.state.selection,
      );
      if (!snapshot) {
        deps.setStatusT("store.status.nothingCopyableInSelection");
        return false;
      }

      const payload = serializeClipboardSnapshot(snapshot);
      try {
        window.nohal.writeClipboardText(payload);
      } catch (error) {
        deps.setState("status", `Failed to copy selection: ${String(error)}`);
        return false;
      }
      lastClipboardPayload = payload;
      pasteSequence = 0;

      const count =
        snapshot.nodes.length +
        snapshot.labels.length +
        snapshot.comments.length +
        snapshot.ports.length;
      if (skippedProtected > 0) {
        deps.setStatusT("store.status.copiedSelectionSkippedProtected", {
          count,
          skipped: skippedProtected,
        });
      } else {
        deps.setStatusT("store.status.copiedSelection", { count });
      }
      return true;
    },

    pasteClipboard(targetPosition?: XY): boolean {
      let rawClipboardText = "";
      try {
        rawClipboardText = window.nohal.readClipboardText();
      } catch (error) {
        deps.setState("status", `Failed to paste selection: ${String(error)}`);
        return false;
      }

      const clipboard = parseClipboardSnapshot(rawClipboardText);
      if (!clipboard) {
        deps.setStatusT("store.status.nothingToPasteInSelectionClipboard");
        return false;
      }
      if (rawClipboardText !== lastClipboardPayload) {
        pasteSequence = 0;
        lastClipboardPayload = rawClipboardText;
      }

      const result = pasteSelectionClipboardSnapshot({
        project: deps.state.project,
        activeSheetId: deps.state.activeSheetId,
        clipboard,
        targetPosition,
        pasteSequence,
        cloneValue,
      });
      if (!result) {
        deps.setStatusT("store.status.nothingToPasteInSelectionClipboard");
        return false;
      }

      deps.pushUndoSnapshot();
      deps.setState("project", result.project);
      deps.markProjectChanged();
      deps.setState("selection", result.selection);
      deps.clearPendingConnectionUi();
      deps.setStatusT("store.status.pastedSelection", { count: result.count });
      pasteSequence += 1;
      return true;
    },
  };
}
