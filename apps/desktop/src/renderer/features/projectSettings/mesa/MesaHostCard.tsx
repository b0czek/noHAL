import {
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  MESA_DB25_CARDS,
  MESA_HOSTS,
  MESA_RAW_GPIO_CARD_KIND,
  type MesaValidationIssue,
  type ProjectMesaConnectorCardKind,
  type ProjectMesaHostConfig,
  type ProjectMesaHostKind,
} from "@nohal/core/src/mesa";
import { For, Show } from "solid-js";
import StringSelect from "../../../components/form/StringSelect";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useI18n } from "../../../i18n";
import { useEditorStore } from "../../../state/EditorStoreProvider";
import MesaRawGpioSection from "./MesaRawGpioSection";
import MesaSmartSerialSection from "./MesaSmartSerialSection";

interface MesaHostCardProps {
  host: ProjectMesaHostConfig;
  index: number;
  issues: readonly MesaValidationIssue[];
  fieldLabelClass: string;
}

export default function MesaHostCard(props: MesaHostCardProps) {
  const { t } = useI18n();
  const { actions } = useEditorStore();

  const hostOptions = () =>
    MESA_HOSTS.map((host) => ({
      value: host.kind,
      label: host.displayName,
    }));

  const connectorOptions = (hostKind: ProjectMesaHostKind) => [
    {
      value: "",
      label: t("projectSettings.mesa.noCard"),
    },
    ...(getMesaHostCatalogEntry(hostKind)?.connectorSlots.some(
      (slot) => slot.rawGpio,
    )
      ? [
          {
            value: MESA_RAW_GPIO_CARD_KIND,
            label: t("projectSettings.mesa.rawGpio"),
          },
        ]
      : []),
    ...MESA_DB25_CARDS.filter((card) =>
      getMesaHostCatalogEntry(hostKind)?.connectorSlots.some((slot) =>
        card.compatibleConnectorKinds.includes(slot.kind),
      ),
    ).map((card) => ({
      value: card.kind,
      label: card.displayName,
    })),
  ];

  const catalog = () => getMesaHostCatalogEntry(props.host.kind);
  const connectorAssignments = () =>
    new Map(
      (props.host.connectors ?? []).map((item) => [item.connectorKey, item]),
    );
  const smartSerialMap = (connectorKey?: string) =>
    new Map(
      (props.host.smartSerial ?? [])
        .filter((item) => (item.connectorKey ?? "") === (connectorKey ?? ""))
        .map((item) => [
          `${item.portKey}:${item.channel}`,
          item.cardKind ?? "",
        ]),
    );

  return (
    <section class="grid gap-4 rounded-2xl bg-black/20 p-4">
      <div class="flex items-start justify-between gap-4">
        <div class="grid gap-1">
          <div class="text-sm font-semibold tracking-tight">
            {t("projectSettings.mesa.hostCard", {
              index: props.index + 1,
            })}
          </div>
          <div class="text-xs text-muted-foreground">
            {catalog()?.displayName}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => actions.removeMesaHost(props.host.id)}
        >
          {t("projectSettings.mesa.removeHost")}
        </Button>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="grid gap-2">
          <span class={props.fieldLabelClass}>
            {t("projectSettings.mesa.hostModel")}
          </span>
          <StringSelect
            value={props.host.kind}
            options={hostOptions()}
            onChange={(value) =>
              actions.updateMesaHostKind(
                props.host.id,
                value as ProjectMesaHostKind,
              )
            }
          />
        </div>

        <div class="grid gap-2">
          <span class={props.fieldLabelClass}>
            {t("projectSettings.mesa.hostIp")}
          </span>
          <Input
            type="text"
            value={props.host.ip}
            onChange={(evt) =>
              actions.updateMesaHostIp(props.host.id, evt.currentTarget.value)
            }
          />
        </div>
      </div>

      <Show when={(catalog()?.connectorSlots.length ?? 0) > 0}>
        <div class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
          <div class={props.fieldLabelClass}>
            {t("projectSettings.mesa.connectors")}
          </div>
          <For each={catalog()?.connectorSlots ?? []}>
            {(slot) => {
              const connectorAssignment = () =>
                connectorAssignments().get(slot.key);
              const assignedCardKind = () =>
                connectorAssignment()?.cardKind ?? "";
              const assignedCard = () =>
                getMesaDb25CardCatalogEntry(assignedCardKind());

              return (
                <div class="grid gap-3">
                  <div class="grid gap-2 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
                    <div class="text-sm text-muted-foreground">
                      {slot.label}
                    </div>
                    <StringSelect
                      value={assignedCardKind()}
                      options={connectorOptions(props.host.kind)}
                      onChange={(value) =>
                        actions.setMesaConnectorCard(
                          props.host.id,
                          slot.key,
                          (value || undefined) as
                            | ProjectMesaConnectorCardKind
                            | undefined,
                        )
                      }
                    />
                  </div>

                  <Show
                    when={
                      assignedCardKind() === MESA_RAW_GPIO_CARD_KIND &&
                      slot.rawGpio
                    }
                  >
                    <MesaRawGpioSection
                      hostId={props.host.id}
                      connectorKey={slot.key}
                      firstIndex={slot.rawGpio?.firstIndex ?? 0}
                      count={slot.rawGpio?.count ?? 0}
                      outputPins={
                        connectorAssignment()?.rawGpio?.outputPins ?? []
                      }
                      outerClass="ml-0 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 lg:ml-[140px]"
                      titleClass="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
                      fieldLabelClass={props.fieldLabelClass}
                    />
                  </Show>

                  <Show
                    when={
                      (assignedCard()?.sserial.smartSerialPorts.length ?? 0) > 0
                    }
                  >
                    <MesaSmartSerialSection
                      hostId={props.host.id}
                      ports={assignedCard()?.sserial.smartSerialPorts ?? []}
                      smartSerialMap={smartSerialMap}
                      connectorKey={slot.key}
                      outerClass="ml-0 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 lg:ml-[140px]"
                      titleClass="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
                      fieldLabelClass={props.fieldLabelClass}
                    />
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={(catalog()?.smartSerialPorts.length ?? 0) > 0}>
        <MesaSmartSerialSection
          hostId={props.host.id}
          ports={catalog()?.smartSerialPorts ?? []}
          smartSerialMap={smartSerialMap}
          outerClass="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20"
          fieldLabelClass={props.fieldLabelClass}
        />
      </Show>

      <Show when={props.issues.length > 0}>
        <Alert
          variant={
            props.issues.some((issue) => issue.severity === "fatal")
              ? "destructive"
              : "default"
          }
        >
          <AlertTitle>{t("projectSettings.mesa.validationTitle")}</AlertTitle>
          <AlertDescription>
            <div class="grid gap-1">
              <For each={props.issues}>{(issue) => <p>{issue.message}</p>}</For>
            </div>
          </AlertDescription>
        </Alert>
      </Show>
    </section>
  );
}
