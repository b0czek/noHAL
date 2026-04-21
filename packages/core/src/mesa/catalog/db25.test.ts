import { describe, expect, it } from "vitest";
import {
  paramsForMesaSchemaProfile,
  pinsForMesaSchemaProfile,
} from "../schema";
import { MESA_DB25_CARDS } from "./db25";
import { getMesaSmartSerialCatalogEntry } from "./index";

function cardEntryFor(kind: (typeof MESA_DB25_CARDS)[number]["kind"]) {
  const entry = MESA_DB25_CARDS.find((card) => card.kind === kind);
  if (!entry) {
    throw new Error(`Missing DB25 card catalog entry for ${kind}`);
  }
  return entry;
}

describe("Mesa DB25 catalog", () => {
  it("keeps 7i77 encoders on the host-facing profile and exposes its internal smart-serial cards explicitly", () => {
    const entry = cardEntryFor("7i77");
    const ioCard = getMesaSmartSerialCatalogEntry("7i77-io");
    const analogCard = getMesaSmartSerialCatalogEntry("7i77-analog");
    const hostPinNames = pinsForMesaSchemaProfile(
      entry.hostmot.directProfile,
    ).map((pin) => pin.name);
    const ioPinNames = pinsForMesaSchemaProfile(
      ioCard?.peripheralProfile ?? {},
    ).map((pin) => pin.name);
    const analogPinNames = pinsForMesaSchemaProfile(
      analogCard?.peripheralProfile ?? {},
    ).map((pin) => pin.name);
    const analogParamNames = paramsForMesaSchemaProfile(
      analogCard?.peripheralProfile ?? {},
    ).map((param) => param.name);

    expect(hostPinNames).toContain("encoder.05.position");
    expect(ioPinNames).toContain("input-00");
    expect(ioPinNames).toContain("input-00-not");
    expect(ioPinNames).toContain("output-15");
    expect(ioPinNames).not.toContain("spinena");
    expect(analogPinNames).toContain("analogena");
    expect(analogPinNames).toContain("spinena");
    expect(analogPinNames).toContain("analogout5");
    expect(analogParamNames).toContain("analogout0-maxlim");
    expect(analogParamNames).toContain("analogout0-minlim");
    expect(analogParamNames).toContain("analogout0-scalemax");
    expect(analogParamNames).toContain("analogout5-scalemax");
    expect(analogPinNames).not.toContain("encoder.00.position");
    expect(entry.sserial.smartSerialPorts).toEqual([
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
    ]);
  });
});
