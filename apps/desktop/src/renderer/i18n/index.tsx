import {
  createContext,
  createMemo,
  type ParentProps,
  useContext,
} from "solid-js";
import type { AppLocale } from "../../shared/appSettings";
import { en, type TranslationKey } from "./en";

export type LocaleCode = AppLocale;

type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type I18nContextValue = {
  locale: () => LocaleCode;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  formatDateTime: (value: string | number | Date) => string;
};

const MESSAGES = {
  en,
} as const;

const I18nContext = createContext<I18nContextValue>();

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replaceAll(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value == null ? match : String(value);
  });
}

export function I18nProvider(
  props: ParentProps<{
    locale?: LocaleCode;
  }>,
) {
  const locale = () => props.locale ?? "en";
  const messages = createMemo(() => MESSAGES[locale()]);

  const value: I18nContextValue = {
    locale,
    t: (key, params) => {
      const message = messages()[key] ?? key;
      return interpolate(message, params);
    },
    formatDateTime: (value) => {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleString(locale());
    },
  };

  return (
    <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("I18nProvider is missing");
  return ctx;
}

export type { TranslationKey };
