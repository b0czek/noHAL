import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, dialog } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const windowDirtyState = new WeakMap<BrowserWindow, boolean>();
type UnsavedChangesChoice = "save" | "discard" | "cancel";

type PendingSaveBeforeCloseRequest = {
  senderWebContentsId: number;
  resolve: (didSave: boolean) => void;
  timeout: ReturnType<typeof setTimeout>;
};

const pendingSaveBeforeCloseRequests = new Map<
  number,
  PendingSaveBeforeCloseRequest
>();
let nextSaveBeforeCloseRequestId = 1;

export function setWindowDirtyState(
  win: BrowserWindow,
  isDirty: boolean,
): void {
  windowDirtyState.set(win, isDirty);
  if (process.platform === "darwin") {
    win.setDocumentEdited(isDirty);
  }
}

function isWindowDirty(win: BrowserWindow): boolean {
  return windowDirtyState.get(win) === true;
}

export function promptUnsavedChangesChoice(
  win: BrowserWindow,
): UnsavedChangesChoice {
  const choice = dialog.showMessageBoxSync(win, {
    type: "warning",
    buttons: ["Save", "Discard Changes", "Cancel"],
    defaultId: 0,
    cancelId: 2,
    title: "Unsaved Changes",
    message: "This project has unsaved changes.",
    detail: "Save changes before continuing?",
    noLink: true,
  });
  if (choice === 0) return "save";
  if (choice === 1) return "discard";
  return "cancel";
}

async function requestRendererSaveBeforeClose(
  win: BrowserWindow,
): Promise<boolean> {
  const requestId = nextSaveBeforeCloseRequestId++;
  const senderWebContentsId = win.webContents.id;

  const resultPromise = new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      pendingSaveBeforeCloseRequests.delete(requestId);
      resolve(false);
    }, 60_000);
    pendingSaveBeforeCloseRequests.set(requestId, {
      senderWebContentsId,
      resolve,
      timeout,
    });
  });

  win.webContents.send("nohal:request-save-before-close", requestId);
  return resultPromise;
}

export function resolveRendererSaveBeforeCloseRequest(
  senderWebContentsId: number,
  requestId: number,
  didSave: boolean,
): void {
  const pending = pendingSaveBeforeCloseRequests.get(requestId);
  if (!pending) return;
  if (pending.senderWebContentsId !== senderWebContentsId) return;
  pendingSaveBeforeCloseRequests.delete(requestId);
  clearTimeout(pending.timeout);
  pending.resolve(didSave);
}

export function createWindow(): void {
  const preloadCandidates = [
    path.join(__dirname, "../preload/index.cjs"),
    path.join(__dirname, "../preload/index.mjs"),
    path.join(__dirname, "../preload/index.js"),
  ];
  const preloadPath =
    preloadCandidates.find((candidate) => existsSync(candidate)) ??
    preloadCandidates[0];

  const win = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  setWindowDirtyState(win, false);

  let allowDirtyClose = false;
  let closePromptInFlight = false;
  win.on("close", (event) => {
    if (allowDirtyClose) return;
    if (closePromptInFlight) {
      event.preventDefault();
      return;
    }
    if (!isWindowDirty(win)) return;

    event.preventDefault();
    const choice = promptUnsavedChangesChoice(win);
    if (choice === "cancel") {
      return;
    }
    if (choice === "discard") {
      allowDirtyClose = true;
      win.close();
      return;
    }

    closePromptInFlight = true;
    void (async () => {
      const didSave = await requestRendererSaveBeforeClose(win);
      closePromptInFlight = false;
      if (!didSave) return;
      setWindowDirtyState(win, false);
      allowDirtyClose = true;
      win.close();
    })();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
