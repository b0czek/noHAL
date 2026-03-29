import {
  addfQueueEntryKey,
  addfQueueEntryNodeId,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
  makeAddfQueueSubsheetOutputEntry,
} from "@nohal/core/addfQueue";
import { resolveAddfFunctionTarget } from "@nohal/core/componentFunctions";
import {
  firstSheetThreadOutputId,
  getSheetThreadOutputs,
} from "@nohal/core/sheet";
import type { NoHALProject, SheetNodeInstance } from "@nohal/core/types";
import type { SheetQueueRow } from "./types";

interface SheetQueueLabels {
  defaultFunction: string;
  missing: string;
  missingSheet: string;
  unknownFloat: string;
}

export function buildSheetQueueRows(
  project: NoHALProject,
  sheetId: string | null,
  labels: SheetQueueLabels,
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
    if (node.kind === "sheet") return null;
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
      if ((component?.functions?.length ?? 0) > 0) {
        coveredByNodeEntry.add(node.id);
      }
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
    if (!row) continue;
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

  for (const node of eligibleNodes) {
    if (node.kind === "sheet") {
      for (const row of subsheetOutputRows(node, defaultThreadOutputId)) {
        appendRow(row);
      }
      continue;
    }
    if (coveredByNodeEntry.has(node.id)) continue;
    for (const row of componentFunctionRows(node)) appendRow(row);
  }

  return rows;
}
