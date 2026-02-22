import { contextBridge, ipcRenderer } from "electron";
import type { NochalApi } from "./api";
import type { ImportedComponentDefinition, NochalProject } from "../shared/types";

const api: NochalApi = {
  newProject: () => ipcRenderer.invoke("nochal:new-project") as Promise<NochalProject>,
  openProject: () =>
    ipcRenderer.invoke("nochal:open-project") as Promise<{ project: NochalProject; filePath: string } | null>,
  saveProject: (project, filePath) =>
    ipcRenderer.invoke("nochal:save-project", project, filePath) as Promise<{ filePath: string } | null>,
  exportHal: (project, filePath) =>
    ipcRenderer.invoke("nochal:export-hal", project, filePath) as Promise<{
      filePath: string;
      warnings: string[];
    } | null>,
  importCompFile: () => ipcRenderer.invoke("nochal:import-comp-file") as Promise<ImportedComponentDefinition | null>,
  scanCompDir: (dirPath) =>
    ipcRenderer.invoke("nochal:scan-comp-dir", dirPath) as Promise<{
      imported: ImportedComponentDefinition[];
      errors: Array<{ filePath: string; error: string }>;
    }>,
  readTextFile: (filePath) => ipcRenderer.invoke("nochal:read-text-file", filePath) as Promise<string>
};

contextBridge.exposeInMainWorld("nochal", api);
