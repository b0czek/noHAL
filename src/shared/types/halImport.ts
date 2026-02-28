import type { ComponentStore } from "./componentStore";
import type { NoHALProject, ProjectMotmodConfig } from "./project";

export interface HalImportObservedPin {
  name: string;
  observedDirections: Array<"in" | "out" | "io">;
}

export interface HalImportObservedParam {
  name: string;
  sampleValues: string[];
}

export interface HalImportInstance {
  instanceName: string;
  componentGroupId: string;
  pinNames: string[];
  paramValues: Record<string, string>;
}

export interface HalImportComponentGroup {
  id: string;
  inferredHalComponentName: string;
  loadCommand?: string;
  runtimeHint: "rt" | "userspace" | "unknown";
  instances: HalImportInstance[];
  pins: HalImportObservedPin[];
  params: HalImportObservedParam[];
}

export interface HalImportNetEndpoint {
  rawPath: string;
  instanceName: string;
  pinName: string;
}

export interface HalImportNet {
  line: number;
  name: string;
  endpoints: HalImportNetEndpoint[];
}

export interface HalImportSetp {
  line: number;
  rawPath: string;
  instanceName: string;
  fieldName: string;
  value: string;
}

export interface HalImportAddf {
  line: number;
  functionName: string;
  instanceName?: string;
  functionSuffix?: string;
  isDefaultFunction?: boolean;
  thread?: string;
  position?: number;
}

export interface HalImportDraft {
  parser: "nohal-hal-v1";
  sourcePath?: string;
  sourceFileName?: string;
  lineCount: number;
  componentGroups: HalImportComponentGroup[];
  nets: HalImportNet[];
  setps: HalImportSetp[];
  addfs: HalImportAddf[];
  motmod?: Partial<ProjectMotmodConfig>;
  warnings: string[];
}

export type HalImportLinkSelection =
  | { groupId: string; mode: "project-local" }
  | { groupId: string; mode: "store"; componentId: string };

export interface HalImportLinkSuggestion {
  groupId: string;
  selection: HalImportLinkSelection;
  reason: string;
}

export type HalImportPlacementHeuristic = "alphabetical" | "related-groups";

export interface HalImportBuildOptions {
  draft: HalImportDraft;
  componentStore: ComponentStore;
  linkSelections: Record<string, HalImportLinkSelection>;
  projectName?: string;
  placementHeuristic?: HalImportPlacementHeuristic;
}

export interface HalImportBuildResult {
  project: NoHALProject;
  warnings: string[];
}
