import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import {
  addfQueueEntryKey,
  addfQueueEntryNodeId,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
} from "../../shared/addfQueue";
import type {
  NoHALProject,
  SheetAddfQueueStoredEntry,
  SheetNodeInstance,
} from "../../shared/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";
import { useEditorUi } from "../state/EditorUiProvider";

interface SheetQueueRow {
  queueKey: string;
  queueEntry: SheetAddfQueueStoredEntry;
  nodeId: string;
  instanceName: string;
  kind: "component" | "function" | "subsheet";
  title: string;
  subtitle: string;
  sortName: string;
}

function reorderByIds(
  list: string[],
  draggedId: string,
  targetId: string,
): string[] {
  if (draggedId === targetId) return list;
  const from = list.indexOf(draggedId);
  const to = list.indexOf(targetId);
  if (from < 0 || to < 0) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
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

  const eligibleNodes: SheetNodeInstance[] = sheet.nodes.filter((node) => {
    if (node.kind === "sheet") return true;
    const component = project.library.components[node.componentId];
    return component?.runtime?.kind === "rt";
  });
  const byId = new Map(eligibleNodes.map((node) => [node.id, node]));
  const rows: SheetQueueRow[] = [];
  const seenKeys = new Set<string>();
  const coveredByNodeEntry = new Set<string>();

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
      const queueEntry = makeAddfQueueNodeEntry(node.id);
      const queueKey = addfQueueEntryKey(queueEntry) ?? `node:${node.id}`;
      return [
        {
          queueKey,
          queueEntry,
          nodeId: node.id,
          instanceName: node.instanceName,
          kind: "component",
          title: node.instanceName,
          subtitle: component?.halComponentName ?? labels.missing,
          sortName: node.instanceName,
        },
      ];
    }
    return functions.map((fn) => {
      const queueEntry = makeAddfQueueFunctionEntry(node.id, fn.key);
      const queueKey =
        addfQueueEntryKey(queueEntry) ?? `fn:${node.id}:${fn.key}`;
      const addfTarget = fn.halSuffix
        ? `${node.instanceName}.${fn.halSuffix}`
        : node.instanceName;
      const fnLabel = fn.halSuffix || labels.defaultFunction;
      const floatLabel = fn.floatMode === "unknown" ? labels.unknownFloat : fn.floatMode;
      return {
        queueKey,
        queueEntry,
        nodeId: node.id,
        instanceName: node.instanceName,
        kind: "function" as const,
        title: addfTarget,
        subtitle: `${component?.halComponentName ?? labels.missing} • ${fnLabel} • ${floatLabel}`,
        sortName: `${node.instanceName}\u0000${fn.halSuffix || "\u0000"}`,
      };
    });
  };

  const nodeRow = (node: SheetNodeInstance): SheetQueueRow | null => {
    if (node.kind === "sheet") {
      const childSheet = project.sheets[node.sheetId];
      const queueEntry = makeAddfQueueNodeEntry(node.id);
      const queueKey = addfQueueEntryKey(queueEntry) ?? `node:${node.id}`;
      return {
        queueKey,
        queueEntry,
        nodeId: node.id,
        instanceName: node.instanceName,
        kind: "subsheet",
        title: node.instanceName,
        subtitle: childSheet?.name ?? labels.missingSheet,
        sortName: node.instanceName,
      };
    }
    const component = project.library.components[node.componentId];
    return {
      queueKey: addfQueueEntryKey(makeAddfQueueNodeEntry(node.id)) ?? `node:${node.id}`,
      queueEntry: makeAddfQueueNodeEntry(node.id),
      nodeId: node.id,
      instanceName: node.instanceName,
      kind: "component",
      title: node.instanceName,
      subtitle: component?.halComponentName ?? labels.missing,
      sortName: node.instanceName,
    };
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
      const fn = component?.functions?.find((item) => item.key === entry.functionKey);
      if (!fn) continue;
      const addfTarget = fn.halSuffix
        ? `${node.instanceName}.${fn.halSuffix}`
        : node.instanceName;
      const fnLabel = fn.halSuffix || labels.defaultFunction;
      const floatLabel = fn.floatMode === "unknown" ? labels.unknownFloat : fn.floatMode;
      appendRow({
        queueKey,
        queueEntry: entry,
        nodeId,
        instanceName: node.instanceName,
        kind: "function",
        title: addfTarget,
        subtitle: `${component?.halComponentName ?? labels.missing} • ${fnLabel} • ${floatLabel}`,
        sortName: `${node.instanceName}\u0000${fn.halSuffix || "\u0000"}`,
      });
      continue;
    }

    if (node.kind === "component") {
      const component = project.library.components[node.componentId];
      if ((component?.functions?.length ?? 0) > 0) coveredByNodeEntry.add(node.id);
    }
    const row = nodeRow(node);
    if (row) {
      row.queueEntry = typeof entry === "string" ? makeAddfQueueNodeEntry(nodeId) : entry;
      row.queueKey = addfQueueEntryKey(row.queueEntry) ?? row.queueKey;
      appendRow(row);
    }
  }

  for (const node of eligibleNodes) {
    if (node.kind === "sheet") {
      const row = nodeRow(node);
      if (row) appendRow(row);
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
  const [draggingNodeId, setDraggingNodeId] = createSignal<string | null>(null);
  const [dropTargetNodeId, setDropTargetNodeId] = createSignal<string | null>(
    null,
  );

  const sheet = createMemo(() => {
    const sheetId = editorUi.sheetSettingsSheetId();
    if (!sheetId) return undefined;
    return state.project.sheets[sheetId];
  });
  const rows = createMemo(() =>
    buildSheetQueueRows(state.project, editorUi.sheetSettingsSheetId(), {
      missingSheet: t("sheetSettings.missingSheet"),
      missing: t("sheetSettings.missing"),
      defaultFunction: t("sheetSettings.defaultFunction"),
      unknownFloat: t("common.unknown"),
    }),
  );

  const commitQueueOrder = (entries: SheetAddfQueueStoredEntry[]) => {
    const sheetId = editorUi.sheetSettingsSheetId();
    if (!sheetId) return;
    actions.setSheetAddfQueue(sheetId, entries);
  };

  const commitRowsByKeys = (keys: string[]) => {
    const byKey = new Map(rows().map((row) => [row.queueKey, row.queueEntry]));
    commitQueueOrder(
      keys
        .map((key) => byKey.get(key))
        .filter((entry): entry is SheetAddfQueueStoredEntry => Boolean(entry)),
    );
  };

  createEffect(() => {
    if (!draggingNodeId()) return;
    const finishDrag = () => {
      setDraggingNodeId(null);
      setDropTargetNodeId(null);
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
                        commitQueueOrder(sorted.map((row) => row.queueEntry));
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
                  <For each={rows()}>
                    {(row, index) => (
                      <div
                        class="component-row addf-queue-row"
                        classList={{
                          "is-dragging": draggingNodeId() === row.queueKey,
                          "is-drop-target": dropTargetNodeId() === row.queueKey,
                        }}
                        role="presentation"
                        onPointerEnter={() => {
                          const dragged = draggingNodeId();
                          if (!dragged || dragged === row.queueKey) return;
                          setDropTargetNodeId(row.queueKey);
                          const keys = rows().map((item) => item.queueKey);
                          const next = reorderByIds(keys, dragged, row.queueKey);
                          if (next !== keys) commitRowsByKeys(next);
                        }}
                        onPointerUp={() => {
                          if (!draggingNodeId()) return;
                          setDraggingNodeId(null);
                          setDropTargetNodeId(null);
                        }}
                      >
                        <button
                          type="button"
                          class={`addf-drag-handle-btn ${draggingNodeId() === row.queueKey ? "is-active" : ""}`}
                          title={t("sheetSettings.dragToReorder")}
                          onPointerDown={(evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            setDraggingNodeId(row.queueKey);
                            setDropTargetNodeId(row.queueKey);
                          }}
                        >
                          <span class="addf-drag-dot-grid" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                            <span />
                          </span>
                        </button>
                        <div class="component-store-main">
                          <div class="component-name mono">
                            <span class="addf-queue-index">{index() + 1}.</span>{" "}
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
                            class="mini"
                            disabled={index() === 0}
                            onClick={() => {
                              const ids = rows().map((item) => item.queueKey);
                              const prev = rows()[index() - 1];
                              if (!prev) return;
                              commitRowsByKeys(
                                reorderByIds(ids, row.queueKey, prev.queueKey),
                              );
                            }}
                          >
                            {t("common.up")}
                          </button>
                          <button
                            type="button"
                            class="mini"
                            disabled={index() === rows().length - 1}
                            onClick={() => {
                              const ids = rows().map((item) => item.queueKey);
                              const next = rows()[index() + 1];
                              if (!next) return;
                              commitRowsByKeys(
                                reorderByIds(ids, row.queueKey, next.queueKey),
                              );
                            }}
                          >
                            {t("common.down")}
                          </button>
                        </div>
                      </div>
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
