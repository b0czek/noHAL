import { describe, expect, it } from "vitest";
import { pinsForMesaSchemaProfile } from "../schema";
import { MESA_DB25_CARDS } from "./db25";

function cardEntryFor(kind: (typeof MESA_DB25_CARDS)[number]["kind"]) {
  const entry = MESA_DB25_CARDS.find((card) => card.kind === kind);
  if (!entry) {
    throw new Error(`Missing DB25 card catalog entry for ${kind}`);
  }
  return entry;
}

describe("Mesa DB25 catalog", () => {
  it("keeps 7i77 encoders on the host-facing profile and splits peripheral cardlets by smart-serial entity", () => {
    const entry = cardEntryFor("7i77");
    const hostPinNames = pinsForMesaSchemaProfile(
      entry.hostmot.directProfile,
    ).map((pin) => pin.name);
    const ioPinNames = pinsForMesaSchemaProfile(
      entry.sserial.peripheralFragments[0]?.schemaProfile ?? {},
    ).map((pin) => pin.name);
    const analogPinNames = pinsForMesaSchemaProfile(
      entry.sserial.peripheralFragments[1]?.schemaProfile ?? {},
    ).map((pin) => pin.name);

    expect(hostPinNames).toContain("encoder.05.position");
    expect(ioPinNames).toContain("input-00");
    expect(ioPinNames).toContain("input-00-not");
    expect(ioPinNames).toContain("output-15");
    expect(ioPinNames).not.toContain("spinena");
    expect(analogPinNames).toContain("analogena");
    expect(analogPinNames).toContain("spinena");
    expect(analogPinNames).toContain("analogout.05");
    expect(analogPinNames).not.toContain("encoder.00.position");
    expect(entry.sserial.smartSerialPorts).toEqual([
      {
        key: "rs422",
        label: "RS422 Smart-Serial",
        order: 0,
        baseChannelOffset: 2,
        channels: 1,
      },
    ]);
  });
});
