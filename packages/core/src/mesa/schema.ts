import type { ComponentPinDefinition } from "../types";
import type { MesaSchemaProfile } from "./catalog/types";

export interface MesaEncoderPinOptions {
  keyPrefix?: string;
  namePrefix?: string;
}

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

export function createMesaEncoderPins(
  options: MesaEncoderPinOptions = {},
): ComponentPinDefinition[] {
  const keyPrefix = options.keyPrefix ? `${options.keyPrefix}_` : "";
  const namePrefix = options.namePrefix ? `${options.namePrefix}.` : "";
  return [
    {
      key: `${keyPrefix}position`,
      name: `${namePrefix}position`,
      direction: "out",
      type: "float",
    },
    {
      key: `${keyPrefix}velocity`,
      name: `${namePrefix}velocity`,
      direction: "out",
      type: "float",
    },
    {
      key: `${keyPrefix}index_enable`,
      name: `${namePrefix}index-enable`,
      direction: "io",
      type: "bit",
    },
  ];
}

function createIndexedEncoderPins(
  count: number | undefined,
): ComponentPinDefinition[] {
  if (!count || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const suffix = `${index}`.padStart(2, "0");
    return createMesaEncoderPins({
      keyPrefix: `encoder_${suffix}`,
      namePrefix: `encoder.${suffix}`,
    });
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

interface MesaBitInputPinNames {
  key: string;
  name: string;
  negatedKey?: string;
  negatedName?: string;
}

export function createMesaBitInputPins(
  names: MesaBitInputPinNames,
): ComponentPinDefinition[] {
  const pins: ComponentPinDefinition[] = [
    {
      key: names.key,
      name: names.name,
      direction: "out",
      type: "bit",
    },
  ];
  if (names.negatedKey && names.negatedName) {
    pins.push({
      key: names.negatedKey,
      name: names.negatedName,
      direction: "out",
      type: "bit",
    });
  }
  return pins;
}

function createDigitalInputPins(
  count: number | undefined,
): ComponentPinDefinition[] {
  if (!count || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const suffix = `${index}`.padStart(2, "0");
    return createMesaBitInputPins({
      key: `input_${suffix}`,
      name: `input-${suffix}`,
      negatedKey: `input_${suffix}_not`,
      negatedName: `input-${suffix}-not`,
    });
  }).flat();
}

function createDigitalOutputPins(
  count: number | undefined,
): ComponentPinDefinition[] {
  if (!count || count <= 0) return [];
  return createIndexedPins(
    count,
    (index) => `output-${`${index}`.padStart(2, "0")}`,
    "in",
    "bit",
    "output",
  );
}

export function pinsForMesaSchemaProfile(
  profile: MesaSchemaProfile,
): ComponentPinDefinition[] {
  const spec = profile;
  return [
    ...(spec.explicitPins ?? []),
    ...createIndexedEncoderPins(spec.encoders),
    ...createDigitalInputPins(spec.digitalInputs),
    ...createDigitalOutputPins(spec.digitalOutputs),
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
