import {
  type LinuxCncVersion,
  SUPPORTED_LINUXCNC_VERSIONS,
} from "../../linuxcncVersion";
import type { ComponentStore } from "../../types";
import { loadAllLinuxCncVersionCatalogs } from "../catalog";
import { upsertStoredComponentEntry } from "./shared";

function createLinuxCncBuiltinSourceId(version: LinuxCncVersion): string {
  return `linuxcnc-builtin:${version}`;
}

export async function applyLinuxCncBuiltinSources(
  store: ComponentStore,
): Promise<void> {
  const expectedSourceIds = new Set<string>();
  const builtins = await loadAllLinuxCncVersionCatalogs();

  for (const version of SUPPORTED_LINUXCNC_VERSIONS) {
    const builtin = builtins[version];
    const sourceId = createLinuxCncBuiltinSourceId(version);
    expectedSourceIds.add(sourceId);
    const existing = store.sources[sourceId];

    store.sources[sourceId] = {
      id: sourceId,
      kind: "linuxcnc-builtin",
      linuxcncVersion: version,
      revision: builtin.revision,
      refName: builtin.refName,
      repoPath: "embedded://linuxcnc-catalog",
      createdAt:
        existing?.kind === "linuxcnc-builtin"
          ? existing.createdAt
          : builtin.generatedAt,
      updatedAt: builtin.generatedAt,
      lastScanAt: builtin.generatedAt,
      lastError: undefined,
    };

    for (const [componentId, entry] of Object.entries(store.components)) {
      if (entry.sourceRef.sourceId !== sourceId) continue;
      delete store.components[componentId];
    }

    for (const parsed of builtin.components) {
      upsertStoredComponentEntry(
        store,
        parsed,
        {
          kind: "linuxcnc-builtin",
          sourceId,
          filePath:
            parsed.sourcePath ??
            `linuxcnc:${version}:${parsed.halComponentName ?? parsed.id}`,
        },
        builtin.generatedAt,
        parsed.id,
      );
    }
  }

  for (const [sourceId, source] of Object.entries(store.sources)) {
    if (source.kind !== "linuxcnc-builtin") continue;
    if (expectedSourceIds.has(sourceId)) continue;
    delete store.sources[sourceId];
    for (const [componentId, entry] of Object.entries(store.components)) {
      if (entry.sourceRef.sourceId !== sourceId) continue;
      delete store.components[componentId];
    }
  }
}

export function toPersistedComponentStore(
  store: ComponentStore,
): ComponentStore {
  const persisted: ComponentStore = {
    format: store.format,
    version: store.version,
    sources: {},
    components: {},
  };

  for (const [sourceId, source] of Object.entries(store.sources)) {
    if (source.kind === "linuxcnc-builtin") continue;
    persisted.sources[sourceId] = source;
  }

  for (const [componentId, entry] of Object.entries(store.components)) {
    if (entry.sourceRef.kind === "linuxcnc-builtin") continue;
    persisted.components[componentId] = entry;
  }

  return persisted;
}
