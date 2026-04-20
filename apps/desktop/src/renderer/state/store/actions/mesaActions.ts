import { type FailureCode, matchFailure } from "@nohal/core";
import {
  addMesaHost as addMesaHostEdit,
  type ProjectMesaConnectorCardKind,
  type ProjectMesaGpioDirection,
  type ProjectMesaHostKind,
  type ProjectMesaSmartSerialCardKind,
  type ProjectMesaSmartSerialTarget,
  removeMesaHost as removeMesaHostEdit,
  setMesaConnectorCard as setMesaConnectorCardEdit,
  setMesaRawGpioPinDirection as setMesaRawGpioPinDirectionEdit,
  setMesaSmartSerialCard as setMesaSmartSerialCardEdit,
  setMesaSmartSerialProcessDataMode as setMesaSmartSerialProcessDataModeEdit,
  syncMesaManagedProjection as syncMesaManagedProjectionEdit,
  updateMesaHostIp as updateMesaHostIpEdit,
  updateMesaHostKind as updateMesaHostKindEdit,
} from "@nohal/core/mesa";
import type { EditorStoreActionContext } from "./types";

export function createMesaActions(deps: EditorStoreActionContext) {
  const setMesaHostMissingStatus = (): void => {
    deps.setStatusT("store.status.mesaHostMissing");
  };

  const setMesaConnectorFailureStatus = (error: {
    code: FailureCode;
    detail?: string;
  }): void => {
    matchFailure(error, {
      "not-found": {
        "mesa-host": () => {
          setMesaHostMissingStatus();
        },
        "mesa-connector": () => {
          deps.setStatusT("store.status.mesaConnectorUnavailable");
        },
      },
      unsupported: {
        "connector-card": () => {
          deps.setStatusT("store.status.mesaConnectorUnavailable");
        },
        "raw-gpio": () => {
          deps.setStatusT("store.status.mesaRawGpioUnavailable");
        },
      },
    });
  };

  const setMesaSmartSerialTargetFailureStatus = (error: {
    code: FailureCode;
    detail?: string;
  }): void => {
    matchFailure(error, {
      "not-found": {
        "mesa-host": () => {
          setMesaHostMissingStatus();
        },
        "smart-serial-port": () => {
          deps.setStatusT("store.status.mesaSmartSerialTargetUnavailable");
        },
        "smart-serial-assignment": () => {
          deps.setStatusT("store.status.mesaSmartSerialTargetUnavailable");
        },
      },
      forbidden: {
        "fixed-card-kind": () => {
          deps.setStatusT("store.status.mesaSmartSerialTargetFixed");
        },
      },
      "invalid-input": {
        "smart-serial-channel": () => {
          deps.setStatusT("store.status.mesaInvalidSmartSerialChannel");
        },
        "process-data-mode": () => {
          deps.setStatusT("store.status.mesaInvalidProcessDataMode");
        },
        "smart-serial-card": () => {
          deps.setStatusT("store.status.mesaSmartSerialTargetUnavailable");
        },
      },
    });
  };

  const setMesaRawGpioFailureStatus = (error: {
    code: FailureCode;
    detail?: string;
  }): void => {
    matchFailure(error, {
      "not-found": {
        "mesa-host": () => {
          setMesaHostMissingStatus();
        },
        "raw-gpio-assignment": () => {
          deps.setStatusT("store.status.mesaRawGpioUnavailable");
        },
      },
      "invalid-input": {
        "pin-index": () => {
          deps.setStatusT("store.status.mesaInvalidRawGpioPin");
        },
      },
    });
  };

  return {
    addMesaHost(kind?: ProjectMesaHostKind): void {
      deps
        .withProjectResult((project) => addMesaHostEdit(project, kind))
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.addedMesaHost", { hostId: data });
          },
          () => {
            setMesaHostMissingStatus();
          },
        );
    },

    removeMesaHost(hostId: string): void {
      deps
        .withProjectResult((project) => removeMesaHostEdit(project, hostId))
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.removedMesaHost");
          },
          () => {
            setMesaHostMissingStatus();
          },
        );
    },

    updateMesaHostKind(hostId: string, kind: ProjectMesaHostKind): void {
      deps
        .withProjectResult((project) =>
          updateMesaHostKindEdit(project, hostId, kind),
        )
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedMesaHost");
          },
          () => {
            setMesaHostMissingStatus();
          },
        );
    },

    updateMesaHostIp(hostId: string, ip: string): void {
      deps
        .withProjectResult((project) =>
          updateMesaHostIpEdit(project, hostId, ip),
        )
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedMesaHostIp");
          },
          () => {
            setMesaHostMissingStatus();
          },
        );
    },

    setMesaConnectorCard(
      hostId: string,
      connectorKey: string,
      cardKind: ProjectMesaConnectorCardKind | undefined,
    ): void {
      deps
        .withProjectResult((project) =>
          setMesaConnectorCardEdit(project, hostId, connectorKey, cardKind),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaConnector");
        }, setMesaConnectorFailureStatus);
    },

    setMesaSmartSerialProcessDataMode(
      hostId: string,
      target: ProjectMesaSmartSerialTarget,
      processDataMode: number,
    ): void {
      deps
        .withProjectResult((project) =>
          setMesaSmartSerialProcessDataModeEdit(
            project,
            hostId,
            target,
            processDataMode,
          ),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaProcessDataMode");
        }, setMesaSmartSerialTargetFailureStatus);
    },

    setMesaRawGpioPinDirection(
      hostId: string,
      connectorKey: string,
      pinIndex: number,
      direction: ProjectMesaGpioDirection,
    ): void {
      deps
        .withProjectResult((project) =>
          setMesaRawGpioPinDirectionEdit(
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
        }, setMesaRawGpioFailureStatus);
    },

    setMesaSmartSerialCard(
      hostId: string,
      target: ProjectMesaSmartSerialTarget,
      cardKind: ProjectMesaSmartSerialCardKind | undefined,
    ): void {
      deps
        .withProjectResult((project) =>
          setMesaSmartSerialCardEdit(project, hostId, target, cardKind),
        )
        .match(({ changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedMesaSmartSerial");
        }, setMesaSmartSerialTargetFailureStatus);
    },

    syncMesaManagedProjection(): void {
      deps
        .withProjectResult((project) => syncMesaManagedProjectionEdit(project))
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
