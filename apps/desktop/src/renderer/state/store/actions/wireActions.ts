import type { FailureMatcher } from "@nohal/core";
import { getSheet, resolveEndpointInSheet } from "@nohal/core/graph";
import { sheetEdits } from "@nohal/core/sheet";
import type { SheetEndpointRef, XY } from "@nohal/core/types";
import { validateDirectConnection } from "@nohal/core/validation";
import {
  type ActionStatusUpdate,
  createFailureReporter,
  type ExtractActionFailuresDeep,
} from "./actionFailureTypes";
import type { EditorStoreActionContext } from "./types";

export function createWireActions(deps: EditorStoreActionContext) {
  type WireActionFailure = ExtractActionFailuresDeep<typeof sheetEdits>;

  const wireActionFailureMatcher: FailureMatcher<
    WireActionFailure,
    ActionStatusUpdate
  > = {
    "not-found": {
      "direct-connection": {
        _: "store.status.wireEditTargetMissing",
      },
      "label-anchor": {
        _: "store.status.wireEditTargetMissing",
      },
      label: {
        _: "store.status.wireEditTargetMissing",
      },
    },
    "invalid-input": {
      "direct-connection-signal-name": {
        "invalid-name": "store.status.invalidHalSignalName",
      },
    },
  };
  const reportWireActionFailure = createFailureReporter(
    deps,
    wireActionFailureMatcher,
  );

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
      deps
        .withProjectResult((nextProject) => {
          const sheet = getSheet(nextProject, activeSheetId);
          return sheetEdits.connection.add(sheet, {
            a: pending,
            b: endpoint,
            ...(pendingWirePoints.length > 0
              ? { waypoints: [...pendingWirePoints] }
              : {}),
          });
        })
        .match(() => {
          clearPendingEndpoint();
          deps.setStatusT("store.status.connectedEndpoints");
        }, reportWireActionFailure);
    },

    anchorPendingToLabel(labelId: string): void {
      const pending = deps.state.pendingEndpoint;
      if (!pending) return;
      const activeSheetId = deps.state.activeSheetId;
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, activeSheetId);
          return sheetEdits.labelAnchor.add(sheet, labelId, pending);
        })
        .match(() => {
          clearPendingEndpoint();
          deps.setStatusT("store.status.attachedEndpointToLabel");
        }, reportWireActionFailure);
    },

    removeDirectConnection(connectionId: string): void {
      const activeSheetId = deps.state.activeSheetId;
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, activeSheetId);
          return sheetEdits.connection.remove(sheet, connectionId);
        })
        .match(() => {
          deps.clearSelectionIfWireConnection(connectionId);
          deps.setStatusT("store.status.removedConnection");
        }, reportWireActionFailure);
    },

    splitDirectConnectionIntoLabels(
      connectionId: string,
      labelPositions?: {
        firstLabelPosition: XY;
        secondLabelPosition: XY;
      },
    ): void {
      const activeSheetId = deps.state.activeSheetId;

      deps
        .withProjectResult((project) =>
          sheetEdits.connection.splitIntoLabels(
            getSheet(project, activeSheetId),
            connectionId,
            labelPositions,
          ),
        )
        .match(({ data }) => {
          deps.clearSelectionIfWireConnection(connectionId);
          deps.setStatusT("store.status.splitConnectionIntoLabels", {
            name: data.labelName,
          });
        }, reportWireActionFailure);
    },

    updateDirectConnectionWaypoints(
      connectionId: string,
      waypoints: XY[],
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, activeSheetId);
          return sheetEdits.connection.waypoints.update(
            sheet,
            connectionId,
            waypoints,
          );
        })
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedWireRoute");
        }, reportWireActionFailure);
    },

    updateDirectConnectionSignalName(
      connectionId: string,
      signalName: string,
    ): void {
      const activeSheetId = deps.state.activeSheetId;
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, activeSheetId);
          return sheetEdits.connection.signalName.update(
            sheet,
            connectionId,
            signalName,
          );
        })
        .orTee(reportWireActionFailure);
    },

    removeLabelAnchor(anchorId: string): void {
      const activeSheetId = deps.state.activeSheetId;
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, activeSheetId);
          return sheetEdits.labelAnchor.remove(sheet, anchorId);
        })
        .match(() => {
          if (
            deps.state.selection?.kind === "label-anchor" &&
            deps.state.selection.id === anchorId
          ) {
            deps.setState("selection", null);
          }
          deps.setStatusT("store.status.removedLabelAnchor");
        }, reportWireActionFailure);
    },
  };
}
