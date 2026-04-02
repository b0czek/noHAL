import { Show } from "solid-js";
import BufferedInput from "../../components/form/BufferedInput";
import { Button } from "../../components/ui/button";
import { useI18n } from "../../i18n";
import { useEditorUi } from "../../state/EditorUiProvider";
import { useSheetSettings } from "./SheetSettingsContext";

export default function InstanceTab() {
  const { t } = useI18n();
  const settings = useSheetSettings();
  const editorUi = useEditorUi();
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
          when={settings.instanceReference()}
          fallback={
            <div class="text-sm text-muted-foreground">
              {settings.isRootSheet()
                ? t("sheetSettings.instanceRootHelp")
                : t("sheetSettings.instanceUnavailable")}
            </div>
          }
        >
          {(instanceReference) => (
            <div class="grid gap-4">
              <div class="grid gap-2">
                <span class={fieldLabelClass}>
                  {t("sheetSettings.referencedSheet")}
                </span>
                <div class="mono rounded-xl bg-white/5 px-3 py-2 text-sm text-foreground">
                  {settings.sheet()?.name ?? t("sheetSettings.missingSheet")}
                </div>
              </div>
              <div class="grid gap-2">
                <span class={fieldLabelClass}>
                  {t("componentDialog.instanceName")}
                </span>
                <BufferedInput
                  value={instanceReference().instanceName}
                  onCommit={(value) =>
                    settings.renameInstance(
                      instanceReference().parentSheetId,
                      instanceReference().nodeId,
                      value,
                    )
                  }
                />
              </div>
              <div class="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const nextSheetId = settings.detachReference(
                      instanceReference().parentSheetId,
                      instanceReference().nodeId,
                    );
                    if (!nextSheetId) return;
                    editorUi.openSheetSettings(nextSheetId, {
                      parentSheetId: instanceReference().parentSheetId,
                      nodeId: instanceReference().nodeId,
                    });
                  }}
                >
                  {t("sheetSettings.detachReference")}
                </Button>
              </div>
            </div>
          )}
        </Show>
      </section>
    </div>
  );
}
