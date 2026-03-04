import type {
  ComponentDefinition,
  HalThreadDefinition,
  ProjectMotmodConfig,
} from "../types";

export type LoadrtStrategyId =
  | "names_or_count"
  | "names_or_num_chan"
  | "motmod";

export interface LoadrtContext {
  componentName: string;
  instancePaths: string[];
  extraArgs: string[];
  runtime?: ComponentDefinition["runtime"];
  project?: {
    halThreads?: HalThreadDefinition[];
    motmod?: ProjectMotmodConfig;
  };
}

export interface LoadrtResult {
  lines: string[];
  warnings?: string[];
}

export interface LoadrtImportContext {
  componentName: string;
  args: Record<string, string>;
}

export interface LoadrtImportResult {
  instancePaths: string[];
  warnings?: string[];
  events?: LoadrtImportEvent[];
}

export interface LoadrtImportEvent {
  topic: string;
  payload: unknown;
}

export interface LoadrtStrategy {
  export: (context: LoadrtContext) => LoadrtResult;
  import: (context: LoadrtImportContext) => LoadrtImportResult;
}
