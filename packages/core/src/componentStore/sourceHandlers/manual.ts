import {
  createCustomComponentDefinition,
  toImportedCustomComponentDefinition,
} from "../../customComponent/shared";
import { createId } from "../../id";
import type {
  ComponentDefinition,
  ComponentStore,
  ComponentStoreManualSource,
  ImportedComponentDefinition,
} from "../../types";

export const MANUAL_COMPONENT_STORE_SOURCE_ID = "manual:custom-components";
export const STORE_MANUAL_COMPONENT_ID_PREFIX = "store-manual:";

export function createStoreManualComponentId(): string {
  return `${STORE_MANUAL_COMPONENT_ID_PREFIX}${createId("component")}`;
}

export function ensureManualComponentSource(
  store: ComponentStore,
  nowIso: string,
): ComponentStoreManualSource {
  const existing = store.sources[MANUAL_COMPONENT_STORE_SOURCE_ID];
  if (existing && existing.kind !== "manual") {
    throw new Error(
      `Source id collision with non-manual source: ${MANUAL_COMPONENT_STORE_SOURCE_ID}`,
    );
  }

  const source: ComponentStoreManualSource = {
    id: MANUAL_COMPONENT_STORE_SOURCE_ID,
    kind: "manual",
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    lastScanAt: existing?.lastScanAt,
    lastError: existing?.lastError,
  };
  store.sources[source.id] = source;
  return source;
}

export function createStoredManualComponentDefinition(options: {
  componentId?: string;
  existingHalComponentNames: readonly string[];
  halComponentName?: string;
}): ImportedComponentDefinition {
  return toImportedCustomComponentDefinition(
    createCustomComponentDefinition({
      componentId: options.componentId ?? createStoreManualComponentId(),
      existingHalComponentNames: options.existingHalComponentNames,
      baseHalComponentName: options.halComponentName,
    }),
  );
}

export function normalizeStoredManualComponentDefinition(
  component: ComponentDefinition | ImportedComponentDefinition,
  componentId: string,
): ImportedComponentDefinition {
  return {
    ...toImportedCustomComponentDefinition(component),
    id: componentId,
    source: "manual",
  };
}
