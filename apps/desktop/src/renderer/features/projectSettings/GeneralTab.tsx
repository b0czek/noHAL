import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export default function GeneralTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div class="grid gap-6">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">
          {t("projectSettings.generalTitle")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("projectSettings.generalHelp")}
        </div>
      </div>

      <section class="grid gap-4 rounded-2xl bg-black/20 p-4">
        <div class="grid gap-1">
          <div class="text-sm font-semibold tracking-tight">
            {t("projectSettings.generalProjectName")}
          </div>
          <div class="text-xs text-muted-foreground">
            {t("projectSettings.generalProjectNameHelp")}
          </div>
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.generalProjectName")}
          </span>
          <Input
            type="text"
            value={state.project.name}
            onChange={(evt) =>
              actions.updateProjectName(evt.currentTarget.value)
            }
          />
        </div>
      </section>
    </div>
  );
}
