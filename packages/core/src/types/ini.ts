export interface LinuxCncIniEntry {
  key: string;
  value: string;
  line: number;
}

export interface LinuxCncIniSection {
  name: string;
  entries: LinuxCncIniEntry[];
  line: number;
}

export interface LinuxCncIniDocument {
  parser: "nohal-ini-v1";
  sourcePath?: string;
  sourceFileName?: string;
  lineCount: number;
  sections: LinuxCncIniSection[];
  warnings: string[];
}

export interface LinuxCncIniHalReference {
  kind: "HALFILE" | "POSTGUI_HALFILE" | "SHUTDOWN";
  sectionName: string;
  key: string;
  rawValue: string;
  fileToken: string;
  args: string[];
  line: number;
}

export interface MachineConfigHalSource {
  kind: LinuxCncIniHalReference["kind"];
  iniLine: number;
  iniValue: string;
  requestedPath: string;
  resolvedPath?: string;
  status: "loaded" | "missing" | "skipped-lib" | "skipped-non-hal";
}

export interface MachineConfigHalFileSelection {
  filePath: string;
  resolveIniSubstitutions: boolean;
}

export interface ProjectMachineConfig {
  source: "imported-linuxcnc-config";
  userIni: LinuxCncIniDocument;
  halSources: MachineConfigHalSource[];
}

export interface MachineConfigImportDraft {
  machineConfig: ProjectMachineConfig;
  halImport: import("./halImport").HalImportDraft;
  warnings: string[];
}

export interface MachineConfigImportSetupDraft {
  ini: LinuxCncIniDocument;
  halReferences: LinuxCncIniHalReference[];
  suggestedHalFilePaths: string[];
  warnings: string[];
}
