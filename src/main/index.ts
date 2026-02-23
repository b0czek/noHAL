import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEmptyProject,
  parseNoHALProject,
  stringifyNoHALProject
} from "../shared/project";
import { exportProjectToHal } from "../shared/exportHal";
import { parseCompComponentDefinition } from "../shared/compParser";
import { slugify } from "../shared/id";
import type {
  ComponentStore,
  ComponentStoreDirSource,
  ComponentStoreFileSource,
  ComponentStoreEntry,
  ImportedComponentDefinition,
  NoHALProject
} from "../shared/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPONENT_STORE_FILENAME = "component-store.json";

async function collectCompFilesRecursive(
  dirPath: string,
  errors: Array<{ filePath: string; error: string }>
): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    errors.push({
      filePath: dirPath,
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...(await collectCompFilesRecursive(fullPath, errors)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".comp")) {
      files.push(fullPath);
    }
  }
  return files;
}

function createEmptyComponentStore(): ComponentStore {
  return {
    format: "nohal-component-store",
    version: 2,
    sources: {},
    components: {}
  };
}

function assertComponentStoreShape(input: unknown): asserts input is ComponentStore {
  if (!input || typeof input !== "object") throw new Error("Component store file is not an object");
  const store = input as Partial<ComponentStore>;
  if (store.format !== "nohal-component-store") throw new Error("Unsupported component store format");
  if (store.version !== 2) throw new Error(`Unsupported component store version: ${String(store.version)}`);
  if (!store.sources || typeof store.sources !== "object") throw new Error("Component store has no sources map");
  if (!store.components || typeof store.components !== "object") throw new Error("Component store has no components map");
}

async function getComponentStoreFilePath(): Promise<string> {
  const userDataDir = app.getPath("userData");
  await mkdir(userDataDir, { recursive: true });
  return path.join(userDataDir, COMPONENT_STORE_FILENAME);
}

async function readComponentStoreFile(): Promise<ComponentStore> {
  const filePath = await getComponentStoreFilePath();
  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    assertComponentStoreShape(parsed);
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createEmptyComponentStore();
    }
    throw error;
  }
}

async function writeComponentStoreFile(store: ComponentStore): Promise<void> {
  const filePath = await getComponentStoreFilePath();
  await writeFile(filePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function createComponentDirSourceId(dirPath: string): string {
  return `compdir:${slugify(path.resolve(dirPath))}`;
}

function createComponentFileSourceId(filePath: string): string {
  return `compfile:${slugify(path.resolve(filePath))}`;
}

function upsertComponentDirSource(
  store: ComponentStore,
  dirPath: string,
  nowIso: string
): ComponentStoreDirSource {
  const normalizedDirPath = path.resolve(dirPath);
  const sourceId = createComponentDirSourceId(normalizedDirPath);
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
    lastError: existing?.lastError
  };
  store.sources[sourceId] = source;
  return source;
}

function upsertComponentFileSource(
  store: ComponentStore,
  filePath: string,
  nowIso: string
): ComponentStoreFileSource {
  const normalizedFilePath = path.resolve(filePath);
  const sourceId = createComponentFileSourceId(normalizedFilePath);
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
    lastError: existing?.lastError
  };
  store.sources[sourceId] = source;
  return source;
}

type StoreSourceRefreshResult = {
  sourceId: string;
  entries: ComponentStoreEntry[];
  removedComponentIds: string[];
  errors: Array<{ filePath: string; error: string }>;
};

function upsertStoredComponentEntry(
  store: ComponentStore,
  parsed: ImportedComponentDefinition,
  sourceRef: ComponentStoreEntry["sourceRef"],
  nowIso: string,
  forcedComponentId?: string
): ComponentStoreEntry {
  const componentId = forcedComponentId ?? parsed.id;
  const existing = store.components[componentId];
  const normalizedParsed = forcedComponentId ? { ...parsed, id: forcedComponentId } : parsed;
  const entry: ComponentStoreEntry = {
    componentId,
    sourceRef,
    parsed: normalizedParsed,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso
  };
  store.components[componentId] = entry;
  return entry;
}

async function saveParsedCompFileToStore(filePath: string): Promise<ComponentStoreEntry> {
  const store = await readComponentStoreFile();
  const nowIso = new Date().toISOString();
  const normalizedFilePath = path.resolve(filePath);
  const source = upsertComponentFileSource(store, normalizedFilePath, nowIso);
  const content = await readFile(normalizedFilePath, "utf8");
  const parsed = parseCompComponentDefinition(content, normalizedFilePath);
  const existingForSource = Object.values(store.components).find(
    (entry) => entry.sourceRef.sourceId === source.id
  );
  const entry = upsertStoredComponentEntry(
    store,
    parsed,
    { kind: "comp-file", sourceId: source.id, filePath: normalizedFilePath },
    nowIso,
    existingForSource?.componentId
  );
  store.sources[source.id] = {
    ...source,
    updatedAt: nowIso,
    lastScanAt: nowIso,
    lastError: undefined
  };
  await writeComponentStoreFile(store);
  return entry;
}

