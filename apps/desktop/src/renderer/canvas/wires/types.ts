import type {
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
} from "@nohal/core/types";

export type WireAttrs = {
  stroke: string | CanvasGradient;
  strokeWidth: number;
  dash?: number[];
  listening?: boolean;
  hitStrokeWidth?: number | "auto";
};

export type CullBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EndpointSide = "left" | "right" | "top" | "bottom";

export type SheetLookup = {
  nodesById: Map<string, SheetDefinition["nodes"][number]>;
  portsById: Map<string, SheetDefinition["ports"][number]>;
  labelsById: Map<string, SheetDefinition["labels"][number]>;
  nodePinSidesById: Map<string, Map<string, EndpointSide>>;
};

export type WireStateProject = NoHALProject;
export type WireStateSheet = SheetDefinition;
export type WireEndpoint = SheetEndpointRef;
