import type {
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
  NoHALProject,
  RecentProjectEntry
} from "../shared/types";

export interface NoHALApi {
  newProject(): Promise<NoHALProject>;
  getRecentProjects(): Promise<RecentProjectEntry[]>;
  openProject(): Promise<{ project: NoHALProject; filePath: string } | null>;
  openProjectAt(filePath: string): Promise<{ project: NoHALProject; filePath: string }>;
  saveProject(project: NoHALProject, filePath?: string | null): Promise<{ filePath: string } | null>;
  exportHal(
    project: NoHALProject,
    filePath?: string | null
  ): Promise<{ filePath: string; warnings: string[] } | null>;
  importCompFile(): Promise<ImportedComponentDefinition | null>;
  pickDirectory(defaultPath?: string | null): Promise<string | null>;
  scanCompDir(
    dirPath: string
  ): Promise<{ imported: ImportedComponentDefinition[]; errors: Array<{ filePath: string; error: string }> }>;
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
