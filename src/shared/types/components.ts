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

export interface ComponentDefinition {
  id: string;
  name: string;
  halComponentName: string;
  source: "manual" | "comp";
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
  runtime?: {
    kind: "rt" | "userspace" | "unknown";
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
  pins: ComponentPinDefinition[];
  params?: ComponentParamDefinition[];
}
