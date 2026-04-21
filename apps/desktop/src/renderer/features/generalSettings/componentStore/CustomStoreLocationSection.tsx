import { HiOutlineArrowUturnLeft, HiOutlineFolderOpen } from "solid-icons/hi";
import { createEffect, createSignal, Match, Switch } from "solid-js";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useI18n } from "../../../i18n";
import { useAppSettings } from "../../../state/AppSettingsProvider";
import { useEditorStore } from "../../../state/EditorStoreProvider";

interface CustomStorePathInfo {
  path: string;
  defaultPath: string;
  isDefault: boolean;
}

export default function CustomStoreLocationSection() {
  const { t } = useI18n();
  const { actions } = useEditorStore();
  const { settings, updateSetting } = useAppSettings();
  const [customStorePathInfo, setCustomStorePathInfo] =
    createSignal<CustomStorePathInfo | null>(null);
  const [isUpdatingCustomStorePath, setIsUpdatingCustomStorePath] =
    createSignal(false);

  const reloadCustomStorePathInfo = async (): Promise<void> => {
    setCustomStorePathInfo(
      await window.nohal.getCustomComponentStorePathInfo(),
    );
  };

  const applyCustomStorePathSetting = async (
    nextPath: string | null,
  ): Promise<void> => {
    setIsUpdatingCustomStorePath(true);
    try {
      await updateSetting("customComponentStoreFilePath", nextPath);
      await actions.loadComponentStore();
    } finally {
      setIsUpdatingCustomStorePath(false);
    }
  };

  const pickCustomStorePath = async (): Promise<void> => {
    const selectedPath = await window.nohal.pickCustomComponentStoreFile(
      customStorePathInfo()?.path ?? null,
    );
    if (!selectedPath) return;
    await applyCustomStorePathSetting(selectedPath);
  };

  const resetCustomStorePath = async (): Promise<void> => {
    await applyCustomStorePathSetting(null);
  };

  createEffect(() => {
    settings.customComponentStoreFilePath;
    void reloadCustomStorePathInfo();
  });

  return (
    <section class="grid gap-3 rounded-2xl bg-black/20 p-4">
      <div class="grid gap-1">
        <div class="text-sm font-semibold tracking-tight">
          {t("componentStore.customStoreLocationLabel")}
        </div>
        <div class="text-xs text-muted-foreground">
          {t("componentStore.customStoreLocationHelp")}
        </div>
      </div>

      <div class="grid gap-2">
        <div class="flex items-center gap-2">
          <Input
            readOnly
            value={customStorePathInfo()?.path ?? ""}
            class="mono min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            title={t("componentStore.chooseCustomStorePath")}
            aria-label={t("componentStore.chooseCustomStorePath")}
            disabled={isUpdatingCustomStorePath()}
            onClick={() => void pickCustomStorePath()}
          >
            <HiOutlineFolderOpen size={16} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={t("componentStore.resetCustomStorePath")}
            aria-label={t("componentStore.resetCustomStorePath")}
            disabled={
              isUpdatingCustomStorePath() || customStorePathInfo()?.isDefault
            }
            onClick={() => void resetCustomStorePath()}
          >
            <HiOutlineArrowUturnLeft size={16} aria-hidden="true" />
          </Button>
        </div>
        <Switch fallback={null}>
          <Match when={customStorePathInfo()?.isDefault}>
            <div class="text-xs text-muted-foreground">
              {t("componentStore.customStoreUsingDefault")}
            </div>
          </Match>
          <Match when={customStorePathInfo()}>
            {(info) => (
              <div class="text-xs text-muted-foreground">
                {t("componentStore.customStoreDefaultPath", {
                  path: info().defaultPath,
                })}
              </div>
            )}
          </Match>
        </Switch>
      </div>
    </section>
  );
}
