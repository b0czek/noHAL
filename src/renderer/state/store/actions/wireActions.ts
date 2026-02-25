import { getSheet, resolveEndpointInSheet } from "../../../../shared/graph";
import { createId } from "../../../../shared/id";
import type { SheetEndpointRef, XY } from "../../../../shared/types";
import { validateDirectConnection } from "../../../../shared/validation";
import type { EditorStoreActionContext } from "./types";

export function createWireActions(deps: EditorStoreActionContext) {
  const selectPendingEndpoint = (endpoint: SheetEndpointRef): void => {
    deps.setPendingEndpoint(endpoint);
    deps.setPendingWirePoints([]);
  };

  const clearPendingEndpoint = (): void => {
    deps.setPendingEndpoint(null);
    deps.setPendingWirePoints([]);
  };

  return {
    endpointClick(endpoint: SheetEndpointRef): void {
      const pending = deps.getPendingEndpoint();
      const project = deps.getProject();
      const activeSheetId = deps.getActiveSheetId();

      if (!pending) {
        selectPendingEndpoint(endpoint);
        try {
          const info = resolveEndpointInSheet(project, activeSheetId, endpoint);
          deps.setStatus(
            deps.t("store.status.selectedEndpointDetailed", {
              name: info.name,
              direction: info.direction,
              type: info.type,
            }),
          );
        } catch {
          deps.setStatusT("store.status.selectedEndpoint");
        }
        return;
      }

      const validation = validateDirectConnection(
        project,
        activeSheetId,
        pending,
        endpoint,
        deps.getCurrentSheetDirectConnections(),
      );
      if (!validation.ok) {
        deps.setStatus(
          validation.reason ?? deps.t("store.status.invalidConnection"),
        );
        selectPendingEndpoint(endpoint);
        return;
      }

      const pendingWirePoints = deps.getPendingWirePoints();
      deps.withProject((nextProject) => {
        const sheet = getSheet(nextProject, activeSheetId);
        sheet.directConnections.push({
          id: createId("conn"),
          a: pending,
          b: endpoint,
          ...(pendingWirePoints.length > 0
            ? { waypoints: [...pendingWirePoints] }
            : {}),
        });
      });
      clearPendingEndpoint();
      deps.setStatusT("store.status.connectedEndpoints");
    },

    anchorPendingToLabel(labelId: string): void {
      const pending = deps.getPendingEndpoint();
      if (!pending) return;
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const exists = sheet.labelAnchors.some(
          (a) =>
            a.labelId === labelId &&
            JSON.stringify(a.endpoint) === JSON.stringify(pending),
        );
        if (!exists) {
          sheet.labelAnchors.push({
            id: createId("anchor"),
            labelId,
            endpoint: pending,
          });
        }
      });
      clearPendingEndpoint();
      deps.setStatusT("store.status.attachedEndpointToLabel");
    },

    removeDirectConnection(connectionId: string): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        sheet.directConnections = sheet.directConnections.filter(
          (c) => c.id !== connectionId,
        );
      });
      deps.clearSelectionIfWireConnection(connectionId);
      deps.setStatusT("store.status.removedConnection");
    },

    updateDirectConnectionWaypoints(
      connectionId: string,
      waypoints: XY[],
    ): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const conn = sheet.directConnections.find((c) => c.id === connectionId);
        if (!conn) return;
        if (waypoints.length === 0) delete conn.waypoints;
        else conn.waypoints = waypoints.map((p) => ({ x: p.x, y: p.y }));
      });
      deps.setStatusT("store.status.updatedWireRoute");
    },

    removeLabelAnchor(anchorId: string): void {
      const activeSheetId = deps.getActiveSheetId();
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        sheet.labelAnchors = sheet.labelAnchors.filter(
          (a) => a.id !== anchorId,
        );
      });
      deps.setStatusT("store.status.removedLabelAnchor");
    },
  };
}
