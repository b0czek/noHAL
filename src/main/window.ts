import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
