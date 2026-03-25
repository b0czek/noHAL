import type { ProjectMesaGpioDirection } from "@nohal/core/src/mesa";
import { For } from "solid-js";
import { Button } from "../../../components/ui/button";
import { useI18n } from "../../../i18n";

interface MesaRawGpioSectionProps {
  hostId: string;
  connectorKey: string;
  firstIndex: number;
  count: number;
  outputPins: readonly number[];
  outerClass: string;
  titleClass?: string;
  fieldLabelClass: string;
  onSetPinDirection: (
    hostId: string,
    connectorKey: string,
    pinIndex: number,
    direction: ProjectMesaGpioDirection,
  ) => void;
}

export default function MesaRawGpioSection(props: MesaRawGpioSectionProps) {
  const { t } = useI18n();
  const formatMesaGpioIndex = (index: number) => `${index}`.padStart(3, "0");

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
            <div class="inline-flex min-h-9 w-fit items-center gap-2 rounded-xl bg-black/20 p-1">
              <Button
                type="button"
                size="sm"
                variant={outputPins().has(pinIndex) ? "ghost" : "default"}
                onClick={() =>
                  props.onSetPinDirection(
                    props.hostId,
                    props.connectorKey,
                    pinIndex,
                    "input",
                  )
                }
              >
                {t("projectSettings.mesa.gpioDirectionInput")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={outputPins().has(pinIndex) ? "default" : "ghost"}
                onClick={() =>
                  props.onSetPinDirection(
                    props.hostId,
                    props.connectorKey,
                    pinIndex,
                    "output",
                  )
                }
              >
                {t("projectSettings.mesa.gpioDirectionOutput")}
              </Button>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}
