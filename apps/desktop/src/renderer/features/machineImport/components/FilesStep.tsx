import type { MachineConfigImportSetupDraft } from "@nohal/core/src/types";
import {
  HiOutlineFolderOpen,
  HiOutlinePlus,
  HiOutlineTrash,
} from "solid-icons/hi";
import { For, Show } from "solid-js";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from "../../../components/ui/switch";
import { useI18n } from "../../../i18n";
import type { MachineImportController } from "../useMachineImportFlow";
import WarningsCard from "./WarningsCard";

interface FilesStepProps {
  machineImport: MachineImportController;
  setup: MachineConfigImportSetupDraft;
  iniKeyCount: number;
}

export default function FilesStep(props: FilesStepProps) {
  const { t } = useI18n();
  const flow = () => props.machineImport.machineImportFlow;

  return (
    <>
      <Card class="border-white/8 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle>{t("projectCreation.machineConfigIniSource")}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-3">
          <div class="grid gap-3 rounded-2xl p-1 text-sm">
            <div class="flex items-start justify-between gap-3">
              <span class="text-muted-foreground">{t("common.file")}</span>
              <span class="mono max-w-[70%] truncate text-right">
                {props.setup.ini.sourcePath ?? t("common.unspecified")}
              </span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-muted-foreground">
                {t("projectCreation.iniKeys")}
              </span>
              <span>{props.iniKeyCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <WarningsCard warnings={props.setup.warnings} />

      <Card class="border-white/8 bg-transparent shadow-none">
        <CardHeader>
          <CardTitle>{t("projectCreation.selectedHalFilesList")}</CardTitle>
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
                        props.machineImport.updateMachineHalFilePath(
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
                          props.machineImport.updateMachineHalFileResolveIni(
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
                            void props.machineImport.pickMachineHalFileForRow(
                              index(),
                            )
                          }
                          disabled={flow().isBusy}
                          title={t("projectCreation.browseHalFile")}
                          aria-label={t("projectCreation.browseHalFile")}
                        >
                          <HiOutlineFolderOpen size={15} aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            props.machineImport.removeMachineHalFilePath(
                              index(),
                            )
                          }
                          disabled={flow().isBusy}
                          title={t("projectCreation.removeHalFileRow")}
                          aria-label={t("projectCreation.removeHalFileRow")}
                        >
                          <HiOutlineTrash size={15} aria-hidden="true" />
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
              onClick={props.machineImport.addBlankMachineHalFilePath}
              disabled={flow().isBusy}
            >
              <HiOutlinePlus size={16} aria-hidden="true" />
              {t("projectCreation.addHalFileRow")}
            </Button>
          </div>
          <div class="flex justify-end">
            <Button
              type="button"
              onClick={() => void props.machineImport.continueToLinkStep()}
              disabled={flow().isBusy}
            >
              {t("projectCreation.continueToComponentLinking")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
