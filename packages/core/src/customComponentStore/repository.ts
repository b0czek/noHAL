import {
  NOHAL_CUSTOM_COMPONENT_STORE_FORMAT,
  NOHAL_CUSTOM_COMPONENT_STORE_VERSION,
} from "../project/formats";
import type { CoreIo, CustomComponentStore } from "../types";
import { createEmptyCustomComponentStore } from "./model";

function assertCustomComponentStoreShape(
  input: unknown,
): asserts input is CustomComponentStore {
  if (!input || typeof input !== "object") {
    throw new Error("Custom component store file is not an object");
  }
  const store = input as Partial<CustomComponentStore>;
  if (store.format !== NOHAL_CUSTOM_COMPONENT_STORE_FORMAT) {
    throw new Error("Unsupported custom component store format");
  }
  if (store.version !== NOHAL_CUSTOM_COMPONENT_STORE_VERSION) {
    throw new Error(
      `Unsupported custom component store version: ${String(store.version)}`,
    );
  }
  if (typeof store.createdAt !== "string") {
    throw new Error("Custom component store has no createdAt timestamp");
  }
  if (typeof store.updatedAt !== "string") {
    throw new Error("Custom component store has no updatedAt timestamp");
  }
  if (!store.components || typeof store.components !== "object") {
    throw new Error("Custom component store has no components map");
  }
}

function isErrnoCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("code" in error)) return false;
  return (error as { code?: unknown }).code === code;
}

export const readCustomComponentStoreFileFromDisk =
  (io: CoreIo) =>
  async (storeFilePath: string): Promise<CustomComponentStore> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    try {
      const content = await io.fs.readTextFile(normalizedStoreFilePath);
      const parsed = JSON.parse(content) as unknown;
      assertCustomComponentStoreShape(parsed);
      return parsed;
    } catch (error) {
      if (isErrnoCode(error, "ENOENT")) {
        return createEmptyCustomComponentStore();
      }
      throw error;
    }
  };

export const writeCustomComponentStoreFileToDisk =
  (io: CoreIo) =>
  async (storeFilePath: string, store: CustomComponentStore): Promise<void> => {
    const normalizedStoreFilePath = io.path.resolve(storeFilePath);
    await io.fs.makeDir(io.path.dirname(normalizedStoreFilePath), {
      recursive: true,
    });
    await io.fs.writeTextFile(
      normalizedStoreFilePath,
      `${JSON.stringify(store, null, 2)}\n`,
    );
  };
