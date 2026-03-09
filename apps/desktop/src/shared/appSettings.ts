import {
  type AnyAppSettingDefinition,
  APP_SETTINGS_REGISTRY,
  type AppLocale,
  type AppSettingKey,
  type AppSettings,
} from "./appSettingsRegistry";

export type AppSettingsPatch = Partial<AppSettings>;

const appSettingDefinitions = Object.values(
  APP_SETTINGS_REGISTRY,
) as AnyAppSettingDefinition[];

export const DEFAULT_APP_SETTINGS = Object.fromEntries(
  appSettingDefinitions.map((definition) => [
    definition.key,
    definition.defaultValue,
  ]),
) as unknown as AppSettings;

export type { AppLocale, AppSettingKey, AppSettings };

export function listAppSettingKeys(): AppSettingKey[] {
  return appSettingDefinitions.map((definition) => definition.key);
}

export function sanitizeAppSettings(value: unknown): AppSettings {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return Object.fromEntries(
    appSettingDefinitions.map((definition) => [
      definition.key,
      definition.sanitize(candidate[definition.key]),
    ]),
  ) as unknown as AppSettings;
}

export function mergeAppSettings(
  current: AppSettings,
  patch: AppSettingsPatch,
): AppSettings {
  return sanitizeAppSettings({
    ...current,
    ...patch,
  });
}
