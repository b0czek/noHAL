import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => ({
  userDataDir: "",
}));

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => mockState.userDataDir),
  },
}));

import { listRecentProjects, touchRecentProject } from "./recentProjects";

const tempDirs: string[] = [];

async function makeTempDir(prefix = "nohal-recent-projects-test-") {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0, tempDirs.length)
      .map((dir) => rm(dir, { recursive: true, force: true })),
  );
  mockState.userDataDir = "";
});

async function writeProjectManifest(
  projectDir: string,
  linuxcncVersion: string,
): Promise<void> {
  await writeFile(
    path.join(projectDir, "project.nohal.json"),
    `${JSON.stringify(
      {
        project: {
          target: {
            linuxcncVersion,
          },
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

describe("recent projects", () => {
  it("backfills the LinuxCNC version from the project manifest", async () => {
    const userDataDir = await makeTempDir("nohal-user-data-");
    mockState.userDataDir = userDataDir;
    const projectDir = await makeTempDir("nohal-project-");
    const recentsFilePath = path.join(userDataDir, "recent-projects.json");
    await writeProjectManifest(projectDir, "2.8");
    await writeFile(
      recentsFilePath,
      `${JSON.stringify(
        [
          {
            projectPath: projectDir,
            name: "Lathe",
            lastOpenedAt: "2026-03-28T12:00:00.000Z",
          },
        ],
        null,
        2,
      )}\n`,
      "utf8",
    );

    const entries = await listRecentProjects();

    expect(entries).toEqual([
      {
        projectPath: projectDir,
        name: "Lathe",
        linuxCncVersion: "2.8",
        lastOpenedAt: "2026-03-28T12:00:00.000Z",
      },
    ]);
    const persisted = JSON.parse(await readFile(recentsFilePath, "utf8")) as
      | Array<{ linuxCncVersion?: string }>
      | undefined;
    expect(persisted?.[0]?.linuxCncVersion).toBe("2.8");
  });

  it("stores the LinuxCNC version when touching a recent project", async () => {
    const userDataDir = await makeTempDir("nohal-user-data-");
    mockState.userDataDir = userDataDir;
    const projectDir = await makeTempDir("nohal-project-");
    const recentsFilePath = path.join(userDataDir, "recent-projects.json");

    await touchRecentProject(projectDir, "Mill", "2.9");

    const persisted = JSON.parse(await readFile(recentsFilePath, "utf8")) as
      | Array<{
          projectPath?: string;
          name?: string;
          linuxCncVersion?: string;
          lastOpenedAt?: string;
        }>
      | undefined;
    expect(persisted?.[0]?.projectPath).toBe(projectDir);
    expect(persisted?.[0]?.name).toBe("Mill");
    expect(persisted?.[0]?.linuxCncVersion).toBe("2.9");
    expect(typeof persisted?.[0]?.lastOpenedAt).toBe("string");
  });
});
