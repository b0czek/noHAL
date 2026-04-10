import { readFile } from "node:fs/promises";
import { parseCompComponentDefinition } from "@nohal/core/compParser";
import { normalizeLinuxCncVersion } from "@nohal/core/linuxcncVersion";
import { createEmptyProject, reconcileProject } from "@nohal/core/project";
import type {
  ComponentDefinition,
  ImportedComponentDefinition,
  MachineConfigHalFileSelection,
  NoHALProject,
} from "@nohal/core/types";
import { BrowserWindow, clipboard, dialog, ipcMain } from "electron";
import { appSettings } from "./appSettings";
import { applyChangedAppSettings } from "./appSettingsEffects";
import { componentStore } from "./componentStore";
import {
  machineConfigImport,
  projectBuild,
  projectDirectory,
} from "./coreWrappers";
import {
  getProjectVersionWarning,
  NOHAL_APP_VERSION,
} from "./projectVersionWarning";
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

  ipcMain.on("nohal:read-clipboard-text", (evt) => {
    evt.returnValue = clipboard.readText();
  });

  ipcMain.on("nohal:write-clipboard-text", (evt, text: string) => {
    clipboard.writeText(text);
    evt.returnValue = null;
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

  ipcMain.handle("nohal:get-app-settings", async () => appSettings.read());

  ipcMain.handle("nohal:update-app-settings", async (evt, patch) => {
    const { previous, current } = await appSettings.update(patch);
    const win = BrowserWindow.fromWebContents(evt.sender);
    await applyChangedAppSettings({ win }, current, previous);
    return current;
  });

  ipcMain.handle(
    "nohal:new-project",
    async (_evt, linuxcncVersion?: string) => {
      const project = createEmptyProject("NoHAL Project");
      project.target.linuxcncVersion =
        normalizeLinuxCncVersion(linuxcncVersion);
      reconcileProject(project);
      return { project };
    },
  );

  ipcMain.handle("nohal:get-recent-projects", async () => listRecentProjects());

  const maybeWarnAboutNewerProject = async (
    win: BrowserWindow | null,
    savedWith?: string,
  ) => {
    if (!win) return;
    const warning = getProjectVersionWarning(savedWith);
    if (!warning) return;
    await dialog.showMessageBox(win, {
      type: "warning",
      buttons: ["Open Project"],
      defaultId: 0,
      cancelId: 0,
      title: warning.title,
      message: warning.message,
      detail: warning.detail,
      noLink: true,
    });
  };

  ipcMain.handle("nohal:open-project", async (evt) => {
    const res = await dialog.showOpenDialog({
      title: "Open NoHAL Project",
      properties: ["openDirectory"],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    const result = await projectDirectory.readProjectPath(res.filePaths[0]);
    const win = BrowserWindow.fromWebContents(evt.sender);
    await maybeWarnAboutNewerProject(win, result.savedWith);
    await touchRecentProject(
      result.projectPath,
      result.project.name,
      result.project.target.linuxcncVersion,
    );
    return result;
  });

  ipcMain.handle("nohal:open-project-at", async (evt, projectPath: string) => {
    const result = await projectDirectory.readProjectPath(projectPath);
    const win = BrowserWindow.fromWebContents(evt.sender);
    await maybeWarnAboutNewerProject(win, result.savedWith);
    await touchRecentProject(
      result.projectPath,
      result.project.name,
      result.project.target.linuxcncVersion,
    );
    return result;
  });

  ipcMain.handle(
    "nohal:save-project",
    async (_evt, project: NoHALProject, projectPath?: string | null) => {
      let target = projectPath ?? null;
      if (!target) {
        const res = await dialog.showOpenDialog({
          title: "Select NoHAL Project Folder",
          properties: ["openDirectory", "createDirectory"],
        });
        if (res.canceled || res.filePaths.length === 0) return null;
        target = res.filePaths[0];
      }

      const savedProjectPath = await projectDirectory.writeProjectDirectory(
        project,
        target,
        { savedWith: NOHAL_APP_VERSION },
      );
      await touchRecentProject(
        savedProjectPath,
        project.name,
        project.target.linuxcncVersion,
      );
      return { projectPath: savedProjectPath };
    },
  );

  ipcMain.handle(
    "nohal:build-project",
    async (_evt, project: NoHALProject, projectPath: string) =>
      projectBuild.buildProjectIntoDirectory(project, projectPath),
  );

  ipcMain.handle("nohal:pick-machine-ini-file", async () => {
    const res = await dialog.showOpenDialog({
      title: "Select LinuxCNC INI File",
      properties: ["openFile"],
      filters: [{ name: "INI File", extensions: ["ini"] }],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return machineConfigImport.parseMachineConfigImportSetupDraft(
      res.filePaths[0],
    );
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
      machineConfigImport.buildMachineConfigImportDraft(iniPath, halFiles),
  );

  ipcMain.handle("nohal:load-component-store", async () =>
    componentStore.readComponentStoreFile(),
  );

  ipcMain.handle(
    "nohal:add-manual-component-to-store",
    async (_evt, halComponentName?: string) =>
      componentStore.addManualComponentToStore(halComponentName),
  );

  ipcMain.handle(
    "nohal:update-manual-component-in-store",
    async (_evt, componentId: string, component: ImportedComponentDefinition) =>
      componentStore.updateManualComponentInStore(componentId, component),
  );

  ipcMain.handle(
    "nohal:remove-manual-component-from-store",
    async (_evt, componentId: string) =>
      componentStore.removeManualComponentFromStore(componentId),
  );

  ipcMain.handle(
    "nohal:promote-project-custom-component-to-store",
    async (_evt, component: ComponentDefinition) =>
      componentStore.promoteProjectCustomComponentToStore(component),
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
    return componentStore.saveParsedCompFileToStore(res.filePaths[0]);
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
    componentStore.scanCompDirectory(dirPath),
  );

  ipcMain.handle("nohal:add-comp-dir-source-to-store", async () =>
    componentStore.addComponentDirSourceToStore(),
  );

  ipcMain.handle(
    "nohal:refresh-component-source-in-store",
    async (_evt, sourceId: string) =>
      componentStore.refreshComponentSourceInStore(sourceId),
  );

  ipcMain.handle(
    "nohal:delete-component-source-from-store",
    async (_evt, sourceId: string) =>
      componentStore.deleteComponentSourceFromStore(sourceId),
  );

  ipcMain.handle(
    "nohal:refresh-component-in-store",
    async (_evt, componentId: string) =>
      componentStore.refreshStoredCompEntry(componentId),
  );

  ipcMain.handle("nohal:read-text-file", async (_evt, filePath: string) =>
    readFile(filePath, "utf8"),
  );
}
