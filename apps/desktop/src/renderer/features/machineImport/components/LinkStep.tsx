import { listStoreEntriesForLinuxCncVersion } from "@nohal/core/src/componentStore";
import { analyzeSystemHalImportOverride } from "@nohal/core/src/halImport";
import type {
  HalImportDraft,
  HalImportPlacementHeuristic,
} from "@nohal/core/src/types";
import { createMemo, For, Show } from "solid-js";
import StringSelect from "../../../components/form/StringSelect";
import { Alert } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useI18n } from "../../../i18n";
import { useEditorStore } from "../../../state/EditorStoreProvider";
import type { MachineImportController } from "../useMachineImportFlow";
import LinkGroupCard from "./LinkGroupCard";
import WarningsCard from "./WarningsCard";

interface LinkStepProps {
  machineImport: MachineImportController;
  draft: HalImportDraft;
  onEditGeneratedGroup: (groupId: string) => void;
  placementOptions: Array<{
    value: HalImportPlacementHeuristic;
    label: string;
  }>;
}

export default function LinkStep(props: LinkStepProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const flow = () => props.machineImport.machineImportFlow;

  const storeEntries = createMemo(() =>
    listStoreEntriesForLinuxCncVersion(
      state.componentStore,
      props.machineImport.selectedLinuxCncVersion(),
    ).sort((a, b) =>
      a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
    ),
  );

  const isSystemSelectableGroup = (groupId: string) =>
    flow().systemLinkGroupIds.includes(groupId);

  const selectionForGroup = (groupId: string) =>
    flow().linkSelections[groupId] ?? "local";

  const systemOverrideAnalysisForGroup = (groupId: string) => {
    const group = props.draft.componentGroups.find(
      (item) => item.id === groupId,
    );
    const component = flow().generatedLocalComponents[groupId];
    if (!group || !component || !isSystemSelectableGroup(groupId)) return null;
    return analyzeSystemHalImportOverride(group, component, {
      linuxcncVersion: props.machineImport.selectedLinuxCncVersion(),
      motmod: props.draft.motmod,
    });
  };

  const storeComponentExists = (encodedValue: string) => {
    if (!encodedValue.startsWith("store:")) return false;
    return Boolean(
      state.componentStore.components[encodedValue.slice("store:".length)],
    );
  };

  const groupNeedsReview = (groupId: string) => {
    const selection = selectionForGroup(groupId);
    if (selection === "local") return true;
    if (selection === "system") {
      return Boolean(systemOverrideAnalysisForGroup(groupId));
    }
    if (selection.startsWith("store:")) {
      return !storeComponentExists(selection);
    }
    return true;
  };

  const reviewGroups = createMemo(() =>
    props.draft.componentGroups.filter((group) => groupNeedsReview(group.id)),
  );

  const resolvedGroups = createMemo(() =>
    props.draft.componentGroups.filter((group) => !groupNeedsReview(group.id)),
  );

  return (
    <>
      <Card class="border-white/8 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle>{t("projectCreation.importSource")}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <div class="grid gap-3 rounded-2xl p-1 text-sm">
            <div class="flex items-start justify-between gap-3">
              <span class="text-muted-foreground">{t("common.file")}</span>
              <span class="mono max-w-[70%] truncate text-right">
                {flow().machineConfigImport?.machineConfig.userIni.sourcePath ??
                  props.draft.sourcePath ??
                  t("common.unspecified")}
              </span>
            </div>
            <Show when={flow().machineConfigImport}>
              {(machineConfigImport) => (
                <div class="flex items-start justify-between gap-3">
                  <span class="text-muted-foreground">
                    {t("projectCreation.halFiles")}
                  </span>
                  <span>
                    {
                      machineConfigImport().machineConfig.halSources.filter(
                        (source) => source.status === "loaded",
                      ).length
                    }
                  </span>
                </div>
              )}
            </Show>
            <div class="flex items-start justify-between gap-3">
              <span class="text-muted-foreground">
                {t("projectCreation.components")}
              </span>
              <span>{props.draft.componentGroups.length}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-muted-foreground">
                {t("projectCreation.nets")}
              </span>
              <span>{props.draft.nets.length}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-muted-foreground">
                {t("projectCreation.setp")}
              </span>
              <span>{props.draft.setps.length}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-muted-foreground">
                {t("projectCreation.addf")}
              </span>
              <span>{props.draft.addfs.length}</span>
            </div>
          </div>
          <div class="grid gap-2">
            <span class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("projectCreation.placement")}
            </span>
            <StringSelect
              value={flow().placementHeuristic}
              options={props.placementOptions}
              disabled={flow().isBusy}
              onChange={(value) =>
                props.machineImport.changeHalImportPlacementHeuristic(
                  value as HalImportPlacementHeuristic,
                )
              }
            />
            <div class="text-sm text-muted-foreground">
              {t("projectCreation.placementHelp")}
            </div>
          </div>
          <div class="flex justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={props.machineImport.backToMachineFilesStep}
              disabled={flow().isBusy}
            >
              {t("common.back")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card class="border-white/8 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle>{t("projectCreation.componentLinking")}</CardTitle>
          <CardDescription>
            {t("projectCreation.componentLinkingHelp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-3">
            <Show when={reviewGroups().length > 0}>
              <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("projectCreation.linkReviewSectionTitle", {
                  count: reviewGroups().length,
                })}
              </div>
            </Show>
            <For each={reviewGroups()}>
              {(group) => (
                <LinkGroupCard
                  group={group}
                  machineImport={props.machineImport}
                  motmod={props.draft.motmod}
                  storeEntries={storeEntries()}
                  linkReason={flow().linkReasons[group.id]}
                  onEditGeneratedGroup={() =>
                    props.onEditGeneratedGroup(group.id)
                  }
                />
              )}
            </For>
            <Show
              when={
                reviewGroups().length === 0 &&
                props.draft.componentGroups.length > 0
              }
            >
              <Alert class="border-white/10 bg-black/10 text-foreground">
                {t("projectCreation.allComponentGroupsResolved")}
              </Alert>
            </Show>
            <Show when={resolvedGroups().length > 0}>
              <details class="rounded-2xl border border-white/10 bg-black/10 p-4">
                <summary class="cursor-pointer list-item text-sm font-medium text-foreground">
                  {t("projectCreation.resolvedComponentDrawerTitle", {
                    count: resolvedGroups().length,
                  })}
                </summary>
                <div class="mt-3 grid gap-3">
                  <div class="text-sm text-muted-foreground">
                    {t("projectCreation.resolvedComponentDrawerHelp")}
                  </div>
                  <For each={resolvedGroups()}>
                    {(group) => (
                      <LinkGroupCard
                        group={group}
                        machineImport={props.machineImport}
                        motmod={props.draft.motmod}
                        storeEntries={storeEntries()}
                        linkReason={flow().linkReasons[group.id]}
                        onEditGeneratedGroup={() =>
                          props.onEditGeneratedGroup(group.id)
                        }
                      />
                    )}
                  </For>
                </div>
              </details>
            </Show>
            <Show when={props.draft.componentGroups.length === 0}>
              <div class="text-sm text-muted-foreground">
                {t("projectCreation.noComponentGroups")}
              </div>
            </Show>
          </div>
        </CardContent>
      </Card>

      <WarningsCard warnings={props.draft.warnings} />

      <div class="flex justify-end">
        <Button
          type="button"
          onClick={() => void props.machineImport.createImportedProject()}
          disabled={flow().isBusy}
        >
          {t("projectCreation.createImportedProject")}
        </Button>
      </div>
    </>
  );
}
