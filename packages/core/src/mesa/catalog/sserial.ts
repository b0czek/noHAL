import type { ProjectMesaSmartSerialCardKind } from "../types";
import type { MesaSmartSerialCatalogEntry } from "./types";

export const MESA_SMART_SERIAL_CARD_KINDS: readonly ProjectMesaSmartSerialCardKind[] =
  ["7i66-8", "7i66-24", "7i71", "7i72"] as const;

export const MESA_SMART_SERIAL_CARDS: readonly MesaSmartSerialCatalogEntry[] = [
  {
    kind: "7i66-8",
    displayName: "7i66",
    peripheralProfile: {
      digitalInputs: 16,
      digitalOutputs: 8,
    },
    defaultMode: 0,
  },
  {
    kind: "7i66-24",
    displayName: "7i66",
    peripheralProfile: {
      digitalOutputs: 24,
    },
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
