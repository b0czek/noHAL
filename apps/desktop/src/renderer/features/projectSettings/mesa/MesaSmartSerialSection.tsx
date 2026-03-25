import {
  MESA_SMART_SERIAL_CARDS,
  type ProjectMesaSmartSerialCardKind,
} from "@nohal/core/src/mesa";
import { For } from "solid-js";
import StringSelect from "../../../components/form/StringSelect";
import { useI18n } from "../../../i18n";

interface MesaSmartSerialSectionProps {
  hostId: string;
  ports: readonly {
    key: string;
    label: string;
    channels: number;
    channelOffset?: number;
  }[];
  smartSerialMap: (connectorKey?: string) => Map<string, string>;
  connectorKey?: string;
  outerClass: string;
  titleClass?: string;
  fieldLabelClass: string;
  onSetSmartSerialCard: (
    hostId: string,
    target: {
      connectorKey?: string;
      portKey: string;
      channel: number;
    },
    cardKind: ProjectMesaSmartSerialCardKind | undefined,
  ) => void;
}

export default function MesaSmartSerialSection(
  props: MesaSmartSerialSectionProps,
) {
  const { t } = useI18n();

  const smartSerialOptions = () => [
    {
      value: "",
      label: t("projectSettings.mesa.noCard"),
    },
    ...MESA_SMART_SERIAL_CARDS.map((card) => ({
      value: card.kind,
      label: card.displayName,
    })),
  ];

  return (
    <div class={props.outerClass}>
      <div class={props.titleClass ?? props.fieldLabelClass}>
        {t("projectSettings.mesa.smartSerial")}
      </div>
      <For each={props.ports}>
        {(port) => (
          <div class="grid gap-3">
            <div class="text-sm text-muted-foreground">{port.label}</div>
            <For
              each={Array.from(
                { length: port.channels },
                (_, channel) => channel,
              )}
            >
              {(channel) => (
                <div class="grid gap-2 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
                  <div class="text-sm text-muted-foreground">
                    {t("projectSettings.mesa.channelLabel", {
                      channel: (port.channelOffset ?? 0) + channel,
                    })}
                  </div>
                  <StringSelect
                    value={
                      props
                        .smartSerialMap(props.connectorKey)
                        .get(`${port.key}:${channel}`) ?? ""
                    }
                    options={smartSerialOptions()}
                    onChange={(value) =>
                      props.onSetSmartSerialCard(
                        props.hostId,
                        {
                          connectorKey: props.connectorKey,
                          portKey: port.key,
                          channel,
                        },
                        (value || undefined) as
                          | ProjectMesaSmartSerialCardKind
                          | undefined,
                      )
                    }
                  />
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
