import BufferedInput from "../../components/form/BufferedInput";
import { useI18n } from "../../i18n";
import { useSheetSettings } from "./SheetSettingsContext";

export default function SheetTab() {
  const { t } = useI18n();
  const settings = useSheetSettings();
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div class="grid gap-6">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">{t("sheetSettings.sheetTitle")}</div>
        <div class="text-sm text-muted-foreground">
          {t("sheetSettings.sheetHelp")}
        </div>
      </div>

      <section class="grid gap-4 rounded-2xl bg-black/20 p-4">
        <div class="grid gap-2">
          <span class={fieldLabelClass}>{t("common.name")}</span>
          <BufferedInput
            value={settings.sheet()?.name ?? ""}
            onCommit={(value) => settings.renameSheetDefinition(value)}
          />
        </div>
      </section>
    </div>
  );
}
