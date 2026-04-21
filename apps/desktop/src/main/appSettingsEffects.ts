import type { BrowserWindow } from "electron";
import type { AppSettings } from "../shared/appSettings";

interface AppSettingsEffectContext {
  win?: BrowserWindow | null;
}

export function applyChangedAppSettings(
  ctx: AppSettingsEffectContext,
  next: AppSettings,
  previous?: AppSettings | null,
): void {
  if (!previous || !Object.is(previous.interfaceScale, next.interfaceScale)) {
    ctx.win?.webContents.setZoomFactor(next.interfaceScale);
  }
}
