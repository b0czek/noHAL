import type {
  NOHAL_CUSTOM_COMPONENT_STORE_FORMAT,
  NOHAL_CUSTOM_COMPONENT_STORE_VERSION,
} from "../project/formats";
import type { ImportedComponentDefinition } from "./components";

export interface CustomComponentStoreEntry {
  componentId: string;
  parsed: ImportedComponentDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface CustomComponentStore {
  format: typeof NOHAL_CUSTOM_COMPONENT_STORE_FORMAT;
  version: typeof NOHAL_CUSTOM_COMPONENT_STORE_VERSION;
  createdAt: string;
  updatedAt: string;
  components: Record<string, CustomComponentStoreEntry>;
}
