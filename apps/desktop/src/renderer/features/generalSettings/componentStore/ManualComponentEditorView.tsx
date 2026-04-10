import type { ComponentStoreEntry } from "@nohal/core/types";
import { HiOutlineArrowLeft } from "solid-icons/hi";
import { Button } from "../../../components/ui/button";
import { useI18n } from "../../../i18n";
import { useEditorStore } from "../../../state/EditorStoreProvider";
import CustomComponentEditor from "../../projectSettings/CustomComponentEditor";

interface ManualComponentEditorViewProps {
  entry: ComponentStoreEntry;
  onBack: () => void;
}

export default function ManualComponentEditorView(
  props: ManualComponentEditorViewProps,
) {
  const { t } = useI18n();
  const { actions } = useEditorStore();

  return (
    <div class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-2xl bg-black/20 p-4">
      <div class="flex items-start gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={t("common.back")}
          aria-label={t("common.back")}
          onClick={props.onBack}
        >
          <HiOutlineArrowLeft size={16} aria-hidden="true" />
        </Button>
        <div class="min-w-0">
          <div class="text-lg font-semibold">
            {t("componentStore.customSource")}
          </div>
          <div class="mono truncate text-sm text-muted-foreground">
            {props.entry.parsed.halComponentName}
          </div>
        </div>
      </div>

      <CustomComponentEditor
        component={props.entry.parsed}
        onRemoveComponent={() =>
          void actions.removeStoreCustomComponent(props.entry.componentId)
        }
        onHalComponentNameChange={(value) =>
          void actions.updateStoreCustomComponentHalComponentName(
            props.entry.componentId,
            value,
          )
        }
        onRuntimeKindChange={(value) =>
          void actions.updateStoreCustomComponentRuntimeKind(
            props.entry.componentId,
            value,
          )
        }
        onLoadCommandChange={(value) =>
          void actions.updateStoreCustomComponentLoadCommand(
            props.entry.componentId,
            value,
          )
        }
        onMaxInstancesChange={(value) =>
          void actions.updateStoreCustomComponentMaxInstances(
            props.entry.componentId,
            value,
          )
        }
        onAddPin={() =>
          void actions.addStoreCustomComponentPin(props.entry.componentId)
        }
        onRemovePin={(pinKey) =>
          void actions.removeStoreCustomComponentPin(
            props.entry.componentId,
            pinKey,
          )
        }
        onPinNameChange={(pinKey, value) =>
          void actions.updateStoreCustomComponentPinName(
            props.entry.componentId,
            pinKey,
            value,
          )
        }
        onPinTypeChange={(pinKey, value) =>
          void actions.updateStoreCustomComponentPinType(
            props.entry.componentId,
            pinKey,
            value,
          )
        }
        onPinDirectionChange={(pinKey, value) =>
          void actions.updateStoreCustomComponentPinDirection(
            props.entry.componentId,
            pinKey,
            value,
          )
        }
        onAddParam={() =>
          void actions.addStoreCustomComponentParam(props.entry.componentId)
        }
        onRemoveParam={(paramKey) =>
          void actions.removeStoreCustomComponentParam(
            props.entry.componentId,
            paramKey,
          )
        }
        onParamNameChange={(paramKey, value) =>
          void actions.updateStoreCustomComponentParamName(
            props.entry.componentId,
            paramKey,
            value,
          )
        }
        onParamTypeChange={(paramKey, value) =>
          void actions.updateStoreCustomComponentParamType(
            props.entry.componentId,
            paramKey,
            value,
          )
        }
        onParamDirectionChange={(paramKey, value) =>
          void actions.updateStoreCustomComponentParamDirection(
            props.entry.componentId,
            paramKey,
            value,
          )
        }
        onParamDefaultValueChange={(paramKey, value) =>
          void actions.updateStoreCustomComponentParamDefaultValue(
            props.entry.componentId,
            paramKey,
            value,
          )
        }
        onAddFunction={() =>
          void actions.addStoreCustomComponentFunction(props.entry.componentId)
        }
        onRemoveFunction={(functionKey) =>
          void actions.removeStoreCustomComponentFunction(
            props.entry.componentId,
            functionKey,
          )
        }
        onFunctionNameChange={(functionKey, value) =>
          void actions.updateStoreCustomComponentFunctionName(
            props.entry.componentId,
            functionKey,
            value,
          )
        }
        onFunctionFloatModeChange={(functionKey, value) =>
          void actions.updateStoreCustomComponentFunctionFloatMode(
            props.entry.componentId,
            functionKey,
            value,
          )
        }
      />
    </div>
  );
}
