import { contextBridge, ipcRenderer } from "electron";
import type {
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
  NoHALProject,
} from "../shared/types";
import type { NoHALApi } from "./api";

const api: NoHALApi = {
  newProject: () =>
    ipcRenderer.invoke("nohal:new-project") as Promise<NoHALProject>,
  getRecentProjects: () =>
    ipcRenderer.invoke("nohal:get-recent-projects") as Promise<
      Array<{ filePath: string; name?: string; lastOpenedAt: string }>
    >,
  openProject: () =>
    ipcRenderer.invoke("nohal:open-project") as Promise<{
      project: NoHALProject;
      filePath: string;
    } | null>,
  openProjectAt: (filePath) =>
    ipcRenderer.invoke("nohal:open-project-at", filePath) as Promise<{
      project: NoHALProject;
      filePath: string;
    }>,
  saveProject: (project, filePath) =>
    ipcRenderer.invoke("nohal:save-project", project, filePath) as Promise<{
      filePath: string;
    } | null>,
  exportHal: (project, filePath) =>
    ipcRenderer.invoke("nohal:export-hal", project, filePath) as Promise<{
      filePath: string;
      warnings: string[];
    } | null>,
  importCompFile: () =>
    ipcRenderer.invoke(
      "nohal:import-comp-file",
    ) as Promise<ImportedComponentDefinition | null>,
  pickDirectory: (defaultPath) =>
    ipcRenderer.invoke("nohal:pick-directory", defaultPath) as Promise<
      string | null
    >,
  scanCompDir: (dirPath) =>
    ipcRenderer.invoke("nohal:scan-comp-dir", dirPath) as Promise<{
      imported: ImportedComponentDefinition[];
      errors: Array<{ filePath: string; error: string }>;
    }>,
  loadComponentStore: () =>
    ipcRenderer.invoke("nohal:load-component-store") as Promise<ComponentStore>,
  importCompFileToStore: () =>
    ipcRenderer.invoke(
      "nohal:import-comp-file-to-store",
    ) as Promise<ComponentStoreEntry | null>,
  addCompDirSourceToStore: () =>
    ipcRenderer.invoke("nohal:add-comp-dir-source-to-store") as Promise<{
      sourceId: string;
      entries: ComponentStoreEntry[];
      removedComponentIds: string[];
      errors: Array<{ filePath: string; error: string }>;
    } | null>,
  refreshComponentSourceInStore: (sourceId) =>
    ipcRenderer.invoke(
      "nohal:refresh-component-source-in-store",
      sourceId,
    ) as Promise<{
      sourceId: string;
      entries: ComponentStoreEntry[];
      removedComponentIds: string[];
      errors: Array<{ filePath: string; error: string }>;
    }>,
  deleteComponentSourceFromStore: (sourceId) =>
    ipcRenderer.invoke(
      "nohal:delete-component-source-from-store",
      sourceId,
    ) as Promise<{
      sourceId: string;
      removedComponentIds: string[];
    }>,
  refreshComponentInStore: (componentId) =>
    ipcRenderer.invoke(
      "nohal:refresh-component-in-store",
      componentId,
    ) as Promise<ComponentStoreEntry>,
  readTextFile: (filePath) =>
    ipcRenderer.invoke("nohal:read-text-file", filePath) as Promise<string>,
};

contextBridge.exposeInMainWorld("nohal", api);
