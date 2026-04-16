import {
  getMesaSmartSerialCatalogEntry,
  MESA_SMART_SERIAL_CARDS,
  type ProjectMesaSmartSerialAssignment,
  type ProjectMesaSmartSerialCardKind,
} from "@nohal/core/mesa";
import { For, Show } from "solid-js";
import StringSelect from "../../../components/form/StringSelect";
import { useI18n } from "../../../i18n";

interface MesaSmartSerialSectionProps {
  hostId: string;
  ports: readonly {
    key: string;
    label: string;
    channels: number;
    baseChannelOffset?: number;
    fixedCardKind?: ProjectMesaSmartSerialCardKind;
  }[];
  smartSerialAssignments: (
    connectorKey?: string,
  ) => Map<string, ProjectMesaSmartSerialAssignment>;
  connectorKey?: string;
  outerClass: string;
  titleClass?: string;
  fieldLabelClass: string;
  onSetProcessDataMode?: (
    hostId: string,
    target: {
      connectorKey?: string;
      portKey: string;
      channel: number;
    },
    processDataMode: number,
  ) => void;
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
    ...MESA_SMART_SERIAL_CARDS.filter((card) => card.assignable !== false).map(
      (card) => ({
        value: card.kind,
        label: card.displayName,
      }),
    ),
  ];

  const smartSerialAssignment = (
    connectorKey: string | undefined,
    key: string,
  ) => props.smartSerialAssignments(connectorKey).get(key);

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
              {(channel) => {
                const target = {
                  connectorKey: props.connectorKey,
                  portKey: port.key,
                  channel,
                };
                const assignment = () =>
                  smartSerialAssignment(
                    props.connectorKey,
                    `${port.key}:${channel}`,
                  );
                const selectedCardKind = () =>
                  assignment()?.cardKind ?? port.fixedCardKind ?? "";
                const selectedCard = () =>
                  selectedCardKind()
                    ? getMesaSmartSerialCatalogEntry(selectedCardKind())
                    : undefined;
                const processDataModeOptions = () =>
                  (selectedCard()?.processDataModes ?? []).map((mode) => ({
                    value: `${mode.mode}`,
                    label: mode.label,
                  }));
                const selectedProcessDataMode = () =>
                  `${assignment()?.processDataMode ?? selectedCard()?.defaultMode ?? 0}`;

                return (
                  <div class="grid gap-2">
                    <div class="grid gap-2 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
                      <div class="text-sm text-muted-foreground">
                        {t("projectSettings.mesa.channelLabel", {
                          channel: (port.baseChannelOffset ?? 0) + channel,
                        })}
                      </div>
                      <StringSelect
                        value={selectedCardKind()}
                        options={
                          port.fixedCardKind
                            ? [
                                {
                                  value: port.fixedCardKind,
                                  label:
                                    getMesaSmartSerialCatalogEntry(
                                      port.fixedCardKind,
                                    )?.displayName ?? port.fixedCardKind,
                                },
                              ]
                            : smartSerialOptions()
                        }
                        disabled={Boolean(port.fixedCardKind)}
                        onChange={(value) =>
                          props.onSetSmartSerialCard(
                            props.hostId,
                            target,
                            (value || undefined) as
                              | ProjectMesaSmartSerialCardKind
                              | undefined,
                          )
                        }
                      />
                    </div>
                    <Show
                      when={
                        props.onSetProcessDataMode &&
                        processDataModeOptions().length > 0
                      }
                    >
                      <div class="grid gap-2 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
                        <div class="text-sm text-muted-foreground">
                          {t("projectSettings.mesa.processDataMode")}
                        </div>
                        <StringSelect
                          value={selectedProcessDataMode()}
                          options={processDataModeOptions()}
                          onChange={(value) => {
                            const processDataMode = Number.parseInt(value, 10);
                            if (
                              !props.onSetProcessDataMode ||
                              !Number.isInteger(processDataMode)
                            ) {
                              return;
                            }
                            props.onSetProcessDataMode(
                              props.hostId,
                              target,
                              processDataMode,
                            );
                          }}
                        />
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
