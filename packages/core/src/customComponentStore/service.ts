import type {
  ComponentDefinition,
  CoreIo,
  CustomComponentStore,
  CustomComponentStoreEntry,
  ImportedComponentDefinition,
} from "../types";
import type { CustomComponentStoreApi } from "./model";
import {
  readCustomComponentStoreFileFromDisk,
  writeCustomComponentStoreFileToDisk,
} from "./repository";
import {
  createStoreCustomComponentId,
  createStoredCustomComponentDefinition,
  normalizeStoredCustomComponentDefinition,
} from "./shared";

function assertCustomComponentHalComponentNameAvailable(
  halComponentName: string,
  store: CustomComponentStore,
  excludeComponentIds?: readonly string[],
): void {
  const excluded = new Set(excludeComponentIds ?? []);
  for (const [componentId, entry] of Object.entries(store.components)) {
    if (excluded.has(componentId)) continue;
    if (entry.parsed.halComponentName !== halComponentName) continue;
    throw new Error(`HAL component name already exists: ${halComponentName}`);
  }
}

function upsertCustomComponentStoreEntry(
  store: CustomComponentStore,
  parsed: ImportedComponentDefinition,
  nowIso: string,
  componentId: string,
): CustomComponentStoreEntry {
  const previous = store.components[componentId];
  const entry: CustomComponentStoreEntry = {
    componentId,
    parsed: {
      ...parsed,
      id: componentId,
    },
    createdAt: previous?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
  store.components[componentId] = entry;
  store.updatedAt = nowIso;
  return entry;
}

export const readCustomComponentStoreFile =
  (io: CoreIo) => async (storeFilePath: string) =>
    readCustomComponentStoreFileFromDisk(io)(storeFilePath);

export const addCustomComponentToStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    halComponentName?: string,
  ): Promise<CustomComponentStoreEntry> => {
    const readStore = readCustomComponentStoreFileFromDisk(io);
    const writeStore = writeCustomComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    const nowIso = new Date().toISOString();
    const parsed = createStoredCustomComponentDefinition({
      componentId: createStoreCustomComponentId(),
      existingHalComponentNames: Object.values(store.components).map(
        (entry) => entry.parsed.halComponentName,
      ),
      halComponentName,
    });
    assertCustomComponentHalComponentNameAvailable(
      parsed.halComponentName,
      store,
      [parsed.id],
    );
    const entry = upsertCustomComponentStoreEntry(
      store,
      parsed,
      nowIso,
      parsed.id,
    );
    await writeStore(normalizedStoreFilePath, store);
    return entry;
  };

export const updateCustomComponentInStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    componentId: string,
    component: ComponentDefinition | ImportedComponentDefinition,
  ): Promise<CustomComponentStoreEntry> => {
    const readStore = readCustomComponentStoreFileFromDisk(io);
    const writeStore = writeCustomComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    const existing = store.components[componentId];
    if (!existing) {
      throw new Error(`Custom component store entry not found: ${componentId}`);
    }

    const nowIso = new Date().toISOString();
    const normalized = normalizeStoredCustomComponentDefinition(
      component,
      componentId,
    );
    assertCustomComponentHalComponentNameAvailable(
      normalized.halComponentName,
      store,
      [componentId],
    );
    const entry = upsertCustomComponentStoreEntry(
      store,
      normalized,
      nowIso,
      componentId,
    );
    await writeStore(normalizedStoreFilePath, store);
    return entry;
  };

export const removeCustomComponentFromStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    componentId: string,
  ): Promise<{ componentId: string }> => {
    const readStore = readCustomComponentStoreFileFromDisk(io);
    const writeStore = writeCustomComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    if (!store.components[componentId]) {
      throw new Error(`Custom component store entry not found: ${componentId}`);
    }

    delete store.components[componentId];
    store.updatedAt = new Date().toISOString();
    await writeStore(normalizedStoreFilePath, store);
    return { componentId };
  };

export const promoteProjectCustomComponentToStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    component: ComponentDefinition,
  ): Promise<CustomComponentStoreEntry> => {
    const readStore = readCustomComponentStoreFileFromDisk(io);
    const writeStore = writeCustomComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    const nowIso = new Date().toISOString();
    const promoted = normalizeStoredCustomComponentDefinition(
      component,
      createStoreCustomComponentId(),
    );
    assertCustomComponentHalComponentNameAvailable(
      promoted.halComponentName,
      store,
    );
    const entry = upsertCustomComponentStoreEntry(
      store,
      promoted,
      nowIso,
      promoted.id,
    );
    await writeStore(normalizedStoreFilePath, store);
    return entry;
  };

export function createCustomComponentStoreService(
  io: CoreIo,
): CustomComponentStoreApi {
  return {
    readCustomComponentStoreFile: readCustomComponentStoreFile(io),
    addCustomComponentToStore: addCustomComponentToStore(io),
    updateCustomComponentInStore: updateCustomComponentInStore(io),
    removeCustomComponentFromStore: removeCustomComponentFromStore(io),
    promoteProjectCustomComponentToStore:
      promoteProjectCustomComponentToStore(io),
  };
}

export function createCustomComponentStoreApi(
  io: CoreIo,
): CustomComponentStoreApi {
  return createCustomComponentStoreService(io);
}
