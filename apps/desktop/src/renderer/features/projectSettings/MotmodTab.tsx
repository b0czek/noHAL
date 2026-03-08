import { planMotmodReconcile } from "@nohal/core/src/motmod";
import { createDefaultMotmodConfig } from "@nohal/core/src/project";
import { Show } from "solid-js";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export default function MotmodTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();

  const motmod = () => state.project.motmod ?? createDefaultMotmodConfig();
  const reconcilePlan = () => planMotmodReconcile(state.project);

  const setMotmodNumber = (
    key:
      | "numJoints"
      | "numDio"
      | "numAio"
      | "numSpindles"
      | "numMiscError"
      | "trajPeriodNs",
    rawValue: string,
  ) => {
    const next = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(next)) return;
    actions.updateMotmodNumericConfig(key, next);
  };
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div class="grid gap-6">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">
          {t("projectSettings.motmodTitle")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("projectSettings.motmodHelp")}
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.motmod.numJoints")}
          </span>
          <Input
            type="number"
            min="1"
            step="1"
            value={String(motmod().numJoints)}
            onChange={(evt) =>
              setMotmodNumber("numJoints", evt.currentTarget.value)
            }
          />
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.motmod.numDio")}
          </span>
          <Input
            type="number"
            min="0"
            step="1"
            value={String(motmod().numDio)}
            onChange={(evt) =>
              setMotmodNumber("numDio", evt.currentTarget.value)
            }
          />
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.motmod.numAio")}
          </span>
          <Input
            type="number"
            min="0"
            step="1"
            value={String(motmod().numAio)}
            onChange={(evt) =>
              setMotmodNumber("numAio", evt.currentTarget.value)
            }
          />
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.motmod.trajPeriodNs")}
          </span>
          <Input
            type="number"
            min="0"
            step="1"
            class="mono"
            value={String(motmod().trajPeriodNs)}
            onChange={(evt) =>
              setMotmodNumber("trajPeriodNs", evt.currentTarget.value)
            }
          />
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.motmod.numSpindles")}
          </span>
          <Input
            type="number"
            min="1"
            step="1"
            value={String(motmod().numSpindles)}
            onChange={(evt) =>
              setMotmodNumber("numSpindles", evt.currentTarget.value)
            }
          />
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("projectSettings.motmod.numMiscError")}
          </span>
          <Input
            type="number"
            min="0"
            step="1"
            value={String(motmod().numMiscError)}
            onChange={(evt) =>
              setMotmodNumber("numMiscError", evt.currentTarget.value)
            }
          />
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <div class="grid gap-2 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
          <div class={fieldLabelClass}>
            {t("projectSettings.motmod.threadsDerived")}
          </div>
          <div class="mono text-sm text-muted-foreground">
            {t("projectSettings.motmod.threadsDerivedHelp")}
          </div>
        </div>

        <div class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
          <div class={fieldLabelClass}>
            {t("projectSettings.motmod.syncStatusLabel")}
          </div>
          <div>
            <Badge variant={reconcilePlan().inSync ? "secondary" : "warning"}>
              {reconcilePlan().inSync
                ? t("projectSettings.motmod.syncStatusInSync")
                : t("projectSettings.motmod.syncStatusOutOfSync")}
            </Badge>
          </div>
          <Show when={!reconcilePlan().inSync}>
            <div class="mono text-sm text-muted-foreground">
              {t("projectSettings.motmod.syncSummary", {
                add: reconcilePlan().addNodes.length,
                remove: reconcilePlan().removeNodes.length,
                adopt: reconcilePlan().adoptNodes.length,
                ensure: reconcilePlan().ensureComponents.length,
                update: reconcilePlan().updateNodeConfigs.length,
              })}
            </div>
          </Show>
          <div class="flex justify-start">
            <Button
              type="button"
              disabled={reconcilePlan().inSync}
              onClick={() => actions.syncMotmodManagedProjection()}
            >
              {t("projectSettings.motmod.syncNow")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
