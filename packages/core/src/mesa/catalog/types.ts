import type {
  ComponentParamDefinition,
  ComponentPinDefinition,
} from "../../types/components";
import type {
  ProjectMesaDb25CardKind,
  ProjectMesaHostKind,
  ProjectMesaSmartSerialCardKind,
} from "../types";

export type MesaConnectorKind = "db25";

export interface MesaSchemaProfile {
  explicitPins?: ComponentPinDefinition[];
  explicitParams?: ComponentParamDefinition[];
  dpll?: boolean;
  encoders?: number;
  digitalInputs?: number;
  digitalOutputs?: number;
  analogInputs?: number;
  analogOutputs?: number;
  spindleEnable?: boolean;
  analogEnable?: boolean;
}

export interface MesaSmartSerialAddress {
  portIndex: number;
  channel: number;
}

export interface MesaHostConnectorDefinition {
  key: string;
  label: string;
  kind: MesaConnectorKind;
  order: number;
  smartSerialAddress?: MesaSmartSerialAddress;
  rawGpio?: {
    firstIndex: number;
    count: number;
  };
}

export interface MesaSmartSerialPortDefinition {
  key: string;
  label: string;
  order: number;
  portIndex: number;
  channels: number;
}

export interface MesaDb25SmartSerialPortDefinition {
  key: string;
  label: string;
  order: number;
  baseChannelOffset: number;
  channels: number;
}

export interface MesaHostCatalogEntry {
  kind: ProjectMesaHostKind;
  displayName: string;
  transport: "ethernet";
  driverName: string;
  connectorSlots: MesaHostConnectorDefinition[];
  smartSerialPorts: MesaSmartSerialPortDefinition[];
  directProfile: MesaSchemaProfile;
}

export interface MesaDb25HostmotDefinition {
  directProfile: MesaSchemaProfile;
}

export interface MesaDb25SserialDefinition {
  peripheralFragments: {
    key: string;
    displayName: string;
    channelOffset: number;
    schemaProfile: MesaSchemaProfile;
  }[];
  smartSerialPorts: MesaDb25SmartSerialPortDefinition[];
  defaultMode: number;
}

export interface MesaDb25CatalogEntry {
  kind: ProjectMesaDb25CardKind;
  displayName: string;
  compatibleConnectorKinds: MesaConnectorKind[];
  hostmot: MesaDb25HostmotDefinition;
  sserial: MesaDb25SserialDefinition;
}

export interface MesaSmartSerialCatalogEntry {
  kind: ProjectMesaSmartSerialCardKind;
  displayName: string;
  halInstanceName?: string;
  peripheralProfile: MesaSchemaProfile;
  defaultMode: number;
}
