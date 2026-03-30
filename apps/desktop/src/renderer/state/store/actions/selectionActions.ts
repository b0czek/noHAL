import { getSheet } from "@nohal/core/graph";
import {
  isProtectedSystemNode,
  isProtectedSystemSheet,
} from "@nohal/core/sheet";
import type { XY } from "@nohal/core/types";
import { createSelectionClipboard } from "../../../clipboard/selection";
import {
  cloneProject,
  collectSheetSubtreeIds,
  removeSheetNodeReferencesForDeletedSheets,
  removeSheetSelectionItems,
  syncProjectUi,
} from "../helpers";
import {
  extendSelection as mergeSelection,
  selectionIdBuckets,
  toggleSelection as toggleSelectionState,
} from "../selection";
import type { MultiSelection } from "../selectionTypes";
import type { EditorSelection, EditorStoreActionContext } from "./types";

type SelectionActionLinks = {
  deleteSheetDefinition: (sheetId: string) => void;
  removeDirectConnection: (connectionId: string) => void;
};

export function createSelectionActions(
  deps: EditorStoreActionContext,
  links: SelectionActionLinks,
) {
  const clipboard = createSelectionClipboard(deps);

  const removeMultiSelection = (sel: MultiSelection): void => {
    const currentSheet = getSheet(deps.state.project, deps.state.activeSheetId);
    const selectionIds = selectionIdBuckets(sel);
    if (!selectionIds) return;
    const selectedNodeIds = new Set(selectionIds.nodeIds);
    const protectedSheetNodeIds = new Set(
      currentSheet.nodes
        .filter(
          (node) =>
            node.kind === "sheet" &&
            selectedNodeIds.has(node.id) &&
            isProtectedSystemSheet(deps.state.project, node.sheetId),
        )
        .map((node) => node.id),
    );
    for (const nodeId of protectedSheetNodeIds) selectedNodeIds.delete(nodeId);

    const protectedNodeIds = new Set(
      currentSheet.nodes
        .filter(
          (node) =>
            selectedNodeIds.has(node.id) &&
            isProtectedSystemNode(deps.state.project, node),
        )
        .map((node) => node.id),
    );
    for (const nodeId of protectedNodeIds) selectedNodeIds.delete(nodeId);

    const deletedSheetIds = new Set<string>();
    for (const node of currentSheet.nodes) {
      if (node.kind !== "sheet" || !selectedNodeIds.has(node.id)) continue;
      for (const sheetId of collectSheetSubtreeIds(
        deps.state.project,
        node.sheetId,
      )) {
        deletedSheetIds.add(sheetId);
      }
    }

    const next = cloneProject(deps.state.project);
    if (deletedSheetIds.size > 0) {
      removeSheetNodeReferencesForDeletedSheets(next, deletedSheetIds);
      for (const deletedSheetId of deletedSheetIds) {
        delete next.sheets[deletedSheetId];
      }
    }

    const sheet = next.sheets[deps.state.activeSheetId];
    if (sheet) {
      removeSheetSelectionItems(sheet, {
        ...selectionIds,
        nodeIds: selectedNodeIds,
      });
    }

    syncProjectUi(next, deps.state.activeSheetId);
    deps.pushUndoSnapshot();
    deps.setState("project", next);
    deps.markProjectChanged();
    deps.clearSelectionAndPendingUi();
    if (protectedNodeIds.size > 0) {
      deps.setStatusT("store.status.removedSelectionSkippedSystemManaged", {
        count: protectedNodeIds.size,
      });
      return;
    }
    deps.setStatusT("store.status.removedSelection");
  };

  const removeSimpleSelection = (sel: NonNullable<EditorSelection>): void => {
    const activeSheetId = deps.state.activeSheetId;
    deps.withProject((project) => {
      const sheet = getSheet(project, activeSheetId);
      const selectionIds = selectionIdBuckets(sel);
      if (!selectionIds) return;
      removeSheetSelectionItems(sheet, selectionIds);
    });
    deps.clearSelectionAndPendingUi();
    deps.setStatusT("store.status.removedSelection");
  };

  return {
    select(sel: EditorSelection): void {
      deps.setState("selection", sel);
    },

    extendSelection(sel: EditorSelection): void {
      deps.setState("selection", mergeSelection(deps.state.selection, sel));
    },

    toggleSelection(sel: EditorSelection): void {
      deps.setState(
        "selection",
        toggleSelectionState(deps.state.selection, sel),
      );
    },

    clearPendingEndpoint(): void {
      deps.clearPendingConnectionUi();
    },

    addPendingWirePoint(point: XY): void {
      if (!deps.state.pendingEndpoint) return;
      const currentPoints = deps.state.pendingWirePoints;
      deps.setState("pendingWirePoints", [...currentPoints, point]);
      deps.setStatusT("store.status.addedWireWaypoint", {
        count: currentPoints.length + 1,
      });
    },

    copySelection(): boolean {
      return clipboard.copySelection();
    },

    pasteClipboard(targetPosition?: XY): boolean {
      return clipboard.pasteClipboard(targetPosition);
    },

    removeSelection(): void {
      const sel = deps.state.selection;
      if (!sel) return;

      if (sel.kind === "node") {
        const currentSheet = getSheet(
          deps.state.project,
          deps.state.activeSheetId,
        );
        const node = currentSheet.nodes.find((n) => n.id === sel.id);
        if (node && isProtectedSystemNode(deps.state.project, node)) {
          deps.setStatusT("store.status.cannotDeleteSystemManagedComponent");
          return;
        }
        if (node?.kind === "sheet") {
          if (isProtectedSystemSheet(deps.state.project, node.sheetId)) {
            deps.setStatusT("store.status.cannotDeleteSystemSheet");
            return;
          }
          links.deleteSheetDefinition(node.sheetId);
          return;
        }
      }

      if (sel.kind === "wire-connection") {
        links.removeDirectConnection(sel.id);
        deps.clearPendingConnectionUi();
        return;
      }

      if (sel.kind === "multi") {
        removeMultiSelection(sel);
        return;
      }

      removeSimpleSelection(sel);
    },
  };
}
