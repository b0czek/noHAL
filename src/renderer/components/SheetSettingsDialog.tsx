import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from "solid-js";
import { Portal } from "solid-js/web";
import type { NoHALProject, SheetNodeInstance } from "../../shared/types";
import { useI18n } from "../i18n";
import { useEditorStore } from "../state/EditorStoreProvider";

interface SheetSettingsDialogProps {
  open: boolean;
  sheetId: string | null;
  onClose: () => void;
}

interface SheetQueueRow {
  nodeId: string;
  instanceName: string;
  kind: "component" | "subsheet";
  title: string;
  subtitle: string;
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
  labels: { missingSheet: string; missing: string },
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
  const ordered: SheetNodeInstance[] = [];
  const seen = new Set<string>();

  for (const nodeId of sheet.hal?.addfQueue ?? []) {
    const node = byId.get(nodeId);
    if (!node || seen.has(nodeId)) continue;
    ordered.push(node);
    seen.add(nodeId);
  }
  for (const node of eligibleNodes) {
    if (seen.has(node.id)) continue;
    ordered.push(node);
  }

  return ordered.map((node) => {
    if (node.kind === "sheet") {
      const childSheet = project.sheets[node.sheetId];
      return {
        nodeId: node.id,
        instanceName: node.instanceName,
        kind: "subsheet",
        title: node.instanceName,
        subtitle: childSheet?.name ?? labels.missingSheet,
      };
    }
    const component = project.library.components[node.componentId];
    return {
      nodeId: node.id,
      instanceName: node.instanceName,
      kind: "component",
      title: node.instanceName,
      subtitle: component?.halComponentName ?? labels.missing,
    };
  });
}

export default function SheetSettingsDialog(props: SheetSettingsDialogProps) {
  const { t } = useI18n();
  const { state, actions } = useEditorStore();
  const [draggingNodeId, setDraggingNodeId] = createSignal<string | null>(null);
  const [dropTargetNodeId, setDropTargetNodeId] = createSignal<string | null>(
    null,
  );

  const sheet = createMemo(() =>
    props.sheetId ? state.project.sheets[props.sheetId] : undefined,
  );
  const rows = createMemo(() =>
    buildSheetQueueRows(state.project, props.sheetId, {
      missingSheet: t("sheetSettings.missingSheet"),
      missing: t("sheetSettings.missing"),
    }),
  );

  const commitNodeOrder = (nodeIds: string[]) => {
    if (!props.sheetId) return;
    actions.setSheetAddfQueue(props.sheetId, nodeIds);
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
    <Show when={props.open && sheet()}>
      <Portal>
        <div
          class="modal-backdrop"
          role="presentation"
          onPointerDown={() => props.onClose()}
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
              <button type="button" class="btn subtle" onClick={props.onClose}>
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
                          a.instanceName.localeCompare(b.instanceName),
                        );
                        commitNodeOrder(sorted.map((row) => row.nodeId));
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
                        class={`component-row addf-queue-row ${draggingNodeId() === row.nodeId ? "is-dragging" : ""} ${dropTargetNodeId() === row.nodeId ? "is-drop-target" : ""}`}
                        role="presentation"
                        onPointerEnter={() => {
                          const dragged = draggingNodeId();
                          if (!dragged || dragged === row.nodeId) return;
                          setDropTargetNodeId(row.nodeId);
                          const ids = rows().map((item) => item.nodeId);
                          const next = reorderByIds(ids, dragged, row.nodeId);
                          if (next !== ids) commitNodeOrder(next);
                        }}
                        onPointerUp={() => {
                          if (!draggingNodeId()) return;
                          setDraggingNodeId(null);
                          setDropTargetNodeId(null);
                        }}
                      >
                        <button
                          type="button"
                          class={`addf-drag-handle-btn ${draggingNodeId() === row.nodeId ? "is-active" : ""}`}
                          title={t("sheetSettings.dragToReorder")}
                          onPointerDown={(evt) => {
                            evt.preventDefault();
                            evt.stopPropagation();
                            setDraggingNodeId(row.nodeId);
                            setDropTargetNodeId(row.nodeId);
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
                              const ids = rows().map((item) => item.nodeId);
                              const prev = rows()[index() - 1];
                              if (!prev) return;
                              commitNodeOrder(
                                reorderByIds(ids, row.nodeId, prev.nodeId),
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
                              const ids = rows().map((item) => item.nodeId);
                              const next = rows()[index() + 1];
                              if (!next) return;
                              commitNodeOrder(
                                reorderByIds(ids, row.nodeId, next.nodeId),
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
