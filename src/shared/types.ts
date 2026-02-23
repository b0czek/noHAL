export type HalValueType = "bit" | "float" | "s32" | "u32" | "s64" | "u64" | "port";
export type PinDirection = "in" | "out" | "io";
export type ParamDirection = "r" | "rw";
export type PortSide = "left" | "right" | "bottom";
export type LabelScope = "local" | "global" | "hierarchical";

export interface XY {
  x: number;
  y: number;
}

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

export interface ComponentStoreSourceRef {
  kind: "comp-file";
  sourceId: string;
  filePath: string;
}

export interface ComponentStoreDirComponentSourceRef {
  kind: "comp-dir";
  sourceId: string;
  filePath: string;
}

export interface ComponentStoreDirSource {
  id: string;
  kind: "comp-dir";
  dirPath: string;
  recursive: boolean;
  createdAt: string;
  updatedAt: string;
  lastScanAt?: string;
  lastError?: string;
}

export interface ComponentStoreFileSource {
  id: string;
  kind: "comp-file";
  filePath: string;
  createdAt: string;
  updatedAt: string;
  lastScanAt?: string;
  lastError?: string;
}

export interface ComponentStoreEntry {
  componentId: string;
  sourceRef: ComponentStoreSourceRef | ComponentStoreDirComponentSourceRef;
  parsed: ImportedComponentDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentStore {
  format: "nohal-component-store";
  version: 2;
  sources: Record<string, ComponentStoreDirSource | ComponentStoreFileSource>;
  components: Record<string, ComponentStoreEntry>;
}

export interface RecentProjectEntry {
  filePath: string;
  name?: string;
  lastOpenedAt: string;
}

export interface ManualComponentDefinitionInput {
  name: string;
  halComponentName?: string;
  pins: ComponentPinDefinition[];
  params?: ComponentParamDefinition[];
}

export interface SheetPort {
  id: string;
  name: string;
  type: HalValueType;
  direction: PinDirection;
  side: PortSide;
  position: XY;
}

export interface ComponentNode {
  id: string;
  kind: "component";
  componentId: string;
  instanceName: string;
  position: XY;
  paramValues: Record<string, string>;
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
  directConnections: DirectConnection[];
  labelAnchors: LabelAnchor[];
  hal?: {
    addfQueue?: string[];
  };
}

export interface ProjectLibrary {
  components: Record<string, ComponentDefinition>;
}

export interface HalExportComponentAddfRule {
  enabled?: boolean;
  thread?: string;
  functionTemplates?: string[];
}

export interface HalExportComponentRule {
  loadCombine?: "names" | "separate";
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

export interface NoHALProject {
  format: "nohal-project";
  version: 1;
  name: string;
  target: {
    linuxcncVersion: "2.10";
    platform: "linux";
  };
  rootSheetId: string;
  sheets: Record<string, SheetDefinition>;
  library: ProjectLibrary;
  halExport?: HalExportConfig;
  ui: {
    activeSheetId: string;
  };
}

export interface ResolvedPin {
  key: string;
  name: string;
  direction: PinDirection;
  type: HalValueType;
  side: PortSide;
  doc?: string;
}

export interface ResolvedEndpoint {
  endpoint: SheetEndpointRef;
  name: string;
  direction: PinDirection;
  type: HalValueType;
  side: PortSide;
}