async function refreshStoredCompEntry(componentId: string): Promise<ComponentStoreEntry> {
  const store = await readComponentStoreFile();
  const existing = store.components[componentId];
  if (!existing) throw new Error(`Component store entry not found: ${componentId}`);
  if (existing.sourceRef.kind !== "comp-file" && existing.sourceRef.kind !== "comp-dir") {
    throw new Error(`Unsupported component source for refresh: ${componentId}`);
  }
  const filePath = existing.sourceRef.filePath;
  const nowIso = new Date().toISOString();
  const content = await readFile(filePath, "utf8");
  const parsed = parseCompComponentDefinition(content, filePath);
  const entry = upsertStoredComponentEntry(store, parsed, existing.sourceRef, nowIso, componentId);
  const source = store.sources[existing.sourceRef.sourceId];
  if (source) {
    store.sources[source.id] = {
      ...source,
      updatedAt: nowIso,
      lastScanAt: nowIso,
      lastError: undefined
    };
  }
  await writeComponentStoreFile(store);
  return entry;
}

async function rescanComponentDirSourceInStore(sourceId: string): Promise<StoreSourceRefreshResult> {
  const store = await readComponentStoreFile();
  const source = store.sources[sourceId];
  if (!source) throw new Error(`Component source not found: ${sourceId}`);
  if (source.kind !== "comp-dir") throw new Error(`Component source is not a dir: ${sourceId}`);

  const nowIso = new Date().toISOString();
  const errors: Array<{ filePath: string; error: string }> = [];
  const files = await collectCompFilesRecursive(source.dirPath, errors);
  const entries: ComponentStoreEntry[] = [];
  const seenComponentIds = new Set<string>();
  const hasRootScanError = errors.some((error) => path.resolve(error.filePath) === path.resolve(source.dirPath));

  for (const filePath of files) {
    const normalizedFilePath = path.resolve(filePath);
    try {
      const content = await readFile(normalizedFilePath, "utf8");
      const parsed = parseCompComponentDefinition(content, normalizedFilePath);
      const existingByFile = Object.values(store.components).find(
        (entry) =>
          entry.sourceRef.kind === "comp-dir" &&
          entry.sourceRef.sourceId === sourceId &&
          path.resolve(entry.sourceRef.filePath) === normalizedFilePath
      );
      const entry = upsertStoredComponentEntry(
        store,
        parsed,
        { kind: "comp-dir", sourceId, filePath: normalizedFilePath },
        nowIso,
        existingByFile?.componentId
      );
      entries.push(entry);
      seenComponentIds.add(entry.componentId);
    } catch (error) {
      errors.push({
        filePath: normalizedFilePath,
        error: error instanceof Error ? error.message : String(error)
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
      ? { lastError: hasRootScanError ? "Directory scan failed" : `${errors.length} scan errors` }
      : { lastError: undefined })
  };

  await writeComponentStoreFile(store);
  return { sourceId, entries, removedComponentIds, errors };
}

async function addComponentDirSourceToStore(): Promise<StoreSourceRefreshResult | null> {
  const res = await dialog.showOpenDialog({
    title: "Add Component Source Directory",
    properties: ["openDirectory"]
  });
  if (res.canceled || res.filePaths.length === 0) return null;

  const dirPath = path.resolve(res.filePaths[0]);
  const store = await readComponentStoreFile();
  const nowIso = new Date().toISOString();
  const source = upsertComponentDirSource(store, dirPath, nowIso);
  await writeComponentStoreFile(store);
  return rescanComponentDirSourceInStore(source.id);
}

async function refreshComponentSourceInStore(sourceId: string): Promise<StoreSourceRefreshResult> {
  const store = await readComponentStoreFile();
  const source = store.sources[sourceId];
  if (!source) throw new Error(`Component source not found: ${sourceId}`);

  if (source.kind === "comp-dir") {
    return rescanComponentDirSourceInStore(sourceId);
  }

  const nowIso = new Date().toISOString();
  const errors: Array<{ filePath: string; error: string }> = [];
  const removedComponentIds: string[] = [];
  let entries: ComponentStoreEntry[] = [];

  try {
    const normalizedFilePath = path.resolve(source.filePath);
    const content = await readFile(normalizedFilePath, "utf8");
    const parsed = parseCompComponentDefinition(content, normalizedFilePath);
    const existingEntries = Object.values(store.components).filter((entry) => entry.sourceRef.sourceId === sourceId);
    const keepId = existingEntries[0]?.componentId;
    const entry = upsertStoredComponentEntry(
      store,
      parsed,
      { kind: "comp-file", sourceId, filePath: normalizedFilePath },
      nowIso,
      keepId
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
      lastError: undefined
    };
  } catch (error) {
    errors.push({
      filePath: source.filePath,
      error: error instanceof Error ? error.message : String(error)
    });
    store.sources[sourceId] = {
      ...source,
      updatedAt: nowIso,
      lastScanAt: nowIso,
      lastError: "File import refresh failed"
    };
  }

  await writeComponentStoreFile(store);
  return { sourceId, entries, removedComponentIds, errors };
}

async function deleteComponentSourceFromStore(sourceId: string): Promise<{ sourceId: string; removedComponentIds: string[] }> {
  const store = await readComponentStoreFile();
  const source = store.sources[sourceId];
  if (!source) throw new Error(`Component source not found: ${sourceId}`);

  delete store.sources[sourceId];
  const removedComponentIds: string[] = [];
  for (const [componentId, entry] of Object.entries(store.components)) {
    if (entry.sourceRef.sourceId !== sourceId) continue;
    delete store.components[componentId];
    removedComponentIds.push(componentId);
  }
  await writeComponentStoreFile(store);
  return { sourceId, removedComponentIds };
}

function createWindow(): void {
  const preloadCandidates = [
    path.join(__dirname, "../preload/index.cjs"),
    path.join(__dirname, "../preload/index.mjs"),
    path.join(__dirname, "../preload/index.js")
  ];
  const preloadPath = preloadCandidates.find((candidate) => existsSync(candidate)) ?? preloadCandidates[0];

  const win = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("nohal:new-project", async () => createEmptyProject("NoHAL Project"));

  ipcMain.handle("nohal:open-project", async () => {
    const res = await dialog.showOpenDialog({
      title: "Open NoHAL Project",
      properties: ["openFile"],
      filters: [{ name: "NoHAL Project", extensions: ["nohal.json", "json"] }]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const filePath = res.filePaths[0];
    const content = await readFile(filePath, "utf8");
    const project = parseNoHALProject(content);
    return { project, filePath };
  });

  ipcMain.handle("nohal:save-project", async (_evt, project: NoHALProject, filePath?: string | null) => {
    let target = filePath ?? null;
    if (!target) {
      const res = await dialog.showSaveDialog({
        title: "Save NoHAL Project",
        defaultPath: `${project.name || "project"}.nohal.json`,
        filters: [{ name: "NoHAL Project", extensions: ["nohal.json", "json"] }]
      });
      if (res.canceled || !res.filePath) return null;
      target = res.filePath;
    }

    await writeFile(target, stringifyNoHALProject(project), "utf8");
    return { filePath: target };
  });

  ipcMain.handle("nohal:export-hal", async (_evt, project: NoHALProject, filePath?: string | null) => {
    let target = filePath ?? null;
    if (!target) {
      const res = await dialog.showSaveDialog({
        title: "Export HAL",
        defaultPath: `${project.name || "project"}.hal`,
        filters: [{ name: "HAL File", extensions: ["hal"] }]
      });
      if (res.canceled || !res.filePath) return null;
      target = res.filePath;
    }
    const hal = exportProjectToHal(project);
    await writeFile(target, hal.text, "utf8");
    return { filePath: target, warnings: hal.warnings };
  });

  ipcMain.handle("nohal:load-component-store", async () => readComponentStoreFile());

  ipcMain.handle("nohal:import-comp-file", async () => {
    const res = await dialog.showOpenDialog({
      title: "Import LinuxCNC .comp",
      properties: ["openFile"],
      filters: [{ name: "HAL Component", extensions: ["comp"] }]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const filePath = res.filePaths[0];
    const content = await readFile(filePath, "utf8");
    const parsed = parseCompComponentDefinition(content, filePath);
    return parsed;
  });

  ipcMain.handle("nohal:import-comp-file-to-store", async () => {
    const res = await dialog.showOpenDialog({
      title: "Import LinuxCNC .comp",
      properties: ["openFile"],
      filters: [{ name: "HAL Component", extensions: ["comp"] }]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return saveParsedCompFileToStore(res.filePaths[0]);
  });

  ipcMain.handle("nohal:pick-directory", async (_evt, defaultPath?: string | null) => {
    const res = await dialog.showOpenDialog({
      title: "Select Directory",
      defaultPath: defaultPath ?? undefined,
      properties: ["openDirectory"]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle("nohal:scan-comp-dir", async (_evt, dirPath: string) => {
    const imported: ImportedComponentDefinition[] = [];
    const errors: Array<{ filePath: string; error: string }> = [];
    const files = await collectCompFilesRecursive(dirPath, errors);

    for (const filePath of files) {
      try {
        const content = await readFile(filePath, "utf8");
        imported.push(parseCompComponentDefinition(content, filePath));
      } catch (error) {
        errors.push({
          filePath,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { imported, errors };
  });

  ipcMain.handle("nohal:add-comp-dir-source-to-store", async () => addComponentDirSourceToStore());

  ipcMain.handle("nohal:refresh-component-source-in-store", async (_evt, sourceId: string) =>
    refreshComponentSourceInStore(sourceId)
  );

  ipcMain.handle("nohal:delete-component-source-from-store", async (_evt, sourceId: string) =>
    deleteComponentSourceFromStore(sourceId)
  );

  ipcMain.handle("nohal:refresh-component-in-store", async (_evt, componentId: string) => refreshStoredCompEntry(componentId));

  ipcMain.handle("nohal:read-text-file", async (_evt, filePath: string) => readFile(filePath, "utf8"));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
