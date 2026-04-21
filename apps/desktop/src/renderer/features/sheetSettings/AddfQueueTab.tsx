import {
  addfQueueEntryKey,
  makeAddfQueueNodeEntry,
} from "@nohal/core/addfQueue";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "solid-icons/hi";
import { For, Show } from "solid-js";
import {
  createDragReorderController,
  DragReorderHandle,
} from "../../components/reorderable/DragReorder";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useI18n } from "../../i18n";
import { useSheetSettings } from "./SheetSettingsContext";
import type { SheetQueueRow } from "./types";

export default function AddfQueueTab() {
  const { t } = useI18n();
  const settings = useSheetSettings();
  const reorder = createDragReorderController();
  const rowContainerClass = (rowKey: string) => {
    if (reorder.isDragging(rowKey)) {
      return "border-accent/30 bg-accent/10 opacity-65";
    }
    if (reorder.isDropTarget(`row:${rowKey}`)) {
      return "border-accent/30 bg-accent/10";
    }
    return "bg-black/20";
  };
  const rowKindLabel = (kind: SheetQueueRow["kind"]) => {
    switch (kind) {
      case "subsheet":
        return t("sheetSettings.kindSheet");
      case "function":
        return t("sheetSettings.kindFunction");
      case "component":
        return t("sheetSettings.kindRt");
    }
  };

  const moveRowBefore = (
    draggedRowKey: string,
    targetRowKey: string,
    targetThreadOutputId: string,
  ): string | null => {
    if (draggedRowKey === targetRowKey) return null;
    const currentRows = settings.rows();
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
    settings.commitRows(nextRows);
    return updatedRow.rowKey;
  };

  const appendRowToThread = (
    draggedRowKey: string,
    targetThreadOutputId: string,
  ): string | null => {
    const currentRows = settings.rows();
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
    settings.commitRows(nextRows);
    return updatedRow.rowKey;
  };
  return (
    <div class="grid gap-6">
      <div class="grid gap-1">
        <div class="text-lg font-semibold">
          {t("sheetSettings.addfQueueTitle")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("sheetSettings.addfQueueHelp")}
        </div>
        <div class="text-sm text-muted-foreground">
          {t("sheetSettings.addfQueueDragThreadHelp")}
        </div>
      </div>

      <section class="grid gap-3 rounded-2xl bg-black/20 p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="grid gap-1">
            <div class="text-sm font-semibold tracking-tight">
              {t("sheetSettings.queueItems")}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const sorted = [...settings.rows()].sort((a, b) =>
                a.sortName.localeCompare(b.sortName),
              );
              settings.commitRows(sorted);
            }}
          >
            {t("sheetSettings.resetAZ")}
          </Button>
        </div>

        <div class="grid gap-3">
          <For each={settings.rowsByThreadOutput()}>
            {(group) => (
              <section
                class="grid gap-3 rounded-2xl p-3"
                onPointerEnter={() => {
                  const dragged = reorder.draggingItemId();
                  if (!dragged) return;
                  if (group.rows.length > 0) return;
                  reorder.setDropTargetId(`thread:${group.output.id}:end`);
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
                        class={`grid gap-3 rounded-xl p-3 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${rowContainerClass(row.rowKey)}`}
                        role="presentation"
                        onPointerEnter={() => {
                          const dragged = reorder.draggingItemId();
                          if (!dragged || dragged === row.rowKey) return;
                          reorder.setDropTargetId(`row:${row.rowKey}`);
                          moveRowBefore(dragged, row.rowKey, group.output.id);
                        }}
                        onPointerUp={() => {
                          if (!reorder.draggingItemId()) return;
                          reorder.finishDrag();
                        }}
                      >
                        <DragReorderHandle
                          controller={reorder}
                          itemId={row.rowKey}
                          label={t("sheetSettings.dragToReorder")}
                          dropTargetId={`row:${row.rowKey}`}
                        />

                        <div class="min-w-0">
                          <div class="mono truncate font-medium">
                            <span class="mr-2 inline-block min-w-7 text-right text-muted-foreground">
                              {index() + 1}.
                            </span>
                            {row.title}
                          </div>
                          <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline">
                              {rowKindLabel(row.kind)}
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
                            <HiOutlineChevronUp size={16} aria-hidden="true" />
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
                              const nextRows = [...settings.rows()];
                              const draggedIndex = nextRows.findIndex(
                                (item) => item.rowKey === row.rowKey,
                              );
                              const nextIndex = nextRows.findIndex(
                                (item) => item.rowKey === next.rowKey,
                              );
                              if (draggedIndex < 0 || nextIndex < 0) return;
                              const [item] = nextRows.splice(draggedIndex, 1);
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
                                      sheetThreadOutputId: group.output.id,
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
                              settings.commitRows(nextRows);
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
                      reorder.isDropTarget(`thread:${group.output.id}:end`)
                        ? "border border-dashed border-accent/30 bg-accent/10"
                        : "bg-white/[0.03]"
                    }`}
                    onPointerEnter={() => {
                      const dragged = reorder.draggingItemId();
                      if (!dragged) return;
                      reorder.setDropTargetId(`thread:${group.output.id}:end`);
                      appendRowToThread(dragged, group.output.id);
                    }}
                    onPointerUp={() => {
                      if (!reorder.draggingItemId()) return;
                      reorder.finishDrag();
                    }}
                  />
                </div>
              </section>
            )}
          </For>

          <Show when={settings.rows().length === 0}>
            <div class="px-1 py-2 text-xs text-muted-foreground">
              {t("sheetSettings.empty")}
            </div>
          </Show>
        </div>
      </section>
    </div>
  );
}
