import { deriveMesaTopology, planMesaReconcile } from "@nohal/core/src/mesa";
import { For, Show } from "solid-js";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import MesaHostCard from "./mesa/MesaHostCard";

export default function MesaTab() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const mesa = () => state.project.mesa ?? { hosts: [] };
  const topology = () => deriveMesaTopology(mesa());
  const reconcilePlan = () => planMesaReconcile(state.project);
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
            {(host, index) => (
              <MesaHostCard
                host={host}
                index={index()}
                issues={issuesForHost(host.id)}
                fieldLabelClass={fieldLabelClass}
              />
            )}
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
