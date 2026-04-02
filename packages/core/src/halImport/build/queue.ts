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
  HalImportAddf,
  HalImportDraft,
  NoHALProject,
  SheetAddfQueueStoredEntry,
  SheetDefinition,
} from "../../types";
import type { ImportedNodeRegistry } from "./registry";

function ensureRootThreadOutputs(options: {
  project: NoHALProject;
  rootSheet: SheetDefinition;
  addfs: HalImportAddf[];
}): {
  rootThreadOutputIdByName: Map<string, string>;
  defaultRootThreadOutputId: string | undefined;
  ensureHalThreadId: (threadName: string) => string;
} {
  const hasImportedThreadNames = options.addfs.some((addf) =>
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

  for (const addf of options.addfs) {
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

  for (const addf of options.addfs) {
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

  return {
    rootThreadOutputIdByName,
    defaultRootThreadOutputId: options.rootSheet.hal.threadOutputs[0]?.id,
    ensureHalThreadId,
  };
}

function resolveGlobalFunctionTarget(args: {
  functionName: string;
  registry: ImportedNodeRegistry;
  warnings: string[];
}): { nodeId: string; functionKey: string } | null {
  const target = args.functionName.trim();
  if (!target) return null;

  const matches: Array<{ nodeId: string; functionKey: string }> = [];
  for (const [nodeId, component] of args.registry.componentByNodeId.entries()) {
    const instanceName = args.registry.nodeInstanceNameById.get(nodeId);
    if (!instanceName) continue;
    for (const fn of component.functions ?? []) {
      if (resolveAddfFunctionTarget(instanceName, fn) !== target) continue;
      matches.push({ nodeId, functionKey: fn.key });
    }
  }

  if (matches.length === 1) return matches[0] ?? null;
  if (matches.length > 1) {
    args.warnings.push(
      `Imported addf target '${args.functionName}' matches multiple component functions; skipping explicit queue mapping`,
    );
  }
  return null;
}

function buildQueueEntryForImportedAddf(args: {
  addf: HalImportAddf;
  registry: ImportedNodeRegistry;
  threadOutputId: string | undefined;
  warnings: string[];
  warnedCollapsedAddfInstances: Set<string>;
}): SheetAddfQueueStoredEntry | null {
  const {
    addf,
    registry,
    threadOutputId,
    warnings,
    warnedCollapsedAddfInstances,
  } = args;

  if (!addf.instanceName && addf.functionName.trim()) {
    const match = resolveGlobalFunctionTarget({
      functionName: addf.functionName,
      registry,
      warnings,
    });
    if (match) {
      return makeAddfQueueFunctionEntry(
        match.nodeId,
        match.functionKey,
        threadOutputId,
      );
    }
  }

  const addfInstanceName = addf.instanceName ?? addf.functionName;
  const nodeId = registry.nodeIdByInstanceName.get(addfInstanceName);
  if (!nodeId) return null;
  const component = registry.componentByNodeId.get(nodeId);

  if (addf.functionSuffix !== undefined) {
    const fn = component?.functions?.find(
      (item) => item.halSuffix === addf.functionSuffix,
    );
    if (fn) {
      return makeAddfQueueFunctionEntry(nodeId, fn.key, threadOutputId);
    }
    if (!warnedCollapsedAddfInstances.has(addfInstanceName)) {
      warnedCollapsedAddfInstances.add(addfInstanceName);
      warnings.push(
        `Imported addf target '${addf.functionName}' could not be matched to component function metadata on '${addfInstanceName}'; queue entry kept at instance level`,
      );
    }
    return makeAddfQueueNodeEntry(nodeId, threadOutputId);
  }

  if (
    addf.isDefaultFunction === false &&
    !warnedCollapsedAddfInstances.has(addfInstanceName)
  ) {
    warnedCollapsedAddfInstances.add(addfInstanceName);
    warnings.push(
      `Imported addf target '${addf.functionName}' uses a non-default function but no function suffix metadata was parsed; queue entry kept at instance level`,
    );
  }
  return makeAddfQueueNodeEntry(nodeId, threadOutputId);
}

export function applyImportedAddfQueue(options: {
  project: NoHALProject;
  rootSheet: SheetDefinition;
  draft: HalImportDraft;
  registry: ImportedNodeRegistry;
  warnings: string[];
}): void {
  const addfQueue: SheetAddfQueueStoredEntry[] = [];
  const seenQueueItems = new Set<string>();
  const warnedCollapsedAddfInstances = new Set<string>();
  const { rootThreadOutputIdByName, defaultRootThreadOutputId } =
    ensureRootThreadOutputs({
      project: options.project,
      rootSheet: options.rootSheet,
      addfs: options.draft.addfs,
    });

  for (const addf of options.draft.addfs) {
    const threadOutputId =
      (addf.thread?.trim() &&
        rootThreadOutputIdByName.get(addf.thread.trim())) ||
      defaultRootThreadOutputId;
    const queueEntry = buildQueueEntryForImportedAddf({
      addf,
      registry: options.registry,
      threadOutputId,
      warnings: options.warnings,
      warnedCollapsedAddfInstances,
    });
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
