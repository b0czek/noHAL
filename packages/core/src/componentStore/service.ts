import { parseCompComponentDefinition } from "../compParser";
import type {
  ComponentStoreEntry,
  CoreIo,
  ImportedComponentDefinition,
} from "../types";
import type { ComponentStoreApi, StoreSourceRefreshResult } from "./model";
import {
  readComponentStoreFileFromDisk,
  writeComponentStoreFileToDisk,
} from "./repository";
import {
  collectCompFilesRecursive,
  upsertComponentDirSource,
} from "./sourceHandlers/compDir";
import { upsertComponentFileSource } from "./sourceHandlers/compFile";
import { upsertStoredComponentEntry } from "./sourceHandlers/shared";

async function rescanComponentDirSourceInStore(
  io: CoreIo,
  storeFilePath: string,
  sourceId: string,
): Promise<StoreSourceRefreshResult> {
  const readStore = readComponentStoreFileFromDisk(io);
  const writeStore = writeComponentStoreFileToDisk(io);
  const store = await readStore(storeFilePath);
  const source = store.sources[sourceId];
  if (!source) throw new Error(`Component source not found: ${sourceId}`);
  if (source.kind !== "comp-dir") {
    throw new Error(`Component source is not a dir: ${sourceId}`);
  }

  const nowIso = new Date().toISOString();
  const errors: Array<{ filePath: string; error: string }> = [];
  const files = await collectCompFilesRecursive(io, source.dirPath, errors);
  const entries: ComponentStoreEntry[] = [];
  const seenComponentIds = new Set<string>();
  const hasRootScanError = errors.some(
    (error) =>
      io.path.resolve(error.filePath) === io.path.resolve(source.dirPath),
  );

  for (const filePath of files) {
    const normalizedFilePath = io.path.resolve(filePath);
    try {
      const content = await io.fs.readTextFile(normalizedFilePath);
      const parsed = parseCompComponentDefinition(content, normalizedFilePath);
      const existingByFile = Object.values(store.components).find(
        (entry) =>
          entry.sourceRef.kind === "comp-dir" &&
          entry.sourceRef.sourceId === sourceId &&
          io.path.resolve(entry.sourceRef.filePath) === normalizedFilePath,
      );
      const entry = upsertStoredComponentEntry(
        store,
        parsed,
        { kind: "comp-dir", sourceId, filePath: normalizedFilePath },
        nowIso,
        existingByFile?.componentId,
      );
      entries.push(entry);
      seenComponentIds.add(entry.componentId);
    } catch (error) {
      errors.push({
        filePath: normalizedFilePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const removedComponentIds: string[] = [];
  if (!hasRootScanError) {
    for (const [componentId, entry] of Object.entries(store.components)) {
      if (entry.sourceRef.kind !== "comp-dir") continue;
      if (entry.sourceRef.sourceId !== sourceId) continue;
      if (seenComponentIds.has(componentId)) continue;
      delete store.components[componentId];
      removedComponentIds.push(componentId);
    }
  }

  store.sources[sourceId] = {
    ...source,
    updatedAt: nowIso,
    lastScanAt: nowIso,
    ...(errors.length > 0
      ? {
          lastError: hasRootScanError
            ? "Directory scan failed"
            : `${errors.length} scan errors`,
        }
      : { lastError: undefined }),
  };

  await writeStore(storeFilePath, store);
  return { sourceId, entries, removedComponentIds, errors };
}

export const readComponentStoreFile =
  (io: CoreIo) =>
  async (storeFilePath: string) => {
    return readComponentStoreFileFromDisk(io)(storeFilePath);
  };

export const saveParsedCompFileToStore =
  (io: CoreIo) =>
  async (storeFilePath: string, filePath: string): Promise<ComponentStoreEntry> => {
    const readStore = readComponentStoreFileFromDisk(io);
    const writeStore = writeComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    const nowIso = new Date().toISOString();
    const normalizedFilePath = io.path.resolve(filePath);
    const source = upsertComponentFileSource(
      io,
      store,
      normalizedFilePath,
      nowIso,
    );
    const content = await io.fs.readTextFile(normalizedFilePath);
    const parsed = parseCompComponentDefinition(content, normalizedFilePath);
    const existingForSource = Object.values(store.components).find(
      (entry) => entry.sourceRef.sourceId === source.id,
    );
    const entry = upsertStoredComponentEntry(
      store,
      parsed,
      { kind: "comp-file", sourceId: source.id, filePath: normalizedFilePath },
      nowIso,
      existingForSource?.componentId,
    );
    store.sources[source.id] = {
      ...source,
      updatedAt: nowIso,
      lastScanAt: nowIso,
      lastError: undefined,
    };
    await writeStore(normalizedStoreFilePath, store);
    return entry;
  };

export const refreshStoredCompEntry =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    componentId: string,
  ): Promise<ComponentStoreEntry> => {
    const readStore = readComponentStoreFileFromDisk(io);
    const writeStore = writeComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    const existing = store.components[componentId];
    if (!existing) {
      throw new Error(`Component store entry not found: ${componentId}`);
    }
    if (
      existing.sourceRef.kind !== "comp-file" &&
      existing.sourceRef.kind !== "comp-dir"
    ) {
      throw new Error(
        `Unsupported component source for refresh: ${componentId}`,
      );
    }
    const filePath = existing.sourceRef.filePath;
    const nowIso = new Date().toISOString();
    const content = await io.fs.readTextFile(filePath);
    const parsed = parseCompComponentDefinition(content, filePath);
    const entry = upsertStoredComponentEntry(
      store,
      parsed,
      existing.sourceRef,
      nowIso,
      componentId,
    );
    const source = store.sources[existing.sourceRef.sourceId];
    if (source) {
      store.sources[source.id] = {
        ...source,
        updatedAt: nowIso,
        lastScanAt: nowIso,
        lastError: undefined,
      };
    }
    await writeStore(normalizedStoreFilePath, store);
    return entry;
  };

export const addComponentDirSourceToStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    dirPath: string,
  ): Promise<StoreSourceRefreshResult> => {
    const readStore = readComponentStoreFileFromDisk(io);
    const writeStore = writeComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const normalizedDirPath = io.path.resolve(dirPath);
    const store = await readStore(normalizedStoreFilePath);
    const nowIso = new Date().toISOString();
    const source = upsertComponentDirSource(
      io,
      store,
      normalizedDirPath,
      nowIso,
    );
    await writeStore(normalizedStoreFilePath, store);
    return rescanComponentDirSourceInStore(io, normalizedStoreFilePath, source.id);
  };

export const refreshComponentSourceInStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    sourceId: string,
  ): Promise<StoreSourceRefreshResult> => {
    const readStore = readComponentStoreFileFromDisk(io);
    const writeStore = writeComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    const source = store.sources[sourceId];
    if (!source) throw new Error(`Component source not found: ${sourceId}`);

    if (source.kind === "comp-dir") {
      return rescanComponentDirSourceInStore(io, normalizedStoreFilePath, sourceId);
    }
    if (source.kind === "linuxcnc-builtin") {
      throw new Error(
        "Embedded LinuxCNC version stores are read-only. Regenerate them using pnpm generate:linuxcnc-stores.",
      );
    }

    const nowIso = new Date().toISOString();
    const errors: Array<{ filePath: string; error: string }> = [];
    const removedComponentIds: string[] = [];
    let entries: ComponentStoreEntry[] = [];

    try {
      const normalizedFilePath = io.path.resolve(source.filePath);
      const content = await io.fs.readTextFile(normalizedFilePath);
      const parsed = parseCompComponentDefinition(content, normalizedFilePath);
      const existingEntries = Object.values(store.components).filter(
        (entry) => entry.sourceRef.sourceId === sourceId,
      );
      const keepId = existingEntries[0]?.componentId;
      const entry = upsertStoredComponentEntry(
        store,
        parsed,
        { kind: "comp-file", sourceId, filePath: normalizedFilePath },
        nowIso,
        keepId,
      );
      entries = [entry];
      for (const extra of existingEntries) {
        if (extra.componentId === entry.componentId) continue;
        delete store.components[extra.componentId];
        removedComponentIds.push(extra.componentId);
      }
      store.sources[sourceId] = {
        ...source,
        filePath: normalizedFilePath,
        updatedAt: nowIso,
        lastScanAt: nowIso,
        lastError: undefined,
      };
    } catch (error) {
      errors.push({
        filePath: source.filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      store.sources[sourceId] = {
        ...source,
        updatedAt: nowIso,
        lastScanAt: nowIso,
        lastError: "File import refresh failed",
      };
    }

    await writeStore(normalizedStoreFilePath, store);
    return { sourceId, entries, removedComponentIds, errors };
  };

export const deleteComponentSourceFromStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    sourceId: string,
  ): Promise<{ sourceId: string; removedComponentIds: string[] }> => {
    const readStore = readComponentStoreFileFromDisk(io);
    const writeStore = writeComponentStoreFileToDisk(io);
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readStore(normalizedStoreFilePath);
    const source = store.sources[sourceId];
    if (!source) throw new Error(`Component source not found: ${sourceId}`);
    if (source.kind === "linuxcnc-builtin") {
      throw new Error(
        "Embedded LinuxCNC version stores cannot be deleted from the component store.",
      );
    }

    delete store.sources[sourceId];
    const removedComponentIds: string[] = [];
    for (const [componentId, entry] of Object.entries(store.components)) {
      if (entry.sourceRef.sourceId !== sourceId) continue;
      delete store.components[componentId];
      removedComponentIds.push(componentId);
    }
    await writeStore(normalizedStoreFilePath, store);
    return { sourceId, removedComponentIds };
  };

export const scanCompDirectory =
  (io: CoreIo) =>
  async (
    dirPath: string,
  ): Promise<{
    imported: ImportedComponentDefinition[];
    errors: Array<{ filePath: string; error: string }>;
  }> => {
    const normalizedDirPath = io.path.resolve(dirPath);
    const imported: ImportedComponentDefinition[] = [];
    const errors: Array<{ filePath: string; error: string }> = [];
    const files = await collectCompFilesRecursive(io, normalizedDirPath, errors);

    for (const filePath of files) {
      try {
        const content = await io.fs.readTextFile(filePath);
        imported.push(parseCompComponentDefinition(content, filePath));
      } catch (error) {
        errors.push({
          filePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { imported, errors };
  };

export function createComponentStoreService(io: CoreIo): ComponentStoreApi {
  return {
    readComponentStoreFile: readComponentStoreFile(io),
    saveParsedCompFileToStore: saveParsedCompFileToStore(io),
    refreshStoredCompEntry: refreshStoredCompEntry(io),
    addComponentDirSourceToStore: addComponentDirSourceToStore(io),
    refreshComponentSourceInStore: refreshComponentSourceInStore(io),
    deleteComponentSourceFromStore: deleteComponentSourceFromStore(io),
    scanCompDirectory: scanCompDirectory(io),
  };
}

export function createComponentStoreApi(io: CoreIo): ComponentStoreApi {
  return createComponentStoreService(io);
}
