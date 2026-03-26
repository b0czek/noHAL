import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import corePackageJson from "@nohal/core/package.json";
import { buildManagedMachineConfigIniSections } from "@nohal/core/src/machineConfig/policy";
import {
  createEmptyProject,
  createSheet,
  reconcileProject,
} from "@nohal/core/src/project";
import {
  NOHAL_PROJECT_DIR_FORMAT,
  NOHAL_PROJECT_DIR_VERSION,
  NOHAL_PROJECT_LIBRARY_FILE_FORMAT,
  NOHAL_PROJECT_LIBRARY_FILE_VERSION,
  NOHAL_PROJECT_SHEET_FILE_FORMAT,
  NOHAL_PROJECT_SHEET_FILE_VERSION,
} from "@nohal/core/src/project/formats";
import { findSystemSheet } from "@nohal/core/src/sheet";
import type { NoHALProject } from "@nohal/core/src/types";
import { afterEach, describe, expect, it } from "vitest";
import { projectDirectory } from "./coreWrappers";

const tempDirs: string[] = [];
const NOHAL_APP_VERSION =
  typeof corePackageJson.version === "string"
    ? corePackageJson.version
    : "0.0.0";

async function makeTempDir(prefix = "nohal-projects-test-"): Promise<string> {
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
});

function createProjectWithTwoSheets(): NoHALProject {
  const project = createEmptyProject("Spec Test Project");
  const child = createSheet("Child", project.rootSheetId);
  const rootSheet = project.sheets[project.rootSheetId];
  const and2ComponentId = "comp:test-and2";
  return {
    ...project,
    library: {
      components: {
        ...project.library.components,
        [and2ComponentId]: {
          id: and2ComponentId,
          name: "and2",
          halComponentName: "and2",
          source: "comp",
          sourcePath: "tests/components/and2.comp",
          runtime: { kind: "rt" },
          pins: [
            { key: "in0", name: "in0", direction: "in", type: "bit" },
            { key: "in1", name: "in1", direction: "in", type: "bit" },
            { key: "out", name: "out", direction: "out", type: "bit" },
          ],
          params: [],
        },
      },
    },
    sheets: {
      ...project.sheets,
      [project.rootSheetId]: {
        ...rootSheet,
        nodes: [
          ...rootSheet.nodes,
          {
            id: "node_spec_and2",
            kind: "component",
            componentId: and2ComponentId,
            instanceName: "and2.0",
            position: { x: 10, y: 20 },
            paramValues: {},
            hiddenPinKeys: ["in1"],
          },
        ],
      },
      [child.id]: child,
    },
  };
}

