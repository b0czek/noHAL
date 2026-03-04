import {
  createComponentStoreApi,
  type StoreSourceRefreshResult,
} from "@nohal/core/src/componentStore";
import type {
  ComponentStore,
  ComponentStoreEntry,
  ImportedComponentDefinition,
} from "@nohal/core/src/types";
import { app, dialog } from "electron";
import { nodeIo } from "./coreNodeIo";

const COMPONENT_STORE_FILENAME = "component-store.json";
const coreComponentStore = createComponentStoreApi(nodeIo);

function componentStoreFilePath(): string {
  return nodeIo.path.join(app.getPath("userData"), COMPONENT_STORE_FILENAME);
}

export const componentStore = {
  readComponentStoreFile(): Promise<ComponentStore> {
    return coreComponentStore.readComponentStoreFile(componentStoreFilePath());
  },
  saveParsedCompFileToStore(filePath: string): Promise<ComponentStoreEntry> {
    return coreComponentStore.saveParsedCompFileToStore(
      componentStoreFilePath(),
      filePath,
    );
  },
  refreshStoredCompEntry(componentId: string): Promise<ComponentStoreEntry> {
    return coreComponentStore.refreshStoredCompEntry(
      componentStoreFilePath(),
      componentId,
    );
  },
  async addComponentDirSourceToStore(): Promise<StoreSourceRefreshResult | null> {
    const res = await dialog.showOpenDialog({
      title: "Add Component Source Directory",
      properties: ["openDirectory"],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return coreComponentStore.addComponentDirSourceToStore(
      componentStoreFilePath(),
      res.filePaths[0],
    );
  },
  refreshComponentSourceInStore(
    sourceId: string,
  ): Promise<StoreSourceRefreshResult> {
    return coreComponentStore.refreshComponentSourceInStore(
      componentStoreFilePath(),
      sourceId,
    );
  },
  deleteComponentSourceFromStore(
    sourceId: string,
  ): Promise<{ sourceId: string; removedComponentIds: string[] }> {
    return coreComponentStore.deleteComponentSourceFromStore(
      componentStoreFilePath(),
      sourceId,
    );
  },
  scanCompDirectory(dirPath: string): Promise<{
    imported: ImportedComponentDefinition[];
    errors: Array<{ filePath: string; error: string }>;
  }> {
    return coreComponentStore.scanCompDirectory(dirPath);
  },
};
