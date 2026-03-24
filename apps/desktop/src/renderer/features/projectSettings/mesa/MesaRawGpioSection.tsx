import { For } from "solid-js";
import StringSelect from "../../../components/form/StringSelect";
import { useI18n } from "../../../i18n";
import { useEditorStore } from "../../../state/EditorStoreProvider";

interface MesaRawGpioSectionProps {
  hostId: string;
  connectorKey: string;
  firstIndex: number;
  count: number;
  outputPins: readonly number[];
  outerClass: string;
  titleClass?: string;
  fieldLabelClass: string;
}

export default function MesaRawGpioSection(props: MesaRawGpioSectionProps) {
  const { t } = useI18n();
  const { actions } = useEditorStore();
  const formatMesaGpioIndex = (index: number) => `${index}`.padStart(3, "0");

  const gpioDirectionOptions = () => [
    {
      value: "input",
      label: t("projectSettings.mesa.gpioDirectionInput"),
    },
    {
      value: "output",
      label: t("projectSettings.mesa.gpioDirectionOutput"),
    },
  ];

  const outputPins = () => new Set(props.outputPins);

  return (
    <div class={props.outerClass}>
      <div class={props.titleClass ?? props.fieldLabelClass}>
        {t("projectSettings.mesa.rawGpio")}
      </div>
      <div class="text-sm text-muted-foreground">
        {t("projectSettings.mesa.rawGpioHelp")}
      </div>
      <For
        each={Array.from({ length: props.count }, (_, pinIndex) => pinIndex)}
      >
        {(pinIndex) => (
          <div class="grid gap-2 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
            <div class="text-sm text-muted-foreground">
              {t("projectSettings.mesa.gpioLabel", {
                gpio: formatMesaGpioIndex(props.firstIndex + pinIndex),
              })}
            </div>
            <StringSelect
              value={outputPins().has(pinIndex) ? "output" : "input"}
              options={gpioDirectionOptions()}
              onChange={(value) =>
                actions.setMesaRawGpioPinDirection(
                  props.hostId,
                  props.connectorKey,
                  pinIndex,
                  (value || "input") as "input" | "output",
                )
              }
            />
          </div>
        )}
      </For>
    </div>
  );
}
