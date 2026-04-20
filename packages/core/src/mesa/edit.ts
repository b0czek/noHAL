import { err, ok, type Result } from "neverthrow";
import { createId } from "../id";
import type { Change } from "../result";
import type { NoHALProject } from "../types";
import {
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  getMesaSmartSerialCatalogEntry,
  isMesaConnectorCardCompatible,
} from "./catalog";
import type {
  MesaHostError,
  SetMesaConnectorCardResult,
  SetMesaRawGpioPinDirectionResult,
  SetMesaSmartSerialCardResult,
  SetMesaSmartSerialProcessDataModeResult,
  ValidateMesaSmartSerialTargetError,
} from "./editTypes";
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
  ProjectMesaDb25CardAssignment,
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

function requireMesaHost(
  project: NoHALProject,
  hostId: string,
): Result<ProjectMesaHostConfig, MesaHostError> {
  const host = findMesaHost(project, hostId);
  if (!host) return err({ code: "not-found", detail: "mesa-host" });
  return ok(host);
}

function validateMesaSmartSerialTarget(
  host: ProjectMesaHostConfig,
  target: ProjectMesaSmartSerialTarget,
): Result<void, ValidateMesaSmartSerialTargetError> {
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
  const channels = connectorPort?.channels ?? hostPort?.channels;

  if (connectorPort?.fixedCardKind) {
    return err({ code: "forbidden", detail: "fixed-card-kind" });
  }
  if (
    target.connectorKey &&
    !(host.connectors ?? []).some(
      (item) =>
        item.connectorKey === target.connectorKey &&
        Boolean(getMesaDb25CardCatalogEntry(item.cardKind ?? "")),
    )
  ) {
    return err({ code: "not-found", detail: "smart-serial-port" });
  }
  if (!connectorPort && !hostPort) {
    return err({ code: "not-found", detail: "smart-serial-port" });
  }
  if (
    !Number.isInteger(target.channel) ||
    target.channel < 0 ||
    !channels ||
    target.channel >= channels
  ) {
    return err({ code: "invalid-input", detail: "smart-serial-channel" });
  }

  return ok(undefined);
}

function applyMesaSmartSerialCard(
  project: NoHALProject,
  host: ProjectMesaHostConfig,
  target: ProjectMesaSmartSerialTarget,
  cardKind: ProjectMesaSmartSerialCardKind | undefined,
): SetMesaSmartSerialCardResult {
  const smartSerial = host.smartSerial ?? [];
  const index = smartSerial.findIndex(
    (item) =>
      item.connectorKey === target.connectorKey &&
      item.portKey === target.portKey &&
      item.channel === target.channel,
  );

  if (!cardKind) {
    if (index < 0) {
      return ok({ data: { target, assignment: null }, changed: false });
    }
    smartSerial.splice(index, 1);
    host.smartSerial = smartSerial;
    renormalizeMesa(project);
    return ok({ data: { target, assignment: null }, changed: true });
  }

  if (index >= 0 && smartSerial[index]?.cardKind === cardKind) {
    return ok({
      data: {
        target,
        assignment: smartSerial[index] ?? null,
      },
      changed: false,
    });
  }

  const card = getMesaSmartSerialCatalogEntry(cardKind);
  if (!card) {
    return err({ code: "invalid-input", detail: "smart-serial-card" });
  }

  const next = {
    ...target,
    cardKind,
    processDataMode: card.processDataModes?.length
      ? card.defaultMode
      : undefined,
  };
  if (index >= 0) {
    smartSerial[index] = next;
  } else {
    smartSerial.push(next);
  }
  host.smartSerial = smartSerial;
  renormalizeMesa(project);
  return ok({ data: { target, assignment: next }, changed: true });
}

