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
        rawGpio: { firstIndex: 0, count: 17 },
      },
      {
        key: "p2",
        label: "P2",
        kind: "db25",
        order: 1,
        smartSerialAddress: { portIndex: 1, channel: 0 },
        rawGpio: { firstIndex: 17, count: 17 },
      },
    ],
    smartSerialPorts: [],
    directProfile: {
      dpll: true,
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
        {
          key: "watchdog_has_bit",
          name: "watchdog.has_bit",
          direction: "io",
          type: "bit",
        },
      ],
      explicitParams: [
        {
          key: "watchdog_timeout_ns",
          name: "watchdog.timeout_ns",
          direction: "rw",
          type: "u32",
          defaultValue: "5000000",
        },
      ],
    },
  },
] as const;
