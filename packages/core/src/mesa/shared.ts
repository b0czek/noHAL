import { createId } from "../id";
import type { NoHALProject } from "../types";
import {
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  MESA_DB25_CARD_KINDS,
  MESA_HOST_KINDS,
  MESA_SMART_SERIAL_CARD_KINDS,
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

function normalizeSmartSerialAssignments(
  hostKind: ProjectMesaHostKind,
  connectors: ProjectMesaDb25CardAssignment[],
  hostValue: unknown,
): ProjectMesaSmartSerialAssignment[] {
  const host = getMesaHostCatalogEntry(hostKind);
  const rawList = Array.isArray(hostValue) ? hostValue : [];
  const seen = new Set<string>();
  const out: ProjectMesaSmartSerialAssignment[] = [];
  for (const raw of rawList) {
    if (!isRecord(raw)) continue;
    const connectorKeyCandidate =
      `${raw.connectorKey ?? ""}`.trim().toLowerCase() || undefined;
    const portKey = `${raw.portKey ?? ""}`.trim().toLowerCase();
    const channel = Number.parseInt(`${raw.channel ?? ""}`, 10);
    const cardKind = normalizeSmartSerialCardKind(raw.cardKind);
    if (!cardKind) continue;
    if (!portKey || !Number.isInteger(channel) || channel < 0) continue;
    let channels: number | undefined;
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
      channels = port?.channels;
    } else {
      const port = host?.smartSerialPorts.find((item) => item.key === portKey);
      channels = port?.channels;
    }
    if (!channels || channel >= channels) continue;
    const dedupeKey = `${connectorKeyCandidate ?? ""}:${portKey}:${channel}`;
    if (seen.has(dedupeKey)) continue;
    out.push({
      connectorKey: connectorKeyCandidate,
      portKey,
      channel,
      cardKind,
    });
    seen.add(dedupeKey);
  }
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
