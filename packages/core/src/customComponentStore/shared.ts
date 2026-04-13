import {
  createCustomComponentDefinition,
  toImportedCustomComponentDefinition,
} from "../customComponent/shared";
import { createId } from "../id";
import type {
  ComponentDefinition,
  ImportedComponentDefinition,
} from "../types";

export const CUSTOM_COMPONENT_STORE_SOURCE_ID = "custom-component-store:global";
export const STORE_CUSTOM_COMPONENT_ID_PREFIX = "store-custom:";

export function createStoreCustomComponentId(): string {
  return `${STORE_CUSTOM_COMPONENT_ID_PREFIX}${createId("component")}`;
}

export function createStoredCustomComponentDefinition(options: {
  componentId?: string;
  existingHalComponentNames: readonly string[];
  halComponentName?: string;
}): ImportedComponentDefinition {
  return toImportedCustomComponentDefinition(
    createCustomComponentDefinition({
      componentId: options.componentId ?? createStoreCustomComponentId(),
      existingHalComponentNames: options.existingHalComponentNames,
      baseHalComponentName: options.halComponentName,
    }),
  );
}

export function normalizeStoredCustomComponentDefinition(
  component: ComponentDefinition | ImportedComponentDefinition,
  componentId: string,
): ImportedComponentDefinition {
  return {
    ...toImportedCustomComponentDefinition(component),
    id: componentId,
    source: "manual",
  };
}
