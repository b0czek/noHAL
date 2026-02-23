import type { ImportedComponentDefinition, NoHALProject } from "../shared/types";

export interface NoHALApi {
  newProject(): Promise<NoHALProject>;
  openProject(): Promise<{ project: NoHALProject; filePath: string } | null>;
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
  readTextFile(filePath: string): Promise<string>;
}
