export type ProjectMesaHostKind = "7i92t";

export type ProjectMesaDb25CardKind = "7i77";

export type ProjectMesaSmartSerialCardKind = "7i71" | "7i72";

export interface ProjectMesaSmartSerialAssignment {
  connectorKey?: string;
  portKey: string;
  channel: number;
  cardKind?: ProjectMesaSmartSerialCardKind;
}

export type ProjectMesaSmartSerialTarget = Pick<
  ProjectMesaSmartSerialAssignment,
  "connectorKey" | "portKey" | "channel"
>;

export interface ProjectMesaDb25CardAssignment {
  connectorKey: string;
  cardKind?: ProjectMesaDb25CardKind;
}

export interface ProjectMesaHostConfig {
  id: string;
  kind: ProjectMesaHostKind;
  ip: string;
  connectors?: ProjectMesaDb25CardAssignment[];
  smartSerial?: ProjectMesaSmartSerialAssignment[];
}

export interface ProjectMesaConfig {
  hosts: ProjectMesaHostConfig[];
}
