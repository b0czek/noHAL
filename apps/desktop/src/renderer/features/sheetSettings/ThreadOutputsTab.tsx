import { For, Show } from "solid-js";
import StringSelect from "../../components/form/StringSelect";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useSheetSettings } from "./SheetSettingsContext";

export default function ThreadOutputsTab() {
  const { t } = useI18n();
  const settings = useSheetSettings();
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div class="grid gap-6">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">
          {t("sheetSettings.threadOutputsTitle")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("sheetSettings.threadOutputsHelp")}
        </div>
        <Show when={settings.isRootSheet()}>
          <div class="text-sm text-muted-foreground">
            {t("sheetSettings.rootThreadBindingHelp")}
          </div>
        </Show>
      </div>

      <section class="grid gap-4 rounded-2xl bg-black/20 p-4">
        <div class="flex justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => settings.addThreadOutput()}
          >
            {t("sheetSettings.addThreadOutput")}
          </Button>
        </div>

        <div class="grid gap-3">
          <For each={settings.threadOutputs()}>
            {(output) => (
              <div class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-end">
                <div class="grid gap-2">
                  <span class={fieldLabelClass}>
                    {t("sheetSettings.threadOutputsTitle")}
                  </span>
                  <Input
                    class="mono"
                    value={output.name}
                    onChange={(evt) =>
                      settings.updateThreadOutputName(
                        output.id,
                        evt.currentTarget.value,
                      )
                    }
                  />
                </div>

                <Show when={settings.isRootSheet()}>
                  <div class="grid gap-2">
                    <span class={fieldLabelClass}>
                      {t("sheetSettings.rootThreadBinding")}
                    </span>
                    <StringSelect
                      value={output.halThreadId ?? ""}
                      options={[
                        {
                          value: "",
                          label: t("sheetSettings.rootThreadBindingUnbound"),
                        },
                        ...settings.halThreads().map((thread) => ({
                          value: thread.id,
                          label: thread.name,
                        })),
                      ]}
                      onChange={(value) =>
                        settings.updateThreadOutputHalBinding(
                          output.id,
                          value.trim() || null,
                        )
                      }
                    />
                  </div>
                </Show>

                <div class="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={settings.threadOutputs().length <= 1}
                    onClick={() => settings.removeThreadOutput(output.id)}
                  >
                    {t("common.remove")}
                  </Button>
                </div>
              </div>
            )}
          </For>
        </div>
      </section>
    </div>
  );
}
