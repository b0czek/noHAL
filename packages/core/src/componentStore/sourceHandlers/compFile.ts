import { slugify } from "../../id";
import type {
  ComponentStore,
  ComponentStoreFileSource,
  CoreIo,
} from "../../types";

export function createComponentFileSourceId(
  io: CoreIo,
  filePath: string,
): string {
  return `compfile:${slugify(io.path.resolve(filePath))}`;
}

export function upsertComponentFileSource(
  io: CoreIo,
  store: ComponentStore,
  filePath: string,
  nowIso: string,
): ComponentStoreFileSource {
  const normalizedFilePath = io.path.resolve(filePath);
  const sourceId = createComponentFileSourceId(io, normalizedFilePath);
  const existing = store.sources[sourceId];
  if (existing && existing.kind !== "comp-file") {
    throw new Error(`Source id collision with non-file source: ${sourceId}`);
  }
  const source: ComponentStoreFileSource = {
    id: sourceId,
    kind: "comp-file",
    filePath: normalizedFilePath,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    lastScanAt: existing?.lastScanAt,
    lastError: existing?.lastError,
  };
  store.sources[sourceId] = source;
  return source;
}
