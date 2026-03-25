import type {
  ProjectMesaDb25CardKind,
  ProjectMesaHostKind,
  ProjectMesaSmartSerialAssignment,
  ProjectMesaSmartSerialCardKind,
} from "../types";
import {
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  getMesaSmartSerialCatalogEntry,
} from "./index";

export function isMesaConnectorCardCompatible(
  hostKind: ProjectMesaHostKind,
  connectorKey: string,
  cardKind: ProjectMesaDb25CardKind,
): boolean {
  const host = getMesaHostCatalogEntry(hostKind);
  const connector = host?.connectorSlots.find(
    (item) => item.key === connectorKey,
  );
  const card = getMesaDb25CardCatalogEntry(cardKind);
  if (!host || !connector || !card) return false;
  return card.compatibleConnectorKinds.includes(connector.kind);
}

export function isMesaSmartSerialCardCompatible(
  hostKind: ProjectMesaHostKind,
  assignment: Pick<
    ProjectMesaSmartSerialAssignment,
    "connectorKey" | "portKey" | "channel"
  >,
  connectorCardKind: ProjectMesaDb25CardKind | undefined,
  cardKind: ProjectMesaSmartSerialCardKind,
): boolean {
  const host = getMesaHostCatalogEntry(hostKind);
  if (!host) return false;
  const port = assignment.connectorKey
    ? getMesaDb25CardCatalogEntry(
        connectorCardKind ?? "",
      )?.sserial.smartSerialPorts.find(
        (item) => item.key === assignment.portKey,
      )
    : host.smartSerialPorts.find((item) => item.key === assignment.portKey);
  if (!port) return false;
  if (
    !Number.isInteger(assignment.channel) ||
    assignment.channel < 0 ||
    assignment.channel >= port.channels
  ) {
    return false;
  }
  return !!getMesaSmartSerialCatalogEntry(cardKind);
}
