import {
  NOHAL_COMPONENT_STORE_FORMAT,
  NOHAL_COMPONENT_STORE_VERSION,
} from "../fileFormats";
import type { ComponentStore, CoreIo } from "../types";
import { createEmptyComponentStore } from "./model";
import {
  applyLinuxCncBuiltinSources,
  toPersistedComponentStore,
} from "./sourceHandlers/linuxcncBuiltin";

function assertComponentStoreShape(
  input: unknown,
): asserts input is ComponentStore {
  if (!input || typeof input !== "object") {
    throw new Error("Component store file is not an object");
  }
  const store = input as Partial<ComponentStore>;
  if (store.format !== NOHAL_COMPONENT_STORE_FORMAT) {
    throw new Error("Unsupported component store format");
  }
  if (store.version !== NOHAL_COMPONENT_STORE_VERSION) {
    throw new Error(
      `Unsupported component store version: ${String(store.version)}`,
    );
  }
  if (!store.sources || typeof store.sources !== "object") {
    throw new Error("Component store has no sources map");
  }
  if (!store.components || typeof store.components !== "object") {
    throw new Error("Component store has no components map");
  }
}

function isErrnoCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("code" in error)) return false;
  return (error as { code?: unknown }).code === code;
}

export const readComponentStoreFileFromDisk =
  (io: CoreIo) =>
  async (storeFilePath: string): Promise<ComponentStore> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    try {
      const content = await io.fs.readTextFile(normalizedStoreFilePath);
      const parsed = JSON.parse(content) as unknown;
      assertComponentStoreShape(parsed);
      await applyLinuxCncBuiltinSources(parsed);
      return parsed;
    } catch (error) {
      if (isErrnoCode(error, "ENOENT")) {
        const empty = createEmptyComponentStore();
        await applyLinuxCncBuiltinSources(empty);
        return empty;
      }
      throw error;
    }
  };

export const writeComponentStoreFileToDisk =
  (io: CoreIo) =>
  async (storeFilePath: string, store: ComponentStore): Promise<void> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    const persisted = toPersistedComponentStore(store);
    await io.fs.makeDir(io.path.dirname(normalizedStoreFilePath), {
      recursive: true,
    });
    await io.fs.writeTextFile(
      normalizedStoreFilePath,
      `${JSON.stringify(persisted, null, 2)}\n`,
    );
  };
