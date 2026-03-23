import {
  deriveMesaTopology,
  getMesaDb25CardCatalogEntry,
  getMesaHostCatalogEntry,
  MESA_DB25_CARDS,
  MESA_HOSTS,
  MESA_SMART_SERIAL_CARDS,
  type ProjectMesaDb25CardKind,
  type ProjectMesaHostKind,
  type ProjectMesaSmartSerialCardKind,
  planMesaReconcile,
} from "@nohal/core/src/mesa";
import { For, Show } from "solid-js";
import StringSelect from "../../components/form/StringSelect";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";

export default function MesaTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const mesa = () => state.project.mesa ?? { hosts: [] };
  const topology = () => deriveMesaTopology(mesa());
  const reconcilePlan = () => planMesaReconcile(state.project);
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

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
    ...MESA_DB25_CARDS.filter((card) =>
      getMesaHostCatalogEntry(hostKind)?.connectorSlots.some((slot) =>
        card.compatibleConnectorKinds.includes(slot.kind),
      ),
    ).map((card) => ({
      value: card.kind,
      label: card.displayName,
    })),
  ];

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

  const issuesForHost = (hostId: string) =>
    topology().issues.filter((issue) => issue.hostId === hostId);

  function MesaSmartSerialSection(props: {
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
  }) {
    return (
      <div class={props.outerClass}>
        <div class={props.titleClass ?? fieldLabelClass}>
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
                        actions.setMesaSmartSerialCard(
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

  return (
    <div class="grid gap-6">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">
          {t("projectSettings.mesaTitle")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("projectSettings.mesaHelp")}
        </div>
      </div>

      <div class="flex items-center justify-between rounded-2xl bg-black/20 p-4">
        <div class="grid gap-1">
          <div class="text-sm font-semibold tracking-tight">
            {t("projectSettings.mesa.hostBoards")}
          </div>
          <div class="text-xs text-muted-foreground">
            {t("projectSettings.mesa.hostBoardsHelp")}
          </div>
        </div>
        <Button type="button" onClick={() => actions.addMesaHost()}>
          {t("projectSettings.mesa.addHost")}
        </Button>
      </div>

      <Show
        when={mesa().hosts.length > 0}
        fallback={
          <Alert>
            <AlertTitle>{t("projectSettings.mesa.emptyTitle")}</AlertTitle>
            <AlertDescription>
              {t("projectSettings.mesa.emptyHelp")}
            </AlertDescription>
          </Alert>
        }
      >
        <div class="grid gap-4">
          <For each={mesa().hosts}>
            {(host, index) => {
              const catalog = () => getMesaHostCatalogEntry(host.kind);
              const connectorMap = () =>
                new Map(
                  (host.connectors ?? []).map((item) => [
                    item.connectorKey,
                    item.cardKind ?? "",
                  ]),
                );
              const smartSerialMap = (connectorKey?: string) =>
                new Map(
                  (host.smartSerial ?? [])
                    .filter(
                      (item) =>
                        (item.connectorKey ?? "") === (connectorKey ?? ""),
                    )
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
                          index: index() + 1,
                        })}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {catalog()?.displayName}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => actions.removeMesaHost(host.id)}
                    >
                      {t("projectSettings.mesa.removeHost")}
                    </Button>
                  </div>

                  <div class="grid gap-4 lg:grid-cols-2">
                    <div class="grid gap-2">
                      <span class={fieldLabelClass}>
                        {t("projectSettings.mesa.hostModel")}
                      </span>
                      <StringSelect
                        value={host.kind}
                        options={hostOptions()}
                        onChange={(value) =>
                          actions.updateMesaHostKind(
                            host.id,
                            value as ProjectMesaHostKind,
                          )
                        }
                      />
                    </div>

                    <div class="grid gap-2">
                      <span class={fieldLabelClass}>
                        {t("projectSettings.mesa.hostIp")}
                      </span>
                      <Input
                        type="text"
                        value={host.ip}
                        onChange={(evt) =>
                          actions.updateMesaHostIp(
                            host.id,
                            evt.currentTarget.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <Show when={(catalog()?.connectorSlots.length ?? 0) > 0}>
                    <div class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
                      <div class={fieldLabelClass}>
                        {t("projectSettings.mesa.connectors")}
                      </div>
                      <For each={catalog()?.connectorSlots ?? []}>
                        {(slot) => {
                          const assignedCard = () =>
                            getMesaDb25CardCatalogEntry(
                              connectorMap().get(slot.key) ?? "",
                            );
                          return (
                            <div class="grid gap-3">
                              <div class="grid gap-2 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
                                <div class="text-sm text-muted-foreground">
                                  {slot.label}
                                </div>
                                <StringSelect
                                  value={connectorMap().get(slot.key) ?? ""}
                                  options={connectorOptions(host.kind)}
                                  onChange={(value) =>
                                    actions.setMesaConnectorCard(
                                      host.id,
                                      slot.key,
                                      (value || undefined) as
                                        | ProjectMesaDb25CardKind
                                        | undefined,
                                    )
                                  }
                                />
                              </div>

                              <Show
                                when={
                                  (assignedCard()?.sserial.smartSerialPorts
                                    .length ?? 0) > 0
                                }
                              >
                                <MesaSmartSerialSection
                                  hostId={host.id}
                                  ports={
                                    assignedCard()?.sserial.smartSerialPorts ??
                                    []
                                  }
                                  smartSerialMap={smartSerialMap}
                                  connectorKey={slot.key}
                                  outerClass="ml-0 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 lg:ml-[140px]"
                                  titleClass="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
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
                      hostId={host.id}
                      ports={catalog()?.smartSerialPorts ?? []}
                      smartSerialMap={smartSerialMap}
                      outerClass="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20"
                    />
                  </Show>

                  <Show when={issuesForHost(host.id).length > 0}>
                    <Alert
                      variant={
                        issuesForHost(host.id).some(
                          (issue) => issue.severity === "fatal",
                        )
                          ? "destructive"
                          : "default"
                      }
                    >
                      <AlertTitle>
                        {t("projectSettings.mesa.validationTitle")}
                      </AlertTitle>
                      <AlertDescription>
                        <div class="grid gap-1">
                          <For each={issuesForHost(host.id)}>
                            {(issue) => <p>{issue.message}</p>}
                          </For>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </Show>
                </section>
              );
            }}
          </For>
        </div>
      </Show>

      <div class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20 lg:grid-cols-[1fr_auto] lg:items-center">
        <div class="grid gap-3">
          <div class={fieldLabelClass}>
            {t("projectSettings.mesa.syncStatusLabel")}
          </div>
          <div>
            <Badge variant={reconcilePlan().inSync ? "secondary" : "warning"}>
              {reconcilePlan().inSync
                ? t("projectSettings.mesa.syncStatusInSync")
                : t("projectSettings.mesa.syncStatusOutOfSync")}
            </Badge>
          </div>
          <Show when={!reconcilePlan().inSync}>
            <div class="mono text-sm text-muted-foreground">
              {t("projectSettings.mesa.syncSummary", {
                add: reconcilePlan().addNodes.length,
                remove: reconcilePlan().removeNodes.length,
                ensure: reconcilePlan().ensureComponents.length,
                update: reconcilePlan().updateNodes.length,
              })}
            </div>
          </Show>
        </div>
        <div class="flex justify-start lg:justify-end">
          <Button
            type="button"
            disabled={reconcilePlan().inSync}
            onClick={() => actions.syncMesaManagedProjection()}
          >
            {t("projectSettings.mesa.syncNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
