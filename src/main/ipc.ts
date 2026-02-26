import { readFile, writeFile } from "node:fs/promises";
import { BrowserWindow, dialog, ipcMain } from "electron";
import { parseCompComponentDefinition } from "../shared/compParser";
import { exportProjectToHal } from "../shared/halExport";
import { createEmptyProject } from "../shared/project";
import type {
  MachineConfigHalFileSelection,
  NoHALProject,
} from "../shared/types";
import {
  addComponentDirSourceToStore,
  deleteComponentSourceFromStore,
  readComponentStoreFile,
  refreshComponentSourceInStore,
  refreshStoredCompEntry,
  saveParsedCompFileToStore,
  scanCompDirectory,
} from "./componentStore";
import {
  buildMachineConfigImportDraft,
  parseMachineConfigImportSetupDraft,
} from "./machineConfigImport";
import { readProjectPath, writeProjectDirectory } from "./projects";
import { listRecentProjects, touchRecentProject } from "./recentProjects";
import {
  promptUnsavedChangesChoice,
  resolveRendererSaveBeforeCloseRequest,
  setWindowDirtyState,
} from "./window";

export function registerIpcHandlers(): void {
  ipcMain.on("nohal:set-window-dirty-state", (evt, isDirty: boolean) => {
    const win = BrowserWindow.fromWebContents(evt.sender);
    if (!win) return;
    setWindowDirtyState(win, Boolean(isDirty));
  });

  ipcMain.on(
    "nohal:reply-save-before-close",
    (evt, requestId: number, didSave: boolean) => {
      resolveRendererSaveBeforeCloseRequest(
        evt.sender.id,
        requestId,
        Boolean(didSave),
      );
    },
  );

  ipcMain.handle("nohal:prompt-unsaved-changes", async (evt) => {
    const win = BrowserWindow.fromWebContents(evt.sender);
    if (!win) return "cancel" as const;
    return promptUnsavedChangesChoice(win);
  });

  ipcMain.handle("nohal:new-project", async () => {
    const project = createEmptyProject("NoHAL Project");
    const res = await dialog.showSaveDialog({
      title: "Create NoHAL Project Folder",
      defaultPath: `${project.name || "project"}.nohal`,
    });
    if (res.canceled || !res.filePath) return null;
    const projectPath = await writeProjectDirectory(project, res.filePath);
    await touchRecentProject(projectPath, project.name);
    return { project, projectPath };
  });

  ipcMain.handle("nohal:get-recent-projects", async () => listRecentProjects());

  ipcMain.handle("nohal:open-project", async () => {
    const res = await dialog.showOpenDialog({
      title: "Open NoHAL Project",
      properties: ["openDirectory"],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const result = await readProjectPath(res.filePaths[0]);
    await touchRecentProject(result.projectPath, result.project.name);
    return result;
  });

  ipcMain.handle("nohal:open-project-at", async (_evt, projectPath: string) => {
    const result = await readProjectPath(projectPath);
    await touchRecentProject(result.projectPath, result.project.name);
    return result;
  });

  ipcMain.handle(
    "nohal:save-project",
    async (_evt, project: NoHALProject, projectPath?: string | null) => {
      let target = projectPath ?? null;
      if (!target) {
        const res = await dialog.showSaveDialog({
          title: "Save NoHAL Project Folder",
          defaultPath: `${project.name || "project"}.nohal`,
        });
        if (res.canceled || !res.filePath) return null;
        target = res.filePath;
      }

      const savedProjectPath = await writeProjectDirectory(project, target);
      await touchRecentProject(savedProjectPath, project.name);
      return { projectPath: savedProjectPath };
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

  ipcMain.handle("nohal:pick-machine-ini-file", async () => {
    const res = await dialog.showOpenDialog({
      title: "Select LinuxCNC INI File",
      properties: ["openFile"],
      filters: [{ name: "INI File", extensions: ["ini"] }],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return parseMachineConfigImportSetupDraft(res.filePaths[0]);
  });

  ipcMain.handle("nohal:pick-machine-hal-file", async () => {
    const res = await dialog.showOpenDialog({
      title: "Select HAL File",
      properties: ["openFile"],
      filters: [{ name: "HAL File", extensions: ["hal"] }],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle(
    "nohal:build-machine-configuration-import",
    async (_evt, iniPath: string, halFiles: MachineConfigHalFileSelection[]) =>
      buildMachineConfigImportDraft(iniPath, halFiles),
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
