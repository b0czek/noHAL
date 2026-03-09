import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import {
  type AppSettings,
  type AppSettingsPatch,
  DEFAULT_APP_SETTINGS,
  mergeAppSettings,
  sanitizeAppSettings,
} from "../shared/appSettings";

const APP_SETTINGS_FILENAME = "app-settings.json";

async function appSettingsFilePath(): Promise<string> {
  const userDataDir = app.getPath("userData");
  await mkdir(userDataDir, { recursive: true });
  return path.join(userDataDir, APP_SETTINGS_FILENAME);
}

async function writeAppSettingsFile(settings: AppSettings): Promise<void> {
  const filePath = await appSettingsFilePath();
  await writeFile(filePath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

export const appSettings = {
  async read(): Promise<AppSettings> {
    const filePath = await appSettingsFilePath();
    try {
      const content = await readFile(filePath, "utf8");
      return sanitizeAppSettings(JSON.parse(content) as unknown);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return DEFAULT_APP_SETTINGS;
      }
      throw error;
    }
  },

  async write(settings: AppSettings): Promise<AppSettings> {
    const next = sanitizeAppSettings(settings);
    await writeAppSettingsFile(next);
    return next;
  },

  async update(
    patch: AppSettingsPatch,
  ): Promise<{ previous: AppSettings; current: AppSettings }> {
    const previous = await this.read();
    const current = mergeAppSettings(previous, patch);
    await writeAppSettingsFile(current);
    return { previous, current };
  },
};
