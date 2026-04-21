import {
  customLoadCommandInterpolationAliases,
  customLoadCommandInterpolationTokens,
} from "@nohal/core/customComponent";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  HalValueType,
} from "@nohal/core/types";
import { HiOutlinePlus, HiOutlineTrash } from "solid-icons/hi";
import { createMemo, Index, type JSXElement, Show } from "solid-js";
import StringSelect from "../../components/form/StringSelect";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { useI18n } from "../../i18n";
import FloatModeToggle from "./FloatModeToggle";

export interface CustomComponentEditorProps {
  component: ComponentDefinition;
  headerActions?: JSXElement;
  onHalComponentNameChange: (value: string) => void;
  onRuntimeKindChange: (value: "rt" | "userspace" | "unknown") => void;
  onLoadCommandChange: (value: string) => void;
  onMaxInstancesChange: (value: number | undefined) => void;
  onAddPin: () => void;
  onRemovePin: (pinKey: string) => void;
  onPinNameChange: (pinKey: string, value: string) => void;
  onPinTypeChange: (pinKey: string, value: HalValueType) => void;
  onPinDirectionChange: (pinKey: string, value: "in" | "out" | "io") => void;
  onAddParam: () => void;
  onRemoveParam: (paramKey: string) => void;
  onParamNameChange: (paramKey: string, value: string) => void;
  onParamTypeChange: (paramKey: string, value: HalValueType) => void;
  onParamDirectionChange: (paramKey: string, value: "r" | "rw") => void;
  onParamDefaultValueChange: (paramKey: string, value: string) => void;
  onAddFunction: () => void;
  onRemoveFunction: (functionKey: string) => void;
  onFunctionNameChange: (functionKey: string, value: string) => void;
  onFunctionFloatModeChange: (
    functionKey: string,
    value: ComponentFunctionDefinition["floatMode"],
  ) => void;
  onRemoveComponent?: () => void;
  removeDisabled?: boolean;
  removeTitle?: string;
}

const halValueTypes: HalValueType[] = [
  "bit",
  "float",
  "s32",
  "u32",
  "s64",
  "u64",
  "port",
];

