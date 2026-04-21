import type { ComponentStore, ComponentStoreEntry } from "@nohal/core/types";
import type { TranslationKey } from "../../../i18n";

type TranslationParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export type TranslateFn = (
  key: TranslationKey,
  params?: TranslationParams,
) => string;

export type ComponentStoreSource = ComponentStore["sources"][string];

export function sourceLabel(
  t: TranslateFn,
  source: ComponentStoreSource,
): string {
  if (source.kind === "manual") return t("componentStore.customSource");
  if (source.kind === "comp-dir") return source.dirPath;
  if (source.kind === "comp-file") return source.filePath;
  return `LinuxCNC ${source.linuxcncVersion} (${source.refName})`;
}

export function sourceDescription(
  t: TranslateFn,
  source: ComponentStoreSource,
): string {
  if (source.kind === "manual") {
    return t("componentStore.customSourceDescription");
  }
  if (source.kind === "comp-dir") return t("componentStore.dirSource");
  if (source.kind === "comp-file") return t("componentStore.fileImport");
  return t("componentStore.builtinSource");
}

export function entrySourceLabel(
  t: TranslateFn,
  sources: ComponentStore["sources"],
  entry: ComponentStoreEntry,
): string {
  const source = sources[entry.sourceRef.sourceId];
  if (!source) return entry.sourceRef.sourceId;
  return sourceLabel(t, source);
}

export function entrySourceDetail(
  t: TranslateFn,
  entry: ComponentStoreEntry,
): string {
  if (entry.sourceRef.kind === "manual") {
    return t("componentStore.customSourceDescription");
  }
  return entry.sourceRef.filePath;
}

export function sourceKindBadge(
  t: TranslateFn,
  source: ComponentStoreSource,
): string {
  if (source.kind === "manual") return t("componentStore.customSourceBadge");
  if (source.kind === "comp-dir") return "dir";
  return ".comp";
}

export function sourceKindLabel(
  t: TranslateFn,
  kind: ComponentStore["components"][string]["sourceRef"]["kind"],
): string {
  switch (kind) {
    case "manual":
      return t("componentStore.customSource");
    case "comp-dir":
      return t("componentStore.dirSource");
    case "comp-file":
      return t("componentStore.fileImport");
    case "linuxcnc-builtin":
      return t("componentStore.builtinSource");
  }
}

export function sortComponentSources(
  t: TranslateFn,
  sources: readonly ComponentStoreSource[],
): ComponentStoreSource[] {
  return [...sources].sort((a, b) => {
    if (a.kind === "manual" && b.kind !== "manual") return -1;
    if (a.kind !== "manual" && b.kind === "manual") return 1;
    return sourceLabel(t, a).localeCompare(sourceLabel(t, b));
  });
}
