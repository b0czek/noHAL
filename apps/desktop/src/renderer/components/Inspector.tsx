import { getNodeTitle, getSheet } from "@nohal/core/src/graph";
import type {
  ComponentStore,
  HalValueType,
  LabelScope,
  NoHALProject,
  SheetNodeInstance,
} from "@nohal/core/src/types";
import { For, Show } from "solid-js";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
import StringSelect, { type StringSelectOption } from "./form/StringSelect";
import { Alert } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const PORT_TYPE_OPTIONS: ReadonlyArray<StringSelectOption> = [
  { value: "bit", label: "bit" },
  { value: "float", label: "float" },
  { value: "s32", label: "s32" },
  { value: "u32", label: "u32" },
  { value: "s64", label: "s64" },
  { value: "u64", label: "u64" },
  { value: "port", label: "port" },
];

export default function Inspector() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const currentSheet = () => getSheet(state.project, state.activeSheetId);
  const labelScopeOptions: ReadonlyArray<StringSelectOption> = [
    { value: "local", label: "local" },
    { value: "global", label: "global" },
  ];
  const portDirectionOptions: ReadonlyArray<StringSelectOption> = [
    { value: "in", label: "in" },
    { value: "out", label: "out" },
    { value: "io", label: "io" },
  ];
  const selectedNode = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "node") return undefined;
      return currentSheet().nodes.find((n) => n.id === selection.id);
    })();
  const selectedLabel = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "label") return undefined;
      return currentSheet().labels.find((l) => l.id === selection.id);
    })();
  const selectedPort = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "sheet-port") return undefined;
      return currentSheet().ports.find((p) => p.id === selection.id);
    })();
  const selectedComment = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "comment") return undefined;
      return currentSheet().comments.find((c) => c.id === selection.id);
    })();
  const selectedConnection = () =>
    (() => {
      const selection = state.selection;
      if (!selection || selection.kind !== "wire-connection") return undefined;
      return currentSheet().directConnections.find(
        (c) => c.id === selection.id,
      );
    })();

  return (
    <Show when={state.selection || state.exportWarnings.length > 0}>
      <aside class="pointer-events-none absolute right-3 top-3 z-10 grid w-[min(22rem,calc(100%-24rem))] min-w-[18rem] gap-3">
        <Show when={state.selection}>
          <Card class="pointer-events-auto flex max-h-[min(42rem,calc(100vh-8rem))] flex-col overflow-hidden !border-white/12 ![background:linear-gradient(180deg,rgba(11,24,31,0.42),rgba(8,17,22,0.28))] backdrop-blur-2xl">
            <CardHeader class="pb-3">
              <CardTitle>{t("inspector.selection")}</CardTitle>
            </CardHeader>
            <CardContent class="min-h-0 flex-1 overflow-auto pt-0">
              <div class="grid gap-4">
                <Show when={selectedNode()}>
                  {(node) => (
                    <NodeInspector
                      project={state.project}
                      componentStore={state.componentStore}
                      node={node()}
                      onOpenComponentEditor={
                        editorUi.openSelectedComponentEditor
                      }
                      onRename={(name) => actions.renameNode(node().id, name)}
                      onEnterSelectedSheet={actions.enterSelectedSheet}
                      onRefreshComponentInStore={(componentId) =>
                        void actions.refreshComponentInStore(componentId)
                      }
                    />
                  )}
                </Show>

                <Show when={selectedLabel()}>
                  {(label) => (
                    <div class="grid gap-3">
                      <div class="grid gap-2">
                        <FieldLabel>{t("common.name")}</FieldLabel>
                        <Input
                          value={label().name}
                          onInput={(e) =>
                            actions.updateLabel(label().id, {
                              name: e.currentTarget.value,
                            })
                          }
                        />
                      </div>
                      <div class="grid gap-2">
                        <FieldLabel>{t("common.scope")}</FieldLabel>
                        <StringSelect
                          value={label().scope}
                          options={labelScopeOptions}
                          onChange={(value) =>
                            actions.updateLabel(label().id, {
                              scope: value as LabelScope,
                            })
                          }
                        />
                      </div>
                      <RotationEditor
                        value={label().rotation ?? 0}
                        onChange={(rotation) =>
                          actions.updateLabel(label().id, { rotation })
                        }
                      />
                    </div>
                  )}
                </Show>

                <Show when={selectedComment()}>
                  {(comment) => (
                    <div class="grid gap-3">
                      <div class="grid gap-2">
                        <FieldLabel>{t("common.text")}</FieldLabel>
                        <Textarea
                          rows={4}
                          value={comment().text}
                          onInput={(e) =>
                            actions.updateComment(comment().id, {
                              text: e.currentTarget.value,
                            })
                          }
                        />
                      </div>
                      <RotationEditor
                        value={comment().rotation ?? 0}
                        onChange={(rotation) =>
                          actions.updateComment(comment().id, { rotation })
                        }
                      />
                    </div>
                  )}
                </Show>

                <Show when={selectedPort()}>
                  {(port) => (
                    <div class="grid gap-3">
                      <div class="grid gap-2">
                        <FieldLabel>{t("common.name")}</FieldLabel>
                        <Input
                          value={port().name}
                          onInput={(e) =>
                            actions.updateSheetPort(port().id, {
                              name: e.currentTarget.value,
                            })
                          }
                        />
                      </div>
                      <div class="grid gap-2">
                        <FieldLabel>{t("common.direction")}</FieldLabel>
                        <StringSelect
                          value={port().direction}
                          options={portDirectionOptions}
                          onChange={(value) =>
                            actions.updateSheetPort(port().id, {
                              direction: value as "in" | "out" | "io",
                            })
                          }
                        />
                      </div>
                      <div class="grid gap-2">
                        <FieldLabel>{t("common.type")}</FieldLabel>
                        <StringSelect
                          value={port().type}
                          options={PORT_TYPE_OPTIONS}
                          onChange={(value) =>
                            actions.updateSheetPort(port().id, {
                              type: value as HalValueType,
                            })
                          }
                        />
                      </div>
                      <RotationEditor
                        value={port().rotation ?? 0}
                        onChange={(rotation) =>
                          actions.updateSheetPort(port().id, { rotation })
                        }
                      />
                    </div>
                  )}
                </Show>

                <Show when={selectedConnection()}>
                  {(conn) => (
                    <div class="grid gap-3">
                      <div class="grid gap-2">
                        <FieldLabel>{t("common.signalName")}</FieldLabel>
                        <Input
                          value={conn().signalName ?? ""}
                          placeholder={t("componentDialog.optionalPlaceholder")}
                          onInput={(e) =>
                            actions.updateDirectConnectionSignalName(
                              conn().id,
                              e.currentTarget.value,
                            )
                          }
                        />
                      </div>
                      <div class="grid gap-2">
                        <FieldLabel>
                          {t("inspector.directConnections")}
                        </FieldLabel>
                        <div class="mono px-1 text-sm text-muted-foreground">
                          {conn().id}
                        </div>
                      </div>
                    </div>
                  )}
                </Show>

                <Show when={state.selection?.kind === "multi"}>
                  <p class="text-sm text-muted-foreground">
                    {t("inspector.multipleSelected")}
                  </p>
                </Show>
                <Button variant="destructive" onClick={actions.removeSelection}>
                  {t("inspector.deleteSelection")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Show>

        <Show when={state.exportWarnings.length > 0}>
          <Card class="pointer-events-auto overflow-hidden !border-white/12 ![background:linear-gradient(180deg,rgba(11,24,31,0.42),rgba(8,17,22,0.28))] backdrop-blur-2xl">
            <CardHeader class="flex-row items-center justify-between gap-3 pb-3">
              <CardTitle>{t("inspector.warnings")}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-8 rounded-lg px-3"
                onClick={() => actions.clearExportWarnings()}
              >
                {t("common.close")}
              </Button>
            </CardHeader>
            <CardContent class="grid max-h-[min(16rem,calc(100vh-10rem))] gap-2 overflow-auto pt-0">
              <For each={state.exportWarnings}>
                {(warning) => (
                  <Alert class="border-warning/20 bg-warning/5 text-foreground">
                    {warning}
                  </Alert>
                )}
              </For>
            </CardContent>
          </Card>
        </Show>
      </aside>
    </Show>
  );
}