function applyMesaConnectorCard(
  project: NoHALProject,
  host: ProjectMesaHostConfig,
  connectorKey: string,
  cardKind: ProjectMesaConnectorCardKind | undefined,
): SetMesaConnectorCardResult {
  const connector = getMesaHostCatalogEntry(host.kind)?.connectorSlots.find(
    (item) => item.key === connectorKey,
  );
  const connectors = host.connectors ?? [];
  const smartSerial = host.smartSerial ?? [];
  const index = connectors.findIndex(
    (item) => item.connectorKey === connectorKey,
  );

  if (!connector) {
    return err({ code: "not-found", detail: "mesa-connector" });
  }

  if (!cardKind) {
    if (index < 0) {
      return ok({
        data: { connectorKey, assignment: null },
        changed: false,
      });
    }
    connectors.splice(index, 1);
    host.connectors = connectors;
    host.smartSerial = smartSerial.filter(
      (item) => item.connectorKey !== connectorKey,
    );
    renormalizeMesa(project);
    return ok({
      data: { connectorKey, assignment: null },
      changed: true,
    });
  }

  if (index >= 0 && connectors[index]?.cardKind === cardKind) {
    return ok({
      data: {
        connectorKey,
        assignment: connectors[index] ?? null,
      },
      changed: false,
    });
  }

  if (cardKind === MESA_RAW_GPIO_CARD_KIND && !connector.rawGpio) {
    return err({ code: "unsupported", detail: "raw-gpio" });
  }
  if (
    cardKind !== MESA_RAW_GPIO_CARD_KIND &&
    !isMesaConnectorCardCompatible(host.kind, connectorKey, cardKind)
  ) {
    return err({ code: "unsupported", detail: "connector-card" });
  }

  const nextAssignment: ProjectMesaDb25CardAssignment =
    cardKind === MESA_RAW_GPIO_CARD_KIND
      ? { connectorKey, cardKind, rawGpio: { outputPins: [] } }
      : { connectorKey, cardKind };

  if (index >= 0) {
    connectors[index] = nextAssignment;
  } else {
    connectors.push(nextAssignment);
  }

  host.connectors = connectors;
  host.smartSerial = smartSerial.filter(
    (item) => item.connectorKey !== connectorKey,
  );
  renormalizeMesa(project);
  return ok({
    data: { connectorKey, assignment: nextAssignment },
    changed: true,
  });
}

function applyMesaSmartSerialProcessDataMode(
  project: NoHALProject,
  host: ProjectMesaHostConfig,
  target: ProjectMesaSmartSerialTarget,
  processDataMode: number,
): SetMesaSmartSerialProcessDataModeResult {
  const assignment = (host.smartSerial ?? []).find(
    (item) =>
      item.connectorKey === target.connectorKey &&
      item.portKey === target.portKey &&
      item.channel === target.channel,
  );
  const cardKind = assignment?.cardKind;
  const card = cardKind ? getMesaSmartSerialCatalogEntry(cardKind) : undefined;

  if (!assignment || !card) {
    return err({ code: "not-found", detail: "smart-serial-assignment" });
  }
  if (!card.processDataModes?.some((mode) => mode.mode === processDataMode)) {
    return err({ code: "invalid-input", detail: "process-data-mode" });
  }
  if (assignment.processDataMode === processDataMode) {
    return ok({ data: processDataMode, changed: false });
  }

  assignment.processDataMode = processDataMode;
  renormalizeMesa(project);
  return ok({ data: processDataMode, changed: true });
}

function applyMesaRawGpioPinDirection(
  project: NoHALProject,
  host: ProjectMesaHostConfig,
  connectorKey: string,
  pinIndex: number,
  direction: ProjectMesaGpioDirection,
): SetMesaRawGpioPinDirectionResult {
  const connector = getMesaHostCatalogEntry(host.kind)?.connectorSlots.find(
    (item) => item.key === connectorKey,
  );
  const connectors = host.connectors ?? [];
  const assignment = connectors.find(
    (item) =>
      item.connectorKey === connectorKey &&
      item.cardKind === MESA_RAW_GPIO_CARD_KIND,
  );
  if (!assignment) {
    return err({ code: "not-found", detail: "raw-gpio-assignment" });
  }
  if (!connector?.rawGpio || pinIndex >= connector.rawGpio.count) {
    return err({ code: "invalid-input", detail: "pin-index" });
  }

  const outputPins = new Set(assignment.rawGpio?.outputPins ?? []);
  const hadPin = outputPins.has(pinIndex);
  if (direction === "output") {
    outputPins.add(pinIndex);
  } else {
    outputPins.delete(pinIndex);
  }
  if ((direction === "output") === hadPin) {
    return ok({ data: direction, changed: false });
  }

  assignment.rawGpio = {
    outputPins: [...outputPins].sort((a, b) => a - b),
  };
  renormalizeMesa(project);
  return ok({ data: direction, changed: true });
}