export default function CustomComponentEditor(
  props: CustomComponentEditorProps,
) {
  const { t } = useI18n();
  const loadStringHint = createMemo(
    () =>
      `${t("customComponents.loadStringHelpTitle")}\n${t("customComponents.loadStringHelpSubtitle")}\n\n${t("customComponents.loadStringHelpTokens")}: ${customLoadCommandInterpolationTokens.join(", ")}\n${t("customComponents.loadStringHelpAliases")}: ${customLoadCommandInterpolationAliases.join(", ")}`,
  );

  const fieldLabelClass =
    "text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";
  const runtimeOptions = [
    { value: "rt", label: t("customComponents.runtimeRt") },
    { value: "userspace", label: t("customComponents.runtimeUserspace") },
    { value: "unknown", label: t("customComponents.runtimeUnknown") },
  ];
  const pinDirectionOptions = [
    { value: "in", label: t("componentDialog.pinFilter.in") },
    { value: "out", label: t("componentDialog.pinFilter.out") },
    { value: "io", label: t("componentDialog.pinFilter.io") },
  ];
  const halValueTypeOptions = halValueTypes.map((valueType) => ({
    value: valueType,
    label: valueType,
  }));
  const paramDirectionOptions = [
    { value: "r", label: t("customComponents.paramDirectionRead") },
    { value: "rw", label: t("customComponents.paramDirectionReadWrite") },
  ];
  return (
    <section class="grid h-full min-h-0 auto-rows-max content-start gap-4 overflow-auto pr-1">
      <div class="grid gap-3 rounded-2xl p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div class="flex items-start justify-between gap-3 lg:col-span-2">
          <div class="grid gap-1">
            <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("customComponents.editorTitle")}
            </div>
            <div class="mono text-sm text-muted-foreground">
              {props.component.halComponentName}
            </div>
          </div>
          <div class="flex items-center gap-2">
            {props.headerActions}
            <Show when={props.onRemoveComponent}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={props.removeDisabled}
                aria-label={t("customComponents.removeComponent")}
                title={
                  props.removeTitle ?? t("customComponents.removeComponent")
                }
                onClick={() => props.onRemoveComponent?.()}
              >
                <HiOutlineTrash size={16} aria-hidden="true" />
              </Button>
            </Show>
          </div>
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("customComponents.componentName")}
          </span>
          <Input
            type="text"
            class="mono"
            value={props.component.halComponentName}
            onChange={(evt) =>
              props.onHalComponentNameChange(evt.currentTarget.value)
            }
          />
        </div>
        <div class="grid gap-2">
          <span class={fieldLabelClass}>{t("customComponents.runtime")}</span>
          <StringSelect
            value={props.component.runtime?.kind ?? "unknown"}
            options={runtimeOptions}
            onChange={(value) =>
              props.onRuntimeKindChange(value as "rt" | "userspace" | "unknown")
            }
          />
        </div>

        <div class="grid gap-2">
          <span class={fieldLabelClass}>
            {t("customComponents.maxInstances")}
          </span>
          <Input
            type="number"
            min="1"
            step="1"
            value={props.component.runtime?.instanceNaming?.maxInstances ?? ""}
            placeholder={t("customComponents.optionalValue")}
            onChange={(evt) => {
              const raw = evt.currentTarget.value.trim();
              props.onMaxInstancesChange(
                raw ? Number.parseInt(raw, 10) : undefined,
              );
            }}
          />
        </div>

        <div class="grid gap-2 lg:col-span-2">
          <div class="flex items-center gap-2">
            <span class={fieldLabelClass}>
              {t("customComponents.loadString")}
            </span>
            <button
              type="button"
              class="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-semibold text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
              title={loadStringHint()}
              aria-label={loadStringHint()}
            >
              ?
            </button>
          </div>
          <Textarea
            class="mono min-h-[80px]"
            rows={2}
            value={props.component.loadCommand ?? ""}
            placeholder={t("customComponents.loadStringPlaceholder")}
            onChange={(evt) =>
              props.onLoadCommandChange(evt.currentTarget.value)
            }
          />
        </div>
      </div>

      <div class="grid gap-4 rounded-2xl p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("customComponents.pinsTitle")}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={t("customComponents.addPin")}
            aria-label={t("customComponents.addPin")}
            onClick={props.onAddPin}
          >
            <HiOutlinePlus size={16} aria-hidden="true" />
          </Button>
        </div>
        <Show
          when={props.component.pins.length > 0}
          fallback={
            <div class="text-sm text-muted-foreground">
              {t("customComponents.noPins")}
            </div>
          }
        >
          <div class="hidden grid-cols-[minmax(0,1fr)_140px_140px_auto] gap-3 px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground lg:grid">
            <span>{t("common.name")}</span>
            <span>{t("common.direction")}</span>
            <span>{t("common.type")}</span>
            <span />
          </div>
          <div class="grid gap-3">
            <Index each={props.component.pins}>
              {(pin) => (
                <div class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto] lg:items-center">
                  <div class="grid gap-2">
                    <span class={`${fieldLabelClass} lg:hidden`}>
                      {t("common.name")}
                    </span>
                    <Input
                      type="text"
                      class="mono"
                      value={pin().name}
                      onChange={(evt) =>
                        props.onPinNameChange(
                          pin().key,
                          evt.currentTarget.value,
                        )
                      }
                    />
                  </div>
                  <div class="grid gap-2">
                    <span class={`${fieldLabelClass} lg:hidden`}>
                      {t("common.direction")}
                    </span>
                    <StringSelect
                      value={pin().direction}
                      options={pinDirectionOptions}
                      onChange={(value) =>
                        props.onPinDirectionChange(
                          pin().key,
                          value as "in" | "out" | "io",
                        )
                      }
                    />
                  </div>
                  <div class="grid gap-2">
                    <span class={`${fieldLabelClass} lg:hidden`}>
                      {t("common.type")}
                    </span>
                    <StringSelect
                      value={pin().type}
                      options={halValueTypeOptions}
                      onChange={(value) =>
                        props.onPinTypeChange(pin().key, value as HalValueType)
                      }
                    />
                  </div>
                  <div class="flex justify-end lg:self-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={t("common.remove")}
                      aria-label={t("common.remove")}
                      onClick={() => props.onRemovePin(pin().key)}
                    >
                      <HiOutlineTrash size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
            </Index>
          </div>
        </Show>
      </div>

      <div class="grid gap-4 rounded-2xl p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("customComponents.paramsTitle")}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={t("customComponents.addParam")}
            aria-label={t("customComponents.addParam")}
            onClick={props.onAddParam}
          >
            <HiOutlinePlus size={16} aria-hidden="true" />
          </Button>
        </div>
        <Show
          when={props.component.params.length > 0}
          fallback={
            <div class="text-sm text-muted-foreground">
              {t("customComponents.noParams")}
            </div>
          }
        >
          <div class="hidden grid-cols-[minmax(0,1fr)_140px_180px_minmax(0,1fr)_auto] gap-3 px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground xl:grid">
            <span>{t("common.name")}</span>
            <span>{t("common.type")}</span>
            <span>{t("customComponents.paramDirection")}</span>
            <span>{t("customComponents.paramDefaultValue")}</span>
            <span />
          </div>
          <div class="grid gap-3">
            <Index each={props.component.params}>
              {(param) => (
                <div class="grid gap-3 rounded-xl bg-black/20 p-3 xl:grid-cols-[minmax(0,1fr)_140px_180px_minmax(0,1fr)_auto] xl:items-end">
                  <div class="grid gap-2">
                    <span class={`${fieldLabelClass} xl:hidden`}>
                      {t("common.name")}
                    </span>
                    <Input
                      type="text"
                      class="mono"
                      value={param().name}
                      onChange={(evt) =>
                        props.onParamNameChange(
                          param().key,
                          evt.currentTarget.value,
                        )
                      }
                    />
                  </div>
                  <div class="grid gap-2">
                    <span class={`${fieldLabelClass} xl:hidden`}>
                      {t("common.type")}
                    </span>
                    <StringSelect
                      value={param().type}
                      options={halValueTypeOptions}
                      onChange={(value) =>
                        props.onParamTypeChange(
                          param().key,
                          value as HalValueType,
                        )
                      }
                    />
                  </div>
                  <div class="grid gap-2">
                    <span class={`${fieldLabelClass} xl:hidden`}>
                      {t("customComponents.paramDirection")}
                    </span>
                    <StringSelect
                      value={param().direction}
                      options={paramDirectionOptions}
                      onChange={(value) =>
                        props.onParamDirectionChange(
                          param().key,
                          value as "r" | "rw",
                        )
                      }
                    />
                  </div>
                  <div class="grid gap-2">
                    <span class={`${fieldLabelClass} xl:hidden`}>
                      {t("customComponents.paramDefaultValue")}
                    </span>
                    <Input
                      type="text"
                      class="mono"
                      value={param().defaultValue ?? ""}
                      placeholder={t("customComponents.optionalValue")}
                      onChange={(evt) =>
                        props.onParamDefaultValueChange(
                          param().key,
                          evt.currentTarget.value,
                        )
                      }
                    />
                  </div>
                  <div class="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={t("common.remove")}
                      aria-label={t("common.remove")}
                      onClick={() => props.onRemoveParam(param().key)}
                    >
                      <HiOutlineTrash size={16} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
            </Index>
          </div>
        </Show>
      </div>

      <Show when={(props.component.runtime?.kind ?? "unknown") === "rt"}>
        <div class="grid gap-4 rounded-2xl p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t("customComponents.functionsTitle")}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={t("customComponents.addFunction")}
              aria-label={t("customComponents.addFunction")}
              onClick={props.onAddFunction}
            >
              <HiOutlinePlus size={16} aria-hidden="true" />
            </Button>
          </div>
          <Show
            when={(props.component.functions?.length ?? 0) > 0}
            fallback={
              <div class="text-sm text-muted-foreground">
                {t("customComponents.noFunctions")}
              </div>
            }
          >
            <div class="hidden grid-cols-[minmax(0,1fr)_140px_auto] gap-3 px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground lg:grid">
              <span>{t("common.name")}</span>
              <span>{t("threadsDialog.floatMode")}</span>
              <span />
            </div>
            <div class="grid gap-3">
              <Index each={props.component.functions ?? []}>
                {(fn) => (
                  <div class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_140px_auto] lg:items-end">
                    <div class="grid gap-2">
                      <span class={`${fieldLabelClass} lg:hidden`}>
                        {t("common.name")}
                      </span>
                      <Input
                        type="text"
                        class="mono"
                        value={fn().declaredName}
                        onChange={(evt) =>
                          props.onFunctionNameChange(
                            fn().key,
                            evt.currentTarget.value,
                          )
                        }
                      />
                    </div>
                    <div class="grid gap-2">
                      <span class={`${fieldLabelClass} lg:hidden`}>
                        {t("threadsDialog.floatMode")}
                      </span>
                      <FloatModeToggle
                        value={fn().floatMode}
                        onChange={(value) =>
                          props.onFunctionFloatModeChange(fn().key, value)
                        }
                      />
                    </div>
                    <div class="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title={t("common.remove")}
                        aria-label={t("common.remove")}
                        onClick={() => props.onRemoveFunction(fn().key)}
                      >
                        <HiOutlineTrash size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </Index>
            </div>
          </Show>
        </div>
      </Show>
    </section>
  );
}
