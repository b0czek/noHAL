import {
  addfQueueEntryKey,
  addfQueueEntryNodeId,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
  makeAddfQueueSubsheetOutputEntry,
} from "@nohal/core/src/addfQueue";
import { resolveAddfFunctionTarget } from "@nohal/core/src/componentFunctions";
import {
  firstSheetThreadOutputId,
  getSheetThreadOutputs,
} from "@nohal/core/src/sheetThreads";
import type {
  NoHALProject,
  SheetAddfQueueStoredEntry,
  SheetNodeInstance,
  SheetThreadOutputDefinition,
} from "@nohal/core/src/types";
import {
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineTrash,
} from "solid-icons/hi";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";
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

interface SheetQueueRow {
  rowKey: string;
  queueKey: string;
  queueEntry: SheetAddfQueueStoredEntry;
  nodeId: string;
  instanceName: string;
  kind: "component" | "function" | "subsheet";
  title: string;
  subtitle: string;
  sortName: string;
  sheetThreadOutputId: string;
}

function buildSheetQueueRows(
  project: NoHALProject,
  sheetId: string | null,
  labels: {
    missingSheet: string;
    missing: string;
    defaultFunction: string;
    unknownFloat: string;
  },
): SheetQueueRow[] {
  if (!sheetId) return [];
  const sheet = project.sheets[sheetId];
  if (!sheet) return [];
  const threadOutputs = getSheetThreadOutputs(sheet);
  const defaultThreadOutputId =
    threadOutputs[0]?.id ?? firstSheetThreadOutputId(sheet);
  const validThreadOutputIds = new Set(
    threadOutputs.map((output) => output.id),
  );
  const normalizeThreadOutputId = (value?: string): string =>
    value && validThreadOutputIds.has(value) ? value : defaultThreadOutputId;

  const eligibleNodes: SheetNodeInstance[] = sheet.nodes.filter((node) => {
    if (node.kind === "sheet") return true;
    const component = project.library.components[node.componentId];
    return component?.runtime?.kind === "rt";
  });
  const byId = new Map(eligibleNodes.map((node) => [node.id, node]));
  const rows: SheetQueueRow[] = [];
  const seenKeys = new Set<string>();
  const coveredByNodeEntry = new Set<string>();
  const coveredFunctionKeysByNodeId = new Map<string, Set<string>>();

  const appendRow = (row: SheetQueueRow) => {
    if (seenKeys.has(row.queueKey)) return;
    seenKeys.add(row.queueKey);
    rows.push(row);
  };

  const componentFunctionRows = (
    node: Extract<SheetNodeInstance, { kind: "component" }>,
  ): SheetQueueRow[] => {
    const component = project.library.components[node.componentId];
    const functions = component?.functions ?? [];
    if (functions.length === 0) {
      const queueEntry = makeAddfQueueNodeEntry(node.id, defaultThreadOutputId);
      const queueKey = addfQueueEntryKey(queueEntry) ?? `node:${node.id}`;
      return [
        {
          rowKey: `node:${node.id}`,
          queueKey,
          queueEntry,
          nodeId: node.id,
          instanceName: node.instanceName,
          kind: "component",
          title: node.instanceName,
          subtitle: component?.halComponentName ?? labels.missing,
          sortName: node.instanceName,
          sheetThreadOutputId: defaultThreadOutputId,
        },
      ];
    }
    return functions.flatMap((fn) => {
      const covered = coveredFunctionKeysByNodeId.get(node.id);
      if (covered?.has(fn.key)) return [];
      const queueEntry = makeAddfQueueFunctionEntry(
        node.id,
        fn.key,
        defaultThreadOutputId,
      );
      const queueKey =
        addfQueueEntryKey(queueEntry) ?? `fn:${node.id}:${fn.key}`;
      const addfTarget = resolveAddfFunctionTarget(node.instanceName, fn);
      const fnLabel = fn.halSuffix || labels.defaultFunction;
      const floatLabel =
        fn.floatMode === "unknown" ? labels.unknownFloat : fn.floatMode;
      return {
        rowKey: `fn:${node.id}:${fn.key}`,
        queueKey,
        queueEntry,
        nodeId: node.id,
        instanceName: node.instanceName,
        kind: "function" as const,
        title: addfTarget,
        subtitle: `${component?.halComponentName ?? labels.missing} • ${fnLabel} • ${floatLabel}`,
        sortName: `${node.instanceName}\u0000${fn.halSuffix || "\u0000"}`,
        sheetThreadOutputId: defaultThreadOutputId,
      };
    });
  };

  const nodeRow = (node: SheetNodeInstance): SheetQueueRow | null => {
    if (node.kind === "sheet") {
      return null;
    }
    const component = project.library.components[node.componentId];
    return {
      rowKey: `node:${node.id}`,
      queueKey:
        addfQueueEntryKey(
          makeAddfQueueNodeEntry(node.id, defaultThreadOutputId),
        ) ?? `node:${node.id}`,
      queueEntry: makeAddfQueueNodeEntry(node.id, defaultThreadOutputId),
      nodeId: node.id,
      instanceName: node.instanceName,
      kind: "component",
      title: node.instanceName,
      subtitle: component?.halComponentName ?? labels.missing,
      sortName: node.instanceName,
      sheetThreadOutputId: defaultThreadOutputId,
    };
  };

  const subsheetOutputRows = (
    node: Extract<SheetNodeInstance, { kind: "sheet" }>,
    parentThreadOutputId: string,
  ): SheetQueueRow[] => {
    const childSheet = project.sheets[node.sheetId];
    const childOutputs = childSheet ? getSheetThreadOutputs(childSheet) : [];
    const threadMap = node.hal?.threadMap ?? {};
    if (childOutputs.length === 0) {
      const queueEntry = makeAddfQueueSubsheetOutputEntry(
        node.id,
        "default",
        parentThreadOutputId,
      );
      return [
        {
          rowKey: `subsheet:${node.id}:default`,
          queueKey:
            addfQueueEntryKey(queueEntry) ?? `subsheet:${node.id}:default`,
          queueEntry,
          nodeId: node.id,
          instanceName: node.instanceName,
          kind: "subsheet",
          title: `${node.instanceName}.default`,
          subtitle: childSheet?.name ?? labels.missingSheet,
          sortName: `${node.instanceName}\u0000default`,
          sheetThreadOutputId: parentThreadOutputId,
        },
      ];
    }
    return childOutputs.map((childOutput) => {
      const mappedParentOutputId = threadMap[childOutput.id];
      const resolvedParentOutputId =
        mappedParentOutputId && validThreadOutputIds.has(mappedParentOutputId)
          ? mappedParentOutputId
          : parentThreadOutputId;
      const queueEntry = makeAddfQueueSubsheetOutputEntry(
        node.id,
        childOutput.id,
        resolvedParentOutputId,
      );
      return {
        rowKey: `subsheet:${node.id}:${childOutput.id}`,
        queueKey:
          addfQueueEntryKey(queueEntry) ??
          `subsheet:${node.id}:${childOutput.id}`,
        queueEntry,
        nodeId: node.id,
        instanceName: node.instanceName,
        kind: "subsheet",
        title: `${node.instanceName}.${childOutput.name}`,
        subtitle: childSheet?.name ?? labels.missingSheet,
        sortName: `${node.instanceName}\u0000${childOutput.name}`,
        sheetThreadOutputId: resolvedParentOutputId,
      };
    });
  };

  for (const entry of sheet.hal?.addfQueue ?? []) {
    const queueKey = addfQueueEntryKey(entry);
    const nodeId = addfQueueEntryNodeId(entry);
    if (!queueKey || !nodeId) continue;
    const node = byId.get(nodeId);
    if (!node) continue;

    if (typeof entry !== "string" && entry.kind === "component-function") {
      if (node.kind !== "component") continue;
      const component = project.library.components[node.componentId];
      const fn = component?.functions?.find(
        (item) => item.key === entry.functionKey,
      );
      if (!fn) continue;
      const covered = coveredFunctionKeysByNodeId.get(node.id);
      if (covered) covered.add(fn.key);
      else coveredFunctionKeysByNodeId.set(node.id, new Set([fn.key]));
      const addfTarget = resolveAddfFunctionTarget(node.instanceName, fn);
      const fnLabel = fn.halSuffix || labels.defaultFunction;
      const floatLabel =
        fn.floatMode === "unknown" ? labels.unknownFloat : fn.floatMode;
      appendRow({
        rowKey: `fn:${node.id}:${fn.key}`,
        queueKey,
        queueEntry: entry,
        nodeId,
        instanceName: node.instanceName,
        kind: "function",
        title: addfTarget,
        subtitle: `${component?.halComponentName ?? labels.missing} • ${fnLabel} • ${floatLabel}`,
        sortName: `${node.instanceName}\u0000${fn.halSuffix || "\u0000"}`,
        sheetThreadOutputId: normalizeThreadOutputId(entry.sheetThreadOutputId),
      });
      continue;
    }

    if (typeof entry !== "string" && entry.kind === "subsheet-output") {
      if (node.kind !== "sheet") continue;
      const childSheet = project.sheets[node.sheetId];
      const childOutput = childSheet
        ? getSheetThreadOutputs(childSheet).find(
            (output) => output.id === entry.childThreadOutputId,
          )
        : undefined;
      if (!childOutput) continue;
      const resolvedParentThreadOutputId = normalizeThreadOutputId(
        entry.sheetThreadOutputId,
      );
      const queueEntry = {
        ...entry,
        sheetThreadOutputId: resolvedParentThreadOutputId,
      } as const;
      appendRow({
        rowKey: `subsheet:${node.id}:${childOutput.id}`,
        queueKey:
          addfQueueEntryKey(queueEntry) ??
          `subsheet:${node.id}:${childOutput.id}`,
        queueEntry,
        nodeId,
        instanceName: node.instanceName,
        kind: "subsheet",
        title: `${node.instanceName}.${childOutput.name}`,
        subtitle: childSheet?.name ?? labels.missingSheet,
        sortName: `${node.instanceName}\u0000${childOutput.name}`,
        sheetThreadOutputId: resolvedParentThreadOutputId,
      });
      continue;
    }

    if (node.kind === "component") {
      const component = project.library.components[node.componentId];
      if ((component?.functions?.length ?? 0) > 0)
        coveredByNodeEntry.add(node.id);
    }
    if (node.kind === "sheet") {
      for (const row of subsheetOutputRows(
        node,
        typeof entry === "string"
          ? defaultThreadOutputId
          : normalizeThreadOutputId(entry.sheetThreadOutputId),
      )) {
        appendRow(row);
      }
      continue;
    }
    const row = nodeRow(node);
    if (row) {
      const resolvedThreadOutputId =
        typeof entry === "string"
          ? defaultThreadOutputId
          : normalizeThreadOutputId(entry.sheetThreadOutputId);
      row.queueEntry =
        typeof entry === "string"
          ? makeAddfQueueNodeEntry(nodeId, defaultThreadOutputId)
          : {
              ...entry,
              sheetThreadOutputId: resolvedThreadOutputId,
            };
      row.queueKey = addfQueueEntryKey(row.queueEntry) ?? row.queueKey;
      row.sheetThreadOutputId = resolvedThreadOutputId;
      appendRow(row);
    }
  }

  for (const node of eligibleNodes) {
    if (node.kind === "sheet") {
      for (const row of subsheetOutputRows(node, defaultThreadOutputId))
        appendRow(row);
      continue;
    }
    if (coveredByNodeEntry.has(node.id)) continue;
    for (const row of componentFunctionRows(node)) appendRow(row);
  }

  return rows;
}

