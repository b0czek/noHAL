import type {
  ComponentParamDefinition,
  ComponentPinDefinition,
} from "../types";
import type { MesaSchemaProfile } from "./catalog/types";

export interface MesaEncoderPinOptions {
  keyPrefix?: string;
  namePrefix?: string;
}

export function createMesaDpllPins(): ComponentPinDefinition[] {
  return [
    ...Array.from({ length: 4 }, (_, index) => {
      const suffix = `${index + 1}`.padStart(2, "0");
      return {
        key: `dpll_timer_us_${suffix}`,
        name: `dpll.${suffix}.timer-us`,
        direction: "in" as const,
        type: "float" as const,
        doc: "Trigger offset for the associated DPLL timer in microseconds.",
      };
    }),
    {
      key: "dpll_base_freq_khz",
      name: "dpll.base-freq-khz",
      direction: "in",
      type: "float",
      doc: "Base frequency of the phase-locked loop in kHz.",
    },
    {
      key: "dpll_phase_error_us",
      name: "dpll.phase-error-us",
      direction: "out",
      type: "float",
      doc: "Reported DPLL phase error in microseconds.",
    },
    {
      key: "dpll_time_const",
      name: "dpll.time-const",
      direction: "in",
      type: "u32",
      doc: "Filter time-constant for the DPLL loop.",
    },
    {
      key: "dpll_plimit",
      name: "dpll.plimit",
      direction: "in",
      type: "u32",
      doc: "Phase adjustment limit for the DPLL loop.",
    },
    {
      key: "dpll_ddsize",
      name: "dpll.ddsize",
      direction: "out",
      type: "u32",
      doc: "Driver-internal DPLL state value.",
    },
    {
      key: "dpll_prescale",
      name: "dpll.prescale",
      direction: "in",
      type: "u32",
      doc: "Prescale factor for the DPLL rate generator.",
    },
  ];
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

export function createMesaEncoderParams(): ComponentParamDefinition[] {
  return [
    {
      key: "scale",
      name: "scale",
      direction: "rw",
      type: "float",
      doc: 'Converts from "count" units to "position" units.',
    },
    {
      key: "index_invert",
      name: "index-invert",
      direction: "rw",
      type: "bit",
      doc: "If true, the rising edge of Index triggers the index event.",
    },
    {
      key: "index_mask",
      name: "index-mask",
      direction: "rw",
      type: "bit",
      doc: "If true, Index only has an effect when the Index-Mask gate is active.",
    },
    {
      key: "index_mask_invert",
      name: "index-mask-invert",
      direction: "rw",
      type: "bit",
      doc: "If true, Index-Mask must be false for Index to have an effect.",
    },
    {
      key: "counter_mode",
      name: "counter-mode",
      direction: "rw",
      type: "bit",
      doc: "False selects quadrature mode; true selects Step/Dir mode.",
    },
    {
      key: "filter",
      name: "filter",
      direction: "rw",
      type: "bit",
      doc: "Controls the quadrature input filter depth.",
    },
    {
      key: "vel_timeout",
      name: "vel-timeout",
      direction: "rw",
      type: "float",
      doc: "How long to wait for the next pulse before reporting zero velocity.",
    },
  ];
}

function createIndexedAnalogOutputParams(
  count: number | undefined,
): ComponentParamDefinition[] {
  if (!count || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => [
    {
      key: `analogout_${`${index}`.padStart(2, "0")}_maxlim`,
      name: `analogout${index}-maxlim`,
      direction: "rw" as const,
      type: "float" as const,
      doc: "The maximum speed request allowable.",
    },
    {
      key: `analogout_${`${index}`.padStart(2, "0")}_minlim`,
      name: `analogout${index}-minlim`,
      direction: "rw" as const,
      type: "float" as const,
      doc: "The minimum speed request.",
    },
    {
      key: `analogout_${`${index}`.padStart(2, "0")}_scalemax`,
      name: `analogout${index}-scalemax`,
      direction: "rw" as const,
      type: "float" as const,
      doc: "The speed request corresponding to full-scale analog output.",
    },
  ]).flat();
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

function createAnalogOutputPins(
  count: number | undefined,
): ComponentPinDefinition[] {
  if (!count || count <= 0) return [];
  return Array.from({ length: count }, (_, index) => ({
    key: `analogout_${`${index}`.padStart(2, "0")}`,
    name: `analogout${index}`,
    direction: "in" as const,
    type: "float" as const,
  }));
}

export function pinsForMesaSchemaProfile(
  profile: MesaSchemaProfile,
): ComponentPinDefinition[] {
  const spec = profile;
  return [
    ...(spec.explicitPins ?? []),
    ...(spec.dpll ? createMesaDpllPins() : []),
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
    ...createAnalogOutputPins(spec.analogOutputs),
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

export function paramsForMesaSchemaProfile(
  profile: MesaSchemaProfile,
): ComponentParamDefinition[] {
  return [
    ...(profile.explicitParams ?? []),
    ...createIndexedAnalogOutputParams(profile.analogOutputs),
  ];
}

export function mergeMesaSchemaProfiles(
  ...profiles: (MesaSchemaProfile | undefined)[]
): MesaSchemaProfile {
  const merged: MesaSchemaProfile = {};
  const explicitPins = new Map<string, ComponentPinDefinition>();
  const explicitParams = new Map<string, ComponentParamDefinition>();
  const numericKeys = [
    "encoders",
    "digitalInputs",
    "digitalOutputs",
    "analogInputs",
    "analogOutputs",
  ] as const satisfies readonly (keyof MesaSchemaProfile)[];
  const booleanKeys = [
    "dpll",
    "spindleEnable",
    "analogEnable",
  ] as const satisfies readonly (keyof MesaSchemaProfile)[];
  for (const profile of profiles) {
    if (!profile) continue;
    for (const pin of profile.explicitPins ?? []) {
      explicitPins.set(pin.key, pin);
    }
    for (const param of profile.explicitParams ?? []) {
      explicitParams.set(param.key, param);
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
  if (explicitParams.size > 0) {
    merged.explicitParams = [...explicitParams.values()];
  }
  return merged;
}

export function schemaProfileSummary(profile: MesaSchemaProfile): string {
  const spec = profile;
  const parts = [
    spec.dpll ? "dpll" : null,
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
