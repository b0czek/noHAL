import { getNodePins, getNodeTitle, getSheet } from "@nohal/core/src/graph";
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
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
    <aside class="min-h-0 overflow-auto border-l border-white/8 bg-black/20 p-3">
      <Card>
        <CardHeader>
          <CardTitle>{t("inspector.selection")}</CardTitle>
        </CardHeader>
        <CardContent class="grid gap-4">
          <Show when={!state.selection}>
            <CardDescription>{t("inspector.nothingSelected")}</CardDescription>
          </Show>

          <Show when={selectedNode()}>
            {(node) => (
              <NodeInspector
                project={state.project}
                componentStore={state.componentStore}
                node={node()}
                onOpenComponentEditor={editorUi.openSelectedComponentEditor}
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
                  <FieldLabel>{t("inspector.directConnections")}</FieldLabel>
                  <div class="mono rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm">
                    {conn().id}
                  </div>
                </div>
              </div>
            )}
          </Show>

          <Show when={state.selection}>
            <Show when={state.selection?.kind === "multi"}>
              <CardDescription>
                {t("inspector.multipleSelected")}
              </CardDescription>
            </Show>
            <Button variant="destructive" onClick={actions.removeSelection}>
              {t("inspector.deleteSelection")}
            </Button>
          </Show>
        </CardContent>
      </Card>

      <Show when={state.exportWarnings.length > 0}>
        <Card class="mt-3 border-warning/25">
          <CardHeader>
            <CardTitle>{t("inspector.warnings")}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-2">
            <For each={state.exportWarnings}>
              {(warning) => (
                <Alert class="border-warning/30 bg-warning/10 text-foreground">
                  {warning}
                </Alert>
              )}
            </For>
          </CardContent>
        </Card>
      </Show>
    </aside>
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
  const pins = () => getNodePins(props.project, props.node);
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
  const pinSetpValue = (pinKey: string) => {
    if (props.node.kind !== "component") return undefined;
    const raw = props.node.pinInitialValues?.[pinKey];
    if (typeof raw !== "string") return undefined;
    const value = raw.trim();
    return value.length > 0 ? value : undefined;
  };

  return (
    <div class="grid gap-4">
      <div class="mono rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-sm">
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
      <div class="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {t("inspector.pins")}
      </div>
      <div class="grid gap-2">
        <For each={pins()}>
          {(pin) => {
            const setpValue = pinSetpValue(pin.key);
            return (
              <div class="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                <Badge variant="secondary">{pin.direction}</Badge>
                <span class="mono min-w-0 flex-1 truncate text-sm">
                  {pin.name}
                </span>
                <div class="ml-auto flex min-w-0 items-center gap-2">
                  <Show when={setpValue}>
                    {(value) => (
                      <Badge
                        variant="outline"
                        class="mono normal-case tracking-normal"
                        title={`setp ${props.node.instanceName}.${pin.name} ${value()}`}
                      >
                        setp {value()}
                      </Badge>
                    )}
                  </Show>
                  <Badge variant="secondary">{pin.type}</Badge>
                </div>
              </div>
            );
          }}
        </For>
      </div>
      <Show when={props.node.kind === "component" && component()}>
        <CardDescription>
          {componentParamCount() > 0
            ? t("inspector.parametersAvailableInDialog", {
                count: componentParamCount(),
              })
            : t("inspector.noParameters")}
        </CardDescription>
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
