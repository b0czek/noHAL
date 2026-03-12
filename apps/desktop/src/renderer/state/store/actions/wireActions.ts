import { getSheet, resolveEndpointInSheet } from "@nohal/core/src/graph";
import { isValidHalName } from "@nohal/core/src/halNames";
import { sheetEdits } from "@nohal/core/src/sheet";
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
        sheetEdits.connection.add(sheet, {
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
        sheetEdits.labelAnchor.add(sheet, labelId, pending);
      });
      clearPendingEndpoint();
      deps.setStatusT("store.status.attachedEndpointToLabel");
    },

    removeDirectConnection(connectionId: string): void {
      const activeSheetId = deps.state.activeSheetId;
      const removed = deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        return sheetEdits.connection.remove(sheet, connectionId);
      });
      if (!removed) return;
      deps.clearSelectionIfWireConnection(connectionId);
      deps.setStatusT("store.status.removedConnection");
    },

    splitDirectConnectionIntoLabels(
      connectionId: string,
      labelPositions?: {
        firstLabelPosition: XY;
        secondLabelPosition: XY;
      },
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      const sheet = getSheet(deps.state.project, activeSheetId);
      if (
        !sheet.directConnections.some(
          (connection) => connection.id === connectionId,
        )
      ) {
        return;
      }

      const result = deps.withProject((project) =>
        sheetEdits.connection.splitIntoLabels(
          getSheet(project, activeSheetId),
          connectionId,
          labelPositions,
        ),
      );
      if (!result) return;
      deps.clearSelectionIfWireConnection(connectionId);
      deps.setStatusT("store.status.splitConnectionIntoLabels", {
        name: result.labelName,
      });
    },

    updateDirectConnectionWaypoints(
      connectionId: string,
      waypoints: XY[],
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      const updated = deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        return sheetEdits.connection.waypoints.update(
          sheet,
          connectionId,
          waypoints,
        );
      });
      if (!updated) return;
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
        sheetEdits.connection.signalName.update(
          sheet,
          connectionId,
          normalized,
        );
      });
    },

    removeLabelAnchor(anchorId: string): void {
      const activeSheetId = deps.state.activeSheetId;
      const removed = deps.withProject((project) => {
        const sheet = getSheet(project, activeSheetId);
        return sheetEdits.labelAnchor.remove(sheet, anchorId);
      });
      if (!removed) return;
      deps.setStatusT("store.status.removedLabelAnchor");
    },
  };
}
