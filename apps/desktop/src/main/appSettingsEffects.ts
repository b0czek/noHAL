import type { BrowserWindow } from "electron";
import {
  type AppSettingKey,
  type AppSettings,
  listAppSettingKeys,
} from "../shared/appSettings";

interface AppSettingsEffectContext {
  win?: BrowserWindow | null;
}

async function applySettingEffect(
  ctx: AppSettingsEffectContext,
  key: AppSettingKey,
  next: AppSettings,
): Promise<void> {
  switch (key) {
    case "interfaceScale":
      ctx.win?.webContents.setZoomFactor(next.interfaceScale);
      return;
    case "locale":
      return;
  }
}

export async function applyChangedAppSettings(
  ctx: AppSettingsEffectContext,
  next: AppSettings,
  previous?: AppSettings | null,
): Promise<void> {
  for (const key of listAppSettingKeys()) {
    if (previous && Object.is(previous[key], next[key])) continue;
    await applySettingEffect(ctx, key, next);
  }
}
