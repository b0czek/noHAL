import type { ComponentPinDefinition } from "../types";
import type { MesaSchemaProfile } from "./catalog/types";

function createIndexedPins(
  count: number | undefined,
  nameFactory: (index: number) => string,
  direction: ComponentPinDefinition["direction"],
  type: ComponentPinDefinition["type"],
  keyPrefix: string,
): ComponentPinDefinition[] {
  if (!count || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => ({
    key: `${keyPrefix}_${`${index}`.padStart(2, "0")}`,
    name: nameFactory(index),
    direction,
    type,
  }));
}

function createEncoderPins(
  count: number | undefined,
): ComponentPinDefinition[] {
  if (!count || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const suffix = `${index}`.padStart(2, "0");
    const pins: ComponentPinDefinition[] = [
      {
        key: `encoder_${suffix}_position`,
        name: `encoder.${suffix}.position`,
        direction: "out",
        type: "float",
      },
      {
        key: `encoder_${suffix}_velocity`,
        name: `encoder.${suffix}.velocity`,
        direction: "out",
        type: "float",
      },
      {
        key: `encoder_${suffix}_index_enable`,
        name: `encoder.${suffix}.index-enable`,
        direction: "io",
        type: "bit",
      },
    ];
    return pins;
  }).flat();
}

function createFlagPin(
  enabled: boolean | undefined,
  key: string,
  name: string,
  direction: ComponentPinDefinition["direction"],
  type: ComponentPinDefinition["type"],
): ComponentPinDefinition[] {
  if (!enabled) return [];
  return [{ key, name, direction, type }];
}

export function pinsForMesaSchemaProfile(
  profile: MesaSchemaProfile,
): ComponentPinDefinition[] {
  const spec = profile;
  return [
    ...(spec.explicitPins ?? []),
    ...createEncoderPins(spec.encoders),
    ...createIndexedPins(
      spec.digitalInputs,
      (index) => `input.${`${index}`.padStart(2, "0")}`,
      "out",
      "bit",
      "input",
    ),
    ...createIndexedPins(
      spec.digitalOutputs,
      (index) => `output.${`${index}`.padStart(2, "0")}`,
      "in",
      "bit",
      "output",
    ),
    ...createIndexedPins(
      spec.analogInputs,
      (index) => `analogin.${`${index}`.padStart(2, "0")}`,
      "out",
      "float",
      "analogin",
    ),
    ...createIndexedPins(
      spec.analogOutputs,
      (index) => `analogout.${`${index}`.padStart(2, "0")}`,
      "in",
      "float",
      "analogout",
    ),
    ...createFlagPin(
      spec.spindleEnable,
      "spindle_enable",
      "spinena",
      "in",
      "bit",
    ),
    ...createFlagPin(
      spec.analogEnable,
      "analog_enable",
      "analogena",
      "in",
      "bit",
    ),
  ];
}

export function mergeMesaSchemaProfiles(
  ...profiles: (MesaSchemaProfile | undefined)[]
): MesaSchemaProfile {
  const merged: MesaSchemaProfile = {};
  const explicitPins = new Map<string, ComponentPinDefinition>();
  const numericKeys = [
    "encoders",
    "digitalInputs",
    "digitalOutputs",
    "analogInputs",
    "analogOutputs",
  ] as const satisfies readonly (keyof MesaSchemaProfile)[];
  const booleanKeys = [
    "spindleEnable",
    "analogEnable",
  ] as const satisfies readonly (keyof MesaSchemaProfile)[];
  for (const profile of profiles) {
    if (!profile) continue;
    for (const pin of profile.explicitPins ?? []) {
      explicitPins.set(pin.key, pin);
    }
    for (const key of numericKeys) {
      const value = profile[key] as number | undefined;
      if (!value || value <= 0) continue;
      const existing = (merged[key] as number | undefined) ?? 0;
      merged[key] = existing + value;
    }
    for (const key of booleanKeys) {
      if (profile[key]) merged[key] = true;
    }
  }
  if (explicitPins.size > 0) {
    merged.explicitPins = [...explicitPins.values()];
  }
  return merged;
}

export function schemaProfileSummary(profile: MesaSchemaProfile): string {
  const spec = profile;
  const parts = [
    spec.encoders ? `${spec.encoders} encoder` : null,
    spec.digitalInputs ? `${spec.digitalInputs} DI` : null,
    spec.digitalOutputs ? `${spec.digitalOutputs} DO` : null,
    spec.analogInputs ? `${spec.analogInputs} AI` : null,
    spec.analogOutputs ? `${spec.analogOutputs} AO` : null,
    spec.spindleEnable ? "spindle ena" : null,
    spec.analogEnable ? "analog ena" : null,
  ].filter(Boolean);
  return parts.join(", ");
}
