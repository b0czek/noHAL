import {
  getConnectedSheetPortReferenceLocations,
  getSheet,
} from "@nohal/core/graph";
import {
  isProtectedSystemNode,
  isProtectedSystemSheet,
} from "@nohal/core/sheet";
import type { XY } from "@nohal/core/types";
import { createSelectionClipboard } from "../../../clipboard/selection";
import {
  cloneProject,
  removeProjectSelectionItems,
  syncProjectUi,
} from "../helpers";
import {
  extendSelection as mergeSelection,
  selectionIdBuckets,
  toggleSelection as toggleSelectionState,
} from "../selection";
import type { MultiSelection } from "../selectionTypes";
import type { EditorSelection, EditorStoreActionContext } from "./types";

interface SelectionActionLinks {
  removeDirectConnection: (connectionId: string) => void;
  removeLabelAnchor: (anchorId: string) => void;
}

export function createSelectionActions(
  deps: EditorStoreActionContext,
  links: SelectionActionLinks,
) {
  const clipboard = createSelectionClipboard(deps);

  const confirmSheetPortDependencyRemoval = (selectionIds: {
    portIds: ReadonlySet<string>;
  }): boolean => {
    if (selectionIds.portIds.size === 0) return true;
    if (typeof window === "undefined" || typeof window.confirm !== "function") {
      return true;
    }

    const connectedInstanceKeys = new Set<string>();
    for (const portId of selectionIds.portIds) {
      for (const reference of getConnectedSheetPortReferenceLocations(
        deps.state.project,
        deps.state.activeSheetId,
        portId,
      )) {
        connectedInstanceKeys.add(
          `${reference.parentSheetId}:${reference.nodeId}`,
        );
      }
    }

    const connectedInstanceCount = connectedInstanceKeys.size;
    if (connectedInstanceCount === 0) return true;

    const translationKey =
      selectionIds.portIds.size === 1
        ? "inspector.confirmDeleteSheetPortUsersSingle"
        : "inspector.confirmDeleteSheetPortUsersMulti";
    return window.confirm(
      deps.t(translationKey, {
        count: connectedInstanceCount,
        ports: selectionIds.portIds.size,
      }),
    );
  };

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

    const next = cloneProject(deps.state.project);
    removeProjectSelectionItems(next, deps.state.activeSheetId, {
      ...selectionIds,
      nodeIds: selectedNodeIds,
    });

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
      const selectionIds = selectionIdBuckets(sel);
      if (!selectionIds) return;
      removeProjectSelectionItems(project, activeSheetId, selectionIds);
    });
    deps.clearSelectionAndPendingUi();
    deps.setStatusT("store.status.removedSelection");
  };

  const rejectProtectedNodeDeletion = (
    sel: NonNullable<EditorSelection>,
  ): boolean => {
    if (sel.kind !== "node") return false;

    const currentSheet = getSheet(deps.state.project, deps.state.activeSheetId);
    const node = currentSheet.nodes.find((entry) => entry.id === sel.id);
    if (node && isProtectedSystemNode(deps.state.project, node)) {
      deps.setStatusT("store.status.cannotDeleteSystemManagedComponent");
      return true;
    }
    if (
      node?.kind === "sheet" &&
      isProtectedSystemSheet(deps.state.project, node.sheetId)
    ) {
      deps.setStatusT("store.status.cannotDeleteSystemSheet");
      return true;
    }
    return false;
  };

  const removeSpecialSelection = (
    sel: NonNullable<EditorSelection>,
  ): boolean => {
    if (sel.kind === "wire-connection") {
      links.removeDirectConnection(sel.id);
      deps.clearPendingConnectionUi();
      return true;
    }

    if (sel.kind === "label-anchor") {
      links.removeLabelAnchor(sel.id);
      deps.clearPendingConnectionUi();
      return true;
    }

    return false;
  };

  const confirmSelectionRemoval = (
    sel: NonNullable<EditorSelection>,
  ): boolean => {
    const selectionIds = selectionIdBuckets(sel);
    if (!selectionIds) return false;
    return confirmSheetPortDependencyRemoval(selectionIds);
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
      if (rejectProtectedNodeDeletion(sel) || removeSpecialSelection(sel)) {
        return;
      }
      if (!confirmSelectionRemoval(sel)) return;

      if (sel.kind === "multi") {
        removeMultiSelection(sel);
        return;
      }

      removeSimpleSelection(sel);
    },
  };
}
