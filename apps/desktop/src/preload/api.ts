import type {
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
  LinuxCncVersion,
  MachineConfigHalFileSelection,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
  NoHALProject,
  RecentProjectEntry,
} from "@nohal/core/src/types";
import type { AppSettings, AppSettingsPatch } from "../shared/appSettings";

export type UnsavedChangesChoice = "save" | "discard" | "cancel";

export interface NoHALApi {
  setWindowDirtyState(isDirty: boolean): void;
  promptUnsavedChanges(): Promise<UnsavedChangesChoice>;
  onRequestSaveBeforeClose(listener: () => Promise<boolean>): () => void;
  getAppSettings(): Promise<AppSettings>;
  updateAppSettings(patch: AppSettingsPatch): Promise<AppSettings>;
  newProject(
    linuxcncVersion?: LinuxCncVersion,
  ): Promise<{ project: NoHALProject } | null>;
  getRecentProjects(): Promise<RecentProjectEntry[]>;
  openProject(): Promise<{ project: NoHALProject; projectPath: string } | null>;
  openProjectAt(
    projectPath: string,
  ): Promise<{ project: NoHALProject; projectPath: string }>;
  saveProject(
    project: NoHALProject,
    projectPath?: string | null,
  ): Promise<{ projectPath: string } | null>;
  buildProject(
    project: NoHALProject,
    projectPath: string,
  ): Promise<{ buildDir: string; files: string[]; warnings: string[] }>;
  pickMachineIniFile(): Promise<MachineConfigImportSetupDraft | null>;
  pickMachineHalFile(): Promise<string | null>;
  buildMachineConfigurationImport(
    iniPath: string,
    halFiles: MachineConfigHalFileSelection[],
  ): Promise<MachineConfigImportDraft>;
  importCompFile(): Promise<ImportedComponentDefinition | null>;
  pickDirectory(defaultPath?: string | null): Promise<string | null>;
  scanCompDir(dirPath: string): Promise<{
    imported: ImportedComponentDefinition[];
    errors: Array<{ filePath: string; error: string }>;
  }>;
  loadComponentStore(): Promise<ComponentStore>;
  importCompFileToStore(): Promise<ComponentStoreEntry | null>;
  addCompDirSourceToStore(): Promise<{
    sourceId: string;
    entries: ComponentStoreEntry[];
    removedComponentIds: string[];
    errors: Array<{ filePath: string; error: string }>;
  } | null>;
  refreshComponentSourceInStore(sourceId: string): Promise<{
    sourceId: string;
    entries: ComponentStoreEntry[];
    removedComponentIds: string[];
    errors: Array<{ filePath: string; error: string }>;
  }>;
  deleteComponentSourceFromStore(sourceId: string): Promise<{
    sourceId: string;
    removedComponentIds: string[];
  }>;
  refreshComponentInStore(componentId: string): Promise<ComponentStoreEntry>;
  readTextFile(filePath: string): Promise<string>;
}
