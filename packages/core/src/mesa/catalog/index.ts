import { MESA_DB25_CARD_KINDS, MESA_DB25_CARDS } from "./db25";
import { MESA_HOST_KINDS, MESA_HOSTS } from "./hosts";
import {
  MESA_SMART_SERIAL_CARD_KINDS,
  MESA_SMART_SERIAL_CARDS,
} from "./sserial";

export {
  MESA_DB25_CARDS,
  MESA_DB25_CARD_KINDS,
  MESA_HOSTS,
  MESA_HOST_KINDS,
  MESA_SMART_SERIAL_CARDS,
  MESA_SMART_SERIAL_CARD_KINDS,
};

export * from "./compat";
export type * from "./types";

const MESA_HOSTS_BY_KIND = Object.fromEntries(
  MESA_HOSTS.map((entry) => [entry.kind, entry]),
);

const MESA_DB25_CARDS_BY_KIND = Object.fromEntries(
  MESA_DB25_CARDS.map((entry) => [entry.kind, entry]),
);

const MESA_SMART_SERIAL_CARDS_BY_KIND = Object.fromEntries(
  MESA_SMART_SERIAL_CARDS.map((entry) => [entry.kind, entry]),
);

export function getMesaHostCatalogEntry(kind: string) {
  return MESA_HOSTS_BY_KIND[kind as keyof typeof MESA_HOSTS_BY_KIND];
}

export function getMesaDb25CardCatalogEntry(kind: string) {
  return MESA_DB25_CARDS_BY_KIND[kind as keyof typeof MESA_DB25_CARDS_BY_KIND];
}

export function getMesaSmartSerialCatalogEntry(kind: string) {
  return MESA_SMART_SERIAL_CARDS_BY_KIND[
    kind as keyof typeof MESA_SMART_SERIAL_CARDS_BY_KIND
  ];
}
