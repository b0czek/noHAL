import type {
  ComponentStore,
  HalImportDraft,
  HalImportLinkSuggestion,
} from "../types";

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function suggestHalImportLinks(
  draft: HalImportDraft,
  componentStore: ComponentStore,
): HalImportLinkSuggestion[] {
  const storeEntries = Object.values(componentStore.components);
  return draft.componentGroups.map((group) => {
    const exact = storeEntries
      .filter(
        (entry) =>
          entry.parsed.halComponentName === group.inferredHalComponentName,
      )
      .sort((a, b) => a.parsed.id.localeCompare(b.parsed.id));
    if (exact.length > 0) {
      return {
        groupId: group.id,
        selection: {
          groupId: group.id,
          mode: "store",
          componentId: exact[0].componentId,
        },
        reason: "exact halComponentName match",
      };
    }

    const normalized = normalizeName(group.inferredHalComponentName);
    const loose = storeEntries
      .filter(
        (entry) => normalizeName(entry.parsed.halComponentName) === normalized,
      )
      .sort((a, b) =>
        a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
      );
    if (loose.length > 0) {
      return {
        groupId: group.id,
        selection: {
          groupId: group.id,
          mode: "store",
          componentId: loose[0].componentId,
        },
        reason: "normalized halComponentName match",
      };
    }

    return {
      groupId: group.id,
      selection: { groupId: group.id, mode: "project-local" },
      reason: "no store match",
    };
  });
}
