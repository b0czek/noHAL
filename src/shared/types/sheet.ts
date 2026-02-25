import type {
  HalValueType,
  LabelScope,
  PinDirection,
  PortSide,
  XY,
} from "./base";

export interface SheetPort {
  id: string;
  name: string;
  type: HalValueType;
  direction: PinDirection;
  side: PortSide;
  position: XY;
  rotation?: number;
}

export interface ComponentNode {
  id: string;
  kind: "component";
  componentId: string;
  instanceName: string;
  position: XY;
  paramValues: Record<string, string>;
  pinInitialValues?: Record<string, string>;
}

export interface SheetNode {
  id: string;
  kind: "sheet";
  sheetId: string;
  instanceName: string;
  position: XY;
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
  waypoints?: XY[];
}

export interface LabelAnchor {
  id: string;
  labelId: string;
  endpoint: SheetEndpointRef;
}

export interface SheetDefinition {
  id: string;
  name: string;
  parentSheetId: string | null;
  nodes: SheetNodeInstance[];
  ports: SheetPort[];
  labels: SheetLabel[];
  comments: SheetComment[];
  directConnections: DirectConnection[];
  labelAnchors: LabelAnchor[];
  hal?: {
    addfQueue?: string[];
  };
}
