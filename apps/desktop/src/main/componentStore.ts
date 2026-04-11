import {
  createComponentStoreApi,
  type StoreSourceRefreshResult,
} from "@nohal/core/componentStore";
import {
  CUSTOM_COMPONENT_STORE_SOURCE_ID,
  type CustomComponentStore,
  type CustomComponentStoreEntry,
  createCustomComponentStoreApi,
} from "@nohal/core/customComponentStore";
import type {
  ComponentDefinition,
  ComponentStore,
  ComponentStoreEntry,
  ComponentStoreManualSource,
  ImportedComponentDefinition,
} from "@nohal/core/types";
import { app, dialog } from "electron";
import { nodeIo } from "./coreNodeIo";

const COMPONENT_STORE_FILENAME = "component-store.json";
const CUSTOM_COMPONENT_STORE_FILENAME = "custom-component-store.json";
const coreComponentStore = createComponentStoreApi(nodeIo);
const coreCustomComponentStore = createCustomComponentStoreApi(nodeIo);

function componentStoreFilePath(): string {
  return nodeIo.path.join(app.getPath("userData"), COMPONENT_STORE_FILENAME);
}

function customComponentStoreFilePath(): string {
  return nodeIo.path.join(
    app.getPath("userData"),
    CUSTOM_COMPONENT_STORE_FILENAME,
  );
}

function toManualSource(
  customStore: CustomComponentStore,
): ComponentStoreManualSource {
  return {
    id: CUSTOM_COMPONENT_STORE_SOURCE_ID,
    kind: "manual",
    createdAt: customStore.createdAt,
    updatedAt: customStore.updatedAt,
  };
}

function toManualEntry(entry: CustomComponentStoreEntry): ComponentStoreEntry {
  return {
    componentId: entry.componentId,
    sourceRef: {
      kind: "manual",
      sourceId: CUSTOM_COMPONENT_STORE_SOURCE_ID,
    },
    parsed: entry.parsed,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function mergeStores(
  componentStore: ComponentStore,
  customStore: CustomComponentStore,
): ComponentStore {
  const manualSource = toManualSource(customStore);
  return {
    ...componentStore,
    sources: {
      ...componentStore.sources,
      [manualSource.id]: manualSource,
    },
    components: {
      ...componentStore.components,
      ...Object.fromEntries(
        Object.values(customStore.components).map((entry) => [
          entry.componentId,
          toManualEntry(entry),
        ]),
      ),
    },
  };
}

export const componentStore = {
  async readComponentStoreFile(): Promise<ComponentStore> {
    const [store, customStore] = await Promise.all([
      coreComponentStore.readComponentStoreFile(componentStoreFilePath()),
      coreCustomComponentStore.readCustomComponentStoreFile(
        customComponentStoreFilePath(),
      ),
    ]);
    return mergeStores(store, customStore);
  },
  addManualComponentToStore(
    halComponentName?: string,
  ): Promise<ComponentStoreEntry> {
    return coreCustomComponentStore
      .addCustomComponentToStore(
        customComponentStoreFilePath(),
        halComponentName,
      )
      .then(toManualEntry);
  },
  updateManualComponentInStore(
    componentId: string,
    component: ImportedComponentDefinition,
  ): Promise<ComponentStoreEntry> {
    return coreCustomComponentStore
      .updateCustomComponentInStore(
        customComponentStoreFilePath(),
        componentId,
        component,
      )
      .then(toManualEntry);
  },
  removeManualComponentFromStore(
    componentId: string,
  ): Promise<{ sourceId: string; componentId: string }> {
    return coreCustomComponentStore
      .removeCustomComponentFromStore(
        customComponentStoreFilePath(),
        componentId,
      )
      .then((result) => ({
        sourceId: CUSTOM_COMPONENT_STORE_SOURCE_ID,
        componentId: result.componentId,
      }));
  },
  promoteProjectCustomComponentToStore(
    component: ComponentDefinition,
  ): Promise<ComponentStoreEntry> {
    return coreCustomComponentStore
      .promoteProjectCustomComponentToStore(
        customComponentStoreFilePath(),
        component,
      )
      .then(toManualEntry);
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
