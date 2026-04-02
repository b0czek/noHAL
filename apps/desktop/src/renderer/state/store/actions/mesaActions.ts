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
  syncMesaManagedProjection as syncMesaManagedProjectionEdit,
  updateMesaHostIp as updateMesaHostIpEdit,
  updateMesaHostKind as updateMesaHostKindEdit,
} from "@nohal/core/mesa";
import type { EditorStoreActionContext } from "./types";

export function createMesaActions(deps: EditorStoreActionContext) {
  return {
    addMesaHost(kind?: ProjectMesaHostKind): void {
      const hostId = deps.withProject((project) =>
        addMesaHostEdit(project, kind),
      );
      deps.setStatusT("store.status.addedMesaHost", { hostId });
    },

    removeMesaHost(hostId: string): void {
      const changed = deps.withProject((project) =>
        removeMesaHostEdit(project, hostId),
      );
      if (!changed) return;
      deps.setStatusT("store.status.removedMesaHost");
    },

    updateMesaHostKind(hostId: string, kind: ProjectMesaHostKind): void {
      const changed = deps.withProject((project) =>
        updateMesaHostKindEdit(project, hostId, kind),
      );
      if (!changed) return;
      deps.setStatusT("store.status.updatedMesaHost");
    },

    updateMesaHostIp(hostId: string, ip: string): void {
      const changed = deps.withProject((project) =>
        updateMesaHostIpEdit(project, hostId, ip),
      );
      if (!changed) return;
      deps.setStatusT("store.status.updatedMesaHostIp");
    },

    setMesaConnectorCard(
      hostId: string,
      connectorKey: string,
      cardKind: ProjectMesaConnectorCardKind | undefined,
    ): void {
      const changed = deps.withProject((project) =>
        setMesaConnectorCardEdit(project, hostId, connectorKey, cardKind),
      );
      if (!changed) return;
      deps.setStatusT("store.status.updatedMesaConnector");
    },

    setMesaRawGpioPinDirection(
      hostId: string,
      connectorKey: string,
      pinIndex: number,
      direction: ProjectMesaGpioDirection,
    ): void {
      const changed = deps.withProject((project) =>
        setMesaRawGpioPinDirectionEdit(
          project,
          hostId,
          connectorKey,
          pinIndex,
          direction,
        ),
      );
      if (!changed) return;
      deps.setStatusT("store.status.updatedMesaRawGpio");
    },

    setMesaSmartSerialCard(
      hostId: string,
      target: ProjectMesaSmartSerialTarget,
      cardKind: ProjectMesaSmartSerialCardKind | undefined,
    ): void {
      const changed = deps.withProject((project) =>
        setMesaSmartSerialCardEdit(project, hostId, target, cardKind),
      );
      if (!changed) return;
      deps.setStatusT("store.status.updatedMesaSmartSerial");
    },

    syncMesaManagedProjection(): void {
      const finalResult = deps.withProject((project) =>
        syncMesaManagedProjectionEdit(project),
      );
      if (!finalResult.changed) {
        deps.setStatusT("store.status.mesaProjectionAlreadyInSync");
        return;
      }
      deps.setStatusT("store.status.syncedMesaProjection", {
        added: finalResult.plan.addNodes.length,
        removed: finalResult.plan.removeNodes.length,
        ensured: finalResult.plan.ensureComponents.length,
        updated: finalResult.plan.updateNodes.length,
      });
    },
  };
}
