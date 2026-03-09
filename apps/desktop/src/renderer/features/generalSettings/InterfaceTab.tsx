import { For } from "solid-js";
import type {
  AppSettingDefinition,
  AppSettingKey,
  AppSettings,
} from "../../../shared/appSettingsRegistry";
import { listAppSettingDefinitions } from "../../../shared/appSettingsRegistry";
import StringSelect from "../../components/form/StringSelect";
import { useI18n } from "../../i18n";
import { useAppSettings } from "../../state/AppSettingsProvider";

export default function InterfaceTab() {
  const { t } = useI18n();
  const { settings, updateSetting } = useAppSettings();
  const interfaceSettings = () => listAppSettingDefinitions("interface");
  const translationKey = (value: string) => value as Parameters<typeof t>[0];

  const settingValue = <K extends AppSettingKey>(
    definition: AppSettingDefinition<K>,
  ) => definition.serialize(settings[definition.key]);

  const settingOptions = <K extends AppSettingKey>(
    definition: AppSettingDefinition<K>,
  ) =>
    definition.options.map((option) => ({
      value: definition.serialize(option.value),
      label: option.label,
    }));

  const updateDefinition = <K extends AppSettingKey>(
    definition: AppSettingDefinition<K>,
    value: string,
  ): Promise<AppSettings> =>
    updateSetting(definition.key, definition.deserialize(value));

  return (
    <div class="grid gap-6">
      <div class="grid gap-2">
        <h2 class="text-lg font-semibold tracking-tight">
          {t("generalSettings.interfaceTitle")}
        </h2>
        <p class="max-w-2xl text-sm text-muted-foreground">
          {t("generalSettings.interfaceHelp")}
        </p>
      </div>

      <For each={interfaceSettings()}>
        {(definition) => (
          <section class="grid gap-4 rounded-2xl bg-black/20 p-4">
            <div class="grid gap-1">
              <div class="text-sm font-semibold tracking-tight">
                {t(translationKey(definition.labelKey))}
              </div>
              <div class="text-xs text-muted-foreground">
                {t(translationKey(definition.helpKey))}
              </div>
            </div>

            <StringSelect
              value={settingValue(definition)}
              class="w-full max-w-xs"
              options={settingOptions(definition)}
              onChange={(value) => void updateDefinition(definition, value)}
            />
          </section>
        )}
      </For>
    </div>
  );
}
