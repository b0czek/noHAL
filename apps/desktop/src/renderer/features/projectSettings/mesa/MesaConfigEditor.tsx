import {
  deriveMesaTopology,
  type ProjectMesaConfig,
  type ProjectMesaConnectorCardKind,
  type ProjectMesaGpioDirection,
  type ProjectMesaHostKind,
  type ProjectMesaSmartSerialCardKind,
  type ProjectMesaSmartSerialTarget,
  planMesaReconcile,
} from "@nohal/core/mesa";
import { For, Show } from "solid-js";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../../components/ui/alert";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { useI18n } from "../../../i18n";
import MesaHostCard from "./MesaHostCard";

export interface MesaConfigEditorProps {
  mesa: ProjectMesaConfig;
  onAddHost: (kind?: ProjectMesaHostKind) => void;
  onRemoveHost: (hostId: string) => void;
  onUpdateHostKind: (hostId: string, kind: ProjectMesaHostKind) => void;
  onUpdateHostIp: (hostId: string, ip: string) => void;
  onSetConnectorCard: (
    hostId: string,
    connectorKey: string,
    cardKind: ProjectMesaConnectorCardKind | undefined,
  ) => void;
  onSetConnectorProcessDataMode: (
    hostId: string,
    connectorKey: string,
    processDataMode: number,
  ) => void;
  onSetRawGpioPinDirection: (
    hostId: string,
    connectorKey: string,
    pinIndex: number,
    direction: ProjectMesaGpioDirection,
  ) => void;
  onSetSmartSerialCard: (
    hostId: string,
    target: ProjectMesaSmartSerialTarget,
    cardKind: ProjectMesaSmartSerialCardKind | undefined,
  ) => void;
  syncProject?: Parameters<typeof planMesaReconcile>[0];
  onSync?: () => void;
}

export default function MesaConfigEditor(props: MesaConfigEditorProps) {
  const { t } = useI18n();
  const topology = () => deriveMesaTopology(props.mesa);
  const reconcilePlan = () =>
    props.syncProject ? planMesaReconcile(props.syncProject) : null;
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  const issuesForHost = (hostId: string) =>
    topology().issues.filter((issue) => issue.hostId === hostId);

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
        <Button type="button" onClick={() => props.onAddHost()}>
          {t("projectSettings.mesa.addHost")}
        </Button>
      </div>

      <Show
        when={props.mesa.hosts.length > 0}
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
          <For each={props.mesa.hosts}>
            {(host, index) => (
              <MesaHostCard
                host={host}
                index={index()}
                issues={issuesForHost(host.id)}
                fieldLabelClass={fieldLabelClass}
                onRemoveHost={props.onRemoveHost}
                onUpdateHostKind={props.onUpdateHostKind}
                onUpdateHostIp={props.onUpdateHostIp}
                onSetConnectorCard={props.onSetConnectorCard}
                onSetConnectorProcessDataMode={
                  props.onSetConnectorProcessDataMode
                }
                onSetRawGpioPinDirection={props.onSetRawGpioPinDirection}
                onSetSmartSerialCard={props.onSetSmartSerialCard}
              />
            )}
          </For>
        </div>
      </Show>

      <Show when={reconcilePlan() && props.onSync}>
        <div class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div class="grid gap-3">
            <div class={fieldLabelClass}>
              {t("projectSettings.mesa.syncStatusLabel")}
            </div>
            <div>
              <Badge
                variant={reconcilePlan()?.inSync ? "secondary" : "warning"}
              >
                {reconcilePlan()?.inSync
                  ? t("projectSettings.mesa.syncStatusInSync")
                  : t("projectSettings.mesa.syncStatusOutOfSync")}
              </Badge>
            </div>
            <Show when={!reconcilePlan()?.inSync}>
              <div class="mono text-sm text-muted-foreground">
                {t("projectSettings.mesa.syncSummary", {
                  add: reconcilePlan()?.addNodes.length ?? 0,
                  remove: reconcilePlan()?.removeNodes.length ?? 0,
                  ensure: reconcilePlan()?.ensureComponents.length ?? 0,
                  update: reconcilePlan()?.updateNodes.length ?? 0,
                })}
              </div>
            </Show>
          </div>
          <div class="flex justify-start lg:justify-end">
            <Button
              type="button"
              disabled={Boolean(reconcilePlan()?.inSync)}
              onClick={() => props.onSync?.()}
            >
              {t("projectSettings.mesa.syncNow")}
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
}
