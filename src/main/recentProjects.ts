import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import type { RecentProjectEntry } from "../shared/types";

const RECENT_PROJECTS_FILENAME = "recent-projects.json";

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
        lastOpenedAt: entry.lastOpenedAt,
      }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
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
  const filtered = entries.filter((entry) => existsSync(entry.projectPath));
  if (filtered.length !== entries.length) {
    await writeRecentProjectsFile(filtered);
  }
  return filtered;
}

export async function touchRecentProject(
  projectPath: string,
  projectName?: string,
): Promise<void> {
  const normalizedProjectPath = path.resolve(projectPath);
  const nowIso = new Date().toISOString();
  const current = await readRecentProjectsFile();
  const next: RecentProjectEntry[] = [
    {
      projectPath: normalizedProjectPath,
      name: projectName?.trim() ? projectName : undefined,
      lastOpenedAt: nowIso,
    },
    ...current.filter(
      (entry) => path.resolve(entry.projectPath) !== normalizedProjectPath,
    ),
  ].slice(0, 20);
  await writeRecentProjectsFile(next);
}
