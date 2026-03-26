import { Show } from "solid-js";
import BufferedInput from "../../components/form/BufferedInput";
import { useI18n } from "../../i18n";
import { useSheetSettings } from "./SheetSettingsContext";

export default function InstanceTab() {
  const { t } = useI18n();
  const settings = useSheetSettings();
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div class="grid gap-6">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">
          {t("sheetSettings.instanceTitle")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("sheetSettings.instanceHelp")}
        </div>
      </div>

      <section class="grid gap-4 rounded-2xl bg-black/20 p-4">
        <Show
          when={settings.instanceNode()}
          fallback={
            <div class="text-sm text-muted-foreground">
              {settings.isRootSheet()
                ? t("sheetSettings.instanceRootHelp")
                : t("sheetSettings.instanceUnavailable")}
            </div>
          }
        >
          {(instanceNode) => (
            <div class="grid gap-2">
              <span class={fieldLabelClass}>
                {t("componentDialog.instanceName")}
              </span>
              <BufferedInput
                value={instanceNode().instanceName}
                onCommit={settings.renameInstance}
              />
            </div>
          )}
        </Show>
      </section>
    </div>
  );
}
