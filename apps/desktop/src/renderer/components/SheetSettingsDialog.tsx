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
import { Portal } from "solid-js/web";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

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
    <Show when={sheet()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={() => editorUi.closeSheetSettings()}
        >
          <div
            class="modal sheet-settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("sheetSettings.ariaLabel")}
            onPointerDown={(evt) => evt.stopPropagation()}
            onContextMenu={(evt) => evt.preventDefault()}
          >
            <div class="modal-header">
              <div>
                <div class="modal-title">{t("sheetSettings.title")}</div>
                <div class="modal-sub mono">{sheet()?.name}</div>
              </div>
              <button
                type="button"
                class="btn subtle"
                onClick={editorUi.closeSheetSettings}
              >
                {t("common.close")}
              </button>
            </div>

            <div class="modal-body sheet-settings-body">
              <section class="panel">
                <div class="panel-title">
                  {t("sheetSettings.threadOutputsTitle")}
                </div>
                <div class="component-store-toolbar">
                  <div class="muted">
                    {t("sheetSettings.threadOutputsHelp")}
                  </div>
                  <Show when={isRootSheet()}>
                    <div class="muted">
                      {t("sheetSettings.rootThreadBindingHelp")}
                    </div>
                  </Show>
                  <div class="toolbar-group">
                    <button
                      type="button"
                      class="btn subtle"
                      onClick={() => {
                        const sheetId = editorUi.sheetSettingsSheetId();
                        if (!sheetId) return;
                        actions.addSheetThreadOutput(sheetId);
                      }}
                    >
                      {t("sheetSettings.addThreadOutput")}
                    </button>
                  </div>
                </div>
                <div class="list compact">
                  <For each={threadOutputs()}>
                    {(output) => (
                      <div class="list-row">
                        <input
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
                          <select
                            value={output.halThreadId ?? ""}
                            title={t("sheetSettings.rootThreadBinding")}
                            onChange={(evt) => {
                              const sheetId = editorUi.sheetSettingsSheetId();
                              if (!sheetId) return;
                              actions.updateSheetThreadOutputHalBinding(
                                sheetId,
                                output.id,
                                evt.currentTarget.value.trim() || null,
                              );
                            }}
                          >
                            <option value="">
                              {t("sheetSettings.rootThreadBindingUnbound")}
                            </option>
                            <For each={halThreads()}>
                              {(thread) => (
                                <option value={thread.id}>{thread.name}</option>
                              )}
                            </For>
                          </select>
                        </Show>
                        <button
                          type="button"
                          class="btn subtle icon-btn"
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
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </section>

              <section class="panel">
                <div class="panel-title">
                  {t("sheetSettings.addfQueueTitle")}
                </div>
                <div class="component-store-toolbar">
                  <div class="muted">{t("sheetSettings.addfQueueHelp")}</div>
                  <div class="toolbar-group">
                    <button
                      type="button"
                      class="btn subtle"
                      onClick={() => {
                        const sorted = [...rows()].sort((a, b) =>
                          a.sortName.localeCompare(b.sortName),
                        );
                        commitRows(sorted);
                      }}
                    >
                      {t("sheetSettings.resetAZ")}
                    </button>
                  </div>
                </div>
              </section>

              <section class="panel">
                <div class="panel-title">{t("sheetSettings.queueItems")}</div>
                <div class="addf-queue-list">
                  <For each={rowsByThreadOutput()}>
                    {(group) => (
                      <section
                        class="addf-queue-thread-section"
                        onPointerEnter={() => {
                          const dragged = draggingRowKey();
                          if (!dragged) return;
                          if (group.rows.length > 0) return;
                          setDropTargetId(`thread:${group.output.id}:end`);
                          appendRowToThread(dragged, group.output.id);
                        }}
                      >
                        <div class="addf-queue-thread-header">
                          <span class="chip type">{group.output.name}</span>
                          <span class="muted mono">{group.rows.length}</span>
                        </div>

                        <div class="addf-queue-thread-rows">
                          <For each={group.rows}>
                            {(row, index) => (
                              <div
                                class="component-row addf-queue-row"
                                classList={{
                                  "is-dragging":
                                    draggingRowKey() === row.rowKey,
                                  "is-drop-target":
                                    dropTargetId() === `row:${row.rowKey}`,
                                }}
                                role="presentation"
                                onPointerEnter={() => {
                                  const dragged = draggingRowKey();
                                  if (!dragged || dragged === row.rowKey)
                                    return;
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
                                  class={`addf-drag-handle-btn ${draggingRowKey() === row.rowKey ? "is-active" : ""}`}
                                  title={t("sheetSettings.dragToReorder")}
                                  onPointerDown={(evt) => {
                                    evt.preventDefault();
                                    evt.stopPropagation();
                                    setDraggingRowKey(row.rowKey);
                                    setDropTargetId(`row:${row.rowKey}`);
                                  }}
                                >
                                  <span
                                    class="addf-drag-dot-grid"
                                    aria-hidden="true"
                                  >
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                  </span>
                                </button>
                                <div class="component-store-main">
                                  <div class="component-name mono">
                                    <span class="addf-queue-index">
                                      {index() + 1}.
                                    </span>{" "}
                                    {row.title}
                                  </div>
                                  <div class="component-sub">
                                    <span class="chip type">
                                      {row.kind === "subsheet"
                                        ? t("sheetSettings.kindSheet")
                                        : row.kind === "function"
                                          ? t("sheetSettings.kindFunction")
                                          : t("sheetSettings.kindRt")}
                                    </span>{" "}
                                    {row.subtitle}
                                  </div>
                                </div>
                                <div class="component-store-actions addf-queue-actions">
                                  <button
                                    type="button"
                                    class="mini icon-btn"
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
                                  </button>
                                  <button
                                    type="button"
                                    class="mini icon-btn"
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
                                      if (draggedIndex < 0 || nextIndex < 0)
                                        return;
                                      const [item] = nextRows.splice(
                                        draggedIndex,
                                        1,
                                      );
                                      if (!item) return;
                                      item.sheetThreadOutputId =
                                        group.output.id;
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
                                  </button>
                                </div>
                              </div>
                            )}
                          </For>
                          <div
                            class="addf-queue-thread-dropzone"
                            classList={{
                              "is-drop-target":
                                dropTargetId() ===
                                `thread:${group.output.id}:end`,
                            }}
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
                    <div class="muted component-store-empty">
                      {t("sheetSettings.empty")}
                    </div>
                  </Show>
                </div>
              </section>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
