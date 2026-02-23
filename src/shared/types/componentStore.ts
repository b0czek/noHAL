import type { ImportedComponentDefinition } from "./components";

export interface ComponentStoreSourceRef {
  kind: "comp-file";
  sourceId: string;
  filePath: string;
}

export interface ComponentStoreDirComponentSourceRef {
  kind: "comp-dir";
  sourceId: string;
  filePath: string;
}

export interface ComponentStoreDirSource {
  id: string;
  kind: "comp-dir";
  dirPath: string;
  recursive: boolean;
  createdAt: string;
  updatedAt: string;
  lastScanAt?: string;
  lastError?: string;
}

export interface ComponentStoreFileSource {
  id: string;
  kind: "comp-file";
  filePath: string;
  createdAt: string;
  updatedAt: string;
  lastScanAt?: string;
  lastError?: string;
}

export interface ComponentStoreEntry {
  componentId: string;
  sourceRef: ComponentStoreSourceRef | ComponentStoreDirComponentSourceRef;
  parsed: ImportedComponentDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentStore {
  format: "nohal-component-store";
  version: 2;
  sources: Record<string, ComponentStoreDirSource | ComponentStoreFileSource>;
  components: Record<string, ComponentStoreEntry>;
}
