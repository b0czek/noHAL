import { listStoreEntriesForLinuxCncVersion } from "@nohal/core/src/componentStore";
import { isSystemHalImportComponentGroup } from "@nohal/core/src/halImport";
import type { HalImportPlacementHeuristic } from "@nohal/core/src/types";
import {
  HiOutlineFolderOpen,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { createMemo, For, Show } from "solid-js";
import StringSelect from "../../components/form/StringSelect";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from "../../components/ui/switch";
import { useI18n } from "../../i18n";
import { useEditorStore } from "../../state/EditorStoreProvider";
import type { MachineImportController } from "./useMachineImportFlow";

export interface MachineImportPageProps {
  machineImport: MachineImportController;
}

export default function MachineImportPage(props: MachineImportPageProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const machineImport = () => props.machineImport;
  const flow = () => machineImport().machineImportFlow;
  const storeEntries = createMemo(() =>
    listStoreEntriesForLinuxCncVersion(
      state.componentStore,
      machineImport().selectedLinuxCncVersion(),
    ).sort((a, b) =>
      a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
    ),
  );

  const optionListForGroup = (inferredName: string) => {
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

  const iniKeyCount = createMemo(() =>
    (flow().machineConfigSetup?.ini.sections ?? []).reduce(
      (count, section) => count + section.entries.length,
      0,
    ),
  );

  const pageSubtitle = createMemo(() =>
    flow().step === "machine-files"
      ? t("projectCreation.subtitleMachineFiles")
      : t("projectCreation.subtitleLink"),
  );

  const placementOptions = [
    {
      value: "related-groups",
      label: t("projectCreation.placementRelatedGroups"),
    },
    {
      value: "alphabetical",
      label: t("projectCreation.placementAlphabetical"),
    },
  ];

  return (
    <div class="relative min-h-screen bg-[linear-gradient(180deg,#081216_0%,#04090c_100%)] px-4 py-8 sm:px-6">
      <div
        class="pointer-events-none fixed inset-0 opacity-45 [background-image:radial-gradient(circle_at_12%_6%,hsl(var(--accent)/0.12),transparent_28%),radial-gradient(circle_at_88%_8%,hsl(var(--primary)/0.12),transparent_24%),linear-gradient(rgba(122,230,208,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(122,230,208,0.025)_1px,transparent_1px)] [background-size:auto,auto,28px_28px,28px_28px]"
        aria-hidden="true"
      />
      <main class="relative z-10 mx-auto grid w-full max-w-5xl gap-5">
        <Card class="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_18%_12%,hsl(var(--accent)/0.14),transparent_38%),radial-gradient(circle_at_88%_14%,hsl(var(--primary)/0.14),transparent_32%),linear-gradient(180deg,rgba(11,24,31,0.9),rgba(8,17,22,0.86))]">
          <CardHeader class="gap-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="grid gap-1">
                <CardTitle>
                  {t("projectCreation.importMachineConfig")}
                </CardTitle>
                <CardDescription>{pageSubtitle()}</CardDescription>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={machineImport().closeMachineImportFlow}
                disabled={flow().isBusy}
              >
                {t("common.back")}
              </Button>
            </div>
            <div class="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void machineImport().pickMachineIniFile()}
                disabled={flow().isBusy}
              >
                {t("projectCreation.pickMachineIniFile")}
              </Button>
            </div>
            <Show when={flow().errorMessage}>
              {(message) => <Alert variant="destructive">{message()}</Alert>}
            </Show>
          </CardHeader>
        </Card>

        <Show
          when={flow().machineConfigSetup}
          fallback={
            <Card class="border-white/8 bg-transparent shadow-none">
              <CardContent class="pt-6 text-sm text-muted-foreground">
                {t("projectCreation.importMachineConfigHelp")}
              </CardContent>
            </Card>
          }
        >
          {(setup) => (
            <>
              <Show when={flow().step === "machine-files"}>
                <Card class="border-white/8 bg-transparent shadow-none">
                  <CardHeader>
                    <CardTitle>
                      {t("projectCreation.machineConfigIniSource")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="grid gap-3">
                    <div class="grid gap-3 rounded-2xl p-1 text-sm">
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-muted-foreground">
                          {t("common.file")}
                        </span>
                        <span class="mono max-w-[70%] truncate text-right">
                          {setup().ini.sourcePath ?? t("common.unspecified")}
                        </span>
                      </div>
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-muted-foreground">
                          {t("projectCreation.iniKeys")}
                        </span>
                        <span>{iniKeyCount()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Show when={setup().warnings.length > 0}>
                  <Card class="border-warning/20 bg-transparent shadow-none">
                    <CardHeader>
                      <CardTitle>
                        {t("projectCreation.parserWarnings")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent class="grid gap-2">
                      <For each={setup().warnings.slice(0, 20)}>
                        {(warning) => (
                          <Alert class="border-warning/30 bg-warning/10 text-foreground">
                            {warning}
                          </Alert>
                        )}
                      </For>
                    </CardContent>
                  </Card>
                </Show>

                <Card class="border-white/8 bg-transparent shadow-none">
                  <CardHeader>
                    <CardTitle>
                      {t("projectCreation.selectedHalFilesList")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="grid gap-4">
                    <Show
                      when={flow().selectedMachineHalFiles.length > 0}
                      fallback={
                        <div class="text-sm text-muted-foreground">
                          {t("projectCreation.noSelectedHalFiles")}
                        </div>
                      }
                    >
                      <div class="grid gap-3">
                        <For each={flow().selectedMachineHalFiles}>
                          {(halFile, index) => (
                            <div class="grid gap-3 rounded-2xl bg-black/15 p-4">
                              <Input
                                type="text"
                                class="mono"
                                value={halFile.filePath}
                                onInput={(evt) =>
                                  machineImport().updateMachineHalFilePath(
                                    index(),
                                    evt.currentTarget.value,
                                  )
                                }
                              />
                              <div class="flex flex-wrap items-center justify-between gap-3">
                                <Switch
                                  checked={halFile.resolveIniSubstitutions}
                                  disabled={flow().isBusy}
                                  onChange={(checked) =>
                                    machineImport().updateMachineHalFileResolveIni(
                                      index(),
                                      checked,
                                    )
                                  }
                                  class="flex items-center gap-3"
                                >
                                  <SwitchLabel class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                    {t("projectCreation.resolveIniInHalFile")}
                                  </SwitchLabel>
                                  <SwitchControl>
                                    <SwitchThumb />
                                  </SwitchControl>
                                </Switch>
                                <div class="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      void machineImport().pickMachineHalFileForRow(
                                        index(),
                                      )
                                    }
                                    disabled={flow().isBusy}
                                    title={t("projectCreation.browseHalFile")}
                                    aria-label={t(
                                      "projectCreation.browseHalFile",
                                    )}
                                  >
                                    <HiOutlineFolderOpen
                                      size={15}
                                      aria-hidden="true"
                                    />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      machineImport().removeMachineHalFilePath(
                                        index(),
                                      )
                                    }
                                    disabled={flow().isBusy}
                                    title={t(
                                      "projectCreation.removeHalFileRow",
                                    )}
                                    aria-label={t(
                                      "projectCreation.removeHalFileRow",
                                    )}
                                  >
                                    <HiOutlineTrash
                                      size={15}
                                      aria-hidden="true"
                                    />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    </Show>
                    <div class="flex justify-start">
                      <Button
                        type="button"
                        onClick={machineImport().addBlankMachineHalFilePath}
                        disabled={flow().isBusy}
                      >
                        <HiOutlinePlus size={16} aria-hidden="true" />
                        {t("projectCreation.addHalFileRow")}
                      </Button>
                    </div>
                    <div class="flex justify-end">
                      <Button
                        type="button"
                        onClick={() =>
                          void machineImport().continueToLinkStep()
                        }
                        disabled={flow().isBusy}
                      >
                        {t("projectCreation.continueToComponentLinking")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Show>

              <Show when={flow().step === "link" && flow().importDraft}>
                {(draft) => (
                  <>
                    <Card class="border-white/8 bg-transparent shadow-none">
                      <CardHeader>
                        <CardTitle>
                          {t("projectCreation.importSource")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent class="grid gap-4">
                        <div class="grid gap-3 rounded-2xl p-1 text-sm">
                          <div class="flex items-start justify-between gap-3">
                            <span class="text-muted-foreground">
                              {t("common.file")}
                            </span>
                            <span class="mono max-w-[70%] truncate text-right">
                              {flow().machineConfigImport?.machineConfig.ini
                                .sourcePath ??
                                draft().sourcePath ??
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
                            <span>{draft().componentGroups.length}</span>
                          </div>
                          <div class="flex items-start justify-between gap-3">
                            <span class="text-muted-foreground">
                              {t("projectCreation.nets")}
                            </span>
                            <span>{draft().nets.length}</span>
                          </div>
                          <div class="flex items-start justify-between gap-3">
                            <span class="text-muted-foreground">
                              {t("projectCreation.setp")}
                            </span>
                            <span>{draft().setps.length}</span>
                          </div>
                          <div class="flex items-start justify-between gap-3">
                            <span class="text-muted-foreground">
                              {t("projectCreation.addf")}
                            </span>
                            <span>{draft().addfs.length}</span>
                          </div>
                        </div>
                        <div class="grid gap-2">
                          <span class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            {t("projectCreation.placement")}
                          </span>
                          <StringSelect
                            value={flow().placementHeuristic}
                            options={placementOptions}
                            disabled={flow().isBusy}
                            onChange={(value) =>
                              machineImport().changeHalImportPlacementHeuristic(
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
                            onClick={machineImport().backToMachineFilesStep}
                            disabled={flow().isBusy}
                          >
                            {t("common.back")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card class="border-white/8 bg-transparent shadow-none">
                      <CardHeader>
                        <CardTitle>
                          {t("projectCreation.componentLinking")}
                        </CardTitle>
                        <CardDescription>
                          {t("projectCreation.componentLinkingHelp")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div class="grid gap-3">
                          <For each={draft().componentGroups}>
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
                                    value={
                                      flow().linkSelections[group.id] ?? "local"
                                    }
                                    options={[
                                      ...(isSystemHalImportComponentGroup(group)
                                        ? [
                                            {
                                              value: "system",
                                              label: t(
                                                "projectCreation.systemComponent",
                                              ),
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
                                      machineImport().changeHalImportLinkSelection(
                                        group.id,
                                        value,
                                      )
                                    }
                                  />
                                  <div
                                    class="text-xs text-muted-foreground"
                                    title={selectionLabel(
                                      flow().linkSelections[group.id] ??
                                        "local",
                                    )}
                                  >
                                    {selectionLabel(
                                      flow().linkSelections[group.id] ??
                                        "local",
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </For>
                          <Show when={draft().componentGroups.length === 0}>
                            <div class="text-sm text-muted-foreground">
                              {t("projectCreation.noComponentGroups")}
                            </div>
                          </Show>
                        </div>
                      </CardContent>
                    </Card>

                    <Show when={draft().warnings.length > 0}>
                      <Card class="border-warning/20 bg-transparent shadow-none">
                        <CardHeader>
                          <CardTitle>
                            {t("projectCreation.parserWarnings")}
                          </CardTitle>
                        </CardHeader>
                        <CardContent class="grid gap-2">
                          <For each={draft().warnings.slice(0, 20)}>
                            {(warning) => (
                              <Alert class="border-warning/30 bg-warning/10 text-foreground">
                                {warning}
                              </Alert>
                            )}
                          </For>
                          <Show when={draft().warnings.length > 20}>
                            <div class="text-sm text-muted-foreground">
                              {t("projectCreation.parserWarningsTruncated", {
                                count: draft().warnings.length,
                              })}
                            </div>
                          </Show>
                        </CardContent>
                      </Card>
                    </Show>

                    <div class="flex justify-end">
                      <Button
                        type="button"
                        onClick={() =>
                          void machineImport().createImportedProject()
                        }
                        disabled={flow().isBusy}
                      >
                        {t("projectCreation.createImportedProject")}
                      </Button>
                    </div>
                  </>
                )}
              </Show>
            </>
          )}
        </Show>
      </main>
    </div>
  );
}
