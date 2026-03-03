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
  doc?: string;
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
      strategy?: "names_or_count" | "names_or_num_chan";
    };
    options?: Record<string, string | number | boolean>;
  };
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
