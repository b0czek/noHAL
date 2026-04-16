import {
  getMesaDb25CardCatalogEntry,
  normalizeProjectMesaConfig,
} from "../../mesa";
import type { ProjectMigration } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeComponentToken(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]+/g, "_");
}

function normalizeConnectorKey(value: unknown): string | undefined {
  return `${value ?? ""}`.trim().toLowerCase() || undefined;
}

// Build fixed-card smart-serial entries from legacy connector-scoped process
// data modes. In v3 the process data mode was stored on the connector (as
// `processDataMode` or `sserial.processDataMode`) and the fixed ports were
// implicit. v4 stores everything as explicit smart-serial assignments.
function buildLegacyFixedSmartSerialEntries(
  connectorsValue: unknown,
): unknown[] {
  const rawList = Array.isArray(connectorsValue) ? connectorsValue : [];
  const entries: unknown[] = [];
  for (const raw of rawList) {
    if (!isRecord(raw)) continue;
    const connectorKey = normalizeConnectorKey(raw.connectorKey);
    if (!connectorKey) continue;
    const card = getMesaDb25CardCatalogEntry(`${raw.cardKind ?? ""}`);
    if (!card) continue;
    const legacySserial = isRecord(raw.sserial) ? raw.sserial : {};
    const legacyProcessDataMode =
      legacySserial.processDataMode ?? raw.processDataMode;
    for (const port of card.sserial.smartSerialPorts) {
      if (!port.fixedCardKind) continue;
      for (let channel = 0; channel < port.channels; channel += 1) {
        entries.push({
          connectorKey,
          portKey: port.key,
          channel,
          cardKind: port.fixedCardKind,
          processDataMode: legacyProcessDataMode,
        });
      }
    }
  }
  return entries;
}

function cleanConnector(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const connector = { ...raw };
  delete connector.processDataMode;
  delete connector.sserial;
  return connector;
}

function migrateMesaHost(rawHost: unknown): unknown {
  if (!isRecord(rawHost)) return rawHost;
  const connectors = Array.isArray(rawHost.connectors)
    ? rawHost.connectors
    : [];
  const legacyFixedEntries = buildLegacyFixedSmartSerialEntries(connectors);
  const existingSmartSerial = Array.isArray(rawHost.smartSerial)
    ? rawHost.smartSerial
    : [];
  return {
    ...rawHost,
    connectors: connectors.map(cleanConnector),
    smartSerial: [...legacyFixedEntries, ...existingSmartSerial],
  };
}

// In v3 the runtime emitted one pseudo component per DB25 fragment under
// `system:mesa:db25:<host>:<connector>:<fragmentKey>`. In v4 those became
// fixed smart-serial assignments, so their component IDs now live under
// `system:mesa:sserial:<host>:<connector>_<portKey>:0` (fixed ports only
// use channel 0 because they're single-channel by catalog definition).
function addLegacyConnectorRemap(
  remap: Map<string, string>,
  hostId: string,
  rawConnector: unknown,
): void {
  if (!isRecord(rawConnector)) return;
  const connectorKey = normalizeConnectorKey(rawConnector.connectorKey);
  if (!connectorKey) return;
  const card = getMesaDb25CardCatalogEntry(`${rawConnector.cardKind ?? ""}`);
  if (!card) return;
  for (const port of card.sserial.smartSerialPorts) {
    if (!port.fixedCardKind) continue;
    const oldId = `system:mesa:db25:${sanitizeComponentToken(
      hostId,
    )}:${sanitizeComponentToken(connectorKey)}:${sanitizeComponentToken(
      port.key,
    )}`;
    const newId = `system:mesa:sserial:${sanitizeComponentToken(
      hostId,
    )}:${sanitizeComponentToken(`${connectorKey}:${port.key}`)}:0`;
    remap.set(oldId, newId);
  }
}

function buildLegacyDb25ComponentIdRemap(
  hostsValue: unknown,
): Map<string, string> {
  const remap = new Map<string, string>();
  const rawHosts = Array.isArray(hostsValue) ? hostsValue : [];
  for (const rawHost of rawHosts) {
    if (!isRecord(rawHost)) continue;
    const hostId = typeof rawHost.id === "string" ? rawHost.id : "";
    if (!hostId) continue;
    const connectors = Array.isArray(rawHost.connectors)
      ? rawHost.connectors
      : [];
    for (const rawConnector of connectors) {
      addLegacyConnectorRemap(remap, hostId, rawConnector);
    }
  }
  return remap;
}

function remapSheetComponentIds(
  sheetsValue: unknown,
  remap: ReadonlyMap<string, string>,
): void {
  if (!isRecord(sheetsValue)) return;
  for (const sheet of Object.values(sheetsValue)) {
    if (!isRecord(sheet) || !Array.isArray(sheet.nodes)) continue;
    for (const node of sheet.nodes) {
      if (!isRecord(node) || node.kind !== "component") continue;
      const nextId = remap.get(`${node.componentId ?? ""}`);
      if (nextId) node.componentId = nextId;
    }
  }
}

// Drop stale `system:mesa:db25:*` library entries carrying the v3 fragment
// schemas. The mesa reconcile pass will rebuild fresh entries for the new
// smart-serial component IDs on first normalization.
function dropLegacyDb25LibraryComponents(libraryValue: unknown): void {
  if (!isRecord(libraryValue)) return;
  const components = libraryValue.components;
  if (!isRecord(components)) return;
  for (const key of Object.keys(components)) {
    if (key.startsWith("system:mesa:db25:")) delete components[key];
  }
}

export const projectMigrationV3ToV4: ProjectMigration = {
  from: 3,
  to: 4,
  migrate(input: unknown): unknown {
    const project = structuredClone(input) as Record<string, unknown>;
    project.version = projectMigrationV3ToV4.to;

    if (!isRecord(project.mesa)) return project;

    const componentIdRemap = buildLegacyDb25ComponentIdRemap(
      project.mesa.hosts,
    );
    remapSheetComponentIds(project.sheets, componentIdRemap);
    dropLegacyDb25LibraryComponents(project.library);

    const rawHosts = Array.isArray(project.mesa.hosts)
      ? project.mesa.hosts
      : [];
    project.mesa = normalizeProjectMesaConfig({
      ...project.mesa,
      hosts: rawHosts.map(migrateMesaHost),
    });
    return project;
  },
};
