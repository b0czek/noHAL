import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { existsSync } from "node:fs";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createEmptyProject,
  parseNochalProject,
  stringifyNochalProject
} from "../shared/project";
import { exportProjectToHal } from "../shared/exportHal";
import { parseCompComponentDefinition } from "../shared/compParser";
import type { ImportedComponentDefinition, NochalProject } from "../shared/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  ipcMain.handle("nochal:new-project", async () => createEmptyProject("Nochal Project"));

  ipcMain.handle("nochal:open-project", async () => {
    const res = await dialog.showOpenDialog({
      title: "Open Nochal Project",
      properties: ["openFile"],
      filters: [{ name: "Nochal Project", extensions: ["nochal.json", "json"] }]
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const filePath = res.filePaths[0];
    const content = await readFile(filePath, "utf8");
    const project = parseNochalProject(content);
    return { project, filePath };
  });

  ipcMain.handle("nochal:save-project", async (_evt, project: NochalProject, filePath?: string | null) => {
    let target = filePath ?? null;
    if (!target) {
      const res = await dialog.showSaveDialog({
        title: "Save Nochal Project",
        defaultPath: `${project.name || "project"}.nochal.json`,
        filters: [{ name: "Nochal Project", extensions: ["nochal.json", "json"] }]
      });
      if (res.canceled || !res.filePath) return null;
      target = res.filePath;
    }

    await writeFile(target, stringifyNochalProject(project), "utf8");
    return { filePath: target };
  });

  ipcMain.handle("nochal:export-hal", async (_evt, project: NochalProject, filePath?: string | null) => {
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

  ipcMain.handle("nochal:import-comp-file", async () => {
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

  ipcMain.handle("nochal:scan-comp-dir", async (_evt, dirPath: string) => {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".comp"))
      .map((entry) => path.join(dirPath, entry.name));

    const imported: ImportedComponentDefinition[] = [];
    const errors: Array<{ filePath: string; error: string }> = [];

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

  ipcMain.handle("nochal:read-text-file", async (_evt, filePath: string) => readFile(filePath, "utf8"));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
