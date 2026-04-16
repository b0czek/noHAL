import type { ProjectMesaSmartSerialCardKind } from "../types";
import type { MesaSmartSerialCatalogEntry } from "./types";

export const MESA_SMART_SERIAL_CARD_KINDS: readonly ProjectMesaSmartSerialCardKind[] =
  [
    "7i66-8",
    "7i66-24",
    "7i77-analog",
    "7i77-io",
    "7i84",
    "7i71",
    "7i72",
  ] as const;

export const MESA_SMART_SERIAL_CARDS: readonly MesaSmartSerialCatalogEntry[] = [
  {
    kind: "7i66-8",
    displayName: "7i66-8",
    halInstanceName: "7i66",
    peripheralProfile: {
      digitalInputs: 16,
      digitalOutputs: 8,
    },
    defaultMode: 0,
  },
  {
    kind: "7i66-24",
    displayName: "7i66-24",
    halInstanceName: "7i66",
    peripheralProfile: {
      digitalOutputs: 24,
    },
    defaultMode: 0,
  },
  {
    kind: "7i77-analog",
    displayName: "7i77 Analog + Spindle",
    halInstanceName: "7i77",
    assignable: false,
    peripheralProfile: {
      spindleEnable: true,
      analogEnable: true,
      analogOutputs: 6,
    },
    defaultMode: 0,
  },
  {
    kind: "7i77-io",
    displayName: "7i77 Digital I/O",
    halInstanceName: "7i77",
    assignable: false,
    peripheralProfile: {
      digitalInputs: 32,
      digitalOutputs: 16,
    },
    peripheralProfilesByMode: {
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
    defaultMode: 0,
  },
  {
    kind: "7i84",
    displayName: "7i84",
    peripheralProfile: {
      digitalInputs: 32,
      digitalOutputs: 16,
    },
    peripheralProfilesByMode: {
      1: {
        digitalInputs: 32,
        digitalOutputs: 16,
        analogInputs: 4,
        fieldVoltage: true,
      },
      2: {
        digitalInputs: 32,
        digitalOutputs: 16,
        analogInputs: 4,
        mpgCounters: 2,
      },
    },
    processDataModes: [
      {
        mode: 0,
        label: "Mode 0: I/O only",
      },
      {
        mode: 1,
        label: "Mode 1: I/O + analog inputs + field voltage",
      },
      {
        mode: 2,
        label: "Mode 2: I/O + analog inputs + MPG encoders",
      },
    ],
    defaultMode: 0,
  },
  {
    kind: "7i71",
    displayName: "7i71",
    peripheralProfile: {
      digitalOutputs: 48,
    },
    defaultMode: 0,
  },
  {
    kind: "7i72",
    displayName: "7i72",
    peripheralProfile: {
      digitalOutputs: 48,
    },
    defaultMode: 0,
  },
] as const;
