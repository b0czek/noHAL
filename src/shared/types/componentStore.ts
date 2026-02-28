import type {
  NOHAL_COMPONENT_STORE_FORMAT,
  NOHAL_COMPONENT_STORE_VERSION,
} from "../fileFormats";
import type { LinuxCncVersion } from "../linuxcncVersion";
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

export interface ComponentStoreLinuxCncBuiltinSourceRef {
  kind: "linuxcnc-builtin";
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

export interface ComponentStoreLinuxCncBuiltinSource {
  id: string;
  kind: "linuxcnc-builtin";
  linuxcncVersion: LinuxCncVersion;
  revision: string;
  refName: string;
  repoPath: string;
  createdAt: string;
  updatedAt: string;
  lastScanAt?: string;
  lastError?: string;
}

export interface ComponentStoreEntry {
  componentId: string;
  sourceRef:
    | ComponentStoreSourceRef
    | ComponentStoreDirComponentSourceRef
    | ComponentStoreLinuxCncBuiltinSourceRef;
  parsed: ImportedComponentDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentStore {
  format: typeof NOHAL_COMPONENT_STORE_FORMAT;
  version: typeof NOHAL_COMPONENT_STORE_VERSION;
  sources: Record<
    string,
    | ComponentStoreDirSource
    | ComponentStoreFileSource
    | ComponentStoreLinuxCncBuiltinSource
  >;
  components: Record<string, ComponentStoreEntry>;
}
