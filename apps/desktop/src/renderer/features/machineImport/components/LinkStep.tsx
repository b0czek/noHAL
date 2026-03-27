import { listStoreEntriesForLinuxCncVersion } from "@nohal/core/src/componentStore";
import { analyzeSystemHalImportOverride } from "@nohal/core/src/halImport";
import type {
  ComponentStoreEntry,
  HalImportDraft,
  HalImportPlacementHeuristic,
} from "@nohal/core/src/types";
import { HiOutlinePencilSquare } from "solid-icons/hi";
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

  const optionListForGroup = (inferredName: string): ComponentStoreEntry[] => {
    const entries = storeEntries();
    const exact: typeof entries = [];
    const partial: typeof entries = [];
    const lower = inferredName.toLowerCase();
    for (const entry of entries) {
      const name = entry.parsed.halComponentName.toLowerCase();
      if (name === lower) exact.push(entry);
      else if (name.includes(lower) || lower.includes(name)) {
        partial.push(entry);
      }
    }
    return [
      ...exact,
      ...partial,
      ...entries.filter(
        (entry) => !exact.includes(entry) && !partial.includes(entry),
      ),
    ];
  };

  const selectionLabel = (encodedValue: string): string => {
    if (!encodedValue || encodedValue === "local") {
      return t("projectCreation.projectLocalGenerated");
    }
    if (encodedValue === "system") {
      return t("projectCreation.systemComponent");
    }
    if (!encodedValue.startsWith("store:")) return encodedValue;
    const componentId = encodedValue.slice("store:".length);
    const entry = state.componentStore.components[componentId];
    if (!entry) return t("projectCreation.storeFallback", { componentId });
    return t("projectCreation.storeEntry", {
      name: entry.parsed.halComponentName,
    });
  };

  const isSystemSelectableGroup = (groupId: string) =>
    flow().systemLinkGroupIds.includes(groupId);

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

  const systemOverrideItemsLabel = (groupId: string) => {
    const analysis = systemOverrideAnalysisForGroup(groupId);
    if (!analysis) return "";
    const items = [
      ...analysis.extraPins.map((name) => `pin:${name}`),
      ...analysis.extraParams.map((name) => `param:${name}`),
      ...analysis.extraFunctions.map((name) => `fn:${name}`),
    ];
    if (items.length <= 4) return items.join(", ");
    return t("projectCreation.systemOverrideItemsTruncated", {
      items: items.slice(0, 4).join(", "),
      count: items.length - 4,
    });
  };

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
            <For each={props.draft.componentGroups}>
              {(group) => (
                <div class="grid gap-4 rounded-2xl bg-black/15 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div class="min-w-0 space-y-2">
                    <div class="mono font-medium">
                      {group.inferredHalComponentName}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {t("projectCreation.groupStats", {
                        instances: group.instances.length,
                        pins: group.pins.length,
                        params: group.params.length,
                        runtime: group.runtimeHint,
                      })}
                    </div>
                    <Show when={flow().linkReasons[group.id]}>
                      <div class="text-sm text-muted-foreground">
                        {t("projectCreation.autoReason", {
                          reason: flow().linkReasons[group.id],
                        })}
                      </div>
                    </Show>
                    <div class="mono text-xs text-muted-foreground">
                      {group.instances
                        .slice(0, 3)
                        .map((item) => item.instanceName)
                        .join(", ")}
                      {group.instances.length > 3 ? " ..." : ""}
                    </div>
                  </div>
                  <div class="grid gap-2">
                    <span class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {t("projectCreation.linkTarget")}
                    </span>
                    <StringSelect
                      value={flow().linkSelections[group.id] ?? "local"}
                      options={[
                        ...(isSystemSelectableGroup(group.id)
                          ? [
                              {
                                value: "system",
                                label: t("projectCreation.systemComponent"),
                              },
                            ]
                          : [
                              {
                                value: "local",
                                label: t(
                                  "projectCreation.projectLocalGenerated",
                                ),
                              },
                            ]),
                        ...optionListForGroup(
                          group.inferredHalComponentName,
                        ).map((entry) => ({
                          value: `store:${entry.componentId}`,
                          label: `${entry.parsed.halComponentName} (${entry.parsed.pins.length}p/${entry.parsed.params.length} prm)`,
                        })),
                      ]}
                      onChange={(value) =>
                        props.machineImport.changeHalImportLinkSelection(
                          group.id,
                          value,
                        )
                      }
                    />
                    <div class="flex items-center gap-1">
                      <div
                        class="text-xs text-muted-foreground"
                        title={selectionLabel(
                          flow().linkSelections[group.id] ?? "local",
                        )}
                      >
                        {selectionLabel(
                          flow().linkSelections[group.id] ?? "local",
                        )}
                      </div>
                      <Show
                        when={
                          (flow().linkSelections[group.id] ?? "local") ===
                            "system" && systemOverrideAnalysisForGroup(group.id)
                        }
                      >
                        <span
                          class="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-warning"
                          title={t("projectCreation.systemOverrideBadgeTitle")}
                        >
                          {t("projectCreation.systemOverrideBadge")}
                        </span>
                      </Show>
                      <Show
                        when={
                          (flow().linkSelections[group.id] ?? "local") ===
                            "local" && flow().generatedLocalComponents[group.id]
                        }
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={flow().isBusy}
                          title={t("projectCreation.editGeneratedComponent")}
                          aria-label={t(
                            "projectCreation.editGeneratedComponent",
                          )}
                          onClick={() => props.onEditGeneratedGroup(group.id)}
                        >
                          <HiOutlinePencilSquare size={15} aria-hidden="true" />
                        </Button>
                      </Show>
                    </div>
                    <Show
                      when={
                        (flow().linkSelections[group.id] ?? "local") ===
                          "system" && systemOverrideAnalysisForGroup(group.id)
                      }
                    >
                      {(analysis) => (
                        <Alert class="border-warning/30 bg-warning/10 text-foreground">
                          <div class="grid gap-1">
                            <div class="text-sm font-medium">
                              {t("projectCreation.systemOverrideNotice")}
                            </div>
                            <div class="text-sm text-muted-foreground">
                              {t("projectCreation.systemOverrideDetails", {
                                pins: analysis().extraPins.length,
                                params: analysis().extraParams.length,
                                functions: analysis().extraFunctions.length,
                              })}
                            </div>
                            <div class="mono text-xs text-muted-foreground">
                              {systemOverrideItemsLabel(group.id)}
                            </div>
                          </div>
                        </Alert>
                      )}
                    </Show>
                  </div>
                </div>
              )}
            </For>
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
