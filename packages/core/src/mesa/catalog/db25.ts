import type { ProjectMesaDb25CardKind } from "../types";
import type { MesaDb25CatalogEntry } from "./types";

export const MESA_DB25_CARD_KINDS: readonly ProjectMesaDb25CardKind[] = [
  "7i77",
] as const;

export const MESA_DB25_CARDS: readonly MesaDb25CatalogEntry[] = [
  {
    kind: "7i77",
    displayName: "7i77",
    compatibleConnectorKinds: ["db25"],
    hostmot: {
      directProfile: {
        encoders: 6,
      },
    },
    sserial: {
      smartSerialPorts: [
        {
          key: "io",
          label: "Digital I/O",
          order: 0,
          baseChannelOffset: 0,
          channels: 1,
          fixedCardKind: "7i77-io",
        },
        {
          key: "analog",
          label: "Analog + Spindle",
          order: 1,
          baseChannelOffset: 1,
          channels: 1,
          fixedCardKind: "7i77-analog",
        },
        {
          key: "rs422",
          label: "RS422 Smart-Serial",
          order: 2,
          baseChannelOffset: 2,
          channels: 1,
        },
      ],
    },
  },
] as const;
