import type { ImportedComponentDefinition, NochalProject } from "../shared/types";

export interface NochalApi {
  newProject(): Promise<NochalProject>;
  openProject(): Promise<{ project: NochalProject; filePath: string } | null>;
  saveProject(project: NochalProject, filePath?: string | null): Promise<{ filePath: string } | null>;
  exportHal(
    project: NochalProject,
    filePath?: string | null
  ): Promise<{ filePath: string; warnings: string[] } | null>;
  importCompFile(): Promise<ImportedComponentDefinition | null>;
  scanCompDir(
    dirPath: string
  ): Promise<{ imported: ImportedComponentDefinition[]; errors: Array<{ filePath: string; error: string }> }>;
  readTextFile(filePath: string): Promise<string>;
}
