import {
  NOHAL_CUSTOM_COMPONENT_STORE_FORMAT,
  NOHAL_CUSTOM_COMPONENT_STORE_VERSION,
} from "../project/formats";
import type {
  ComponentDefinition,
  CustomComponentStore,
  CustomComponentStoreEntry,
  ImportedComponentDefinition,
} from "../types";

export interface CustomComponentStoreApi {
  readCustomComponentStoreFile(
    storeFilePath: string,
  ): Promise<CustomComponentStore>;
  addCustomComponentToStore(
    storeFilePath: string,
    halComponentName?: string,
  ): Promise<CustomComponentStoreEntry>;
  updateCustomComponentInStore(
    storeFilePath: string,
    componentId: string,
    component: ComponentDefinition | ImportedComponentDefinition,
  ): Promise<CustomComponentStoreEntry>;
  removeCustomComponentFromStore(
    storeFilePath: string,
    componentId: string,
  ): Promise<{ componentId: string }>;
  promoteProjectCustomComponentToStore(
    storeFilePath: string,
    component: ComponentDefinition,
  ): Promise<CustomComponentStoreEntry>;
}

export function createEmptyCustomComponentStore(
  nowIso = new Date().toISOString(),
): CustomComponentStore {
  return {
    format: NOHAL_CUSTOM_COMPONENT_STORE_FORMAT,
    version: NOHAL_CUSTOM_COMPONENT_STORE_VERSION,
    createdAt: nowIso,
    updatedAt: nowIso,
    components: {},
  };
}
