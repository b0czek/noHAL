import type { LinuxCncVersion } from "../linuxcncVersion";
import type { ProjectMesaConfig } from "../mesa/types";
import type {
  NOHAL_PROJECT_FORMAT,
  NOHAL_PROJECT_VERSION,
} from "../project/formats";
import type { ComponentDefinition } from "./components";
import type { ProjectMachineConfig } from "./ini";
import type { SheetDefinition } from "./sheet";

export interface RecentProjectEntry {
  projectPath: string;
  name?: string;
  lastOpenedAt: string;
}

export interface ProjectLibrary {
  components: Record<string, ComponentDefinition>;
}

export interface HalThreadDefinition {
  id: string;
  name: string;
  periodNs: number;
  floatMode?: "fp" | "nofp";
}

export interface HalExportComponentAddfRule {
  enabled?: boolean;
  functionTemplates?: string[];
}

export interface HalExportComponentRule {
  loadOrderPriority?: number;
  loadrtArgs?: string[];
  addf?: HalExportComponentAddfRule;
}

export interface HalExportAddfConfig {
  enabled?: boolean;
  defaultThread?: string;
  emitPosition?: boolean;
}

export interface HalExportConfig {
  loadOrder?: string[];
  componentRules?: Record<string, HalExportComponentRule>;
  addf?: HalExportAddfConfig;
}

export interface ProjectMotmodConfig {
  numJoints: number;
  numDio: number;
  numAio: number;
  numSpindles: number;
  numMiscError: number;
  trajPeriodNs: number;
}

export type ProjectWireLayerPosition = "under-components" | "above-components";
export type ProjectWireStyle = "right-angle" | "straight" | "curved";

export interface ProjectUiConfig {
  activeSheetId: string;
  wireLayerPosition: ProjectWireLayerPosition;
  wireStyle: ProjectWireStyle;
}

export interface NoHALProject {
  format: typeof NOHAL_PROJECT_FORMAT;
  version: typeof NOHAL_PROJECT_VERSION;
  name: string;
  shutdown: string;
  target: {
    linuxcncVersion: LinuxCncVersion;
    platform: "linux";
  };
  rootSheetId: string;
  sheets: Record<string, SheetDefinition>;
  library: ProjectLibrary;
  halThreads?: HalThreadDefinition[];
  machineConfig?: ProjectMachineConfig;
  motmod?: ProjectMotmodConfig;
  mesa?: ProjectMesaConfig;
  halExport?: HalExportConfig;
  ui: ProjectUiConfig;
}
