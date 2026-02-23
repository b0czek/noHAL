import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { existsSync } from "node:fs";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEmptyProject,
  parseNoHALProject,
  stringifyNoHALProject
} from "../shared/project";
import { exportProjectToHal } from "../shared/exportHal";
import { parseCompComponentDefinition } from "../shared/compParser";
import type { ImportedComponentDefinition, NoHALProject } from "../shared/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function collectCompFilesRecursive(
  dirPath: string,
  errors: Array<{ filePath: string; error: string }>
): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    errors.push({
      filePath: dirPath,
      error: error instanceof Error ? error.message : String(error)
    });
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...(await collectCompFilesRecursive(fullPath, errors)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".comp")) {
      files.push(fullPath);
    }
  }
  return files;
}

function createWindow(): void {
  const preloadCandidates = [
    path.join(__dirname, "../preload/index.cjs"),
    path.join(__dirname, "../preload/index.mjs"),
    path.join(__dirname, "../preload/index.js")
  ];
  const preloadPath = preloadCandidates.find((candidate) => existsSync(candidate)) ?? preloadCandidates[0];

  const win = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  ipcMain.handle("nohal:new-project", async () => createEmptyProject("NoHAL Project"));

  ipcMain.handle("nohal:open-project", async () => {
    const res = await dialog.showOpenDialog({
      title: "Open NoHAL Project",
      properties: ["openFile"],
      filters: [{ name: "NoHAL Project", extensions: ["nohal.json", "json"] }]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const filePath = res.filePaths[0];
    const content = await readFile(filePath, "utf8");
    const project = parseNoHALProject(content);
    return { project, filePath };
  });

  ipcMain.handle("nohal:save-project", async (_evt, project: NoHALProject, filePath?: string | null) => {
    let target = filePath ?? null;
    if (!target) {
      const res = await dialog.showSaveDialog({
        title: "Save NoHAL Project",
        defaultPath: `${project.name || "project"}.nohal.json`,
        filters: [{ name: "NoHAL Project", extensions: ["nohal.json", "json"] }]
      });
      if (res.canceled || !res.filePath) return null;
      target = res.filePath;
    }

    await writeFile(target, stringifyNoHALProject(project), "utf8");
    return { filePath: target };
  });

  ipcMain.handle("nohal:export-hal", async (_evt, project: NoHALProject, filePath?: string | null) => {
    let target = filePath ?? null;
    if (!target) {
      const res = await dialog.showSaveDialog({
        title: "Export HAL",
        defaultPath: `${project.name || "project"}.hal`,
        filters: [{ name: "HAL File", extensions: ["hal"] }]
      });
      if (res.canceled || !res.filePath) return null;
      target = res.filePath;
    }
    const hal = exportProjectToHal(project);
    await writeFile(target, hal.text, "utf8");
    return { filePath: target, warnings: hal.warnings };
  });

  ipcMain.handle("nohal:import-comp-file", async () => {
    const res = await dialog.showOpenDialog({
      title: "Import LinuxCNC .comp",
      properties: ["openFile"],
      filters: [{ name: "HAL Component", extensions: ["comp"] }]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const filePath = res.filePaths[0];
    const content = await readFile(filePath, "utf8");
    const parsed = parseCompComponentDefinition(content, filePath);
    return parsed;
  });

  ipcMain.handle("nohal:pick-directory", async (_evt, defaultPath?: string | null) => {
    const res = await dialog.showOpenDialog({
      title: "Select Directory",
      defaultPath: defaultPath ?? undefined,
      properties: ["openDirectory"]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle("nohal:scan-comp-dir", async (_evt, dirPath: string) => {
    const imported: ImportedComponentDefinition[] = [];
    const errors: Array<{ filePath: string; error: string }> = [];
    const files = await collectCompFilesRecursive(dirPath, errors);

    for (const filePath of files) {
      try {
        const content = await readFile(filePath, "utf8");
        imported.push(parseCompComponentDefinition(content, filePath));
      } catch (error) {
        errors.push({
          filePath,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { imported, errors };
  });

  ipcMain.handle("nohal:read-text-file", async (_evt, filePath: string) => readFile(filePath, "utf8"));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
