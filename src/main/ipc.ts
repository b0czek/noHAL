import { readFile, writeFile } from "node:fs/promises";
import { dialog, ipcMain } from "electron";
import { parseCompComponentDefinition } from "../shared/compParser";
import { exportProjectToHal } from "../shared/exportHal";
import { createEmptyProject, stringifyNoHALProject } from "../shared/project";
import type { NoHALProject } from "../shared/types";
import {
  addComponentDirSourceToStore,
  deleteComponentSourceFromStore,
  readComponentStoreFile,
  refreshComponentSourceInStore,
  refreshStoredCompEntry,
  saveParsedCompFileToStore,
  scanCompDirectory,
} from "./componentStore";
import { readProjectFile } from "./projects";
import { listRecentProjects, touchRecentProject } from "./recentProjects";

export function registerIpcHandlers(): void {
  ipcMain.handle("nohal:new-project", async () =>
    createEmptyProject("NoHAL Project"),
  );

  ipcMain.handle("nohal:get-recent-projects", async () => listRecentProjects());

  ipcMain.handle("nohal:open-project", async () => {
    const res = await dialog.showOpenDialog({
      title: "Open NoHAL Project",
      properties: ["openFile"],
      filters: [{ name: "NoHAL Project", extensions: ["nohal.json", "json"] }],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const result = await readProjectFile(res.filePaths[0]);
    await touchRecentProject(result.filePath, result.project.name);
    return result;
  });

  ipcMain.handle("nohal:open-project-at", async (_evt, filePath: string) => {
    const result = await readProjectFile(filePath);
    await touchRecentProject(result.filePath, result.project.name);
    return result;
  });

  ipcMain.handle(
    "nohal:save-project",
    async (_evt, project: NoHALProject, filePath?: string | null) => {
      let target = filePath ?? null;
      if (!target) {
        const res = await dialog.showSaveDialog({
          title: "Save NoHAL Project",
          defaultPath: `${project.name || "project"}.nohal.json`,
          filters: [
            { name: "NoHAL Project", extensions: ["nohal.json", "json"] },
          ],
        });
        if (res.canceled || !res.filePath) return null;
        target = res.filePath;
      }

      await writeFile(target, stringifyNoHALProject(project), "utf8");
      await touchRecentProject(target, project.name);
      return { filePath: target };
    },
  );

  ipcMain.handle(
    "nohal:export-hal",
    async (_evt, project: NoHALProject, filePath?: string | null) => {
      let target = filePath ?? null;
      if (!target) {
        const res = await dialog.showSaveDialog({
          title: "Export HAL",
          defaultPath: `${project.name || "project"}.hal`,
          filters: [{ name: "HAL File", extensions: ["hal"] }],
        });
        if (res.canceled || !res.filePath) return null;
        target = res.filePath;
      }
      const hal = exportProjectToHal(project);
      await writeFile(target, hal.text, "utf8");
      return { filePath: target, warnings: hal.warnings };
    },
  );

  ipcMain.handle("nohal:load-component-store", async () =>
    readComponentStoreFile(),
  );

  ipcMain.handle("nohal:import-comp-file", async () => {
    const res = await dialog.showOpenDialog({
      title: "Import LinuxCNC .comp",
      properties: ["openFile"],
      filters: [{ name: "HAL Component", extensions: ["comp"] }],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const filePath = res.filePaths[0];
    const content = await readFile(filePath, "utf8");
    const parsed = parseCompComponentDefinition(content, filePath);
    return parsed;
  });

  ipcMain.handle("nohal:import-comp-file-to-store", async () => {
    const res = await dialog.showOpenDialog({
      title: "Import LinuxCNC .comp",
      properties: ["openFile"],
      filters: [{ name: "HAL Component", extensions: ["comp"] }],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return saveParsedCompFileToStore(res.filePaths[0]);
  });

  ipcMain.handle(
    "nohal:pick-directory",
    async (_evt, defaultPath?: string | null) => {
      const res = await dialog.showOpenDialog({
        title: "Select Directory",
        defaultPath: defaultPath ?? undefined,
        properties: ["openDirectory"],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      return res.filePaths[0];
    },
  );

  ipcMain.handle("nohal:scan-comp-dir", async (_evt, dirPath: string) =>
    scanCompDirectory(dirPath),
  );

  ipcMain.handle("nohal:add-comp-dir-source-to-store", async () =>
    addComponentDirSourceToStore(),
  );

  ipcMain.handle(
    "nohal:refresh-component-source-in-store",
    async (_evt, sourceId: string) => refreshComponentSourceInStore(sourceId),
  );

  ipcMain.handle(
    "nohal:delete-component-source-from-store",
    async (_evt, sourceId: string) => deleteComponentSourceFromStore(sourceId),
  );

  ipcMain.handle(
    "nohal:refresh-component-in-store",
    async (_evt, componentId: string) => refreshStoredCompEntry(componentId),
  );

  ipcMain.handle("nohal:read-text-file", async (_evt, filePath: string) =>
    readFile(filePath, "utf8"),
  );
}
