import type { SheetAddfQueueStoredEntry } from "@nohal/core/types";

export interface SheetQueueRow {
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
