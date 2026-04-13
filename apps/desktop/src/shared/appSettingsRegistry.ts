export type AppLocale = "en";

export interface AppSettings {
  canvasGridResolution: number;
  customComponentStoreFilePath: string | null;
  interfaceScale: number;
  locale: AppLocale;
}

export type AppSettingKey = keyof AppSettings;
export type AppSettingCategory = "component-store" | "interface";
export type AppSettingPrimitive = string | number | boolean;

export interface AppSettingOption<T extends AppSettingPrimitive> {
  value: T;
  label: string;
}

export interface AppSettingDefinition<K extends AppSettingKey> {
  key: K;
  category: AppSettingCategory;
  control: "path" | "select";
  labelKey: string;
  helpKey: string;
  defaultValue: AppSettings[K];
  options?: readonly AppSettingOption<AppSettingPrimitive>[];
  sanitize: (value: unknown) => AppSettings[K];
  serialize: (value: unknown) => string;
  deserialize: (value: string) => AppSettings[K];
}

type AppSettingsRegistry = {
  [K in AppSettingKey]: AppSettingDefinition<K>;
};

const interfaceScale = {
  defaultValue: 1,
  options: [
    { value: 0.9, label: "90%" },
    { value: 1, label: "100%" },
    { value: 1.1, label: "110%" },
    { value: 1.25, label: "125%" },
  ],
} as const;
const interfaceScaleOptions = interfaceScale.options.map(({ value }) => value);
const canvasGrid = {
  defaultValue: 0,
  options: [
    { value: 0, label: "Off" },
    { value: 8, label: "8 px" },
    { value: 12, label: "12 px" },
    { value: 16, label: "16 px" },
    { value: 24, label: "24 px" },
    { value: 32, label: "32 px" },
    { value: 48, label: "48 px" },
  ],
} as const;
const canvasGridOptions = canvasGrid.options.map(({ value }) => value);
const localeOptions = ["en"] as const;

export const APP_SETTINGS_REGISTRY = {
  canvasGridResolution: {
    key: "canvasGridResolution",
    category: "interface",
    control: "select",
    labelKey: "generalSettings.canvasGridLabel",
    helpKey: "generalSettings.canvasGridHelp",
    defaultValue: canvasGrid.defaultValue,
    options: canvasGrid.options.map(({ value, label }) => ({
      value,
      label,
    })),
    sanitize: (value) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return canvasGrid.defaultValue;
      }
      return canvasGridOptions.includes(
        value as (typeof canvasGridOptions)[number],
      )
        ? value
        : canvasGrid.defaultValue;
    },
    serialize: (value) => String(value),
    deserialize: (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : canvasGrid.defaultValue;
    },
  },
  customComponentStoreFilePath: {
    key: "customComponentStoreFilePath",
    category: "component-store",
    control: "path",
    labelKey: "componentStore.customStoreLocationLabel",
    helpKey: "componentStore.customStoreLocationHelp",
    defaultValue: null,
    sanitize: (value) => {
      if (typeof value !== "string") return null;
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    },
    serialize: (value) => (typeof value === "string" ? value : ""),
    deserialize: (value) => {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : null;
    },
  },
  interfaceScale: {
    key: "interfaceScale",
    category: "interface",
    control: "select",
    labelKey: "generalSettings.interfaceScaleLabel",
    helpKey: "generalSettings.interfaceScaleHelp",
    defaultValue: interfaceScale.defaultValue,
    options: interfaceScale.options.map(({ value, label }) => ({
      value,
      label,
    })),
    sanitize: (value) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return interfaceScale.defaultValue;
      }
      return interfaceScaleOptions.includes(
        value as (typeof interfaceScaleOptions)[number],
      )
        ? value
        : interfaceScale.defaultValue;
    },
    serialize: (value) => String(value),
    deserialize: (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : interfaceScale.defaultValue;
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
