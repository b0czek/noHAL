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
          schemaProfilesByMode: {
            1: {
              digitalInputs: 32,
              digitalOutputs: 16,
              analogInputs: 4,
            },
            2: {
              digitalInputs: 32,
              digitalOutputs: 16,
              analogInputs: 4,
              fieldVoltage: true,
            },
            3: {
              digitalInputs: 32,
              digitalOutputs: 16,
              analogInputs: 4,
              fieldVoltage: true,
              mpgCounters: 2,
            },
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
      processDataModes: [
        {
          mode: 0,
          label: "Mode 0: I/O only",
        },
        {
          mode: 1,
          label: "Mode 1: I/O + analog inputs",
        },
        {
          mode: 2,
          label: "Mode 2: I/O + analog inputs + field voltage",
        },
        {
          mode: 3,
          label: "Mode 3: I/O + analog inputs + field voltage + MPG encoders",
        },
      ],
      processDataModeChannelOffsets: [0],
      defaultMode: 0,
    },
  },
] as const;
