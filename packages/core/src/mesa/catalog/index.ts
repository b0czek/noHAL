import { indexBy } from "remeda";
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

const MESA_HOSTS_BY_KIND = indexBy(MESA_HOSTS, (entry) => entry.kind);

const MESA_DB25_CARDS_BY_KIND = indexBy(MESA_DB25_CARDS, (entry) => entry.kind);

const MESA_SMART_SERIAL_CARDS_BY_KIND = indexBy(
  MESA_SMART_SERIAL_CARDS,
  (entry) => entry.kind,
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