export function addMesaHost(
  project: NoHALProject,
  kind: ProjectMesaHostKind = DEFAULT_MESA_HOST_KIND,
): Result<Change<string>, never> {
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
  return ok({ data: hostId, changed: true });
}

export function removeMesaHost(
  project: NoHALProject,
  hostId: string,
): Result<Change<string>, MesaHostError> {
  const mesa = ensureProjectMesa(project);
  const index = mesa.hosts.findIndex((host) => host.id === hostId);
  if (index < 0) return err({ code: "not-found", detail: "mesa-host" });
  mesa.hosts.splice(index, 1);
  renormalizeMesa(project);
  return ok({ data: hostId, changed: true });
}

export function updateMesaHostKind(
  project: NoHALProject,
  hostId: string,
  kind: ProjectMesaHostKind,
): Result<Change<ProjectMesaHostKind>, MesaHostError> {
  return requireMesaHost(project, hostId).andThen((host) => {
    if (host.kind === kind) return ok({ data: host.kind, changed: false });
    host.kind = kind;
    renormalizeMesa(project);
    return ok({ data: host.kind, changed: true });
  });
}

export function updateMesaHostIp(
  project: NoHALProject,
  hostId: string,
  ip: string,
): Result<Change<string>, MesaHostError> {
  return requireMesaHost(project, hostId).andThen((host) => {
    if (host.ip === ip) return ok({ data: host.ip, changed: false });
    host.ip = ip;
    renormalizeMesa(project);
    return ok({ data: host.ip, changed: true });
  });
}

export function setMesaConnectorCard(
  project: NoHALProject,
  hostId: string,
  connectorKey: string,
  cardKind: ProjectMesaConnectorCardKind | undefined,
): SetMesaConnectorCardResult {
  return requireMesaHost(project, hostId).andThen((host) =>
    applyMesaConnectorCard(project, host, connectorKey, cardKind),
  );
}

export function setMesaSmartSerialProcessDataMode(
  project: NoHALProject,
  hostId: string,
  target: ProjectMesaSmartSerialTarget,
  processDataMode: number,
): SetMesaSmartSerialProcessDataModeResult {
  if (!Number.isInteger(processDataMode) || processDataMode < 0) {
    return err({ code: "invalid-input", detail: "process-data-mode" });
  }

  return requireMesaHost(project, hostId).andThen((host) =>
    applyMesaSmartSerialProcessDataMode(project, host, target, processDataMode),
  );
}

export function setMesaRawGpioPinDirection(
  project: NoHALProject,
  hostId: string,
  connectorKey: string,
  pinIndex: number,
  direction: ProjectMesaGpioDirection,
): SetMesaRawGpioPinDirectionResult {
  if (!Number.isInteger(pinIndex) || pinIndex < 0) {
    return err({ code: "invalid-input", detail: "pin-index" });
  }

  return requireMesaHost(project, hostId).andThen((host) =>
    applyMesaRawGpioPinDirection(
      project,
      host,
      connectorKey,
      pinIndex,
      direction,
    ),
  );
}

export function setMesaSmartSerialCard(
  project: NoHALProject,
  hostId: string,
  target: ProjectMesaSmartSerialTarget,
  cardKind: ProjectMesaSmartSerialCardKind | undefined,
): SetMesaSmartSerialCardResult {
  return requireMesaHost(project, hostId).andThen((host) =>
    validateMesaSmartSerialTarget(host, target).andThen(() =>
      applyMesaSmartSerialCard(project, host, target, cardKind),
    ),
  );
}

export function syncMesaManagedProjection(
  project: NoHALProject,
): Result<Change<MesaReconcilePlan>, never> {
  const plan = planMesaReconcile(project);
  if (plan.inSync) return ok({ data: plan, changed: false });
  reconcileMesaManagedNodes(project);
  return ok({ data: plan, changed: true });
}
