import type { FailureMatcher } from "@nohal/core";
import {
  mesaEdits,
  type ProjectMesaConnectorCardKind,
  type ProjectMesaGpioDirection,
  type ProjectMesaHostKind,
  type ProjectMesaSmartSerialCardKind,
  type ProjectMesaSmartSerialTarget,
} from "@nohal/core/mesa";
import {
  type ActionStatusUpdate,
  createFailureReporter,
  type ExtractActionFailuresDeep,
} from "./actionFailureTypes";
import type { EditorStoreActionContext } from "./types";

export function createMesaActions(deps: EditorStoreActionContext) {
  type MesaActionFailure = ExtractActionFailuresDeep<typeof mesaEdits>;

  const mesaActionFailureMatcher: FailureMatcher<
    MesaActionFailure,
    ActionStatusUpdate
  > = {
    "not-found": {
      "mesa-host": {
        _: "store.status.mesaHostMissing",
      },
      "mesa-connector": {
        _: "store.status.mesaConnectorUnavailable",
      },
      "smart-serial-port": {
        _: "store.status.mesaSmartSerialTargetUnavailable",
      },
      "smart-serial-assignment": {
        _: "store.status.mesaSmartSerialTargetUnavailable",
      },
      "raw-gpio-assignment": {
        _: "store.status.mesaRawGpioUnavailable",
      },
    },
    "invalid-input": {
      "smart-serial-target": {
        "smart-serial-channel": "store.status.mesaInvalidSmartSerialChannel",
        "process-data-mode": "store.status.mesaInvalidProcessDataMode",
        "smart-serial-card": "store.status.mesaSmartSerialTargetUnavailable",
      },
      "raw-gpio": {
        "pin-index": "store.status.mesaInvalidRawGpioPin",
      },
    },
    forbidden: {
      "smart-serial-target": {
        "fixed-card-kind": "store.status.mesaSmartSerialTargetFixed",
      },
    },
    unsupported: {
      "mesa-connector": {
        "connector-card": "store.status.mesaConnectorUnavailable",
        "raw-gpio": "store.status.mesaRawGpioUnavailable",
      },
    },
  };
  const reportMesaActionFailure = createFailureReporter(
    deps,
    mesaActionFailureMatcher,
  );

  return {
    addMesaHost(kind?: ProjectMesaHostKind): void {
      deps
        .withProjectResult((project) => mesaEdits.host.add(project, kind))
        .match(({ data }) => {
          deps.setStatusT("store.status.addedMesaHost", { hostId: data });
        }, reportMesaActionFailure);
    },

    removeMesaHost(hostId: string): void {
      deps
        .withProjectResult((project) => mesaEdits.host.remove(project, hostId))
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.removedMesaHost");
        }, reportMesaActionFailure);
    },

    updateMesaHostKind(hostId: string, kind: ProjectMesaHostKind): void {
      deps
        .withProjectResult((project) =>
          mesaEdits.host.kind.update(project, hostId, kind),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaHost");
        }, reportMesaActionFailure);
    },

    updateMesaHostIp(hostId: string, ip: string): void {
      deps
        .withProjectResult((project) =>
          mesaEdits.host.ip.update(project, hostId, ip),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaHostIp");
        }, reportMesaActionFailure);
    },

    setMesaConnectorCard(
      hostId: string,
      connectorKey: string,
      cardKind: ProjectMesaConnectorCardKind | undefined,
    ): void {
      deps
        .withProjectResult((project) =>
          mesaEdits.connector.card.set(project, hostId, connectorKey, cardKind),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaConnector");
        }, reportMesaActionFailure);
    },

    setMesaSmartSerialProcessDataMode(
      hostId: string,
      target: ProjectMesaSmartSerialTarget,
      processDataMode: number,
    ): void {
      deps
        .withProjectResult((project) =>
          mesaEdits.smartSerial.processDataMode.set(
            project,
            hostId,
            target,
            processDataMode,
          ),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaProcessDataMode");
        }, reportMesaActionFailure);
    },

    setMesaRawGpioPinDirection(
      hostId: string,
      connectorKey: string,
      pinIndex: number,
      direction: ProjectMesaGpioDirection,
    ): void {
      deps
        .withProjectResult((project) =>
          mesaEdits.rawGpio.pinDirection.set(
            project,
            hostId,
            connectorKey,
            pinIndex,
            direction,
          ),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaRawGpio");
        }, reportMesaActionFailure);
    },

    setMesaSmartSerialCard(
      hostId: string,
      target: ProjectMesaSmartSerialTarget,
      cardKind: ProjectMesaSmartSerialCardKind | undefined,
    ): void {
      deps
        .withProjectResult((project) =>
          mesaEdits.smartSerial.card.set(project, hostId, target, cardKind),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaSmartSerial");
        }, reportMesaActionFailure);
    },

    syncMesaManagedProjection(): void {
      deps
        .withProjectResult((project) => mesaEdits.projection.sync(project))
        .match(
          ({ data, changed }) => {
            if (!changed) {
              deps.setStatusT("store.status.mesaProjectionAlreadyInSync");
              return;
            }
            deps.setStatusT("store.status.syncedMesaProjection", {
              added: data.addNodes.length,
              removed: data.removeNodes.length,
              ensured: data.ensureComponents.length,
              updated: data.updateNodes.length,
            });
          },
          () => {},
        );
    },
  };
}
