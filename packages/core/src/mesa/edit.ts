import { createId } from "../id";
import type { NoHALProject } from "../types";
import {
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  getMesaSmartSerialCatalogEntry,
} from "./catalog";
import {
  type MesaReconcilePlan,
  planMesaReconcile,
  reconcileMesaManagedNodes,
} from "./reconcile";
import {
  DEFAULT_MESA_HOST_KIND,
  ensureProjectMesa,
  normalizeProjectMesaConfig,
} from "./shared";
import type {
  ProjectMesaConnectorCardKind,
  ProjectMesaGpioDirection,
  ProjectMesaHostConfig,
  ProjectMesaHostKind,
  ProjectMesaSmartSerialCardKind,
  ProjectMesaSmartSerialTarget,
} from "./types";
import { MESA_RAW_GPIO_CARD_KIND } from "./types";

function findMesaHost(
  project: NoHALProject,
  hostId: string,
): ProjectMesaHostConfig | null {
  return (
    ensureProjectMesa(project).hosts.find((host) => host.id === hostId) ?? null
  );
}

function renormalizeMesa(project: NoHALProject): void {
  project.mesa = normalizeProjectMesaConfig(project.mesa);
}

export function addMesaHost(
  project: NoHALProject,
  kind: ProjectMesaHostKind = DEFAULT_MESA_HOST_KIND,
): string {
  const mesa = ensureProjectMesa(project);
  const hostId = createId("mesa_host");
  mesa.hosts.push({
    id: hostId,
    kind,
    ip: "",
    connectors: [],
    smartSerial: [],
  });
  renormalizeMesa(project);
  return hostId;
}

export function removeMesaHost(project: NoHALProject, hostId: string): boolean {
  const mesa = ensureProjectMesa(project);
  const index = mesa.hosts.findIndex((host) => host.id === hostId);
  if (index < 0) return false;
  mesa.hosts.splice(index, 1);
  renormalizeMesa(project);
  return true;
}

export function updateMesaHostKind(
  project: NoHALProject,
  hostId: string,
  kind: ProjectMesaHostKind,
): boolean {
  const host = findMesaHost(project, hostId);
  if (!host || host.kind === kind) return false;
  host.kind = kind;
  renormalizeMesa(project);
  return true;
}

export function updateMesaHostIp(
  project: NoHALProject,
  hostId: string,
  ip: string,
): boolean {
  const host = findMesaHost(project, hostId);
  if (!host) return false;
  if (host.ip === ip) return false;
  host.ip = ip;
  renormalizeMesa(project);
  return true;
}

export function setMesaConnectorCard(
  project: NoHALProject,
  hostId: string,
  connectorKey: string,
  cardKind: ProjectMesaConnectorCardKind | undefined,
): boolean {
  const host = findMesaHost(project, hostId);
  if (!host) return false;
  const connectors = host.connectors ?? [];
  const smartSerial = host.smartSerial ?? [];
  const index = connectors.findIndex(
    (item) => item.connectorKey === connectorKey,
  );
  if (!cardKind) {
    if (index < 0) return false;
    connectors.splice(index, 1);
    host.connectors = connectors;
    host.smartSerial = smartSerial.filter(
      (item) => item.connectorKey !== connectorKey,
    );
    renormalizeMesa(project);
    return true;
  }
  if (index >= 0 && connectors[index]?.cardKind === cardKind) return false;
  const nextAssignment =
    cardKind === MESA_RAW_GPIO_CARD_KIND
      ? { connectorKey, cardKind, rawGpio: { outputPins: [] } }
      : { connectorKey, cardKind };
  if (index >= 0) {
    connectors[index] = nextAssignment;
  } else connectors.push(nextAssignment);
  host.connectors = connectors;
  host.smartSerial = smartSerial.filter(
    (item) => item.connectorKey !== connectorKey,
  );
  renormalizeMesa(project);
  return true;
}

