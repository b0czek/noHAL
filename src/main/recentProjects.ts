import { app } from "electron";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RecentProjectEntry } from "../shared/types";

const RECENT_PROJECTS_FILENAME = "recent-projects.json";

async function getRecentProjectsFilePath(): Promise<string> {
  const userDataDir = app.getPath("userData");
  await mkdir(userDataDir, { recursive: true });
  return path.join(userDataDir, RECENT_PROJECTS_FILENAME);
}

async function readRecentProjectsFile(): Promise<RecentProjectEntry[]> {
  const filePath = await getRecentProjectsFilePath();
  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is RecentProjectEntry =>
          Boolean(
            entry &&
              typeof entry === "object" &&
              typeof (entry as { filePath?: unknown }).filePath === "string" &&
              typeof (entry as { lastOpenedAt?: unknown }).lastOpenedAt === "string"
          )
      )
      .map((entry) => ({
        filePath: path.resolve(entry.filePath),
        name: typeof entry.name === "string" ? entry.name : undefined,
        lastOpenedAt: entry.lastOpenedAt
      }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeRecentProjectsFile(entries: RecentProjectEntry[]): Promise<void> {
  const filePath = await getRecentProjectsFilePath();
  await writeFile(filePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export async function listRecentProjects(): Promise<RecentProjectEntry[]> {
  const entries = await readRecentProjectsFile();
  const filtered = entries.filter((entry) => existsSync(entry.filePath));
  if (filtered.length !== entries.length) {
    await writeRecentProjectsFile(filtered);
  }
  return filtered;
}

export async function touchRecentProject(filePath: string, projectName?: string): Promise<void> {
  const normalizedFilePath = path.resolve(filePath);
  const nowIso = new Date().toISOString();
  const current = await readRecentProjectsFile();
  const next: RecentProjectEntry[] = [
    {
      filePath: normalizedFilePath,
      name: projectName?.trim() ? projectName : undefined,
      lastOpenedAt: nowIso
    },
    ...current.filter((entry) => path.resolve(entry.filePath) !== normalizedFilePath)
  ].slice(0, 20);
  await writeRecentProjectsFile(next);
}
