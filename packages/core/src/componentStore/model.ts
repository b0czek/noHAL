import {
  NOHAL_COMPONENT_STORE_FORMAT,
  NOHAL_COMPONENT_STORE_VERSION,
} from "../fileFormats";
import type {
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
} from "../types";

export type StoreSourceRefreshResult = {
  sourceId: string;
  entries: ComponentStoreEntry[];
  removedComponentIds: string[];
  errors: Array<{ filePath: string; error: string }>;
};

export interface ComponentStoreApi {
  readComponentStoreFile(storeFilePath: string): Promise<ComponentStore>;
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
  return {
    format: NOHAL_COMPONENT_STORE_FORMAT,
    version: NOHAL_COMPONENT_STORE_VERSION,
    sources: {},
    components: {},
  };
}
