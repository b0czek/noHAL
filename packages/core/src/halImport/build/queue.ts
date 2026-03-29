import {
  addfQueueEntryKey,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
  normalizeAddfQueueEntries,
} from "../../addfQueue";
import { resolveAddfFunctionTarget } from "../../componentFunctions";
import { createId } from "../../id";
import { getSheetThreadOutputs } from "../../sheet";
import type {
  HalImportBuildOptions,
  NoHALProject,
  SheetAddfQueueStoredEntry,
  SheetDefinition,
} from "../../types";
import type { ImportedNodeRegistry } from "./registry";

export function applyImportedAddfQueue(options: {
  project: NoHALProject;
  rootSheet: SheetDefinition;
  draft: HalImportBuildOptions["draft"];
  registry: ImportedNodeRegistry;
  warnings: string[];
}): void {
  const addfQueue: SheetAddfQueueStoredEntry[] = [];
  const seenQueueItems = new Set<string>();
  const warnedCollapsedAddfInstances = new Set<string>();
  const hasImportedThreadNames = options.draft.addfs.some((addf) =>
    Boolean(addf.thread?.trim()),
  );
  const sheetThreadOutputs = hasImportedThreadNames
    ? []
    : getSheetThreadOutputs(options.rootSheet);

  if (!options.rootSheet.hal) options.rootSheet.hal = {};
  options.rootSheet.hal.threadOutputs = [...sheetThreadOutputs];

  const halThreads = options.project.halThreads ?? [];
  options.project.halThreads = halThreads;
  const halThreadIdByName = new Map(
    halThreads.map((thread) => [thread.name, thread.id]),
  );
  const ensureHalThreadId = (threadName: string): string => {
    const trimmed = threadName.trim();
    const existing = halThreadIdByName.get(trimmed);
    if (existing) return existing;

    const nextId = createId("thread");
    halThreads.push({
      id: nextId,
      name: trimmed,
      periodNs: 1_000_000,
      floatMode: "fp",
    });
    halThreadIdByName.set(trimmed, nextId);
    return nextId;
  };

  const rootThreadOutputIdByName = new Map(
    options.rootSheet.hal.threadOutputs.map((item) => [item.name, item.id]),
  );
  for (const output of options.rootSheet.hal.threadOutputs) {
    const halThreadId = halThreadIdByName.get(output.name);
    if (halThreadId) output.halThreadId = halThreadId;
  }

  for (const addf of options.draft.addfs) {
    const threadName = addf.thread?.trim();
    if (!threadName || rootThreadOutputIdByName.has(threadName)) continue;
    const halThreadId = ensureHalThreadId(threadName);
    const outputId = createId("sheetthread");
    rootThreadOutputIdByName.set(threadName, outputId);
    options.rootSheet.hal.threadOutputs.push({
      id: outputId,
      name: threadName,
      halThreadId,
    });
  }

  for (const addf of options.draft.addfs) {
    const threadName = addf.thread?.trim();
    if (!threadName) continue;
    const outputId = rootThreadOutputIdByName.get(threadName);
    const halThreadId = ensureHalThreadId(threadName);
    const output = options.rootSheet.hal.threadOutputs.find(
      (item) => item.id === outputId,
    );
    if (output && output.halThreadId !== halThreadId) {
      output.halThreadId = halThreadId;
    }
  }

  const defaultRootThreadOutputId = options.rootSheet.hal.threadOutputs[0]?.id;
  const resolveGlobalFunctionTarget = (
    functionName: string,
  ): { nodeId: string; functionKey: string } | null => {
    const target = functionName.trim();
    if (!target) return null;

    const matches: Array<{ nodeId: string; functionKey: string }> = [];
    for (const [
      nodeId,
      component,
    ] of options.registry.componentByNodeId.entries()) {
      const instanceName = options.registry.nodeInstanceNameById.get(nodeId);
      if (!instanceName) continue;
      for (const fn of component.functions ?? []) {
        if (resolveAddfFunctionTarget(instanceName, fn) !== target) continue;
        matches.push({ nodeId, functionKey: fn.key });
      }
    }

    if (matches.length === 1) return matches[0] ?? null;
    if (matches.length > 1) {
      options.warnings.push(
        `Imported addf target '${functionName}' matches multiple component functions; skipping explicit queue mapping`,
      );
    }
    return null;
  };

  for (const addf of options.draft.addfs) {
    const threadOutputId =
      (addf.thread?.trim() &&
        rootThreadOutputIdByName.get(addf.thread.trim())) ||
      defaultRootThreadOutputId;
    let queueEntry: SheetAddfQueueStoredEntry | null = null;

    if (!addf.instanceName && addf.functionName.trim()) {
      const match = resolveGlobalFunctionTarget(addf.functionName);
      if (match) {
        queueEntry = makeAddfQueueFunctionEntry(
          match.nodeId,
          match.functionKey,
          threadOutputId,
        );
      }
    }

    if (!queueEntry) {
      const addfInstanceName = addf.instanceName ?? addf.functionName;
      const nodeId =
        options.registry.nodeIdByInstanceName.get(addfInstanceName);
      if (!nodeId) continue;
      const component = options.registry.componentByNodeId.get(nodeId);

      queueEntry = makeAddfQueueNodeEntry(nodeId, threadOutputId);
      if (addf.functionSuffix !== undefined) {
        const fn = component?.functions?.find(
          (item) => item.halSuffix === addf.functionSuffix,
        );
        if (fn) {
          queueEntry = makeAddfQueueFunctionEntry(
            nodeId,
            fn.key,
            threadOutputId,
          );
        } else if (!warnedCollapsedAddfInstances.has(addfInstanceName)) {
          warnedCollapsedAddfInstances.add(addfInstanceName);
          options.warnings.push(
            `Imported addf target '${addf.functionName}' could not be matched to component function metadata on '${addfInstanceName}'; queue entry kept at instance level`,
          );
        }
      } else if (
        addf.isDefaultFunction === false &&
        !warnedCollapsedAddfInstances.has(addfInstanceName)
      ) {
        warnedCollapsedAddfInstances.add(addfInstanceName);
        options.warnings.push(
          `Imported addf target '${addf.functionName}' uses a non-default function but no function suffix metadata was parsed; queue entry kept at instance level`,
        );
      }
    }

    if (!queueEntry) continue;

    const key = addfQueueEntryKey(queueEntry) ?? addf.functionName;
    if (seenQueueItems.has(key)) continue;
    seenQueueItems.add(key);
    addfQueue.push(queueEntry);
  }

  if (addfQueue.length > 0) {
    options.rootSheet.hal = {
      ...(options.rootSheet.hal ?? {}),
      addfQueue: normalizeAddfQueueEntries(addfQueue),
    };
  }
}