function RotationEditor(props: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div class="grid gap-2">
      <FieldLabel>{t("common.rotation")}</FieldLabel>
      <div class="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => props.onChange((props.value || 0) - 90)}
          title={t("inspector.rotateNeg90")}
        >
          -90
        </Button>
        <Input
          type="number"
          step="15"
          class="mono"
          value={Number.isFinite(props.value) ? props.value : 0}
          onInput={(e) => {
            const next = Number.parseFloat(e.currentTarget.value);
            if (Number.isFinite(next)) props.onChange(next);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => props.onChange((props.value || 0) + 90)}
          title={t("inspector.rotatePos90")}
        >
          +90
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => props.onChange(0)}
          title={t("inspector.resetRotation")}
        >
          0
        </Button>
      </div>
    </div>
  );
}

function NodeInspector(props: {
  project: NoHALProject;
  componentStore: ComponentStore;
  node: SheetNodeInstance;
  onOpenComponentEditor: () => void;
  onRename: (name: string) => void;
  onEnterSelectedSheet: () => void;
  onRefreshComponentInStore: (componentId: string) => void;
}) {
  const { t } = useI18n();
  const component = () =>
    props.node.kind === "component"
      ? props.project.library.components[props.node.componentId]
      : undefined;
  const canRefreshFromStore = () =>
    props.node.kind === "component" &&
    (() => {
      const entry = props.componentStore.components[props.node.componentId];
      if (!entry) return false;
      return entry.sourceRef.kind !== "linuxcnc-builtin";
    })();
  const componentParamCount = () => component()?.params.length ?? 0;
  return (
    <div class="grid gap-4">
      <div class="mono px-1 text-sm text-muted-foreground">
        {getNodeTitle(props.project, props.node)}
      </div>
      <Show
        when={props.node.kind === "component"}
        fallback={
          <div class="grid gap-2">
            <FieldLabel>{t("componentDialog.instanceName")}</FieldLabel>
            <Input
              value={props.node.instanceName}
              onInput={(e) => props.onRename(e.currentTarget.value)}
            />
          </div>
        }
      >
        <Button type="button" onClick={props.onOpenComponentEditor}>
          {t("inspector.openComponentSettings")}
        </Button>
      </Show>
      <Show
        when={
          props.node.kind === "component" &&
          component()?.source === "comp" &&
          component() &&
          canRefreshFromStore()
        }
      >
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const comp = component();
            if (!comp) return;
            props.onRefreshComponentInStore(comp.id);
          }}
        >
          {t("inspector.refreshComponentDefinition")}
        </Button>
      </Show>
      <Show when={props.node.kind === "sheet"}>
        <Button type="button" onClick={props.onEnterSelectedSheet}>
          {t("inspector.enterSubsheet")}
        </Button>
      </Show>
      <Show when={props.node.kind === "component" && component()}>
        <p class="text-sm text-muted-foreground">
          {componentParamCount() > 0
            ? t("inspector.parametersAvailableInDialog", {
                count: componentParamCount(),
              })
            : t("inspector.noParameters")}
        </p>
      </Show>
    </div>
  );
}

function FieldLabel(props: { children: string }) {
  return (
    <span class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {props.children}
    </span>
  );
}
