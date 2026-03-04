import { parseCompComponentDefinition } from "./compParser";
import {
  NOHAL_COMPONENT_STORE_FORMAT,
  NOHAL_COMPONENT_STORE_VERSION,
} from "./fileFormats";
import { slugify } from "./id";
import { LINUXCNC_VERSION_STORES } from "./linuxcncBuiltinStores";
import { SUPPORTED_LINUXCNC_VERSIONS } from "./linuxcncVersion";
import type {
  ComponentStore,
  ComponentStoreDirSource,
  ComponentStoreEntry,
  ComponentStoreFileSource,
  CoreIo,
  ImportedComponentDefinition,
} from "./types";

export type StoreSourceRefreshResult = {
  sourceId: string;
  entries: ComponentStoreEntry[];
  removedComponentIds: string[];
  errors: Array<{ filePath: string; error: string }>;
};

export interface ComponentStoreApi {
  readComponentStoreFile(storeFilePath: string): Promise<ComponentStore>;
  saveParsedCompFileToStore(
    storeFilePath: string,
    filePath: string,
  ): Promise<ComponentStoreEntry>;
  refreshStoredCompEntry(
    storeFilePath: string,
    componentId: string,
  ): Promise<ComponentStoreEntry>;
  addComponentDirSourceToStore(
    storeFilePath: string,
    dirPath: string,
  ): Promise<StoreSourceRefreshResult>;
  refreshComponentSourceInStore(
    storeFilePath: string,
    sourceId: string,
  ): Promise<StoreSourceRefreshResult>;
  deleteComponentSourceFromStore(
    storeFilePath: string,
    sourceId: string,
  ): Promise<{ sourceId: string; removedComponentIds: string[] }>;
  scanCompDirectory(dirPath: string): Promise<{
    imported: ImportedComponentDefinition[];
    errors: Array<{ filePath: string; error: string }>;
  }>;
}

function createEmptyComponentStore(): ComponentStore {
  return {
    format: NOHAL_COMPONENT_STORE_FORMAT,
    version: NOHAL_COMPONENT_STORE_VERSION,
    sources: {},
    components: {},
  };
}

function createLinuxCncBuiltinSourceId(version: string): string {
  return `linuxcnc-builtin:${version}`;
}

