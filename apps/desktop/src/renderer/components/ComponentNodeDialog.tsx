import {
  fixedExportStageForComponent,
  fixedInstanceNameForComponent,
} from "@nohal/core/src/componentSystem";
import { getNodePins, getNodeTitle } from "@nohal/core/src/graph";
import type { ComponentInstanceConfigFieldDefinition } from "@nohal/core/src/types";
import { createMemo, createSignal, For, Show } from "solid-js";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import { componentUsesLockedCanonicalInstanceNames } from "../state/store/helpers";
import StringSelect from "./form/StringSelect";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "./ui/switch";

export default function ComponentNodeDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const node = () => editorUi.editingComponentNode();
  const component = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return undefined;
    return state.project.library.components[currentNode.componentId];
  });
  const pins = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return [];
    return getNodePins(state.project, currentNode);
  });
  const nodeTitle = createMemo(() => {
    const currentNode = node();
    if (!currentNode) return "";
    return getNodeTitle(state.project, currentNode);
  });
  const componentParams = createMemo(() => component()?.params ?? []);
  const componentFunctions = createMemo(() => component()?.functions ?? []);
  const instanceConfigFields = createMemo(
    () => component()?.runtime?.instanceConfig?.fields ?? [],
  );
  const fixedExportStage = createMemo(() =>
    fixedExportStageForComponent(component()),
  );
  const instanceNameLocked = createMemo(
    () =>
      componentUsesLockedCanonicalInstanceNames(component()) ||
      !!fixedInstanceNameForComponent(component()),
  );
  const pinFilterModes = ["all", "in", "out", "io"] as const;
  const [pinFilter, setPinFilter] =
    createSignal<(typeof pinFilterModes)[number]>("all");
  const visiblePins = createMemo(() => {
    const mode = pinFilter();
    return mode === "all" ? pins() : pins().filter((p) => p.direction === mode);
  });
  const pinFilterLabel = (mode: (typeof pinFilterModes)[number]) => {
    switch (mode) {
      case "all":
        return t("componentDialog.pinFilter.all");
      case "in":
        return t("componentDialog.pinFilter.in");
      case "out":
        return t("componentDialog.pinFilter.out");
      case "io":
        return t("componentDialog.pinFilter.io");
    }
  };
  const addfTargetForFunction = (halSuffix: string) => {
    const instanceName = node()?.instanceName ?? "";
    if (!instanceName) {
      return halSuffix ? `{instance}.${halSuffix}` : "{instance}";
    }
    return halSuffix ? `${instanceName}.${halSuffix}` : instanceName;
  };
  const defaultInstanceConfigValue = (
    field: ComponentInstanceConfigFieldDefinition,
  ): string =>
    field.defaultValue === undefined ? "" : `${field.defaultValue ?? ""}`;
  const instanceConfigValue = (
    field: ComponentInstanceConfigFieldDefinition,
  ): string =>
    node()?.instanceConfigValues?.[field.key] ??
    defaultInstanceConfigValue(field);
  const instanceConfigInputType = (
    field: ComponentInstanceConfigFieldDefinition,
  ) => {
    if (field.type === "integer" || field.type === "number") return "number";
    return "text";
  };
  const instanceConfigInputStep = (
    field: ComponentInstanceConfigFieldDefinition,
  ) => {
    if (field.type === "integer") return "1";
    if (field.type === "number") return "any";
    return undefined;
  };
  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <Dialog
      open={!!node()}
      onOpenChange={(isOpen) => {
        if (!isOpen) editorUi.closeComponentEditor();
      }}
    >
      <Show when={node()}>
        <DialogContent
          class="grid h-[min(780px,calc(100vh-36px))] w-[min(920px,calc(100vw-36px))] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.75rem] border-white/10 bg-[linear-gradient(180deg,rgba(11,24,31,0.96),rgba(8,17,22,0.92))] p-5 shadow-2xl shadow-black/30"
          onContextMenu={(evt: MouseEvent) => evt.preventDefault()}
        >
          <DialogHeader class="border-b border-white/8 pb-4 text-left">
            <DialogTitle>{t("componentDialog.title")}</DialogTitle>
            <DialogDescription class="mono">{nodeTitle()}</DialogDescription>
          </DialogHeader>

          <div class="grid min-h-0 gap-4 overflow-auto pr-1 lg:grid-cols-2">
            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <div class="text-sm font-semibold tracking-tight">
                {t("componentDialog.instance")}
              </div>
              <div class="grid gap-2">
                <span class={fieldLabelClass}>
                  {t("componentDialog.instanceName")}
                </span>
                <Input
                  value={node()?.instanceName ?? ""}
                  disabled={instanceNameLocked()}
                  onInput={(evt) => {
                    const currentNode = node();
                    if (!currentNode) return;
                    actions.renameNode(currentNode.id, evt.currentTarget.value);
                  }}
                />
              </div>
              <Show when={instanceNameLocked()}>
                <div class="text-sm text-muted-foreground">
                  {t("componentDialog.instanceNameLocked")}
                </div>
              </Show>
              <Show when={component()}>
                {(comp) => (
                  <>
                    <div class="grid gap-2 rounded-xl bg-black/20 p-3 text-sm">
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-muted-foreground">
                          {t("componentDialog.halComponent")}
                        </span>
                        <span class="mono">{comp().halComponentName}</span>
                      </div>
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-muted-foreground">
                          {t("componentDialog.source")}
                        </span>
                        <span>{comp().source}</span>
                      </div>
                      <div class="flex items-start justify-between gap-3">
                        <span class="text-muted-foreground">
                          {t("componentDialog.runtime")}
                        </span>
                        <span>
                          {comp().runtime?.kind ?? t("common.unknown")}
                        </span>
                      </div>
                    </div>
                    <div class="grid gap-2">
                      <span class={fieldLabelClass}>
                        {t("componentDialog.exportStage")}
                      </span>
                      <StringSelect
                        value={
                          fixedExportStage() ?? node()?.exportStage ?? "main"
                        }
                        disabled={!!fixedExportStage()}
                        options={[
                          {
                            value: "main",
                            label: t("componentDialog.exportStageMain"),
                          },
                          {
                            value: "postgui",
                            label: t("componentDialog.exportStagePostgui"),
                          },
                        ]}
                        onChange={(value) => {
                          const currentNode = node();
                          if (!currentNode) return;
                          actions.updateNodeExportStage(
                            currentNode.id,
                            value as "main" | "postgui",
                          );
                        }}
                      />
                    </div>
                    <Show when={!!fixedExportStage()}>
                      <div class="text-sm text-muted-foreground">
                        {t("componentDialog.exportStageLockedPostgui")}
                      </div>
                    </Show>
                  </>
                )}
              </Show>
            </section>

            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <div class="text-sm font-semibold tracking-tight">
                {t("componentDialog.functions")}
              </div>
              <Show
                when={componentFunctions().length > 0}
                fallback={
                  <div class="text-sm text-muted-foreground">
                    {t("componentDialog.noFunctions")}
                  </div>
                }
              >
                <div class="grid gap-2">
                  <For each={componentFunctions()}>
                    {(fn) => (
                      <div
                        class="grid gap-2 rounded-xl bg-black/20 p-3 text-sm"
                        title={fn.doc ?? ""}
                      >
                        <div class="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{fn.floatMode}</Badge>
                          <span class="mono">
                            {fn.declaredName === "_"
                              ? t("componentDialog.functionDefault")
                              : fn.halSuffix}
                          </span>
                        </div>
                        <div class="text-xs text-muted-foreground">
                          {t("componentDialog.functionAddf")}
                        </div>
                        <div class="mono text-sm">
                          {addfTargetForFunction(fn.halSuffix)}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </section>

            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <div class="text-sm font-semibold tracking-tight">
                {t("componentDialog.instanceConfig")}
              </div>
              <Show
                when={instanceConfigFields().length > 0}
                fallback={
                  <div class="text-sm text-muted-foreground">
                    {t("componentDialog.noInstanceConfig")}
                  </div>
                }
              >
                <div class="grid gap-3">
                  <For each={instanceConfigFields()}>
                    {(field) => (
                      <div
                        class="grid gap-2 rounded-xl bg-black/20 p-3"
                        title={field.doc ?? ""}
                      >
                        <span class="mono text-sm">{field.key}</span>
                        <Show
                          when={field.type === "boolean"}
                          fallback={
                            <Input
                              type={instanceConfigInputType(field)}
                              step={instanceConfigInputStep(field)}
                              min={
                                field.min !== undefined
                                  ? `${field.min}`
                                  : undefined
                              }
                              max={
                                field.max !== undefined
                                  ? `${field.max}`
                                  : undefined
                              }
                              value={instanceConfigValue(field)}
                              onInput={(evt) => {
                                const currentNode = node();
                                if (!currentNode) return;
                                actions.updateNodeInstanceConfigValue(
                                  currentNode.id,
                                  field.key,
                                  evt.currentTarget.value,
                                );
                              }}
                              placeholder={defaultInstanceConfigValue(field)}
                            />
                          }
                        >
                          <Switch
                            checked={instanceConfigValue(field) === "true"}
                            onChange={(checked) => {
                              const currentNode = node();
                              if (!currentNode) return;
                              actions.updateNodeInstanceConfigValue(
                                currentNode.id,
                                field.key,
                                checked ? "true" : "false",
                              );
                            }}
                            class="flex items-center justify-between gap-3"
                          >
                            <SwitchLabel class="text-sm">Enabled</SwitchLabel>
                            <SwitchControl>
                              <SwitchThumb />
                            </SwitchControl>
                          </Switch>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </section>

            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <div class="text-sm font-semibold tracking-tight">
                {t("componentDialog.parameters")}
              </div>
              <Show
                when={componentParams().length > 0}
                fallback={
                  <div class="text-sm text-muted-foreground">
                    {t("componentDialog.noParameters")}
                  </div>
                }
              >
                <div class="grid gap-3">
                  <For each={componentParams()}>
                    {(param) => (
                      <div class="grid gap-2 rounded-xl bg-black/20 p-3">
                        <span class="mono text-sm">{param.name}</span>
                        <Input
                          value={node()?.paramValues[param.key] ?? ""}
                          onInput={(evt) => {
                            const currentNode = node();
                            if (!currentNode) return;
                            actions.updateNodeParam(
                              currentNode.id,
                              param.key,
                              evt.currentTarget.value,
                            );
                          }}
                          placeholder={param.defaultValue ?? ""}
                        />
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </section>

            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20 lg:col-span-2">
              <div class="text-sm font-semibold tracking-tight">
                {t("componentDialog.pinInitialValues")}
              </div>
              <Show
                when={pins().length > 0}
                fallback={
                  <div class="text-sm text-muted-foreground">
                    {t("componentDialog.noPins")}
                  </div>
                }
              >
                <div class="grid gap-3 md:grid-cols-2">
                  <For each={pins()}>
                    {(pin) => (
                      <div class="grid gap-2 rounded-xl bg-black/20 p-3">
                        <span class="mono text-sm">{pin.name}</span>
                        <Input
                          value={node()?.pinInitialValues?.[pin.key] ?? ""}
                          onInput={(evt) => {
                            const currentNode = node();
                            if (!currentNode) return;
                            actions.updateNodePinInitialValue(
                              currentNode.id,
                              pin.key,
                              evt.currentTarget.value,
                            );
                          }}
                          placeholder={t("componentDialog.optionalPlaceholder")}
                        />
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </section>

            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20 lg:col-span-2">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-sm font-semibold tracking-tight">
                  {t("componentDialog.pins")}
                </div>
                <div class="inline-flex flex-wrap items-center gap-2 rounded-xl bg-black/20 p-1">
                  <For each={pinFilterModes}>
                    {(mode) => (
                      <Button
                        type="button"
                        size="sm"
                        variant={pinFilter() === mode ? "default" : "ghost"}
                        onClick={() => setPinFilter(mode)}
                      >
                        {pinFilterLabel(mode)}
                      </Button>
                    )}
                  </For>
                </div>
              </div>
              <div class="grid gap-2">
                <For each={visiblePins()}>
                  {(pin) => (
                    <div class="grid gap-2 rounded-xl bg-black/20 px-3 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                      <Badge
                        variant={
                          pin.direction === "in"
                            ? "outline"
                            : pin.direction === "out"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {pin.direction}
                      </Badge>
                      <span class="mono min-w-0 truncate">{pin.name}</span>
                      <Badge variant="outline">{pin.type}</Badge>
                    </div>
                  )}
                </For>
              </div>
            </section>
          </div>
        </DialogContent>
      </Show>
    </Dialog>
  );
}