export default function SheetSettingsDialog() {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const editorUi = useEditorUi();
  const [draggingRowKey, setDraggingRowKey] = createSignal<string | null>(null);
  const [dropTargetId, setDropTargetId] = createSignal<string | null>(null);

  const sheet = createMemo(() => {
    const sheetId = editorUi.sheetSettingsSheetId();
    if (!sheetId) return undefined;
    return state.project.sheets[sheetId];
  });
  const threadOutputs = createMemo<SheetThreadOutputDefinition[]>(() => {
    const current = sheet();
    if (!current) return [];
    return getSheetThreadOutputs(current);
  });
  const isRootSheet = createMemo(
    () => sheet()?.id === state.project.rootSheetId,
  );
  const halThreads = createMemo(() => state.project.halThreads ?? []);
  const rows = createMemo(() =>
    buildSheetQueueRows(state.project, editorUi.sheetSettingsSheetId(), {
      missingSheet: t("sheetSettings.missingSheet"),
      missing: t("sheetSettings.missing"),
      defaultFunction: t("sheetSettings.defaultFunction"),
      unknownFloat: t("common.unknown"),
    }),
  );
  const rowsByThreadOutput = createMemo(() => {
    const rowList = rows();
    const outputs = threadOutputs();
    return outputs.map((output) => ({
      output,
      rows: rowList.filter((row) => row.sheetThreadOutputId === output.id),
    }));
  });

  const commitQueueOrder = (entries: SheetAddfQueueStoredEntry[]) => {
    const sheetId = editorUi.sheetSettingsSheetId();
    if (!sheetId) return;
    actions.setSheetAddfQueue(sheetId, entries);
  };

  const commitRows = (nextRows: SheetQueueRow[]) => {
    const entriesByThread = new Map<string, SheetAddfQueueStoredEntry[]>();
    for (const output of threadOutputs()) entriesByThread.set(output.id, []);
    for (const row of nextRows) {
      const list = entriesByThread.get(row.sheetThreadOutputId);
      if (list) list.push(row.queueEntry);
    }
    const flattened = threadOutputs().flatMap(
      (output) => entriesByThread.get(output.id) ?? [],
    );
    commitQueueOrder(flattened);
  };

  const moveRowBefore = (
    draggedRowKey: string,
    targetRowKey: string,
    targetThreadOutputId: string,
  ): string | null => {
    if (draggedRowKey === targetRowKey) return null;
    const currentRows = rows();
    const draggedIndex = currentRows.findIndex(
      (row) => row.rowKey === draggedRowKey,
    );
    const targetIndex = currentRows.findIndex(
      (row) => row.rowKey === targetRowKey,
    );
    if (draggedIndex < 0 || targetIndex < 0) return null;
    const targetRow = currentRows[targetIndex];
    const nextRows = [...currentRows];
    const [removed] = nextRows.splice(draggedIndex, 1);
    if (!removed) return null;
    const updatedRow: SheetQueueRow = {
      ...removed,
      queueEntry:
        typeof removed.queueEntry === "string"
          ? makeAddfQueueNodeEntry(removed.nodeId, targetThreadOutputId)
          : {
              ...removed.queueEntry,
              sheetThreadOutputId: targetThreadOutputId,
            },
      sheetThreadOutputId: targetThreadOutputId,
    };
    updatedRow.queueKey =
      addfQueueEntryKey(updatedRow.queueEntry) ?? updatedRow.queueKey;
    const insertIndex = nextRows.findIndex(
      (row) => row.rowKey === targetRow.rowKey,
    );
    if (insertIndex < 0) return null;
    nextRows.splice(insertIndex, 0, updatedRow);
    commitRows(nextRows);
    return updatedRow.rowKey;
  };

  const appendRowToThread = (
    draggedRowKey: string,
    targetThreadOutputId: string,
  ): string | null => {
    const currentRows = rows();
    const draggedIndex = currentRows.findIndex(
      (row) => row.rowKey === draggedRowKey,
    );
    if (draggedIndex < 0) return null;
    const nextRows = [...currentRows];
    const [removed] = nextRows.splice(draggedIndex, 1);
    if (!removed) return null;
    const updatedRow: SheetQueueRow = {
      ...removed,
      queueEntry:
        typeof removed.queueEntry === "string"
          ? makeAddfQueueNodeEntry(removed.nodeId, targetThreadOutputId)
          : {
              ...removed.queueEntry,
              sheetThreadOutputId: targetThreadOutputId,
            },
      sheetThreadOutputId: targetThreadOutputId,
    };
    updatedRow.queueKey =
      addfQueueEntryKey(updatedRow.queueEntry) ?? updatedRow.queueKey;
    nextRows.push(updatedRow);
    commitRows(nextRows);
    return updatedRow.rowKey;
  };

  createEffect(() => {
    if (!draggingRowKey()) return;
    const finishDrag = () => {
      setDraggingRowKey(null);
      setDropTargetId(null);
    };
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    onCleanup(() => {
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    });
  });

  return (
    <Dialog
      open={!!sheet()}
      onOpenChange={(isOpen) => {
        if (!isOpen) editorUi.closeSheetSettings();
      }}
    >
      <Show when={sheet()}>
        <DialogContent
          class="grid h-[min(780px,calc(100vh-36px))] w-[min(980px,calc(100vw-36px))] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden rounded-[1.75rem] border-white/10 bg-[linear-gradient(180deg,rgba(11,24,31,0.96),rgba(8,17,22,0.92))] p-5 shadow-2xl shadow-black/30"
          onContextMenu={(evt: MouseEvent) => evt.preventDefault()}
        >
          <DialogHeader class="border-b border-white/8 pb-4 text-left">
            <DialogTitle>{t("sheetSettings.title")}</DialogTitle>
            <DialogDescription class="mono">{sheet()?.name}</DialogDescription>
          </DialogHeader>

          <div class="grid min-h-0 gap-4 overflow-auto pr-1">
            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <div class="text-sm font-semibold tracking-tight">
                {t("sheetSettings.threadOutputsTitle")}
              </div>
              <div class="grid gap-2 text-sm text-muted-foreground">
                <div>{t("sheetSettings.threadOutputsHelp")}</div>
                <Show when={isRootSheet()}>
                  <div>{t("sheetSettings.rootThreadBindingHelp")}</div>
                </Show>
              </div>
              <div class="flex justify-start">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const sheetId = editorUi.sheetSettingsSheetId();
                    if (!sheetId) return;
                    actions.addSheetThreadOutput(sheetId);
                  }}
                >
                  {t("sheetSettings.addThreadOutput")}
                </Button>
              </div>
              <div class="grid max-h-56 gap-2 overflow-auto pr-1">
                <For each={threadOutputs()}>
                  {(output) => (
                    <div class="grid gap-3 rounded-xl bg-black/20 p-3 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                      <Input
                        class="mono"
                        value={output.name}
                        onChange={(evt) => {
                          const sheetId = editorUi.sheetSettingsSheetId();
                          if (!sheetId) return;
                          actions.updateSheetThreadOutputName(
                            sheetId,
                            output.id,
                            evt.currentTarget.value,
                          );
                        }}
                      />
                      <Show when={isRootSheet()}>
                        <StringSelect
                          value={output.halThreadId ?? ""}
                          options={[
                            {
                              value: "",
                              label: t(
                                "sheetSettings.rootThreadBindingUnbound",
                              ),
                            },
                            ...halThreads().map((thread) => ({
                              value: thread.id,
                              label: thread.name,
                            })),
                          ]}
                          onChange={(value) => {
                            const sheetId = editorUi.sheetSettingsSheetId();
                            if (!sheetId) return;
                            actions.updateSheetThreadOutputHalBinding(
                              sheetId,
                              output.id,
                              value.trim() || null,
                            );
                          }}
                        />
                      </Show>
                      <div class="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={threadOutputs().length <= 1}
                          onClick={() => {
                            const sheetId = editorUi.sheetSettingsSheetId();
                            if (!sheetId) return;
                            actions.removeSheetThreadOutput(sheetId, output.id);
                          }}
                          title={t("common.remove")}
                          aria-label={t("common.remove")}
                        >
                          <HiOutlineTrash size={16} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </section>

            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="grid gap-1">
                  <div class="text-sm font-semibold tracking-tight">
                    {t("sheetSettings.addfQueueTitle")}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {t("sheetSettings.addfQueueHelp")}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const sorted = [...rows()].sort((a, b) =>
                      a.sortName.localeCompare(b.sortName),
                    );
                    commitRows(sorted);
                  }}
                >
                  {t("sheetSettings.resetAZ")}
                </Button>
              </div>
            </section>

            <section class="grid gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-inner shadow-black/20">
              <div class="text-sm font-semibold tracking-tight">
                {t("sheetSettings.queueItems")}
              </div>
              <div class="grid max-h-[min(60vh,620px)] gap-3 overflow-auto pr-1">
                <For each={rowsByThreadOutput()}>
                  {(group) => (
                    <section
                      class="grid gap-3 rounded-2xl bg-black/20 p-3"
                      onPointerEnter={() => {
                        const dragged = draggingRowKey();
                        if (!dragged) return;
                        if (group.rows.length > 0) return;
                        setDropTargetId(`thread:${group.output.id}:end`);
                        appendRowToThread(dragged, group.output.id);
                      }}
                    >
                      <div class="flex items-center justify-between gap-3">
                        <Badge variant="outline">{group.output.name}</Badge>
                        <span class="mono text-xs text-muted-foreground">
                          {group.rows.length}
                        </span>
                      </div>

                      <div class="grid gap-3">
                        <For each={group.rows}>
                          {(row, index) => (
                            <div
                              class={`grid gap-3 rounded-xl p-3 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
                                draggingRowKey() === row.rowKey
                                  ? "border-accent/30 bg-accent/10 opacity-65"
                                  : dropTargetId() === `row:${row.rowKey}`
                                    ? "border-accent/30 bg-accent/10"
                                    : "bg-black/20"
                              }`}
                              role="presentation"
                              onPointerEnter={() => {
                                const dragged = draggingRowKey();
                                if (!dragged || dragged === row.rowKey) return;
                                setDropTargetId(`row:${row.rowKey}`);
                                moveRowBefore(
                                  dragged,
                                  row.rowKey,
                                  group.output.id,
                                );
                              }}
                              onPointerUp={() => {
                                if (!draggingRowKey()) return;
                                setDraggingRowKey(null);
                                setDropTargetId(null);
                              }}
                            >
                              <button
                                type="button"
                                class={`grid h-10 w-10 place-items-center rounded-lg transition ${
                                  draggingRowKey() === row.rowKey
                                    ? "bg-accent/10"
                                    : "hover:bg-accent/5"
                                }`}
                                title={t("sheetSettings.dragToReorder")}
                                onPointerDown={(evt) => {
                                  evt.preventDefault();
                                  evt.stopPropagation();
                                  setDraggingRowKey(row.rowKey);
                                  setDropTargetId(`row:${row.rowKey}`);
                                }}
                              >
                                <span
                                  class="grid grid-cols-2 gap-1"
                                  aria-hidden="true"
                                >
                                  <span class="h-1 w-1 rounded-full bg-foreground/70" />
                                  <span class="h-1 w-1 rounded-full bg-foreground/70" />
                                  <span class="h-1 w-1 rounded-full bg-foreground/70" />
                                  <span class="h-1 w-1 rounded-full bg-foreground/70" />
                                </span>
                              </button>
                              <div class="min-w-0">
                                <div class="mono truncate font-medium">
                                  <span class="mr-2 inline-block min-w-7 text-right text-muted-foreground">
                                    {index() + 1}.
                                  </span>
                                  {row.title}
                                </div>
                                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline">
                                    {row.kind === "subsheet"
                                      ? t("sheetSettings.kindSheet")
                                      : row.kind === "function"
                                        ? t("sheetSettings.kindFunction")
                                        : t("sheetSettings.kindRt")}
                                  </Badge>
                                  <span>{row.subtitle}</span>
                                </div>
                              </div>
                              <div class="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={index() === 0}
                                  title={t("common.up")}
                                  aria-label={t("common.up")}
                                  onClick={() => {
                                    const prev = group.rows[index() - 1];
                                    if (!prev) return;
                                    moveRowBefore(
                                      row.rowKey,
                                      prev.rowKey,
                                      group.output.id,
                                    );
                                  }}
                                >
                                  <HiOutlineChevronUp
                                    size={16}
                                    aria-hidden="true"
                                  />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={index() === group.rows.length - 1}
                                  title={t("common.down")}
                                  aria-label={t("common.down")}
                                  onClick={() => {
                                    const next = group.rows[index() + 1];
                                    if (!next) return;
                                    const currentRows = rows();
                                    const nextRows = [...currentRows];
                                    const draggedIndex = nextRows.findIndex(
                                      (item) => item.rowKey === row.rowKey,
                                    );
                                    const nextIndex = nextRows.findIndex(
                                      (item) => item.rowKey === next.rowKey,
                                    );
                                    if (draggedIndex < 0 || nextIndex < 0) {
                                      return;
                                    }
                                    const [item] = nextRows.splice(
                                      draggedIndex,
                                      1,
                                    );
                                    if (!item) return;
                                    item.sheetThreadOutputId = group.output.id;
                                    item.queueEntry =
                                      typeof item.queueEntry === "string"
                                        ? makeAddfQueueNodeEntry(
                                            item.nodeId,
                                            group.output.id,
                                          )
                                        : {
                                            ...item.queueEntry,
                                            sheetThreadOutputId:
                                              group.output.id,
                                          };
                                    item.queueKey =
                                      addfQueueEntryKey(item.queueEntry) ??
                                      item.queueKey;
                                    const nextInsertIndex =
                                      nextRows.findIndex(
                                        (candidate) =>
                                          candidate.rowKey === next.rowKey,
                                      ) + 1;
                                    nextRows.splice(nextInsertIndex, 0, item);
                                    commitRows(nextRows);
                                  }}
                                >
                                  <HiOutlineChevronDown
                                    size={16}
                                    aria-hidden="true"
                                  />
                                </Button>
                              </div>
                            </div>
                          )}
                        </For>
                        <div
                          class={`min-h-[18px] rounded-lg transition ${
                            dropTargetId() === `thread:${group.output.id}:end`
                              ? "border border-dashed border-accent/30 bg-accent/10"
                              : "bg-white/[0.03]"
                          }`}
                          onPointerEnter={() => {
                            const dragged = draggingRowKey();
                            if (!dragged) return;
                            setDropTargetId(`thread:${group.output.id}:end`);
                            appendRowToThread(dragged, group.output.id);
                          }}
                          onPointerUp={() => {
                            if (!draggingRowKey()) return;
                            setDraggingRowKey(null);
                            setDropTargetId(null);
                          }}
                        />
                      </div>
                    </section>
                  )}
                </For>

                <Show when={rows().length === 0}>
                  <div class="px-1 py-2 text-xs text-muted-foreground">
                    {t("sheetSettings.empty")}
                  </div>
                </Show>
              </div>
            </section>
          </div>
        </DialogContent>
      </Show>
    </Dialog>
  );
}