function applyLinuxCncBuiltinStores(store: ComponentStore): void {
  const expectedSourceIds = new Set<string>();

  for (const version of SUPPORTED_LINUXCNC_VERSIONS) {
    const sourceId = createLinuxCncBuiltinSourceId(version);
    expectedSourceIds.add(sourceId);
    const builtin = LINUXCNC_VERSION_STORES[version];
    const existing = store.sources[sourceId];

    store.sources[sourceId] = {
      id: sourceId,
      kind: "linuxcnc-builtin",
      linuxcncVersion: version,
      revision: builtin.revision,
      refName: builtin.refName,
      repoPath: "embedded://linuxcnc-stores",
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

function assertComponentStoreShape(
  input: unknown,
): asserts input is ComponentStore {
  if (!input || typeof input !== "object")
    throw new Error("Component store file is not an object");
  const store = input as Partial<ComponentStore>;
  if (store.format !== NOHAL_COMPONENT_STORE_FORMAT)
    throw new Error("Unsupported component store format");
  if (store.version !== NOHAL_COMPONENT_STORE_VERSION)
    throw new Error(
      `Unsupported component store version: ${String(store.version)}`,
    );
  if (!store.sources || typeof store.sources !== "object")
    throw new Error("Component store has no sources map");
  if (!store.components || typeof store.components !== "object")
    throw new Error("Component store has no components map");
}

function isErrnoCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("code" in error)) return false;
  return (error as { code?: unknown }).code === code;
}

function createComponentDirSourceId(io: CoreIo, dirPath: string): string {
  return `compdir:${slugify(io.path.resolve(dirPath))}`;
}

function createComponentFileSourceId(io: CoreIo, filePath: string): string {
  return `compfile:${slugify(io.path.resolve(filePath))}`;
}

function upsertComponentDirSource(
  io: CoreIo,
  store: ComponentStore,
  dirPath: string,
  nowIso: string,
): ComponentStoreDirSource {
  const normalizedDirPath = io.path.resolve(dirPath);
  const sourceId = createComponentDirSourceId(io, normalizedDirPath);
  const existing = store.sources[sourceId];
  if (existing && existing.kind !== "comp-dir") {
    throw new Error(`Source id collision with non-dir source: ${sourceId}`);
  }
  const source: ComponentStoreDirSource = {
    id: sourceId,
    kind: "comp-dir",
    dirPath: normalizedDirPath,
    recursive: true,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    lastScanAt: existing?.lastScanAt,
    lastError: existing?.lastError,
  };
  store.sources[sourceId] = source;
  return source;
}

function upsertComponentFileSource(
  io: CoreIo,
  store: ComponentStore,
  filePath: string,
  nowIso: string,
): ComponentStoreFileSource {
  const normalizedFilePath = io.path.resolve(filePath);
  const sourceId = createComponentFileSourceId(io, normalizedFilePath);
  const existing = store.sources[sourceId];
  if (existing && existing.kind !== "comp-file") {
    throw new Error(`Source id collision with non-file source: ${sourceId}`);
  }
  const source: ComponentStoreFileSource = {
    id: sourceId,
    kind: "comp-file",
    filePath: normalizedFilePath,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    lastScanAt: existing?.lastScanAt,
    lastError: existing?.lastError,
  };
  store.sources[sourceId] = source;
  return source;
}

function upsertStoredComponentEntry(
  store: ComponentStore,
  parsed: ImportedComponentDefinition,
  sourceRef: ComponentStoreEntry["sourceRef"],
  nowIso: string,
  forcedComponentId?: string,
): ComponentStoreEntry {
  const componentId = forcedComponentId ?? parsed.id;
  const existing = store.components[componentId];
  const normalizedParsed = forcedComponentId
    ? { ...parsed, id: forcedComponentId }
    : parsed;
  const entry: ComponentStoreEntry = {
    componentId,
    sourceRef,
    parsed: normalizedParsed,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
  store.components[componentId] = entry;
  return entry;
}

async function collectCompFilesRecursive(
  io: CoreIo,
  dirPath: string,
  errors: Array<{ filePath: string; error: string }>,
): Promise<string[]> {
  let entries: Awaited<ReturnType<CoreIo["fs"]["readDir"]>>;
  try {
    entries = await io.fs.readDir(dirPath);
  } catch (error) {
    errors.push({
      filePath: dirPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = io.path.join(dirPath, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...(await collectCompFilesRecursive(io, fullPath, errors)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".comp")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function writeComponentStoreFile(
  io: CoreIo,
  storeFilePath: string,
  store: ComponentStore,
): Promise<void> {
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
  await io.fs.makeDir(io.path.dirname(storeFilePath), { recursive: true });
  await io.fs.writeTextFile(
    storeFilePath,
    `${JSON.stringify(persisted, null, 2)}\n`,
  );
}

async function rescanComponentDirSourceInStore(
  io: CoreIo,
  storeFilePath: string,
  sourceId: string,
): Promise<StoreSourceRefreshResult> {
  const store = await readComponentStoreFile(io)(storeFilePath);
  const source = store.sources[sourceId];
  if (!source) throw new Error(`Component source not found: ${sourceId}`);
  if (source.kind !== "comp-dir")
    throw new Error(`Component source is not a dir: ${sourceId}`);

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

  await writeComponentStoreFile(io, storeFilePath, store);
  return { sourceId, entries, removedComponentIds, errors };
}

export const readComponentStoreFile =
  (io: CoreIo) =>
  async (storeFilePath: string): Promise<ComponentStore> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    try {
      const content = await io.fs.readTextFile(normalizedStoreFilePath);
      const parsed = JSON.parse(content) as unknown;
      assertComponentStoreShape(parsed);
      applyLinuxCncBuiltinStores(parsed);
      return parsed;
    } catch (error) {
      if (isErrnoCode(error, "ENOENT")) {
        const empty = createEmptyComponentStore();
        applyLinuxCncBuiltinStores(empty);
        return empty;
      }
      throw error;
    }
  };

export const saveParsedCompFileToStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    filePath: string,
  ): Promise<ComponentStoreEntry> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readComponentStoreFile(io)(normalizedStoreFilePath);
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
    await writeComponentStoreFile(io, normalizedStoreFilePath, store);
    return entry;
  };

export const refreshStoredCompEntry =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    componentId: string,
  ): Promise<ComponentStoreEntry> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readComponentStoreFile(io)(normalizedStoreFilePath);
    const existing = store.components[componentId];
    if (!existing)
      throw new Error(`Component store entry not found: ${componentId}`);
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
    await writeComponentStoreFile(io, normalizedStoreFilePath, store);
    return entry;
  };

export const addComponentDirSourceToStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    dirPath: string,
  ): Promise<StoreSourceRefreshResult> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const normalizedDirPath = io.path.resolve(dirPath);
    const store = await readComponentStoreFile(io)(normalizedStoreFilePath);
    const nowIso = new Date().toISOString();
    const source = upsertComponentDirSource(
      io,
      store,
      normalizedDirPath,
      nowIso,
    );
    await writeComponentStoreFile(io, normalizedStoreFilePath, store);
    return rescanComponentDirSourceInStore(
      io,
      normalizedStoreFilePath,
      source.id,
    );
  };

export const refreshComponentSourceInStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    sourceId: string,
  ): Promise<StoreSourceRefreshResult> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readComponentStoreFile(io)(normalizedStoreFilePath);
    const source = store.sources[sourceId];
    if (!source) throw new Error(`Component source not found: ${sourceId}`);

    if (source.kind === "comp-dir") {
      return rescanComponentDirSourceInStore(
        io,
        normalizedStoreFilePath,
        sourceId,
      );
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

    await writeComponentStoreFile(io, normalizedStoreFilePath, store);
    return { sourceId, entries, removedComponentIds, errors };
  };

export const deleteComponentSourceFromStore =
  (io: CoreIo) =>
  async (
    storeFilePath: string,
    sourceId: string,
  ): Promise<{ sourceId: string; removedComponentIds: string[] }> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const store = await readComponentStoreFile(io)(normalizedStoreFilePath);
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
    await writeComponentStoreFile(io, normalizedStoreFilePath, store);
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
    const files = await collectCompFilesRecursive(
      io,
      normalizedDirPath,
      errors,
    );

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

export function createComponentStoreApi(io: CoreIo): ComponentStoreApi {
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
