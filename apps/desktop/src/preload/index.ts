import type { LinuxCncVersion } from "@nohal/core/linuxcncVersion";
import type {
  ComponentDefinition,
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
  NoHALProject,
} from "@nohal/core/types";
import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings } from "../shared/appSettings";
import { IPC_CHANNELS } from "../shared/ipcChannels";
import type { NoHALApi } from "./api";

const ipc = IPC_CHANNELS.rendererToMain;
const events = IPC_CHANNELS.mainToRenderer;
type RendererToMainChannel = (typeof ipc)[keyof typeof ipc];

function send(channel: RendererToMainChannel, ...args: unknown[]): void {
  ipcRenderer.send(channel, ...args);
}

function sendSync<T>(channel: RendererToMainChannel, ...args: unknown[]): T {
  return ipcRenderer.sendSync(channel, ...args) as T;
}

function invoke<T>(
  channel: RendererToMainChannel,
  ...args: unknown[]
): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const api: NoHALApi = {
  setWindowDirtyState: (isDirty) => {
    send(ipc.setWindowDirtyState, isDirty);
  },
  readClipboardText: () => sendSync<string>(ipc.readClipboardText),
  writeClipboardText: (text) => {
    sendSync(ipc.writeClipboardText, text);
  },
  promptUnsavedChanges: () =>
    invoke<"save" | "discard" | "cancel">(ipc.promptUnsavedChanges),
  getAppSettings: () => invoke<AppSettings>(ipc.getAppSettings),
  updateAppSettings: (patch) =>
    invoke<AppSettings>(ipc.updateAppSettings, patch),
  getCustomComponentStorePathInfo: () =>
    invoke<{
      path: string;
      defaultPath: string;
      isDefault: boolean;
    }>(ipc.getCustomComponentStorePathInfo),
  onRequestSaveBeforeClose: (listener) => {
    const handler = async (_event: unknown, requestId: number) => {
      let didSave = false;
      try {
        didSave = (await listener()) === true;
      } catch {
        didSave = false;
      }
      send(ipc.replySaveBeforeClose, requestId, didSave);
    };
    ipcRenderer.on(events.requestSaveBeforeClose, handler);
    return () => {
      ipcRenderer.off(events.requestSaveBeforeClose, handler);
    };
  },
  newProject: (linuxcncVersion?: LinuxCncVersion) =>
    invoke<{
      project: NoHALProject;
    } | null>(ipc.newProject, linuxcncVersion),
  getRecentProjects: () =>
    invoke<Array<{ projectPath: string; name?: string; lastOpenedAt: string }>>(
      ipc.getRecentProjects,
    ),
  openProject: () =>
    invoke<{
      project: NoHALProject;
      projectPath: string;
    } | null>(ipc.openProject),
  openProjectAt: (projectPath) =>
    invoke<{
      project: NoHALProject;
      projectPath: string;
    }>(ipc.openProjectAt, projectPath),
  saveProject: (project, projectPath) =>
    invoke<{
      projectPath: string;
    } | null>(ipc.saveProject, project, projectPath),
  buildProject: (project, projectPath) =>
    invoke<{
      buildDir: string;
      files: string[];
      warnings: string[];
    }>(ipc.buildProject, project, projectPath),
  pickMachineIniFile: () =>
    invoke<MachineConfigImportSetupDraft | null>(ipc.pickMachineIniFile),
  pickMachineHalFile: () => invoke<string | null>(ipc.pickMachineHalFile),
  buildMachineConfigurationImport: (iniPath, halFilePaths) =>
    invoke<MachineConfigImportDraft>(
      ipc.buildMachineConfigurationImport,
      iniPath,
      halFilePaths,
    ),
  importCompFile: () =>
    invoke<ImportedComponentDefinition | null>(ipc.importCompFile),
  pickCustomComponentStoreFile: (defaultPath) =>
    invoke<string | null>(ipc.pickCustomComponentStoreFile, defaultPath),
  pickDirectory: (defaultPath) =>
    invoke<string | null>(ipc.pickDirectory, defaultPath),
  scanCompDir: (dirPath) =>
    invoke<{
      imported: ImportedComponentDefinition[];
      errors: Array<{ filePath: string; error: string }>;
    }>(ipc.scanCompDir, dirPath),
  loadComponentStore: () => invoke<ComponentStore>(ipc.loadComponentStore),
  addManualComponentToStore: (halComponentName?: string) =>
    invoke<ComponentStoreEntry>(
      ipc.addManualComponentToStore,
      halComponentName,
    ),
  updateManualComponentInStore: (componentId, component) =>
    invoke<ComponentStoreEntry>(
      ipc.updateManualComponentInStore,
      componentId,
      component,
    ),
  removeManualComponentFromStore: (componentId) =>
    invoke<{ sourceId: string; componentId: string }>(
      ipc.removeManualComponentFromStore,
      componentId,
    ),
  promoteProjectCustomComponentToStore: (component: ComponentDefinition) =>
    invoke<ComponentStoreEntry>(
      ipc.promoteProjectCustomComponentToStore,
      component,
    ),
  importCompFileToStore: () =>
    invoke<ComponentStoreEntry | null>(ipc.importCompFileToStore),
  addCompDirSourceToStore: () =>
    invoke<{
      sourceId: string;
      entries: ComponentStoreEntry[];
      removedComponentIds: string[];
      errors: Array<{ filePath: string; error: string }>;
    } | null>(ipc.addCompDirSourceToStore),
  refreshComponentSourceInStore: (sourceId) =>
    invoke<{
      sourceId: string;
      entries: ComponentStoreEntry[];
      removedComponentIds: string[];
      errors: Array<{ filePath: string; error: string }>;
    }>(ipc.refreshComponentSourceInStore, sourceId),
  deleteComponentSourceFromStore: (sourceId) =>
    invoke<{
      sourceId: string;
      removedComponentIds: string[];
    }>(ipc.deleteComponentSourceFromStore, sourceId),
  refreshComponentInStore: (componentId) =>
    invoke<ComponentStoreEntry>(ipc.refreshComponentInStore, componentId),
  readTextFile: (filePath) => invoke<string>(ipc.readTextFile, filePath),
};

contextBridge.exposeInMainWorld("nohal", api);
