import type { ProjectMesaHostKind } from "../types";
import type { MesaHostCatalogEntry } from "./types";

export const MESA_HOST_KINDS: readonly ProjectMesaHostKind[] = [
  "7i92t",
] as const;

export const MESA_HOSTS: readonly MesaHostCatalogEntry[] = [
  {
    kind: "7i92t",
    displayName: "7i92T",
    transport: "ethernet",
    driverName: "hm2_7i92t",
    connectorSlots: [
      {
        key: "p1",
        label: "P1",
        kind: "db25",
        order: 0,
        smartSerialAddress: { portIndex: 0, channel: 0 },
      },
      {
        key: "p2",
        label: "P2",
        kind: "db25",
        order: 1,
        smartSerialAddress: { portIndex: 1, channel: 0 },
      },
    ],
    smartSerialPorts: [],
    directProfile: {
      explicitPins: [
        {
          key: "status_connected",
          name: "status.connected",
          direction: "out",
          type: "bit",
        },
        {
          key: "status_packet_error",
          name: "status.packet-error",
          direction: "out",
          type: "bit",
        },
      ],
    },
  },
] as const;
