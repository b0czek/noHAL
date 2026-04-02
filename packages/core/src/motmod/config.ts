import type { ProjectMotmodConfig } from "../types";

export const DEFAULT_MOTMOD_CONFIG: ProjectMotmodConfig = {
  numJoints: 3,
  numDio: 4,
  numAio: 4,
  numSpindles: 1,
  numMiscError: 0,
  trajPeriodNs: 0,
};

export const MOTMOD_CONFIG_LIMITS = {
  numJoints: { min: 1, max: 64 },
  numDio: { min: 0, max: 256 },
  numAio: { min: 0, max: 256 },
  numSpindles: { min: 1, max: 16 },
  numMiscError: { min: 0, max: 256 },
  trajPeriodNs: { min: 0, max: 100_000_000 },
} as const;

function clampInt(
  value: unknown,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value as number)));
}

export function normalizeProjectMotmodConfigValue(
  value: Partial<ProjectMotmodConfig> | undefined,
): ProjectMotmodConfig {
  return {
    numJoints: clampInt(
      value?.numJoints,
      DEFAULT_MOTMOD_CONFIG.numJoints,
      MOTMOD_CONFIG_LIMITS.numJoints.min,
      MOTMOD_CONFIG_LIMITS.numJoints.max,
    ),
    numDio: clampInt(
      value?.numDio,
      DEFAULT_MOTMOD_CONFIG.numDio,
      MOTMOD_CONFIG_LIMITS.numDio.min,
      MOTMOD_CONFIG_LIMITS.numDio.max,
    ),
    numAio: clampInt(
      value?.numAio,
      DEFAULT_MOTMOD_CONFIG.numAio,
      MOTMOD_CONFIG_LIMITS.numAio.min,
      MOTMOD_CONFIG_LIMITS.numAio.max,
    ),
    numSpindles: clampInt(
      value?.numSpindles,
      DEFAULT_MOTMOD_CONFIG.numSpindles,
      MOTMOD_CONFIG_LIMITS.numSpindles.min,
      MOTMOD_CONFIG_LIMITS.numSpindles.max,
    ),
    numMiscError: clampInt(
      value?.numMiscError,
      DEFAULT_MOTMOD_CONFIG.numMiscError,
      MOTMOD_CONFIG_LIMITS.numMiscError.min,
      MOTMOD_CONFIG_LIMITS.numMiscError.max,
    ),
    trajPeriodNs: clampInt(
      value?.trajPeriodNs,
      DEFAULT_MOTMOD_CONFIG.trajPeriodNs,
      MOTMOD_CONFIG_LIMITS.trajPeriodNs.min,
      MOTMOD_CONFIG_LIMITS.trajPeriodNs.max,
    ),
  };
}
