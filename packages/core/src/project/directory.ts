import { pickBy } from "remeda";
import corePackageJson from "../../package.json";
import { isSystemComponent } from "../componentSystem";
import { slugify } from "../id";
import type {
  CoreIo,
  NoHALProject,
  ProjectLibrary,
  SheetDefinition,
} from "../types";
import {
  NOHAL_PROJECT_DIR_FORMAT,
  NOHAL_PROJECT_DIR_VERSION,
  NOHAL_PROJECT_LIBRARY_FILE_FORMAT,
  NOHAL_PROJECT_LIBRARY_FILE_VERSION,
  NOHAL_PROJECT_SHEET_FILE_FORMAT,
  NOHAL_PROJECT_SHEET_FILE_VERSION,
} from "./formats";
import { parseNoHALProject } from "./project";

const PROJECT_DIR_MANIFEST_FILENAME = "project.nohal.json";
const CURRENT_PROJECT_DIR_VERSION = NOHAL_PROJECT_DIR_VERSION;
const PROJECT_LIBRARY_FILENAME = "library.nohal.json";
const SHEETS_DIRNAME = "sheets";
const SHEET_FILE_SUFFIX = ".nohal-sheet.json";
const NOHAL_CORE_VERSION =
  typeof corePackageJson.version === "string"
    ? corePackageJson.version
    : "0.0.0";
const ATOMIC_WRITE_RANDOM_SUFFIX_RADIX = 36;
const ATOMIC_WRITE_RANDOM_SUFFIX_START = 2;
const ATOMIC_WRITE_RANDOM_SUFFIX_END = 10;

export interface ProjectPersistenceOptions {
  savedWith?: string;
}

export interface ProjectReadResult {
  project: NoHALProject;
  projectPath: string;
  savedWith?: string;
}

export interface ProjectDirectoryApi {
  readProjectPath(projectPath: string): Promise<ProjectReadResult>;
  writeProjectDirectory(
    project: NoHALProject,
    targetPath: string,
    options?: ProjectPersistenceOptions,
  ): Promise<string>;
}

type ProjectWithoutSheetsAndLibrary = Omit<NoHALProject, "sheets" | "library">;

interface ProjectSheetRef {
  id: string;
  file: string;
}

interface NoHALProjectDirManifest {
  format: typeof NOHAL_PROJECT_DIR_FORMAT;
  version: typeof NOHAL_PROJECT_DIR_VERSION;
  savedWith?: string;
  project: ProjectWithoutSheetsAndLibrary;
  libraryFile: typeof PROJECT_LIBRARY_FILENAME;
  sheets: ProjectSheetRef[];
}

interface NoHALProjectLibraryFile {
  format: typeof NOHAL_PROJECT_LIBRARY_FILE_FORMAT;
  version: typeof NOHAL_PROJECT_LIBRARY_FILE_VERSION;
  savedWith?: string;
  library: ProjectLibrary;
}

