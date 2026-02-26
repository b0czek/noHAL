import { createDefaultMotmodConfig } from "../../../shared/project";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export default function MotmodTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();

  const motmod = () => state.project.motmod ?? createDefaultMotmodConfig();

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

  return (
    <>
      <div class="panel-title">{t("projectSettings.motmodTitle")}</div>
      <div class="muted">{t("projectSettings.motmodHelp")}</div>

      <div class="project-settings-form-list">
        <label>
          <span class="threads-field-label">
            {t("projectSettings.motmod.numJoints")}
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={String(motmod().numJoints)}
            onChange={(evt) =>
              setMotmodNumber("numJoints", evt.currentTarget.value)
            }
          />
        </label>

        <label>
          <span class="threads-field-label">
            {t("projectSettings.motmod.numDio")}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={String(motmod().numDio)}
            onChange={(evt) =>
              setMotmodNumber("numDio", evt.currentTarget.value)
            }
          />
        </label>

        <label>
          <span class="threads-field-label">
            {t("projectSettings.motmod.numAio")}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={String(motmod().numAio)}
            onChange={(evt) =>
              setMotmodNumber("numAio", evt.currentTarget.value)
            }
          />
        </label>

        <label>
          <span class="threads-field-label">
            {t("projectSettings.motmod.trajPeriodNs")}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            class="mono"
            value={String(motmod().trajPeriodNs)}
            onChange={(evt) =>
              setMotmodNumber("trajPeriodNs", evt.currentTarget.value)
            }
          />
        </label>

        <label>
          <span class="threads-field-label">
            {t("projectSettings.motmod.numSpindles")}
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={String(motmod().numSpindles)}
            onChange={(evt) =>
              setMotmodNumber("numSpindles", evt.currentTarget.value)
            }
          />
        </label>

        <label>
          <span class="threads-field-label">
            {t("projectSettings.motmod.numMiscError")}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={String(motmod().numMiscError)}
            onChange={(evt) =>
              setMotmodNumber("numMiscError", evt.currentTarget.value)
            }
          />
        </label>

        <div class="project-settings-note">
          <div class="threads-field-label">
            {t("projectSettings.motmod.threadsDerived")}
          </div>
          <div class="muted mono">
            {t("projectSettings.motmod.threadsDerivedHelp")}
          </div>
        </div>
      </div>
    </>
  );
}
