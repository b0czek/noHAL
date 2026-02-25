import { getSheet } from "../../../../shared/graph";
import type { XY } from "../../../../shared/types";
import {
  cloneProject,
  collectSheetSubtreeIds,
  pruneSheetNodeReferences,
  removeSheetNodeReferencesForDeletedSheets,
  syncProjectUi,
} from "../helpers";
import type { EditorSelection, EditorStoreActionContext } from "./types";

type SelectionActionLinks = {
  deleteSheetDefinition: (sheetId: string) => void;
  removeDirectConnection: (connectionId: string) => void;
};

export function createSelectionActions(
  deps: EditorStoreActionContext,
  links: SelectionActionLinks,
) {
  return {
    select(sel: EditorSelection): void {
      deps.setState("selection", sel);
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

    removeSelection(): void {
      const sel = deps.state.selection;
      if (!sel) return;

      if (sel.kind === "node") {
        const currentSheet = getSheet(
          deps.state.project,
          deps.state.activeSheetId,
        );
        const node = currentSheet.nodes.find((n) => n.id === sel.id);
        if (node?.kind === "sheet") {
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
        const currentSheet = getSheet(
          deps.state.project,
          deps.state.activeSheetId,
        );
        const selectedNodeIds = new Set(sel.nodeIds);
        const selectedLabelIds = new Set(sel.labelIds);
        const selectedPortIds = new Set(sel.portIds);

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
          const removedNodeIds = new Set<string>();
          sheet.nodes = sheet.nodes.filter((n) => {
            if (!selectedNodeIds.has(n.id)) return true;
            removedNodeIds.add(n.id);
            return false;
          });
          pruneSheetNodeReferences(sheet, removedNodeIds);

          sheet.labels = sheet.labels.filter(
            (l) => !selectedLabelIds.has(l.id),
          );
          sheet.labelAnchors = sheet.labelAnchors.filter((a) => {
            if (selectedLabelIds.has(a.labelId)) return false;
            return !(
              a.endpoint.kind === "sheet-port" &&
              selectedPortIds.has(a.endpoint.portId)
            );
          });

          sheet.ports = sheet.ports.filter((p) => !selectedPortIds.has(p.id));
          sheet.directConnections = sheet.directConnections.filter(
            (c) =>
              !(c.a.kind === "sheet-port" && selectedPortIds.has(c.a.portId)) &&
              !(c.b.kind === "sheet-port" && selectedPortIds.has(c.b.portId)),
          );
        }

        syncProjectUi(next, deps.state.activeSheetId);
        deps.pushUndoSnapshot();
        deps.setState("project", next);
        deps.markProjectChanged();
        deps.clearSelectionAndPendingUi();
        deps.setStatusT("store.status.removedSelection");
        return;
      }

      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        if (sel.kind === "node") {
          const removedNodeIds = new Set([sel.id]);
          sheet.nodes = sheet.nodes.filter((n) => n.id !== sel.id);
          pruneSheetNodeReferences(sheet, removedNodeIds);
        } else if (sel.kind === "label") {
          sheet.labels = sheet.labels.filter((l) => l.id !== sel.id);
          sheet.labelAnchors = sheet.labelAnchors.filter(
            (a) => a.labelId !== sel.id,
          );
        } else if (sel.kind === "comment") {
          sheet.comments = sheet.comments.filter((c) => c.id !== sel.id);
        } else if (sel.kind === "sheet-port") {
          sheet.ports = sheet.ports.filter((p) => p.id !== sel.id);
          sheet.directConnections = sheet.directConnections.filter(
            (c) =>
              !(c.a.kind === "sheet-port" && c.a.portId === sel.id) &&
              !(c.b.kind === "sheet-port" && c.b.portId === sel.id),
          );
          sheet.labelAnchors = sheet.labelAnchors.filter(
            (a) =>
              !(
                a.endpoint.kind === "sheet-port" && a.endpoint.portId === sel.id
              ),
          );
        }
      });
      deps.clearSelectionAndPendingUi();
      deps.setStatusT("store.status.removedSelection");
    },
  };
}
