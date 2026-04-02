import process from "node:process";
import { app, BrowserWindow } from "electron";
import { registerIpcHandlers } from "./ipc";
import { createWindow } from "./window";

app.whenReady().then(() => {
  registerIpcHandlers();
  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
