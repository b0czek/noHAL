import { deriveMesaTopology } from "@nohal/core/src/mesa";
import type { HalImportPlacementHeuristic } from "@nohal/core/src/types";
import { createEffect, createMemo, createSignal, Show } from "solid-js";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useI18n } from "../../i18n";
import FilesStep from "./components/FilesStep";
import GeneratedComponentDialog from "./components/GeneratedComponentDialog";
import LinkStep from "./components/LinkStep";
import MesaStep from "./components/MesaStep";
import type { MachineImportController } from "./useMachineImportFlow";

export interface MachineImportPageProps {
  machineImport: MachineImportController;
}

export default function MachineImportPage(props: MachineImportPageProps) {
  const { t } = useI18n();
  const machineImport = () => props.machineImport;
  const flow = () => machineImport().machineImportFlow;
  const [editingGeneratedGroupId, setEditingGeneratedGroupId] = createSignal<
    string | null
  >(null);

  const iniKeyCount = createMemo(() =>
    (flow().machineConfigSetup?.ini.sections ?? []).reduce(
      (count, section) => count + section.entries.length,
      0,
    ),
  );

  const pageSubtitle = createMemo(() => {
    const step = flow().step;
    switch (step) {
      case "machine-files":
        return t("projectCreation.subtitleMachineFiles");
      case "mesa":
        return t("projectCreation.subtitleMesa");
      case "link":
        return t("projectCreation.subtitleLink");
    }
  });

  const mesaTopology = createMemo(() =>
    deriveMesaTopology(flow().mesaConfig ?? { hosts: [] }),
  );
  const mesaFatalIssues = createMemo(() =>
    mesaTopology().issues.filter((issue) => issue.severity === "fatal"),
  );
  const canContinueFromMesa = createMemo(
    () =>
      (flow().mesaConfig?.hosts.length ?? 0) > 0 &&
      mesaFatalIssues().length === 0 &&
      !flow().isBusy,
  );

  const placementOptions: Array<{
    value: HalImportPlacementHeuristic;
    label: string;
  }> = [
    {
      value: "related-groups",
      label: t("projectCreation.placementRelatedGroups"),
    },
    {
      value: "alphabetical",
      label: t("projectCreation.placementAlphabetical"),
    },
  ];

  const editingGeneratedGroup = createMemo(() => {
    const groupId = editingGeneratedGroupId();
    if (!groupId) return undefined;
    return flow().importDraft?.componentGroups.find(
      (group) => group.id === groupId,
    );
  });

  const editingGeneratedComponent = createMemo(() => {
    const groupId = editingGeneratedGroupId();
    if (!groupId) return undefined;
    return flow().generatedLocalComponents[groupId];
  });

  const editingGeneratedEditor = createMemo(() => {
    const group = editingGeneratedGroup();
    const component = editingGeneratedComponent();
    if (!group || !component) return undefined;
    return { group, component };
  });

  createEffect(() => {
    const current = editingGeneratedGroupId();
    if (!current) return;
    if ((flow().linkSelections[current] ?? "local") !== "local") {
      setEditingGeneratedGroupId(null);
      return;
    }
    if (editingGeneratedEditor()) return;
    setEditingGeneratedGroupId(null);
  });

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
                <FilesStep
                  machineImport={machineImport()}
                  setup={setup()}
                  iniKeyCount={iniKeyCount()}
                />
              </Show>

              <Show when={flow().step === "mesa" && flow().mesaConfig}>
                <MesaStep
                  machineImport={machineImport()}
                  mesaFatalIssueCount={mesaFatalIssues().length}
                  canContinue={canContinueFromMesa()}
                />
              </Show>

              <Show when={flow().step === "link" && flow().importDraft}>
                {(draft) => (
                  <LinkStep
                    machineImport={machineImport()}
                    draft={draft()}
                    onEditGeneratedGroup={setEditingGeneratedGroupId}
                    placementOptions={placementOptions}
                  />
                )}
              </Show>

              <GeneratedComponentDialog
                machineImport={machineImport()}
                editor={editingGeneratedEditor()}
                onClose={() => setEditingGeneratedGroupId(null)}
              />
            </>
          )}
        </Show>
      </main>
    </div>
  );
}
