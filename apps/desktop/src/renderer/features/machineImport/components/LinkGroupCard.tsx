import { analyzeSystemHalImportOverride } from "@nohal/core/halImport";
import type {
  ComponentStoreEntry,
  HalImportComponentGroup,
  HalImportDraft,
} from "@nohal/core/types";
import { HiOutlinePencilSquare } from "solid-icons/hi";
import { createMemo, Show } from "solid-js";
import StringSelect from "../../../components/form/StringSelect";
import { Alert } from "../../../components/ui/alert";
import { Button } from "../../../components/ui/button";
import { useI18n } from "../../../i18n";
import { useEditorStore } from "../../../state/EditorStoreProvider";
import type { MachineImportController } from "../useMachineImportFlow";

interface LinkGroupCardProps {
  group: HalImportComponentGroup;
  machineImport: MachineImportController;
  motmod: HalImportDraft["motmod"];
  storeEntries: ComponentStoreEntry[];
  linkReason?: string;
  onEditGeneratedGroup: () => void;
}

export default function LinkGroupCard(props: LinkGroupCardProps) {
  const { t } = useI18n();
  const { state } = useEditorStore();
  const flow = () => props.machineImport.machineImportFlow;

  const selection = () => flow().linkSelections[props.group.id] ?? "local";
  const isSystemSelectable = () =>
    flow().systemLinkGroupIds.includes(props.group.id);
  const generatedLocalComponent = () =>
    flow().generatedLocalComponents[props.group.id];

  const selectionOptions = createMemo(() => {
    const exact: typeof props.storeEntries = [];
    const partial: typeof props.storeEntries = [];
    const lower = props.group.inferredHalComponentName.toLowerCase();
    for (const entry of props.storeEntries) {
      const name = entry.parsed.halComponentName.toLowerCase();
      if (name === lower) exact.push(entry);
      else if (name.includes(lower) || lower.includes(name)) {
        partial.push(entry);
      }
    }
    const orderedEntries = [
      ...exact,
      ...partial,
      ...props.storeEntries.filter(
        (entry) => !exact.includes(entry) && !partial.includes(entry),
      ),
    ];

    return [
      ...(isSystemSelectable()
        ? [
            {
              value: "system",
              label: t("projectCreation.systemComponent"),
            },
          ]
        : [
            {
              value: "local",
              label: t("projectCreation.projectLocalGenerated"),
            },
          ]),
      ...orderedEntries.map((entry) => ({
        value: `store:${entry.componentId}`,
        label: `${entry.parsed.halComponentName} (${entry.parsed.pins.length}p/${entry.parsed.params.length} prm)`,
      })),
    ];
  });

  const selectionLabel = createMemo(() => {
    const value = selection();
    if (!value || value === "local") {
      return t("projectCreation.projectLocalGenerated");
    }
    if (value === "system") {
      return t("projectCreation.systemComponent");
    }
    if (!value.startsWith("store:")) return value;
    const componentId = value.slice("store:".length);
    const entry = state.componentStore.components[componentId];
    if (!entry) return t("projectCreation.storeFallback", { componentId });
    return t("projectCreation.storeEntry", {
      name: entry.parsed.halComponentName,
    });
  });

  const systemOverrideAnalysis = createMemo(() => {
    if (selection() !== "system") return null;
    const component = generatedLocalComponent();
    if (!component || !isSystemSelectable()) return null;
    return analyzeSystemHalImportOverride(props.group, component, {
      linuxcncVersion: props.machineImport.selectedLinuxCncVersion(),
      motmod: props.motmod,
    });
  });

  const systemOverrideItemsLabel = createMemo(() => {
    const analysis = systemOverrideAnalysis();
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
  });

  return (
    <div class="grid gap-4 rounded-2xl bg-black/15 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div class="min-w-0 space-y-2">
        <div class="mono font-medium">
          {props.group.inferredHalComponentName}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("projectCreation.groupStats", {
            instances: props.group.instances.length,
            pins: props.group.pins.length,
            params: props.group.params.length,
            runtime: props.group.runtimeHint,
          })}
        </div>
        <Show when={props.linkReason}>
          <div class="text-sm text-muted-foreground">
            {t("projectCreation.autoReason", {
              reason: props.linkReason,
            })}
          </div>
        </Show>
        <div class="mono text-xs text-muted-foreground">
          {props.group.instances
            .slice(0, 3)
            .map((item) => item.instanceName)
            .join(", ")}
          {props.group.instances.length > 3 ? " ..." : ""}
        </div>
      </div>
      <div class="grid gap-2">
        <span class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t("projectCreation.linkTarget")}
        </span>
        <StringSelect
          value={selection()}
          options={selectionOptions()}
          onChange={(value) =>
            props.machineImport.changeHalImportLinkSelection(
              props.group.id,
              value,
            )
          }
        />
        <div class="flex items-center gap-1">
          <div class="text-xs text-muted-foreground" title={selectionLabel()}>
            {selectionLabel()}
          </div>
          <Show when={systemOverrideAnalysis()}>
            <span
              class="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-warning"
              title={t("projectCreation.systemOverrideBadgeTitle")}
            >
              {t("projectCreation.systemOverrideBadge")}
            </span>
          </Show>
          <Show
            when={selection() === "local" && Boolean(generatedLocalComponent())}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={flow().isBusy}
              title={t("projectCreation.editGeneratedComponent")}
              aria-label={t("projectCreation.editGeneratedComponent")}
              onClick={props.onEditGeneratedGroup}
            >
              <HiOutlinePencilSquare size={15} aria-hidden="true" />
            </Button>
          </Show>
        </div>
        <Show when={systemOverrideAnalysis()}>
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
                  {systemOverrideItemsLabel()}
                </div>
              </div>
            </Alert>
          )}
        </Show>
      </div>
    </div>
  );
}
