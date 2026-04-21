import { createId } from "../id";
import type { NoHALProject } from "../types";
import {
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  getMesaSmartSerialCatalogEntry,
  MESA_DB25_CARD_KINDS,
  MESA_HOST_KINDS,
  MESA_SMART_SERIAL_CARD_KINDS,
  type MesaProcessDataModeDefinition,
} from "./catalog";
import type {
  ProjectMesaConfig,
  ProjectMesaConnectorCardKind,
  ProjectMesaDb25CardAssignment,
  ProjectMesaDb25CardKind,
  ProjectMesaHostConfig,
  ProjectMesaHostKind,
  ProjectMesaSmartSerialAssignment,
  ProjectMesaSmartSerialCardKind,
} from "./types";
import { MESA_RAW_GPIO_CARD_KIND } from "./types";

export const DEFAULT_MESA_HOST_KIND: ProjectMesaHostKind = "7i92t";
export const MESA_GPIO_INDEX_WIDTH = 3;

export function formatMesaGpioIndex(index: number): string {
  return `${index}`.padStart(MESA_GPIO_INDEX_WIDTH, "0");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeHostKind(value: unknown): ProjectMesaHostKind {
  const candidate = `${value ?? ""}`.trim().toLowerCase();
  if (MESA_HOST_KINDS.includes(candidate as ProjectMesaHostKind)) {
    return candidate as ProjectMesaHostKind;
  }
  return DEFAULT_MESA_HOST_KIND;
}

function normalizeConnectorCardKind(
  value: unknown,
): ProjectMesaConnectorCardKind | undefined {
  const candidate = `${value ?? ""}`.trim().toLowerCase();
  if (candidate === MESA_RAW_GPIO_CARD_KIND) {
    return MESA_RAW_GPIO_CARD_KIND;
  }
  if (MESA_DB25_CARD_KINDS.includes(candidate as ProjectMesaDb25CardKind)) {
    return candidate as ProjectMesaConnectorCardKind;
  }
  return undefined;
}

function normalizeSmartSerialCardKind(
  value: unknown,
): ProjectMesaSmartSerialCardKind | undefined {
  const candidate = `${value ?? ""}`.trim().toLowerCase();
  if (
    MESA_SMART_SERIAL_CARD_KINDS.includes(
      candidate as ProjectMesaSmartSerialCardKind,
    )
  ) {
    return candidate as ProjectMesaSmartSerialCardKind;
  }
  return undefined;
}

function normalizeRawGpioConfig(
  count: number | undefined,
  value: unknown,
): { outputPins: number[] } | undefined {
  if (!count || count <= 0) return undefined;
  const raw = isRecord(value) ? value : {};
  const rawList = Array.isArray(raw.outputPins) ? raw.outputPins : [];
  const seen = new Set<number>();
  const outputPins: number[] = [];
  for (const candidate of rawList) {
    const pin = Number.parseInt(`${candidate ?? ""}`, 10);
    if (!Number.isInteger(pin) || pin < 0 || pin >= count || seen.has(pin)) {
      continue;
    }
    seen.add(pin);
    outputPins.push(pin);
  }
  outputPins.sort((a, b) => a - b);
  return { outputPins };
}

function normalizeProcessDataMode(
  value: unknown,
  modes: readonly MesaProcessDataModeDefinition[] | undefined,
  defaultMode: number | undefined,
): number | undefined {
  if (!modes?.length || defaultMode === undefined) return undefined;
  const candidate = Number.parseInt(`${value ?? ""}`, 10);
  if (modes.some((mode) => mode.mode === candidate)) {
    return candidate;
  }
  return defaultMode;
}

function normalizeConnectorAssignments(
  hostKind: ProjectMesaHostKind,
  value: unknown,
): ProjectMesaDb25CardAssignment[] {
  const host = getMesaHostCatalogEntry(hostKind);
  const rawList = Array.isArray(value) ? value : [];
  const seen = new Set<string>();
  const out: ProjectMesaDb25CardAssignment[] = [];
  for (const raw of rawList) {
    if (!isRecord(raw)) continue;
    const connectorKey = `${raw.connectorKey ?? ""}`.trim().toLowerCase();
    if (!connectorKey || seen.has(connectorKey)) continue;
    const connector = host?.connectorSlots.find(
      (item) => item.key === connectorKey,
    );
    if (!connector) continue;
    const cardKind = normalizeConnectorCardKind(raw.cardKind);
    if (!cardKind) continue;
    out.push(
      cardKind === MESA_RAW_GPIO_CARD_KIND
        ? {
            connectorKey,
            cardKind,
            rawGpio: normalizeRawGpioConfig(
              connector.rawGpio?.count,
              raw.rawGpio,
            ),
          }
        : { connectorKey, cardKind },
    );
    seen.add(connectorKey);
  }
  return out.sort((a, b) => a.connectorKey.localeCompare(b.connectorKey));
}

function normalizeSmartSerialProcessDataMode(
  value: unknown,
  cardKind: ProjectMesaSmartSerialCardKind,
): number | undefined {
  const card = getMesaSmartSerialCatalogEntry(cardKind);
  return normalizeProcessDataMode(
    value,
    card?.processDataModes,
    card?.defaultMode,
  );
}

interface ResolvedSmartSerialTargetCatalog {
  channels: number;
  fixedCardKind?: ProjectMesaSmartSerialCardKind;
}

function resolveSmartSerialTargetCatalog(
  hostKind: ProjectMesaHostKind,
  connectors: ProjectMesaDb25CardAssignment[],
  connectorKeyCandidate: string | undefined,
  portKey: string,
): ResolvedSmartSerialTargetCatalog | null {
  if (connectorKeyCandidate) {
    const connector = connectors.find(
      (item) => item.connectorKey === connectorKeyCandidate,
    );
    const connectorCard = connector?.cardKind
      ? getMesaDb25CardCatalogEntry(connector.cardKind)
      : undefined;
    const port = connectorCard?.sserial.smartSerialPorts.find(
      (item) => item.key === portKey,
    );
    if (!port) return null;
    return {
      channels: port.channels,
      fixedCardKind: port.fixedCardKind,
    };
  }
  const port = getMesaHostCatalogEntry(hostKind)?.smartSerialPorts.find(
    (item) => item.key === portKey,
  );
  if (!port) return null;
  return { channels: port.channels };
}

function smartSerialAssignmentKey(
  connectorKey: string | undefined,
  portKey: string,
  channel: number,
): string {
  return `${connectorKey ?? ""}:${portKey}:${channel}`;
}

function buildNormalizedSmartSerialAssignment(
  connectorKeyCandidate: string | undefined,
  portKey: string,
  channel: number,
  rawCardKind: unknown,
  rawProcessDataMode: unknown,
  targetCatalog: ResolvedSmartSerialTargetCatalog,
): ProjectMesaSmartSerialAssignment | null {
  const cardKind =
    targetCatalog.fixedCardKind ?? normalizeSmartSerialCardKind(rawCardKind);
  if (!cardKind) return null;
  return {
    connectorKey: connectorKeyCandidate,
    portKey,
    channel,
    cardKind,
    processDataMode: normalizeSmartSerialProcessDataMode(
      rawProcessDataMode,
      cardKind,
    ),
  };
}

function appendFixedSmartSerialAssignments(
  connectors: ProjectMesaDb25CardAssignment[],
  out: ProjectMesaSmartSerialAssignment[],
  seen: Set<string>,
): void {
  for (const connector of connectors) {
    const connectorCard = connector.cardKind
      ? getMesaDb25CardCatalogEntry(connector.cardKind)
      : undefined;
    if (!connectorCard) continue;
    for (const port of connectorCard.sserial.smartSerialPorts) {
      if (!port.fixedCardKind) continue;
      for (let channel = 0; channel < port.channels; channel += 1) {
        const dedupeKey = smartSerialAssignmentKey(
          connector.connectorKey,
          port.key,
          channel,
        );
        if (seen.has(dedupeKey)) continue;
        out.push({
          connectorKey: connector.connectorKey,
          portKey: port.key,
          channel,
          cardKind: port.fixedCardKind,
        });
        seen.add(dedupeKey);
      }
    }
  }
}

function normalizeSmartSerialAssignments(
  hostKind: ProjectMesaHostKind,
  connectors: ProjectMesaDb25CardAssignment[],
  hostValue: unknown,
): ProjectMesaSmartSerialAssignment[] {
  const rawList = Array.isArray(hostValue) ? hostValue : [];
  const seen = new Set<string>();
  const out: ProjectMesaSmartSerialAssignment[] = [];
  for (const raw of rawList) {
    if (!isRecord(raw)) continue;
    const connectorKeyCandidate =
      `${raw.connectorKey ?? ""}`.trim().toLowerCase() || undefined;
    const portKey = `${raw.portKey ?? ""}`.trim().toLowerCase();
    const channel = Number.parseInt(`${raw.channel ?? ""}`, 10);
    if (!portKey || !Number.isInteger(channel) || channel < 0) continue;
    const targetCatalog = resolveSmartSerialTargetCatalog(
      hostKind,
      connectors,
      connectorKeyCandidate,
      portKey,
    );
    if (!targetCatalog || channel >= targetCatalog.channels) continue;
    const dedupeKey = smartSerialAssignmentKey(
      connectorKeyCandidate,
      portKey,
      channel,
    );
    if (seen.has(dedupeKey)) continue;
    const assignment = buildNormalizedSmartSerialAssignment(
      connectorKeyCandidate,
      portKey,
      channel,
      raw.cardKind,
      raw.processDataMode,
      targetCatalog,
    );
    if (!assignment) continue;
    out.push(assignment);
    seen.add(dedupeKey);
  }
  appendFixedSmartSerialAssignments(connectors, out, seen);

  return out.sort(
    (a, b) =>
      (a.connectorKey ?? "").localeCompare(b.connectorKey ?? "") ||
      a.portKey.localeCompare(b.portKey) ||
      a.channel - b.channel,
  );
}

function normalizeMesaHost(value: unknown): ProjectMesaHostConfig | null {
  if (!isRecord(value)) return null;
  const kind = normalizeHostKind(value.kind);
  const connectors = normalizeConnectorAssignments(kind, value.connectors);
  return {
    id:
      typeof value.id === "string" && value.id.trim()
        ? value.id
        : createId("mesa_host"),
    kind,
    ip: typeof value.ip === "string" ? value.ip.trim() : "",
    connectors,
    smartSerial: normalizeSmartSerialAssignments(
      kind,
      connectors,
      value.smartSerial,
    ),
  };
}

export function createDefaultMesaConfig(): ProjectMesaConfig {
  return { hosts: [] };
}

export function normalizeProjectMesaConfig(value: unknown): ProjectMesaConfig {
  const raw = isRecord(value) ? value : {};
  const hostsRaw = Array.isArray(raw.hosts) ? raw.hosts : [];
  const out: ProjectMesaHostConfig[] = [];
  const seenIds = new Set<string>();
  for (const candidate of hostsRaw) {
    const host = normalizeMesaHost(candidate);
    if (!host) continue;
    if (seenIds.has(host.id)) host.id = createId("mesa_host");
    seenIds.add(host.id);
    out.push(host);
  }
  return { hosts: out };
}

export function ensureProjectMesa(project: NoHALProject): ProjectMesaConfig {
  const mesa = normalizeProjectMesaConfig(project.mesa);
  project.mesa = mesa;
  return mesa;
}
