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
      peripheralFragments: [
        {
          key: "io",
          displayName: "Digital I/O",
          channelOffset: 0,
          schemaProfile: {
            digitalInputs: 32,
            digitalOutputs: 16,
          },
        },
        {
          key: "analog",
          displayName: "Analog + Spindle",
          channelOffset: 1,
          schemaProfile: {
            spindleEnable: true,
            analogEnable: true,
            analogOutputs: 6,
          },
        },
      ],
      smartSerialPorts: [
        {
          key: "rs422",
          label: "RS422 Smart-Serial",
          order: 0,
          baseChannelOffset: 2,
          channels: 1,
        },
      ],
      defaultMode: 0,
    },
  },
] as const;
