import type { ComponentDefinition } from "../types";

export type LoadrtStrategyId = "names_or_count" | "names_or_num_chan";

export interface LoadrtContext {
  componentName: string;
  instancePaths: string[];
  extraArgs: string[];
  runtime?: ComponentDefinition["runtime"];
}

export interface LoadrtResult {
  lines: string[];
  warnings?: string[];
}

export type LoadrtStrategy = (context: LoadrtContext) => LoadrtResult;
