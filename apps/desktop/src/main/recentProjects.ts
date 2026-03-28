import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeLinuxCncVersion } from "@nohal/core/src/linuxcncVersion";
import { app } from "electron";
import type { RecentProjectEntry } from "../shared/recentProjects";

const RECENT_PROJECTS_FILENAME = "recent-projects.json";
const PROJECT_MANIFEST_FILENAME = "project.nohal.json";

async function getRecentProjectsFilePath(): Promise<string> {
  const userDataDir = app.getPath("userData");
  await mkdir(userDataDir, { recursive: true });
  return path.join(userDataDir, RECENT_PROJECTS_FILENAME);
}

async function readRecentProjectsFile(): Promise<RecentProjectEntry[]> {
  const recentsFilePath = await getRecentProjectsFilePath();
  try {
    const content = await readFile(recentsFilePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is RecentProjectEntry =>
        Boolean(
          entry &&
            typeof entry === "object" &&
            typeof (entry as { projectPath?: unknown }).projectPath ===
              "string" &&
            typeof (entry as { lastOpenedAt?: unknown }).lastOpenedAt ===
              "string",
        ),
      )
      .map((entry) => ({
        projectPath: path.resolve(entry.projectPath),
        name: typeof entry.name === "string" ? entry.name : undefined,
        linuxCncVersion:
          typeof entry.linuxCncVersion === "string"
            ? normalizeLinuxCncVersion(entry.linuxCncVersion)
            : undefined,
        lastOpenedAt: entry.lastOpenedAt,
      }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function readProjectLinuxCncVersion(
  projectPath: string,
): Promise<RecentProjectEntry["linuxCncVersion"]> {
  try {
    const manifestPath = path.join(projectPath, PROJECT_MANIFEST_FILENAME);
    const content = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(content) as {
      project?: {
        target?: {
          linuxcncVersion?: unknown;
        };
      };
    };
    if (typeof parsed.project?.target?.linuxcncVersion !== "string") {
      return undefined;
    }
    return normalizeLinuxCncVersion(parsed.project.target.linuxcncVersion);
  } catch {
    return undefined;
  }
}

async function writeRecentProjectsFile(
  entries: RecentProjectEntry[],
): Promise<void> {
  const recentsFilePath = await getRecentProjectsFilePath();
  await writeFile(
    recentsFilePath,
    `${JSON.stringify(entries, null, 2)}\n`,
    "utf8",
  );
}

export async function listRecentProjects(): Promise<RecentProjectEntry[]> {
  const entries = await readRecentProjectsFile();
  const existingEntries = entries.filter((entry) =>
    existsSync(entry.projectPath),
  );
  const hydratedEntries = await Promise.all(
    existingEntries.map(async (entry) => {
      const linuxCncVersion =
        entry.linuxCncVersion ??
        (await readProjectLinuxCncVersion(entry.projectPath));
      return linuxCncVersion === entry.linuxCncVersion
        ? entry
        : {
            ...entry,
            linuxCncVersion,
          };
    }),
  );
  const shouldRewrite =
    hydratedEntries.length !== entries.length ||
    hydratedEntries.some(
      (entry, index) =>
        entry.linuxCncVersion !== entries[index]?.linuxCncVersion,
    );
  if (shouldRewrite) {
    await writeRecentProjectsFile(hydratedEntries);
  }
  return hydratedEntries;
}

export async function touchRecentProject(
  projectPath: string,
  projectName?: string,
  linuxCncVersion?: RecentProjectEntry["linuxCncVersion"],
): Promise<void> {
  const normalizedProjectPath = path.resolve(projectPath);
  const nowIso = new Date().toISOString();
  const current = await readRecentProjectsFile();
  const next: RecentProjectEntry[] = [
    {
      projectPath: normalizedProjectPath,
      name: projectName?.trim() ? projectName : undefined,
      linuxCncVersion,
      lastOpenedAt: nowIso,
    },
    ...current.filter(
      (entry) => path.resolve(entry.projectPath) !== normalizedProjectPath,
    ),
  ].slice(0, 20);
  await writeRecentProjectsFile(next);
}
