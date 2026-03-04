import type {
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
} from "../../types";

export function upsertStoredComponentEntry(
  store: ComponentStore,
  parsed: ImportedComponentDefinition,
  sourceRef: ComponentStoreEntry["sourceRef"],
  nowIso: string,
  forcedComponentId?: string,
): ComponentStoreEntry {
  const componentId = forcedComponentId ?? parsed.id;
  const existing = store.components[componentId];
  const normalizedParsed = forcedComponentId
    ? { ...parsed, id: forcedComponentId }
    : parsed;
  const entry: ComponentStoreEntry = {
    componentId,
    sourceRef,
    parsed: normalizedParsed,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
  store.components[componentId] = entry;
  return entry;
}
