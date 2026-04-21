import type {
  HalValueType,
  LabelScope,
  PinDirection,
  PortSide,
  XY,
} from "./base";
import type { ComponentExportNamespace } from "./components";

export interface SheetPort {
  id: string;
  name: string;
  type: HalValueType;
  direction: PinDirection;
  side: PortSide;
  position: XY;
  rotation?: number;
}

export type SheetRole = "system";

export interface ComponentNode {
  id: string;
  kind: "component";
  componentId: string;
  instanceName: string;
  position: XY;
  paramValues: Record<string, string>;
  instanceConfigValues?: Record<string, string>;
  pinInitialValues?: Record<string, string>;
  hiddenPinKeys?: string[];
  pinOrder?: string[];
  exportStage?: "main" | "postgui";
  exportNamespace?: ComponentExportNamespace;
}

export interface SheetNode {
  id: string;
  kind: "sheet";
  sheetId: string;
  instanceName: string;
  position: XY;
  hal?: {
    threadMap?: Record<string, string>;
  };
}

export type SheetNodeInstance = ComponentNode | SheetNode;

export interface SheetLabel {
  id: string;
  name: string;
  scope: LabelScope;
  position: XY;
  rotation?: number;
}

export interface SheetComment {
  id: string;
  text: string;
  position: XY;
  rotation?: number;
}

export interface NodePinEndpointRef {
  kind: "node-pin";
  nodeId: string;
  pinKey: string;
}

export interface SheetPortEndpointRef {
  kind: "sheet-port";
  portId: string;
}

export type SheetEndpointRef = NodePinEndpointRef | SheetPortEndpointRef;

export interface DirectConnection {
  id: string;
  a: SheetEndpointRef;
  b: SheetEndpointRef;
  signalName?: string;
  waypoints?: XY[];
}

export interface LabelAnchor {
  id: string;
  labelId: string;
  endpoint: SheetEndpointRef;
}

export interface SheetThreadOutputDefinition {
  id: string;
  name: string;
  halThreadId?: string;
}

export interface SheetAddfQueueNodeEntry {
  kind: "node";
  nodeId: string;
  sheetThreadOutputId?: string;
}

export interface SheetAddfQueueFunctionEntry {
  kind: "component-function";
  nodeId: string;
  functionKey: string;
  sheetThreadOutputId?: string;
}

export interface SheetAddfQueueSubsheetOutputEntry {
  kind: "subsheet-output";
  nodeId: string;
  childThreadOutputId: string;
  sheetThreadOutputId?: string;
}

export type SheetAddfQueueEntry =
  | SheetAddfQueueNodeEntry
  | SheetAddfQueueFunctionEntry
  | SheetAddfQueueSubsheetOutputEntry;
export type SheetAddfQueueStoredEntry = string | SheetAddfQueueEntry;

export interface SheetDefinition {
  id: string;
  name: string;
  role?: SheetRole;
  nodes: SheetNodeInstance[];
  ports: SheetPort[];
  labels: SheetLabel[];
  comments: SheetComment[];
  directConnections: DirectConnection[];
  labelAnchors: LabelAnchor[];
  hal?: {
    threadOutputs?: SheetThreadOutputDefinition[];
    addfQueue?: SheetAddfQueueStoredEntry[];
  };
}
