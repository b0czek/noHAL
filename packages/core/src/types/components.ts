import type { HalValueType, ParamDirection, PinDirection } from "./base";

export interface ComponentPinDefinition {
  key: string;
  name: string;
  direction: PinDirection;
  type: HalValueType;
  doc?: string;
  arrayLen?: number;
  arrayExpr?: string;
  defaultValue?: string;
}

export interface ComponentParamDefinition {
  key: string;
  name: string;
  direction: ParamDirection;
  type: HalValueType;
  doc?: string;
  arrayLen?: number;
  arrayExpr?: string;
  defaultValue?: string;
}

export type ComponentFunctionFloatMode = "fp" | "nofp" | "unknown";

export interface ComponentFunctionDefinition {
  key: string;
  declaredName: string;
  halSuffix: string;
  floatMode: ComponentFunctionFloatMode;
  addfTargetTemplate?: string;
  doc?: string;
}

export interface ComponentVisibilityPolicy {
  placeable?: boolean;
  searchable?: boolean;
  showInCustomComponents?: boolean;
}

export interface ComponentSystemMetadata {
  manager: string;
  family?: string;
  subfamily?: string;
}

export interface ComponentConstraintPolicy {
  fixedInstanceName?: string;
  fixedExportStage?: "main" | "postgui";
}

export type ComponentLoadrtStrategyId =
  | "names_or_count"
  | "names_or_num_chan"
  | "cfg";

export interface ComponentInstanceNamingDefinition {
  strategy: "free" | "canonical_indexed";
  lockToCanonical?: boolean;
  maxInstances?: number;
}

export interface ComponentInstanceConfigFieldDefinition {
  key: string;
  type: "string" | "integer" | "number" | "boolean";
  doc?: string;
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
}

export interface ComponentInstanceIndexedPinTemplate {
  keyTemplate: string;
  nameTemplate: string;
  direction: PinDirection;
  type: HalValueType;
  doc?: string;
}

export interface ComponentInstancePinExpansionRule {
  kind: "indexed_by_count";
  countConfigKey: string;
  indexStart?: number;
  templates: ComponentInstanceIndexedPinTemplate[];
}

export interface ComponentInstanceConfigDefinition {
  fields: ComponentInstanceConfigFieldDefinition[];
  pinExpansionRules?: ComponentInstancePinExpansionRule[];
}

export interface ComponentDefinition {
  id: string;
  name: string;
  halComponentName: string;
  source: "manual" | "comp";
  loadCommand?: string;
  sourcePath?: string;
  docs?: {
    component?: string;
    description?: string;
    author?: string;
    license?: string;
    notes?: string;
    examples?: string;
    seeAlso?: string;
  };
  pins: ComponentPinDefinition[];
  params: ComponentParamDefinition[];
  functions?: ComponentFunctionDefinition[];
  runtime?: {
    kind: "rt" | "userspace" | "unknown";
    loadrt?: {
      strategy?: ComponentLoadrtStrategyId;
    };
    instanceNaming?: ComponentInstanceNamingDefinition;
    instanceConfig?: ComponentInstanceConfigDefinition;
    options?: Record<string, string | number | boolean>;
  };
  visibility?: ComponentVisibilityPolicy;
  system?: ComponentSystemMetadata;
  constraints?: ComponentConstraintPolicy;
}

export interface ImportedComponentDefinition extends ComponentDefinition {
  parseMeta: {
    parser: "nohal-comp-v1";
    warnings: string[];
    rawHeader?: string;
  };
}

export interface ManualComponentDefinitionInput {
  name: string;
  halComponentName?: string;
  loadCommand?: string;
  pins: ComponentPinDefinition[];
  params?: ComponentParamDefinition[];
  functions?: ComponentFunctionDefinition[];
}
