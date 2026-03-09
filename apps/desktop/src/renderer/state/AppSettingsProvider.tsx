import {
  createContext,
  createSignal,
  onMount,
  type ParentProps,
  useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import {
  type AppSettingKey,
  type AppSettings,
  type AppSettingsPatch,
  DEFAULT_APP_SETTINGS,
} from "../../shared/appSettings";

function createAppSettingsState() {
  const [settings, setSettings] =
    createStore<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoaded, setIsLoaded] = createSignal(false);

  onMount(() => {
    void (async () => {
      const loaded = await window.nohal.getAppSettings();
      setSettings(loaded);
      setIsLoaded(true);
    })();
  });

  const updateSettings = async (
    patch: AppSettingsPatch,
  ): Promise<AppSettings> => {
    const next = await window.nohal.updateAppSettings(patch);
    setSettings(next);
    return next;
  };

  const updateSetting = async <K extends AppSettingKey>(
    key: K,
    value: AppSettings[K],
  ): Promise<AppSettings> => {
    return updateSettings({ [key]: value } as AppSettingsPatch);
  };

  return {
    settings,
    isLoaded,
    updateSettings,
    updateSetting,
  };
}

type AppSettingsContextValue = ReturnType<typeof createAppSettingsState>;

const AppSettingsContext = createContext<AppSettingsContextValue>();

export function AppSettingsProvider(props: ParentProps) {
  const state = createAppSettingsState();

  return (
    <AppSettingsContext.Provider value={state}>
      {props.children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("AppSettingsProvider is missing");
  return ctx;
}
