import { Show } from "solid-js";
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
import MesaConfigEditor from "../../projectSettings/mesa/MesaConfigEditor";
import type { MachineImportController } from "../useMachineImportFlow";

interface MesaStepProps {
  machineImport: MachineImportController;
  mesaFatalIssueCount: number;
  canContinue: boolean;
}

export default function MesaStep(props: MesaStepProps) {
  const { t } = useI18n();
  const flow = () => props.machineImport.machineImportFlow;

  return (
    <Card class="border-white/8 bg-transparent shadow-none">
      <CardHeader>
        <CardTitle>{t("projectCreation.mesaDetectedTitle")}</CardTitle>
        <CardDescription>
          {t("projectCreation.mesaDetectedHelp")}
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-4">
        <Show when={props.mesaFatalIssueCount > 0}>
          <Alert variant="destructive">
            {t("projectCreation.mesaValidationBlocking")}
          </Alert>
        </Show>
        <Show when={flow().mesaConfig?.hosts.length === 0}>
          <Alert class="border-warning/30 bg-warning/10 text-foreground">
            {t("projectCreation.mesaHostRequired")}
          </Alert>
        </Show>
        <MesaConfigEditor
          mesa={flow().mesaConfig ?? { hosts: [] }}
          onAddHost={props.machineImport.addMesaImportHost}
          onRemoveHost={props.machineImport.removeMesaImportHost}
          onUpdateHostKind={props.machineImport.updateMesaImportHostKind}
          onUpdateHostIp={props.machineImport.updateMesaImportHostIp}
          onSetConnectorCard={props.machineImport.setMesaImportConnectorCard}
          onSetRawGpioPinDirection={
            props.machineImport.setMesaImportRawGpioPinDirection
          }
          onSetSmartSerialCard={
            props.machineImport.setMesaImportSmartSerialCard
          }
        />
        <div class="flex justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={props.machineImport.backToMachineFilesStep}
            disabled={flow().isBusy}
          >
            {t("common.back")}
          </Button>
          <Button
            type="button"
            onClick={props.machineImport.continueFromMesaStep}
            disabled={!props.canContinue}
          >
            {t("projectCreation.continueToComponentLinking")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
