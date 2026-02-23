import { contextBridge, ipcRenderer } from "electron";
import type { NoHALApi } from "./api";
import type { ImportedComponentDefinition, NoHALProject } from "../shared/types";

const api: NoHALApi = {
  newProject: () => ipcRenderer.invoke("nohal:new-project") as Promise<NoHALProject>,
  openProject: () =>
    ipcRenderer.invoke("nohal:open-project") as Promise<{ project: NoHALProject; filePath: string } | null>,
  saveProject: (project, filePath) =>
    ipcRenderer.invoke("nohal:save-project", project, filePath) as Promise<{ filePath: string } | null>,
  exportHal: (project, filePath) =>
    ipcRenderer.invoke("nohal:export-hal", project, filePath) as Promise<{
      filePath: string;
      warnings: string[];
    } | null>,
  importCompFile: () => ipcRenderer.invoke("nohal:import-comp-file") as Promise<ImportedComponentDefinition | null>,
  pickDirectory: (defaultPath) => ipcRenderer.invoke("nohal:pick-directory", defaultPath) as Promise<string | null>,
  scanCompDir: (dirPath) =>
    ipcRenderer.invoke("nohal:scan-comp-dir", dirPath) as Promise<{
      imported: ImportedComponentDefinition[];
      errors: Array<{ filePath: string; error: string }>;
    }>,
  readTextFile: (filePath) => ipcRenderer.invoke("nohal:read-text-file", filePath) as Promise<string>
};

contextBridge.exposeInMainWorld("nohal", api);
