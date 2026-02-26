import { contextBridge, ipcRenderer } from "electron";
import type {
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
  NoHALProject,
} from "../shared/types";
import type { NoHALApi } from "./api";

const api: NoHALApi = {
  setWindowDirtyState: (isDirty) => {
    ipcRenderer.send("nohal:set-window-dirty-state", isDirty);
  },
  promptUnsavedChanges: () =>
    ipcRenderer.invoke("nohal:prompt-unsaved-changes") as Promise<
      "save" | "discard" | "cancel"
    >,
  onRequestSaveBeforeClose: (listener) => {
    const handler = async (_event: unknown, requestId: number) => {
      let didSave = false;
      try {
        didSave = (await listener()) === true;
      } catch {
        didSave = false;
      }
      ipcRenderer.send("nohal:reply-save-before-close", requestId, didSave);
    };
    ipcRenderer.on("nohal:request-save-before-close", handler);
    return () => {
      ipcRenderer.off("nohal:request-save-before-close", handler);
    };
  },
  newProject: () =>
    ipcRenderer.invoke("nohal:new-project") as Promise<{
      project: NoHALProject;
      projectPath: string;
    } | null>,
  getRecentProjects: () =>
    ipcRenderer.invoke("nohal:get-recent-projects") as Promise<
      Array<{ projectPath: string; name?: string; lastOpenedAt: string }>
    >,
  openProject: () =>
    ipcRenderer.invoke("nohal:open-project") as Promise<{
      project: NoHALProject;
      projectPath: string;
    } | null>,
  openProjectAt: (projectPath) =>
    ipcRenderer.invoke("nohal:open-project-at", projectPath) as Promise<{
      project: NoHALProject;
      projectPath: string;
    }>,
  saveProject: (project, projectPath) =>
    ipcRenderer.invoke("nohal:save-project", project, projectPath) as Promise<{
      projectPath: string;
    } | null>,
  exportHal: (project, filePath) =>
    ipcRenderer.invoke("nohal:export-hal", project, filePath) as Promise<{
      filePath: string;
      warnings: string[];
    } | null>,
  pickMachineIniFile: () =>
    ipcRenderer.invoke(
      "nohal:pick-machine-ini-file",
    ) as Promise<MachineConfigImportSetupDraft | null>,
  pickMachineHalFile: () =>
    ipcRenderer.invoke("nohal:pick-machine-hal-file") as Promise<string | null>,
  buildMachineConfigurationImport: (iniPath, halFilePaths) =>
    ipcRenderer.invoke(
      "nohal:build-machine-configuration-import",
      iniPath,
      halFilePaths,
    ) as Promise<MachineConfigImportDraft>,
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