describe("projects persistence (directory format)", () => {
  it("saves a project as a directory with a manifest and one file per sheet", async () => {
    const project = createProjectWithTwoSheets();
    const baseDir = await makeTempDir();
    const targetDir = path.join(baseDir, "machine.nohal");

    const savedPath = await projectDirectory.writeProjectDirectory(
      project,
      targetDir,
    );

    expect(savedPath).toBe(targetDir);

    const entries = await readdir(savedPath);
    expect(entries).toContain("project.nohal.json");
    expect(entries).toContain("library.nohal.json");
    expect(entries).toContain("sheets");

    const manifest = JSON.parse(
      await readFile(path.join(savedPath, "project.nohal.json"), "utf8"),
    ) as {
      version?: number;
      savedWith?: string;
      project?: Record<string, unknown>;
    };
    expect(manifest.version).toBe(NOHAL_PROJECT_DIR_VERSION);
    expect(manifest.savedWith).toBe(NOHAL_APP_VERSION);
    expect(manifest.project).toBeDefined();
    expect(manifest.project).not.toHaveProperty("library");

    const libraryFile = JSON.parse(
      await readFile(path.join(savedPath, "library.nohal.json"), "utf8"),
    ) as {
      format?: string;
      version?: number;
      savedWith?: string;
      library?: { components?: Record<string, unknown> };
    };
    expect(libraryFile.format).toBe(NOHAL_PROJECT_LIBRARY_FILE_FORMAT);
    expect(libraryFile.version).toBe(NOHAL_PROJECT_LIBRARY_FILE_VERSION);
    expect(libraryFile.savedWith).toBe(NOHAL_APP_VERSION);
    expect(Object.keys(libraryFile.library?.components ?? {})).toEqual([
      "comp:test-and2",
    ]);

    const sheetFiles = await readdir(path.join(savedPath, "sheets"));
    expect(sheetFiles).toHaveLength(Object.keys(project.sheets).length);
    expect(sheetFiles.every((name) => name.endsWith(".nohal-sheet.json"))).toBe(
      true,
    );
    expect(
      sheetFiles.some((name) =>
        /^top__[a-z0-9]+\.nohal-sheet\.json$/.test(name),
      ),
    ).toBe(true);
    expect(
      sheetFiles.some((name) =>
        /^child__[a-z0-9]+\.nohal-sheet\.json$/.test(name),
      ),
    ).toBe(true);
    const sheetFilePayloads = await Promise.all(
      sheetFiles.map(async (name) => {
        const text = await readFile(
          path.join(savedPath, "sheets", name),
          "utf8",
        );
        return JSON.parse(text) as {
          format?: string;
          version?: number;
          savedWith?: string;
          sheet?: { id?: string };
        };
      }),
    );
    expect(
      sheetFilePayloads.every(
        (payload) =>
          payload.format === NOHAL_PROJECT_SHEET_FILE_FORMAT &&
          payload.version === NOHAL_PROJECT_SHEET_FILE_VERSION &&
          payload.savedWith === NOHAL_APP_VERSION &&
          typeof payload.sheet?.id === "string",
      ),
    ).toBe(true);

    expect(entries.some((name) => name.includes(".tmp-"))).toBe(false);
    expect(sheetFiles.some((name) => name.includes(".tmp-"))).toBe(false);
  });

  it("round-trips when opening from the project directory path", async () => {
    const project = createProjectWithTwoSheets();
    const baseDir = await makeTempDir();
    const targetDir = path.join(baseDir, "roundtrip.nohal");

    await projectDirectory.writeProjectDirectory(project, targetDir);
    const loaded = await projectDirectory.readProjectPath(targetDir);

    expect(loaded.projectPath).toBe(targetDir);
    expect(loaded.savedWith).toBe(NOHAL_APP_VERSION);
    expect(loaded.project).toEqual(project);
  });

  it("rejects project manifests with an unsupported version", async () => {
    const project = createProjectWithTwoSheets();
    const baseDir = await makeTempDir();
    const targetDir = path.join(baseDir, "legacy-v1.nohal");
    const sheetsDir = path.join(targetDir, "sheets");
    await mkdir(sheetsDir, { recursive: true });

    const { sheets, library, ...projectWithoutSheetsAndLibrary } = project;
    const sheetRefs = Object.keys(sheets)
      .sort()
      .map((sheetId, index) => ({
        id: sheetId,
        file: `sheets/sheet-${index}.nohal-sheet.json`,
      }));

    await writeFile(
      path.join(targetDir, "project.nohal.json"),
      `${JSON.stringify(
        {
          format: NOHAL_PROJECT_DIR_FORMAT,
          version: 0,
          project: projectWithoutSheetsAndLibrary,
          libraryFile: "library.nohal.json",
          sheets: sheetRefs,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    await writeFile(
      path.join(targetDir, "library.nohal.json"),
      `${JSON.stringify(library, null, 2)}\n`,
      "utf8",
    );
    for (const sheetRef of sheetRefs) {
      await writeFile(
        path.join(targetDir, sheetRef.file),
        `${JSON.stringify(sheets[sheetRef.id], null, 2)}\n`,
        "utf8",
      );
    }

    await expect(
      projectDirectory.readProjectPath(targetDir),
    ).rejects.toThrowError(/Invalid project manifest/);
  });

  it("round-trips when opening from the manifest file path", async () => {
    const project = createProjectWithTwoSheets();
    const baseDir = await makeTempDir();
    const targetDir = path.join(baseDir, "manifest-open.nohal");

    await projectDirectory.writeProjectDirectory(project, targetDir);
    const loaded = await projectDirectory.readProjectPath(
      path.join(targetDir, "project.nohal.json"),
    );

    expect(loaded.projectPath).toBe(targetDir);
    expect(loaded.savedWith).toBe(NOHAL_APP_VERSION);
    expect(loaded.project).toEqual(project);
  });

  it("persists referenced system-derived custom overrides across save and reopen", async () => {
    const project = createEmptyProject("Halui Override");
    const systemSheet = findSystemSheet(project);
    if (!systemSheet) throw new Error("expected system sheet");

    const haluiNode = systemSheet.nodes.find(
      (
        node,
      ): node is (typeof systemSheet.nodes)[number] & { kind: "component" } =>
        node.kind === "component" && node.instanceName === "halui",
    );
    if (!haluiNode) throw new Error("expected halui node");

    project.library.components["halimport:halui"] = {
      id: "halimport:halui",
      name: "halui",
      halComponentName: "halui",
      source: "manual",
      runtime: { kind: "userspace" },
      pins: [
        {
          key: "program_run",
          name: "program.run",
          direction: "in",
          type: "bit",
        },
        {
          key: "mode_is_manual",
          name: "mode.is-manual",
          direction: "out",
          type: "bit",
        },
        {
          key: "extra_status",
          name: "extra-status",
          direction: "out",
          type: "bit",
        },
      ],
      params: [],
    };
    haluiNode.componentId = "halimport:halui";
    reconcileProject(project);

    expect(haluiNode.componentId).toBe("halimport:halui");
    expect(project.library.components["halimport:halui"]?.system?.manager).toBe(
      "halui-custom",
    );

    const baseDir = await makeTempDir();
    const targetDir = path.join(baseDir, "halui-override.nohal");

    await projectDirectory.writeProjectDirectory(project, targetDir);
    const loaded = await projectDirectory.readProjectPath(targetDir);

    expect(loaded.project.library.components["halimport:halui"]).toBeDefined();
    expect(
      loaded.project.library.components["halimport:halui"]?.system?.manager,
    ).toBe("halui-custom");
    expect(() =>
      buildManagedMachineConfigIniSections(loaded.project),
    ).not.toThrow();
  });

  it("removes stale sheet files on subsequent saves after a sheet is deleted", async () => {
    const project = createProjectWithTwoSheets();
    const baseDir = await makeTempDir();
    const targetDir = path.join(baseDir, "prune.nohal");

    await projectDirectory.writeProjectDirectory(project, targetDir);

    const childSheetId = Object.values(project.sheets).find(
      (sheet) => sheet.name === "Child",
    )?.id;
    expect(childSheetId).toBeDefined();
    if (!childSheetId) return;
    const nextProject: NoHALProject = {
      ...project,
      sheets: Object.fromEntries(
        Object.entries(project.sheets).filter(
          ([sheetId]) => sheetId !== childSheetId,
        ),
      ),
    };

    await projectDirectory.writeProjectDirectory(nextProject, targetDir);

    const sheetFiles = await readdir(path.join(targetDir, "sheets"));
    expect(sheetFiles).toHaveLength(Object.keys(nextProject.sheets).length);
    expect(sheetFiles.some((name) => name.includes(childSheetId))).toBe(false);
  });

  it("rejects invalid manifests even if the filename matches", async () => {
    const baseDir = await makeTempDir();
    const projectDir = path.join(baseDir, "broken.nohal");
    await mkdir(projectDir, { recursive: true });
    const manifestPath = path.join(projectDir, "project.nohal.json");
    await writeFile(
      manifestPath,
      `${JSON.stringify({ format: "nohal-project", version: 1 }, null, 2)}\n`,
      "utf8",
    );

    await expect(
      projectDirectory.readProjectPath(manifestPath),
    ).rejects.toThrowError(/Invalid project manifest/);
  });
});
