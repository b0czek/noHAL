import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import packageJson from "../../package.json";
import {
  NOHAL_PROJECT_DIR_FORMAT,
  NOHAL_PROJECT_DIR_VERSION,
  NOHAL_PROJECT_LIBRARY_FILE_FORMAT,
  NOHAL_PROJECT_LIBRARY_FILE_VERSION,
  NOHAL_PROJECT_SHEET_FILE_FORMAT,
  NOHAL_PROJECT_SHEET_FILE_VERSION,
} from "../shared/fileFormats";
import { slugify } from "../shared/id";
import { parseNoHALProject } from "../shared/project";
import type {
  NoHALProject,
  ProjectLibrary,
  SheetDefinition,
} from "../shared/types";

const PROJECT_DIR_MANIFEST_FILENAME = "project.nohal.json";
const CURRENT_PROJECT_DIR_VERSION = NOHAL_PROJECT_DIR_VERSION;
const PROJECT_LIBRARY_FILENAME = "library.nohal.json";
const SHEETS_DIRNAME = "sheets";
const SHEET_FILE_SUFFIX = ".nohal-sheet.json";
const NOHAL_APP_VERSION =
  typeof packageJson.version === "string" ? packageJson.version : "0.0.0";

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
  return `${filePath}.tmp-${process.pid}-${Date.now()}-${atomicWriteCounter}`;
}

async function writeFileAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  const tempPath = atomicTempPathFor(filePath);
  try {
    await writeFile(tempPath, content, "utf8");
    await rename(tempPath, filePath);
  } catch (error) {
    try {
      await unlink(tempPath);
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
      used.add(node.componentId);
    }
  }
  return used;
}

function createPersistedProjectLibrary(project: NoHALProject): ProjectLibrary {
  const usedComponentIds = getUsedComponentIds(project);
  const components: ProjectLibrary["components"] = {};
  for (const componentId of usedComponentIds) {
    const component = project.library.components[componentId];
    if (!component) continue;
    components[componentId] = component;
  }
  return { components };
}

function createProjectLibraryFile(
  library: ProjectLibrary,
): NoHALProjectLibraryFile {
  return {
    format: NOHAL_PROJECT_LIBRARY_FILE_FORMAT,
    version: NOHAL_PROJECT_LIBRARY_FILE_VERSION,
    savedWith: NOHAL_APP_VERSION,
    library,
  };
}

function createProjectSheetFile(sheet: SheetDefinition): NoHALProjectSheetFile {
  return {
    format: NOHAL_PROJECT_SHEET_FILE_FORMAT,
    version: NOHAL_PROJECT_SHEET_FILE_VERSION,
    savedWith: NOHAL_APP_VERSION,
    sheet,
  };
}

function sheetFileNameForSheet(sheet: SheetDefinition): string {
  const fileId = sheet.id.replace(/^sheet_/, "");
  return `${slugify(sheet.name)}__${fileId}${SHEET_FILE_SUFFIX}`;
}

function normalizeProjectDirectoryTarget(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  const baseName = path.basename(resolved);
  if (baseName === PROJECT_DIR_MANIFEST_FILENAME) return path.dirname(resolved);
  return resolved;
}

async function readProjectDirectoryManifest(
  projectDir: string,
): Promise<NoHALProjectDirManifest> {
  const manifestPath = path.join(projectDir, PROJECT_DIR_MANIFEST_FILENAME);
  const content = await readFile(manifestPath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  if (!isProjectDirManifest(parsed)) {
    throw new Error(`Invalid project manifest: ${manifestPath}`);
  }
  return parsed;
}

async function readProjectDirectory(
  projectDir: string,
  manifest?: NoHALProjectDirManifest,
): Promise<{ project: NoHALProject; projectPath: string }> {
  const normalizedProjectDir = path.resolve(projectDir);
  const dirManifest =
    manifest ?? (await readProjectDirectoryManifest(normalizedProjectDir));

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
    const sheetPath = path.join(normalizedProjectDir, ...relativeParts);
    const content = await readFile(sheetPath, "utf8");
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

  const libraryPath = path.join(normalizedProjectDir, dirManifest.libraryFile);
  const libraryContent = await readFile(libraryPath, "utf8");
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

  return { project, projectPath: normalizedProjectDir };
}

function createProjectDirManifest(
  project: NoHALProject,
): NoHALProjectDirManifest {
  const {
    sheets,
    library: _library,
    ...projectWithoutSheetsAndLibrary
  } = project;
  return {
    format: NOHAL_PROJECT_DIR_FORMAT,
    version: CURRENT_PROJECT_DIR_VERSION,
    savedWith: NOHAL_APP_VERSION,
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

export async function readProjectPath(
  projectPath: string,
): Promise<{ project: NoHALProject; projectPath: string }> {
  const normalizedProjectPath = path.resolve(projectPath);
  const stat = await lstat(normalizedProjectPath);

  if (stat.isDirectory()) {
    return readProjectDirectory(normalizedProjectPath);
  }

  if (path.basename(normalizedProjectPath) !== PROJECT_DIR_MANIFEST_FILENAME) {
    throw new Error(
      `Expected a NoHAL project directory or ${PROJECT_DIR_MANIFEST_FILENAME}`,
    );
  }

  const content = await readFile(normalizedProjectPath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  if (!isProjectDirManifest(parsed)) {
    throw new Error(`Invalid project manifest: ${normalizedProjectPath}`);
  }
  return readProjectDirectory(path.dirname(normalizedProjectPath), parsed);
}

export async function writeProjectDirectory(
  project: NoHALProject,
  targetPath: string,
): Promise<string> {
  const projectDir = normalizeProjectDirectoryTarget(targetPath);
  const sheetsDir = path.join(projectDir, SHEETS_DIRNAME);
  const manifestPath = path.join(projectDir, PROJECT_DIR_MANIFEST_FILENAME);
  const libraryPath = path.join(projectDir, PROJECT_LIBRARY_FILENAME);
  const manifest = createProjectDirManifest(project);
  const persistedLibrary = createPersistedProjectLibrary(project);

  await mkdir(projectDir, { recursive: true });
  await mkdir(sheetsDir, { recursive: true });

  for (const sheetRef of manifest.sheets) {
    const sheet = project.sheets[sheetRef.id];
    if (!sheet) {
      throw new Error(`Missing sheet in project: ${sheetRef.id}`);
    }
    const sheetFilePath = path.join(sheetsDir, path.basename(sheetRef.file));
    await writeFileAtomic(
      sheetFilePath,
      stringifyJson(createProjectSheetFile(sheet)),
    );
  }
  await writeFileAtomic(
    libraryPath,
    stringifyJson(createProjectLibraryFile(persistedLibrary)),
  );
  // Manifest is the commit point for the multi-file project save.
  await writeFileAtomic(manifestPath, stringifyJson(manifest));

  const expectedSheetFiles = new Set(
    manifest.sheets.map((sheetRef) => path.basename(sheetRef.file)),
  );
  const existingEntries = await readdir(sheetsDir, { withFileTypes: true });
  for (const entry of existingEntries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(SHEET_FILE_SUFFIX)) continue;
    if (expectedSheetFiles.has(entry.name)) continue;
    await unlink(path.join(sheetsDir, entry.name));
  }
  return projectDir;
}
