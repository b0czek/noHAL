import {
  NOHAL_COMPONENT_STORE_FORMAT,
  NOHAL_COMPONENT_STORE_VERSION,
} from "../project/formats";
import type {
  ComponentDefinition,
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
} from "../types";
import { ensureManualComponentSource } from "./sourceHandlers/manual";

export interface StoreSourceRefreshResult {
  sourceId: string;
  entries: ComponentStoreEntry[];
  removedComponentIds: string[];
  errors: Array<{ filePath: string; error: string }>;
}

export interface ComponentStoreApi {
  readComponentStoreFile(storeFilePath: string): Promise<ComponentStore>;
  addManualComponentToStore(
    storeFilePath: string,
    halComponentName?: string,
  ): Promise<ComponentStoreEntry>;
  updateManualComponentInStore(
    storeFilePath: string,
    componentId: string,
    component: ComponentDefinition | ImportedComponentDefinition,
  ): Promise<ComponentStoreEntry>;
  removeManualComponentFromStore(
    storeFilePath: string,
    componentId: string,
  ): Promise<{ sourceId: string; componentId: string }>;
  promoteProjectCustomComponentToStore(
    storeFilePath: string,
    component: ComponentDefinition,
  ): Promise<ComponentStoreEntry>;
  saveParsedCompFileToStore(
    storeFilePath: string,
    filePath: string,
  ): Promise<ComponentStoreEntry>;
  refreshStoredCompEntry(
    storeFilePath: string,
    componentId: string,
  ): Promise<ComponentStoreEntry>;
  addComponentDirSourceToStore(
    storeFilePath: string,
    dirPath: string,
  ): Promise<StoreSourceRefreshResult>;
  refreshComponentSourceInStore(
    storeFilePath: string,
    sourceId: string,
  ): Promise<StoreSourceRefreshResult>;
  deleteComponentSourceFromStore(
    storeFilePath: string,
    sourceId: string,
  ): Promise<{ sourceId: string; removedComponentIds: string[] }>;
  scanCompDirectory(dirPath: string): Promise<{
    imported: ImportedComponentDefinition[];
    errors: Array<{ filePath: string; error: string }>;
  }>;
}

export function createEmptyComponentStore(): ComponentStore {
  const store: ComponentStore = {
    format: NOHAL_COMPONENT_STORE_FORMAT,
    version: NOHAL_COMPONENT_STORE_VERSION,
    sources: {},
    components: {},
  };
  ensureManualComponentSource(store, new Date().toISOString());
  return store;
}