interface NoHALProjectSheetFile {
  format: typeof NOHAL_PROJECT_SHEET_FILE_FORMAT;
  version: typeof NOHAL_PROJECT_SHEET_FILE_VERSION;
  savedWith?: string;
  sheet: SheetDefinition;
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

let atomicWriteCounter = 0;

function atomicTempPathFor(filePath: string): string {
  atomicWriteCounter += 1;
  const randomSuffix = Math.random()
    .toString(ATOMIC_WRITE_RANDOM_SUFFIX_RADIX)
    .slice(ATOMIC_WRITE_RANDOM_SUFFIX_START, ATOMIC_WRITE_RANDOM_SUFFIX_END);
  return `${filePath}.tmp-${Date.now()}-${atomicWriteCounter}-${randomSuffix}`;
}

async function writeFileAtomic(
  io: CoreIo,
  filePath: string,
  content: string,
): Promise<void> {
  const tempPath = atomicTempPathFor(filePath);
  try {
    await io.fs.writeTextFile(tempPath, content);
    await io.fs.renamePath(tempPath, filePath);
  } catch (error) {
    try {
      await io.fs.removeFile(tempPath);
    } catch {
      // Best-effort cleanup only; original error should be preserved.
    }
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSheetDefinitionLike(value: unknown): value is SheetDefinition {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (
    !(value.parentSheetId === null || typeof value.parentSheetId === "string")
  )
    return false;
  return (
    Array.isArray(value.nodes) &&
    Array.isArray(value.ports) &&
    Array.isArray(value.labels) &&
    Array.isArray(value.directConnections) &&
    Array.isArray(value.labelAnchors)
  );
}

function isProjectDirManifest(
  value: unknown,
): value is NoHALProjectDirManifest {
  if (!isRecord(value)) return false;
  if (value.format !== NOHAL_PROJECT_DIR_FORMAT) return false;
  if (value.version !== NOHAL_PROJECT_DIR_VERSION) return false;
  if (!(value.savedWith === undefined || typeof value.savedWith === "string"))
    return false;
  if (!isRecord(value.project)) return false;
  if (value.libraryFile !== PROJECT_LIBRARY_FILENAME) return false;
  if (!Array.isArray(value.sheets)) return false;
  return value.sheets.every(
    (sheetRef) =>
      isRecord(sheetRef) &&
      typeof sheetRef.id === "string" &&
      typeof sheetRef.file === "string",
  );
}

function isProjectLibraryLike(value: unknown): value is ProjectLibrary {
  return isRecord(value) && isRecord(value.components);
}

function isProjectLibraryFile(
  value: unknown,
): value is NoHALProjectLibraryFile {
  return (
    isRecord(value) &&
    value.format === NOHAL_PROJECT_LIBRARY_FILE_FORMAT &&
    value.version === NOHAL_PROJECT_LIBRARY_FILE_VERSION &&
    (value.savedWith === undefined || typeof value.savedWith === "string") &&
    isProjectLibraryLike(value.library)
  );
}

function parseProjectLibraryFile(
  value: unknown,
  libraryPath: string,
): ProjectLibrary {
  if (isProjectLibraryFile(value)) return value.library;
  throw new Error(`Invalid project library: ${libraryPath}`);
}

function isProjectSheetFile(value: unknown): value is NoHALProjectSheetFile {
  return (
    isRecord(value) &&
    value.format === NOHAL_PROJECT_SHEET_FILE_FORMAT &&
    value.version === NOHAL_PROJECT_SHEET_FILE_VERSION &&
    (value.savedWith === undefined || typeof value.savedWith === "string") &&
    isSheetDefinitionLike(value.sheet)
  );
}

function parseProjectSheetFile(
  value: unknown,
  sheetPath: string,
): SheetDefinition {
  if (isProjectSheetFile(value)) return value.sheet;
  throw new Error(`Invalid sheet file: ${sheetPath}`);
}

function getUsedComponentIds(project: NoHALProject): Set<string> {
  const used = new Set<string>();
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      const component = project.library.components[node.componentId];
      if (
        isSystemComponent(component) &&
        node.componentId.startsWith("system:")
      )
        continue;
      used.add(node.componentId);
    }
  }
  return used;
}

function createPersistedProjectLibrary(project: NoHALProject): ProjectLibrary {
  const usedComponentIds = getUsedComponentIds(project);
  return {
    components: pickBy(
      project.library.components,
      (component, componentId) =>
        Boolean(component) && usedComponentIds.has(componentId),
    ),
  };
}

function createProjectLibraryFile(
  library: ProjectLibrary,
  options?: ProjectPersistenceOptions,
): NoHALProjectLibraryFile {
  return {
    format: NOHAL_PROJECT_LIBRARY_FILE_FORMAT,
    version: NOHAL_PROJECT_LIBRARY_FILE_VERSION,
    savedWith: options?.savedWith,
    library,
  };
}

function createProjectSheetFile(
  sheet: SheetDefinition,
  options?: ProjectPersistenceOptions,
): NoHALProjectSheetFile {
  return {
    format: NOHAL_PROJECT_SHEET_FILE_FORMAT,
    version: NOHAL_PROJECT_SHEET_FILE_VERSION,
    savedWith: options?.savedWith,
    sheet,
  };
}

function sheetFileNameForSheet(sheet: SheetDefinition): string {
  const fileId = sheet.id.replace(/^sheet_/, "");
  return `${slugify(sheet.name)}__${fileId}${SHEET_FILE_SUFFIX}`;
}

function normalizeProjectDirectoryTarget(
  io: CoreIo,
  targetPath: string,
): string {
  const resolved = io.path.resolve(targetPath);
  const baseName = io.path.basename(resolved);
  if (baseName === PROJECT_DIR_MANIFEST_FILENAME)
    return io.path.dirname(resolved);
  return resolved;
}

async function readProjectDirectoryManifest(
  io: CoreIo,
  projectDir: string,
): Promise<NoHALProjectDirManifest> {
  const manifestPath = io.path.join(projectDir, PROJECT_DIR_MANIFEST_FILENAME);
  const content = await io.fs.readTextFile(manifestPath);
  const parsed = JSON.parse(content) as unknown;
  if (!isProjectDirManifest(parsed)) {
    throw new Error(`Invalid project manifest: ${manifestPath}`);
  }
  return parsed;
}

async function readProjectDirectory(
  io: CoreIo,
  projectDir: string,
  manifest?: NoHALProjectDirManifest,
): Promise<ProjectReadResult> {
  const normalizedProjectDir = io.path.resolve(projectDir);
  const dirManifest =
    manifest ?? (await readProjectDirectoryManifest(io, normalizedProjectDir));

  const sheets: Record<string, SheetDefinition> = {};

  for (const sheetRef of dirManifest.sheets) {
    if (!sheetRef.file.startsWith(`${SHEETS_DIRNAME}/`)) {
      throw new Error(`Invalid sheet file path: ${sheetRef.file}`);
    }
    const relativeParts = sheetRef.file.split("/").filter(Boolean);
    if (
      relativeParts.length !== 2 ||
      relativeParts[0] !== SHEETS_DIRNAME ||
      relativeParts.some((part) => part === "." || part === "..")
    ) {
      throw new Error(`Invalid sheet file path: ${sheetRef.file}`);
    }
    const sheetPath = io.path.join(normalizedProjectDir, ...relativeParts);
    const content = await io.fs.readTextFile(sheetPath);
    const parsed = JSON.parse(content) as unknown;
    const sheet = parseProjectSheetFile(parsed, sheetPath);
    if (sheet.id !== sheetRef.id) {
      throw new Error(`Sheet id mismatch in ${sheetPath}`);
    }
    if (sheetRef.id in sheets) {
      throw new Error(`Duplicate sheet id in manifest: ${sheetRef.id}`);
    }
    sheets[sheetRef.id] = sheet;
  }

  const libraryPath = io.path.join(
    normalizedProjectDir,
    dirManifest.libraryFile,
  );
  const libraryContent = await io.fs.readTextFile(libraryPath);
  const parsedLibrary = parseProjectLibraryFile(
    JSON.parse(libraryContent) as unknown,
    libraryPath,
  );

  const project = parseNoHALProject(
    JSON.stringify({
      ...dirManifest.project,
      library: parsedLibrary,
      sheets,
    }),
  );

  return {
    project,
    projectPath: normalizedProjectDir,
    savedWith: dirManifest.savedWith,
  };
}

function createProjectDirManifest(
  project: NoHALProject,
  options?: ProjectPersistenceOptions,
): NoHALProjectDirManifest {
  const {
    sheets,
    library: _library,
    ...projectWithoutSheetsAndLibrary
  } = project;
  return {
    format: NOHAL_PROJECT_DIR_FORMAT,
    version: CURRENT_PROJECT_DIR_VERSION,
    savedWith: options?.savedWith,
    project: projectWithoutSheetsAndLibrary,
    libraryFile: PROJECT_LIBRARY_FILENAME,
    sheets: Object.keys(sheets)
      .sort()
      .map((sheetId) => {
        const sheet = sheets[sheetId];
        if (!sheet) {
          throw new Error(`Missing sheet in project: ${sheetId}`);
        }
        return {
          id: sheetId,
          file: `${SHEETS_DIRNAME}/${sheetFileNameForSheet(sheet)}`,
        };
      }),
  };
}

export const readProjectPath =
  (io: CoreIo) =>
  async (projectPath: string): Promise<ProjectReadResult> => {
    const normalizedProjectPath = io.path.resolve(projectPath);
    const stat = await io.fs.lstat(normalizedProjectPath);

    if (stat.isDirectory()) {
      return readProjectDirectory(io, normalizedProjectPath);
    }

    if (
      io.path.basename(normalizedProjectPath) !== PROJECT_DIR_MANIFEST_FILENAME
    ) {
      throw new Error(
        `Expected a NoHAL project directory or ${PROJECT_DIR_MANIFEST_FILENAME}`,
      );
    }

    const content = await io.fs.readTextFile(normalizedProjectPath);
    const parsed = JSON.parse(content) as unknown;
    if (!isProjectDirManifest(parsed)) {
      throw new Error(`Invalid project manifest: ${normalizedProjectPath}`);
    }
    return readProjectDirectory(
      io,
      io.path.dirname(normalizedProjectPath),
      parsed,
    );
  };

export const writeProjectDirectory =
  (io: CoreIo) =>
  async (
    project: NoHALProject,
    targetPath: string,
    options?: ProjectPersistenceOptions,
  ): Promise<string> => {
    const persistenceOptions: ProjectPersistenceOptions = {
      savedWith: options?.savedWith ?? NOHAL_CORE_VERSION,
    };
    const projectDir = normalizeProjectDirectoryTarget(io, targetPath);
    const sheetsDir = io.path.join(projectDir, SHEETS_DIRNAME);
    const manifestPath = io.path.join(
      projectDir,
      PROJECT_DIR_MANIFEST_FILENAME,
    );
    const libraryPath = io.path.join(projectDir, PROJECT_LIBRARY_FILENAME);
    const manifest = createProjectDirManifest(project, persistenceOptions);
    const persistedLibrary = createPersistedProjectLibrary(project);

    await io.fs.makeDir(projectDir, { recursive: true });
    await io.fs.makeDir(sheetsDir, { recursive: true });

    for (const sheetRef of manifest.sheets) {
      const sheet = project.sheets[sheetRef.id];
      if (!sheet) {
        throw new Error(`Missing sheet in project: ${sheetRef.id}`);
      }
      const sheetFilePath = io.path.join(
        sheetsDir,
        io.path.basename(sheetRef.file),
      );
      await writeFileAtomic(
        io,
        sheetFilePath,
        stringifyJson(createProjectSheetFile(sheet, persistenceOptions)),
      );
    }
    await writeFileAtomic(
      io,
      libraryPath,
      stringifyJson(
        createProjectLibraryFile(persistedLibrary, persistenceOptions),
      ),
    );
    // Manifest is the commit point for the multi-file project save.
    await writeFileAtomic(io, manifestPath, stringifyJson(manifest));

    const expectedSheetFiles = new Set(
      manifest.sheets.map((sheetRef) => io.path.basename(sheetRef.file)),
    );
    const existingEntries = await io.fs.readDir(sheetsDir);
    for (const entry of existingEntries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(SHEET_FILE_SUFFIX)) continue;
      if (expectedSheetFiles.has(entry.name)) continue;
      await io.fs.removeFile(io.path.join(sheetsDir, entry.name));
    }
    return projectDir;
  };

export function createProjectDirectoryApi(io: CoreIo): ProjectDirectoryApi {
  return {
    readProjectPath: readProjectPath(io),
    writeProjectDirectory: writeProjectDirectory(io),
  };
}
