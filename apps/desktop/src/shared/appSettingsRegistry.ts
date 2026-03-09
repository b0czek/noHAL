export type AppLocale = "en";

export interface AppSettings {
  interfaceScale: number;
  locale: AppLocale;
}

export type AppSettingKey = keyof AppSettings;
export type AppSettingCategory = "interface";
export type AppSettingPrimitive = string | number | boolean;

export interface AppSettingOption<T extends AppSettingPrimitive> {
  value: T;
  label: string;
}

export interface AppSettingDefinition<K extends AppSettingKey> {
  key: K;
  category: AppSettingCategory;
  control: "select";
  labelKey: string;
  helpKey: string;
  defaultValue: AppSettings[K];
  options: ReadonlyArray<AppSettingOption<AppSettingPrimitive>>;
  sanitize: (value: unknown) => AppSettings[K];
  serialize: (value: unknown) => string;
  deserialize: (value: string) => AppSettings[K];
}

type AppSettingsRegistry = {
  [K in AppSettingKey]: AppSettingDefinition<K>;
};

const interfaceScaleOptions = [0.9, 1, 1.1, 1.25] as const;
const localeOptions = ["en"] as const;

export const APP_SETTINGS_REGISTRY = {
  interfaceScale: {
    key: "interfaceScale",
    category: "interface",
    control: "select",
    labelKey: "generalSettings.interfaceScaleLabel",
    helpKey: "generalSettings.interfaceScaleHelp",
    defaultValue: 1,
    options: interfaceScaleOptions.map((value) => ({
      value,
      label: `${Math.round(value * 100)}%`,
    })),
    sanitize: (value) => {
      if (typeof value !== "number" || !Number.isFinite(value)) return 1;
      return interfaceScaleOptions.includes(
        value as (typeof interfaceScaleOptions)[number],
      )
        ? value
        : 1;
    },
    serialize: (value) => String(value),
    deserialize: (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 1;
    },
  },
  locale: {
    key: "locale",
    category: "interface",
    control: "select",
    labelKey: "generalSettings.languageLabel",
    helpKey: "generalSettings.languageHelp",
    defaultValue: "en",
    options: localeOptions.map((value) => ({
      value,
      label: value === "en" ? "English" : value,
    })),
    sanitize: (value) => {
      if (typeof value !== "string") return "en";
      return localeOptions.includes(value as AppLocale)
        ? (value as AppLocale)
        : "en";
    },
    serialize: (value) => String(value),
    deserialize: (value) =>
      localeOptions.includes(value as AppLocale) ? (value as AppLocale) : "en",
  },
} satisfies AppSettingsRegistry;

export type AnyAppSettingDefinition =
  (typeof APP_SETTINGS_REGISTRY)[keyof typeof APP_SETTINGS_REGISTRY];

const appSettingDefinitions = Object.values(
  APP_SETTINGS_REGISTRY,
) as AnyAppSettingDefinition[];

export function listAppSettingDefinitions(
  category?: AppSettingCategory,
): AnyAppSettingDefinition[] {
  if (!category) return [...appSettingDefinitions];
  return appSettingDefinitions.filter(
    (definition) => definition.category === category,
  );
}
