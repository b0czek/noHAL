import {
  addMesaHost,
  createDefaultMesaConfig,
  type ProjectMesaConfig,
  type ProjectMesaConnectorCardKind,
  type ProjectMesaGpioDirection,
  type ProjectMesaHostKind,
  type ProjectMesaSmartSerialCardKind,
  type ProjectMesaSmartSerialTarget,
  removeMesaHost,
  setMesaConnectorCard,
  setMesaRawGpioPinDirection,
  setMesaSmartSerialCard,
  updateMesaHostIp,
  updateMesaHostKind,
} from "@nohal/core/mesa";
import { createEmptyProject } from "@nohal/core/project";
import { unwrap } from "solid-js/store";

function editMesaConfig(
  mesaConfig: ProjectMesaConfig | null,
  edit: (project: ReturnType<typeof createEmptyProject>) => void,
): ProjectMesaConfig {
  const project = createEmptyProject("Imported Mesa");
  project.mesa = structuredClone(
    unwrap(mesaConfig ?? createDefaultMesaConfig()),
  );
  edit(project);
  return structuredClone(project.mesa ?? createDefaultMesaConfig());
}

export const mesaEdits = {
  addHost: (mesaConfig: ProjectMesaConfig | null, kind?: ProjectMesaHostKind) =>
    editMesaConfig(mesaConfig, (project) => {
      addMesaHost(project, kind);
    }),
  removeHost: (mesaConfig: ProjectMesaConfig | null, hostId: string) =>
    editMesaConfig(mesaConfig, (project) => {
      removeMesaHost(project, hostId);
    }),
  updateHostKind: (
    mesaConfig: ProjectMesaConfig | null,
    hostId: string,
    kind: ProjectMesaHostKind,
  ) =>
    editMesaConfig(mesaConfig, (project) => {
      updateMesaHostKind(project, hostId, kind);
    }),
  updateHostIp: (
    mesaConfig: ProjectMesaConfig | null,
    hostId: string,
    ip: string,
  ) =>
    editMesaConfig(mesaConfig, (project) => {
      updateMesaHostIp(project, hostId, ip);
    }),
  setConnectorCard: (
    mesaConfig: ProjectMesaConfig | null,
    hostId: string,
    connectorKey: string,
    cardKind: ProjectMesaConnectorCardKind | undefined,
  ) =>
    editMesaConfig(mesaConfig, (project) => {
      setMesaConnectorCard(project, hostId, connectorKey, cardKind);
    }),
  setRawGpioPinDirection: (
    mesaConfig: ProjectMesaConfig | null,
    hostId: string,
    connectorKey: string,
    pinIndex: number,
    direction: ProjectMesaGpioDirection,
  ) =>
    editMesaConfig(mesaConfig, (project) => {
      setMesaRawGpioPinDirection(
        project,
        hostId,
        connectorKey,
        pinIndex,
        direction,
      );
    }),
  setSmartSerialCard: (
    mesaConfig: ProjectMesaConfig | null,
    hostId: string,
    target: ProjectMesaSmartSerialTarget,
    cardKind: ProjectMesaSmartSerialCardKind | undefined,
  ) =>
    editMesaConfig(mesaConfig, (project) => {
      setMesaSmartSerialCard(project, hostId, target, cardKind);
    }),
};
