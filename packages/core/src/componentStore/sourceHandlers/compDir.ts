import { slugify } from "../../id";
import type {
  ComponentStore,
  ComponentStoreDirSource,
  CoreIo,
} from "../../types";

export function createComponentDirSourceId(io: CoreIo, dirPath: string): string {
  return `compdir:${slugify(io.path.resolve(dirPath))}`;
}

export function upsertComponentDirSource(
  io: CoreIo,
  store: ComponentStore,
  dirPath: string,
  nowIso: string,
): ComponentStoreDirSource {
  const normalizedDirPath = io.path.resolve(dirPath);
  const sourceId = createComponentDirSourceId(io, normalizedDirPath);
  const existing = store.sources[sourceId];
  if (existing && existing.kind !== "comp-dir") {
    throw new Error(`Source id collision with non-dir source: ${sourceId}`);
  }
  const source: ComponentStoreDirSource = {
    id: sourceId,
    kind: "comp-dir",
    dirPath: normalizedDirPath,
    recursive: true,
    createdAt: existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    lastScanAt: existing?.lastScanAt,
    lastError: existing?.lastError,
  };
  store.sources[sourceId] = source;
  return source;
}

export async function collectCompFilesRecursive(
  io: CoreIo,
  dirPath: string,
  errors: Array<{ filePath: string; error: string }>,
): Promise<string[]> {
  let entries: Awaited<ReturnType<CoreIo["fs"]["readDir"]>>;
  try {
    entries = await io.fs.readDir(dirPath);
  } catch (error) {
    errors.push({
      filePath: dirPath,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = io.path.join(dirPath, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...(await collectCompFilesRecursive(io, fullPath, errors)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".comp")) {
      files.push(fullPath);
    }
  }
  return files;
}
