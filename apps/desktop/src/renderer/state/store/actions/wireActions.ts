import { getSheet, resolveEndpointInSheet } from "@nohal/core/src/graph";
import { isValidHalName } from "@nohal/core/src/halNames";
import { createId } from "@nohal/core/src/id";
import type { SheetEndpointRef, XY } from "@nohal/core/src/types";
import { validateDirectConnection } from "@nohal/core/src/validation";
import type { EditorStoreActionContext } from "./types";

export function createWireActions(deps: EditorStoreActionContext) {
  const selectPendingEndpoint = (endpoint: SheetEndpointRef): void => {
    deps.setState("pendingEndpoint", endpoint);
    deps.setState("pendingWirePoints", []);
  };

  const clearPendingEndpoint = (): void => {
    deps.setState("pendingEndpoint", null);
    deps.setState("pendingWirePoints", []);
  };

  return {
    endpointClick(endpoint: SheetEndpointRef): void {
      const pending = deps.state.pendingEndpoint;
      const project = deps.state.project;
      const activeSheetId = deps.state.activeSheetId;

      if (!pending) {
        selectPendingEndpoint(endpoint);
        try {
          const info = resolveEndpointInSheet(project, activeSheetId, endpoint);
          deps.setState(
            "status",
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
        getSheet(deps.state.project, deps.state.activeSheetId)
          .directConnections,
      );
      if (!validation.ok) {
        deps.setState(
          "status",
          validation.reason ?? deps.t("store.status.invalidConnection"),
        );
        selectPendingEndpoint(endpoint);
        return;
      }

      const pendingWirePoints = deps.state.pendingWirePoints;
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
      const pending = deps.state.pendingEndpoint;
      if (!pending) return;
      const activeSheetId = deps.state.activeSheetId;
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
      const activeSheetId = deps.state.activeSheetId;
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
      const activeSheetId = deps.state.activeSheetId;
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const conn = sheet.directConnections.find((c) => c.id === connectionId);
        if (!conn) return;
        if (waypoints.length === 0) delete conn.waypoints;
        else conn.waypoints = waypoints.map((p) => ({ x: p.x, y: p.y }));
      });
      deps.setStatusT("store.status.updatedWireRoute");
    },

    updateDirectConnectionSignalName(
      connectionId: string,
      signalName: string,
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      const normalized = signalName.trim();
      if (normalized.length > 0 && !isValidHalName(normalized)) {
        deps.setState("status", `Invalid HAL signal name: ${normalized}`);
        return;
      }
      deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        const conn = sheet.directConnections.find((c) => c.id === connectionId);
        if (!conn) return;
        if (normalized.length > 0) conn.signalName = normalized;
        else delete conn.signalName;
      });
    },

    removeLabelAnchor(anchorId: string): void {
      const activeSheetId = deps.state.activeSheetId;
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
