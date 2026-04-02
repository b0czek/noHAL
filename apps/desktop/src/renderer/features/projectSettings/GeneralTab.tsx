import StringSelect from "../../components/form/StringSelect";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export default function GeneralTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
  const wireVisibilityOptions = () => [
    {
      value: "under-components",
      label: t("projectSettings.generalWireLayerUnder"),
    },
    {
      value: "above-components",
      label: t("projectSettings.generalWireLayerAbove"),
    },
  ];
  const wireStyleOptions = () => [
    {
      value: "right-angle",
      label: t("projectSettings.generalWireStyleRightAngle"),
    },
    {
      value: "straight",
      label: t("projectSettings.generalWireStyleStraight"),
    },
    {
      value: "curved",
      label: t("projectSettings.generalWireStyleCurved"),
    },
  ];
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

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.generalWireLayer")}
          </span>
          <StringSelect
            value={state.project.ui.wireLayerPosition}
            class="w-full max-w-xs"
            options={wireVisibilityOptions()}
            onChange={(value) =>
              actions.updateProjectWireLayerPosition(
                value as "under-components" | "above-components",
              )
            }
          />
          <div class="text-xs text-muted-foreground">
            {t("projectSettings.generalWireLayerHelp")}
          </div>
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.generalWireStyle")}
          </span>
          <StringSelect
            value={state.project.ui.wireStyle}
            class="w-full max-w-xs"
            options={wireStyleOptions()}
            onChange={(value) =>
              actions.updateProjectWireStyle(
                value as "right-angle" | "straight" | "curved",
              )
            }
          />
          <div class="text-xs text-muted-foreground">
            {t("projectSettings.generalWireStyleHelp")}
          </div>
        </div>
      </section>
    </div>
  );
}
