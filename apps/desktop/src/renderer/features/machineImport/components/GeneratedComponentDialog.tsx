import type {
  ComponentDefinition,
  HalImportComponentGroup,
} from "@nohal/core/src/types";
import { Show } from "solid-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { useI18n } from "../../../i18n";
import CustomComponentEditor from "../../projectSettings/CustomComponentEditor";
import type { MachineImportController } from "../useMachineImportFlow";

interface GeneratedComponentDialogProps {
  machineImport: MachineImportController;
  editor:
    | {
        group: HalImportComponentGroup;
        component: ComponentDefinition;
      }
    | undefined;
  onClose: () => void;
}

export default function GeneratedComponentDialog(
  props: GeneratedComponentDialogProps,
) {
  const { t } = useI18n();

  return (
    <Show when={props.editor}>
      {(editor) => (
        <Dialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) props.onClose();
          }}
        >
          <DialogContent
            class="grid h-[min(760px,calc(100vh-36px))] w-[min(1040px,calc(100vw-36px))] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.75rem] border-white/10 bg-[linear-gradient(180deg,rgba(11,24,31,0.96),rgba(8,17,22,0.92))] p-5 shadow-2xl shadow-black/30"
            onContextMenu={(evt: MouseEvent) => evt.preventDefault()}
          >
            <DialogHeader class="text-left">
              <DialogTitle>
                {t("projectCreation.editGeneratedComponent")}
              </DialogTitle>
              <DialogDescription class="mono">
                {editor().component.halComponentName}
              </DialogDescription>
            </DialogHeader>
            <div class="min-h-0 overflow-hidden">
              <CustomComponentEditor
                component={editor().component}
                {...props.machineImport.bindGeneratedLocalComponentEditor(
                  editor().group.id,
                )}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Show>
  );
}