export function setMesaSmartSerialProcessDataMode(
  project: NoHALProject,
  hostId: string,
  target: ProjectMesaSmartSerialTarget,
  processDataMode: number,
): boolean {
  const host = findMesaHost(project, hostId);
  if (!host || !Number.isInteger(processDataMode) || processDataMode < 0) {
    return false;
  }
  const assignment = (host.smartSerial ?? []).find(
    (item) =>
      item.connectorKey === target.connectorKey &&
      item.portKey === target.portKey &&
      item.channel === target.channel,
  );
  const cardKind = assignment?.cardKind;
  const card = cardKind ? getMesaSmartSerialCatalogEntry(cardKind) : undefined;
  if (!assignment || !card) {
    return false;
  }
  if (!card.processDataModes?.some((mode) => mode.mode === processDataMode)) {
    return false;
  }
  if (assignment.processDataMode === processDataMode) return false;
  assignment.processDataMode = processDataMode;
  renormalizeMesa(project);
  return true;
}

export function setMesaRawGpioPinDirection(
  project: NoHALProject,
  hostId: string,
  connectorKey: string,
  pinIndex: number,
  direction: ProjectMesaGpioDirection,
): boolean {
  const host = findMesaHost(project, hostId);
  if (!host || !Number.isInteger(pinIndex) || pinIndex < 0) return false;
  const connectors = host.connectors ?? [];
  const assignment = connectors.find(
    (item) =>
      item.connectorKey === connectorKey &&
      item.cardKind === MESA_RAW_GPIO_CARD_KIND,
  );
  if (!assignment) return false;
  const outputPins = new Set(assignment.rawGpio?.outputPins ?? []);
  const hadPin = outputPins.has(pinIndex);
  if (direction === "output") outputPins.add(pinIndex);
  else outputPins.delete(pinIndex);
  if ((direction === "output") === hadPin) return false;
  assignment.rawGpio = {
    outputPins: [...outputPins].sort((a, b) => a - b),
  };
  renormalizeMesa(project);
  return true;
}

export function setMesaSmartSerialCard(
  project: NoHALProject,
  hostId: string,
  target: ProjectMesaSmartSerialTarget,
  cardKind: ProjectMesaSmartSerialCardKind | undefined,
): boolean {
  const host = findMesaHost(project, hostId);
  if (!host) return false;
  const connectorCard = target.connectorKey
    ? getMesaDb25CardCatalogEntry(
        (host.connectors ?? []).find(
          (item) => item.connectorKey === target.connectorKey,
        )?.cardKind ?? "",
      )
    : undefined;
  const connectorPort = connectorCard?.sserial.smartSerialPorts.find(
    (item) => item.key === target.portKey,
  );
  const hostPort = !target.connectorKey
    ? getMesaHostCatalogEntry(host.kind)?.smartSerialPorts.find(
        (item) => item.key === target.portKey,
      )
    : undefined;
  if (connectorPort?.fixedCardKind) return false;
  if (
    target.connectorKey &&
    !(host.connectors ?? []).some(
      (item) =>
        item.connectorKey === target.connectorKey &&
        Boolean(getMesaDb25CardCatalogEntry(item.cardKind ?? "")),
    )
  ) {
    return false;
  }
  if (!connectorPort && !hostPort) return false;
  const smartSerial = host.smartSerial ?? [];
  const index = smartSerial.findIndex(
    (item) =>
      item.connectorKey === target.connectorKey &&
      item.portKey === target.portKey &&
      item.channel === target.channel,
  );
  if (!cardKind) {
    if (index < 0) return false;
    smartSerial.splice(index, 1);
    host.smartSerial = smartSerial;
    renormalizeMesa(project);
    return true;
  }
  if (index >= 0 && smartSerial[index]?.cardKind === cardKind) return false;
  const card = getMesaSmartSerialCatalogEntry(cardKind);
  if (!card) return false;
  const next = {
    ...target,
    cardKind,
    processDataMode: card.processDataModes?.length
      ? card.defaultMode
      : undefined,
  };
  if (index >= 0) smartSerial[index] = next;
  else smartSerial.push(next);
  host.smartSerial = smartSerial;
  renormalizeMesa(project);
  return true;
}

export function syncMesaManagedProjection(project: NoHALProject): {
  changed: boolean;
  plan: MesaReconcilePlan;
} {
  const plan = planMesaReconcile(project);
  if (plan.inSync) return { changed: false, plan };
  reconcileMesaManagedNodes(project);
  return { changed: true, plan };
}
