import {
  addfQueueEntryKey,
  addfQueueEntryNodeId,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
  makeAddfQueueSubsheetOutputEntry,
} from "../addfQueue";
import { resolveAddfFunctionTarget } from "../componentFunctions";
import { interpolateCustomLoadCommand } from "../customComponent/loadCommand";
import { getSheet } from "../graph";
import { isValidHalName } from "../halNames";
import { interpolateLoadrt, interpolateLoadrtByStrategy } from "../loadrt";
import { firstSheetThreadOutputId, getSheetThreadOutputs } from "../sheet";
import type {
  NoHALProject,
  SheetDefinition,
  SheetNodeInstance,
} from "../types";
import type { ExportContext } from "./context";
import { pushFatal } from "./context";
import { collectGeneratedRuntimeContributions } from "./contributions";
import { joinInstancePath, resolveExportedInstancePath } from "./naming";

type RuntimeInstanceRecord = ExportContext["componentInstances"][number];

interface AddfEntry {
  functionName: string;
  thread: string;
  parentSheetPath: string;
}

interface PreparedComponentRuntimeGroup {
  componentName: string;
  component: NoHALProject["library"]["components"][string] | undefined;
  items: RuntimeInstanceRecord[];
  sortedNames: string[];
  instanceConfigByPath?: Record<string, Record<string, string>>;
}

function isCanonicalIndexedInstanceNames(
  componentName: string,
  sortedNames: string[],
): boolean {
  for (const [index, instanceName] of sortedNames.entries()) {
    if (instanceName !== `${componentName}.${index}`) return false;
  }
  return true;
}

export interface RuntimeSections {
  customLoadLines: string[];
  loadrtLines: string[];
  loadusrLines: string[];
  addfLines: string[];
  runtimeSummaryLines: string[];
}

function replaceAddfTemplate(
  template: string,
  item: Pick<
    RuntimeInstanceRecord,
    "componentName" | "instancePath" | "parentSheetPath"
  >,
): string {
  return template
    .replaceAll("{instance}", item.instancePath)
    .replaceAll("{component}", item.componentName)
    .replaceAll("{subsheet}", item.parentSheetPath || "top");
}

function buildInstanceConfigByPath(
  items: RuntimeInstanceRecord[],
): Record<string, Record<string, string>> | undefined {
  const instanceConfigByPath: Record<string, Record<string, string>> = {};
  for (const item of items) {
    if (!item.instanceConfigValues) continue;
    if (Object.keys(item.instanceConfigValues).length === 0) continue;
    instanceConfigByPath[item.instancePath] = {
      ...item.instanceConfigValues,
    };
  }
  return Object.keys(instanceConfigByPath).length > 0
    ? instanceConfigByPath
    : undefined;
}

function prepareComponentRuntimeGroup(
  project: NoHALProject,
  ctx: ExportContext,
  componentName: string,
  items: RuntimeInstanceRecord[],
): PreparedComponentRuntimeGroup | null {
  const sortedNames = items
    .map((item) => item.instancePath)
    .sort((a, b) => a.localeCompare(b));
  const component =
    items.length > 0
      ? project.library.components[items[0]?.componentId]
      : undefined;
  const namingPolicy = component?.runtime?.instanceNaming;
  if (namingPolicy?.maxInstances && items.length > namingPolicy.maxInstances) {
    pushFatal(
      ctx,
      `Component '${componentName}' supports at most ${namingPolicy.maxInstances} instances, but ${items.length} are present`,
    );
    return null;
  }
  if (
    component?.runtime?.kind === "rt" &&
    namingPolicy?.strategy === "canonical_indexed" &&
    !isCanonicalIndexedInstanceNames(componentName, sortedNames)
  ) {
    const message = `Component '${componentName}' requires canonical instance names '${componentName}.N' for loadrt export`;
    if (namingPolicy.lockToCanonical) {
      pushFatal(ctx, message);
      return null;
    }
    ctx.warnings.push(message);
  }
  const instanceConfigByPath = buildInstanceConfigByPath(items);
  return {
    componentName,
    component,
    items,
    sortedNames,
    ...(instanceConfigByPath ? { instanceConfigByPath } : {}),
  };
}

export function buildRuntimeSections(
  project: NoHALProject,
  ctx: ExportContext,
): RuntimeSections {
  const generatedRuntime = collectGeneratedRuntimeContributions(project, ctx);
  const rules = project.halExport?.componentRules ?? {};
  const addfConfig = project.halExport?.addf;
  const loadOrderList = project.halExport?.loadOrder ?? [];
  const loadOrderIndex = new Map(loadOrderList.map((name, idx) => [name, idx]));

  const seenInstancePaths = new Set<string>();
  const allInstances = [...ctx.componentInstances]
    .sort((a, b) => a.instancePath.localeCompare(b.instancePath))
    .filter((item) => {
      if (!isValidHalName(item.instancePath)) {
        pushFatal(
          ctx,
          `Skipping runtime export for invalid instance path '${item.instancePath}'`,
        );
        return false;
      }
      if (seenInstancePaths.has(item.instancePath)) {
        pushFatal(
          ctx,
          `Skipping duplicate runtime instance path '${item.instancePath}'`,
        );
        return false;
      }
      seenInstancePaths.add(item.instancePath);
      return true;
    });
  const itemsByComponentName = new Map<string, RuntimeInstanceRecord[]>();
  for (const item of allInstances) {
    const list = itemsByComponentName.get(item.componentName);
    if (list) list.push(item);
    else itemsByComponentName.set(item.componentName, [item]);
  }

  const customLoadByComponentName = new Map<string, string>();
  for (const item of allInstances) {
    const loadCommand =
      project.library.components[item.componentId]?.loadCommand;
    const normalized = loadCommand?.trim();
    if (!normalized) continue;
    const existing = customLoadByComponentName.get(item.componentName);
    if (!existing) {
      customLoadByComponentName.set(item.componentName, normalized);
      continue;
    }
    if (existing !== normalized) {
      ctx.warnings.push(
        `Component '${item.componentName}' has conflicting custom load commands; keeping first`,
      );
    }
  }

  const hasCustomLoad = (item: RuntimeInstanceRecord) =>
    customLoadByComponentName.has(item.componentName);
  const rtInstances = allInstances.filter(
    (item) => item.runtimeKind === "rt" && !hasCustomLoad(item),
  );
  const userspaceInstances = allInstances.filter(
    (item) => item.runtimeKind === "userspace" && !hasCustomLoad(item),
  );
  const unknownRuntimeInstances = allInstances.filter(
    (item) => item.runtimeKind === "unknown" && !hasCustomLoad(item),
  );

  const preparedByComponentName = new Map<
    string,
    PreparedComponentRuntimeGroup
  >();
  for (const [componentName, items] of itemsByComponentName) {
    const prepared = prepareComponentRuntimeGroup(
      project,
      ctx,
      componentName,
      items,
    );
    if (prepared) preparedByComponentName.set(componentName, prepared);
  }

  for (const item of unknownRuntimeInstances) {
    ctx.warnings.push(
      `Component '${item.instancePath}' (${item.componentName}) has unknown runtime kind; skipping loadrt/addf generation for it`,
    );
  }

  const rtGroups = new Map<string, PreparedComponentRuntimeGroup>();
  for (const item of rtInstances) {
    const prepared = preparedByComponentName.get(item.componentName);
    if (!prepared) continue;
    rtGroups.set(item.componentName, prepared);
  }

  const sortedRtGroups = [...rtGroups.entries()].sort(([nameA], [nameB]) => {
    const ruleA = rules[nameA];
    const ruleB = rules[nameB];
    const explicitA = loadOrderIndex.get(nameA);
    const explicitB = loadOrderIndex.get(nameB);
    if (explicitA !== undefined || explicitB !== undefined) {
      return (
        (explicitA ?? Number.MAX_SAFE_INTEGER) -
        (explicitB ?? Number.MAX_SAFE_INTEGER)
      );
    }
    const prioA = ruleA?.loadOrderPriority ?? 0;
    const prioB = ruleB?.loadOrderPriority ?? 0;
    if (prioA !== prioB) return prioA - prioB;
    return nameA.localeCompare(nameB);
  });

  const customLoadLines = [...customLoadByComponentName.entries()]
    .sort(([nameA], [nameB]) => {
      const explicitA = loadOrderIndex.get(nameA);
      const explicitB = loadOrderIndex.get(nameB);
      if (explicitA !== undefined || explicitB !== undefined) {
        return (
          (explicitA ?? Number.MAX_SAFE_INTEGER) -
          (explicitB ?? Number.MAX_SAFE_INTEGER)
        );
      }
      const prioA = rules[nameA]?.loadOrderPriority ?? 0;
      const prioB = rules[nameB]?.loadOrderPriority ?? 0;
      if (prioA !== prioB) return prioA - prioB;
      return nameA.localeCompare(nameB);
    })
    .flatMap(([componentName, line]) => {
      const prepared = preparedByComponentName.get(componentName);
      if (!prepared) return [];
      const result = interpolateCustomLoadCommand({
        componentName,
        instancePaths: prepared.sortedNames,
        loadCommand: line,
      });
      return [result.line];
    });

  const loadrtLines: string[] = [];
  const projectHalThreads = (project.halThreads ?? []).filter(
    (thread) =>
      thread.name.trim().length > 0 && Number.isFinite(thread.periodNs),
  );
  const motionOwnedThreadNames = new Set(["servo-thread", "base-thread"]);
  const motmodRule = rules.motmod;
  const motmodExtraArgs = (motmodRule?.loadrtArgs ?? [])
    .map((arg) => `${arg}`.trim())
    .filter(Boolean);
  const motmodGroup = rtGroups.get("motmod");
  const emitMotmodLoadrt = (): void => {
    const motmodLoadrtResult = interpolateLoadrtByStrategy("motmod", {
      componentName: "motmod",
      instancePaths: motmodGroup?.sortedNames ?? [],
      extraArgs: motmodExtraArgs,
      runtime: { kind: "rt" },
      project: { halThreads: projectHalThreads, motmod: project.motmod },
    });
    loadrtLines.push(...motmodLoadrtResult.lines);
    if (motmodLoadrtResult.warnings?.length) {
      ctx.warnings.push(...motmodLoadrtResult.warnings);
    }
  };

  emitMotmodLoadrt();
  loadrtLines.push(...generatedRuntime.loadrtLines);
  const exportableHalThreads = projectHalThreads.filter(
    (thread) => !motionOwnedThreadNames.has(thread.name),
  );
  if (exportableHalThreads.length > 0) {
    const sortedHalThreads = [...exportableHalThreads].sort((a, b) => {
      const periodDiff = a.periodNs - b.periodNs;
      if (periodDiff !== 0) return periodDiff;
      return a.name.localeCompare(b.name);
    });
    const originalOrderKey = exportableHalThreads
      .map((thread) => `${thread.name}:${thread.periodNs}`)
      .join("|");
    const sortedOrderKey = sortedHalThreads
      .map((thread) => `${thread.name}:${thread.periodNs}`)
      .join("|");
    if (originalOrderKey !== sortedOrderKey) {
      ctx.warnings.push(
        `HAL thread definitions were reordered fastest-to-slowest for 'loadrt threads' export (threads(9) requirement)`,
      );
    }
    for (let offset = 0; offset < sortedHalThreads.length; offset += 3) {
      const chunk = sortedHalThreads.slice(offset, offset + 3);
      const args: string[] = [];
      for (const [index, thread] of chunk.entries()) {
        const slot = index + 1;
        args.push(`name${slot}=${thread.name}`);
        args.push(`period${slot}=${Math.max(1, Math.round(thread.periodNs))}`);
        args.push(`fp${slot}=${thread.floatMode === "nofp" ? 0 : 1}`);
      }
      loadrtLines.push(`loadrt threads ${args.join(" ")}`);
    }
  }

  for (const [componentName, prepared] of sortedRtGroups) {
    const rule = rules[componentName];
    const extraArgs = (rule?.loadrtArgs ?? [])
      .map((arg) => `${arg}`.trim())
      .filter(Boolean);

    if (componentName === "motmod") {
      continue;
    }

    const loadrtResult = interpolateLoadrt({
      componentName,
      instancePaths: prepared.sortedNames,
      ...(prepared.instanceConfigByPath
        ? { instanceConfigByPath: prepared.instanceConfigByPath }
        : {}),
      extraArgs,
      runtime: prepared.component?.runtime,
    });
    loadrtLines.push(...loadrtResult.lines);
    if (loadrtResult.warnings?.length) {
      ctx.warnings.push(...loadrtResult.warnings);
    }
  }

  const runtimeSummaryLines: string[] = [];
  if (userspaceInstances.length > 0) {
    runtimeSummaryLines.push(
      `# Userspace components still need manual loadusr flags/args:`,
    );
    const byComponent = new Map<string, string[]>();
    for (const item of userspaceInstances) {
      const list = byComponent.get(item.componentName);
      if (list) list.push(item.instancePath);
      else byComponent.set(item.componentName, [item.instancePath]);
    }
    for (const [componentName, instances] of [...byComponent.entries()].sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      runtimeSummaryLines.push(`#   ${componentName}: ${instances.join(", ")}`);
    }
  }
  if (unknownRuntimeInstances.length > 0) {
    runtimeSummaryLines.push(
      `# Unknown-runtime components (set runtime.kind to enable loadrt/addf generation):`,
    );
    for (const item of unknownRuntimeInstances) {
      runtimeSummaryLines.push(
        `#   ${item.instancePath} (${item.componentName})`,
      );
    }
  }

  const addfEnabled = addfConfig?.enabled ?? true;
  const emitPosition = addfConfig?.emitPosition ?? true;
  const defaultThread =
    addfConfig?.defaultThread?.trim() ||
    project.halThreads?.[0]?.name?.trim() ||
    "servo-thread";
  const addfEntries: AddfEntry[] = [];
  const halThreadFloatModeByName = new Map(
    (project.halThreads ?? []).map((thread) => [
      thread.name,
      thread.floatMode ?? "fp",
    ]),
  );
  const warnedFpThreadMismatch = new Set<string>();

  function warnThreadFloatMismatch(
    threadName: string,
    functionTarget: string,
    floatMode: "fp" | "nofp" | "unknown",
  ): void {
    if (floatMode !== "fp") return;
    const threadFloatMode = halThreadFloatModeByName.get(threadName);
    if (threadFloatMode !== "nofp") return;
    const key = `${threadName}::${functionTarget}`;
    if (warnedFpThreadMismatch.has(key)) return;
    warnedFpThreadMismatch.add(key);
    ctx.warnings.push(
      `Function '${functionTarget}' requires fp but is scheduled in nofp thread '${threadName}'`,
    );
  }

  function defaultAddfTemplatesForComponent(componentId: string): string[] {
    const component = project.library.components[componentId];
    const functions = component?.functions ?? [];
    if (functions.length === 0) return ["{instance}"];
    return functions.map((fn) =>
      fn.halSuffix ? `{instance}.${fn.halSuffix}` : "{instance}",
    );
  }

  if (addfEnabled) {
    type OrderedAddfQueueItem = {
      queueKey: string;
      node: SheetNodeInstance;
      functionKey?: string;
      subsheetChildOutputId?: string;
      sheetThreadOutputId: string;
    };

    function orderedAddfQueueItemsForSheet(
      sheet: SheetDefinition,
    ): OrderedAddfQueueItem[] {
      const eligible = sheet.nodes.filter((node) => {
        if (node.kind === "sheet") return true;
        const component = project.library.components[node.componentId];
        if (!component) return false;
        return component.runtime?.kind === "rt";
      });
      const byId = new Map(eligible.map((node) => [node.id, node]));
      const defaultSheetThreadId = firstSheetThreadOutputId(sheet);
      const ordered: OrderedAddfQueueItem[] = [];
      const seen = new Set<string>();
      const coveredByNodeEntry = new Set<string>();
      const coveredFunctionKeysByNodeId = new Map<string, Set<string>>();

      const pushItem = (item: OrderedAddfQueueItem) => {
        if (seen.has(item.queueKey)) return;
        seen.add(item.queueKey);
        ordered.push(item);
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
          if (covered) covered.add(entry.functionKey);
          else
            coveredFunctionKeysByNodeId.set(
              node.id,
              new Set([entry.functionKey]),
            );
          pushItem({
            queueKey,
            node,
            functionKey: entry.functionKey,
            sheetThreadOutputId:
              entry.sheetThreadOutputId ?? defaultSheetThreadId,
          });
          continue;
        }

        if (typeof entry !== "string" && entry.kind === "subsheet-output") {
          if (node.kind !== "sheet") continue;
          const childSheet = getSheet(project, node.sheetId);
          const childOutput = getSheetThreadOutputs(childSheet).find(
            (output) => output.id === entry.childThreadOutputId,
          );
          if (!childOutput) continue;
          pushItem({
            queueKey,
            node,
            subsheetChildOutputId: childOutput.id,
            sheetThreadOutputId:
              entry.sheetThreadOutputId ?? defaultSheetThreadId,
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
          const childSheet = getSheet(project, node.sheetId);
          const childOutputs = getSheetThreadOutputs(childSheet);
          const fallbackParentOutputId =
            (typeof entry === "string"
              ? undefined
              : entry.sheetThreadOutputId) ?? defaultSheetThreadId;
          const legacyThreadMap = node.hal?.threadMap ?? {};
          for (const childOutput of childOutputs) {
            const mappedParentOutputId = legacyThreadMap[childOutput.id];
            pushItem({
              queueKey:
                addfQueueEntryKey(
                  makeAddfQueueSubsheetOutputEntry(
                    node.id,
                    childOutput.id,
                    mappedParentOutputId ?? fallbackParentOutputId,
                  ),
                ) ?? `subsheet:${node.id}:${childOutput.id}`,
              node,
              subsheetChildOutputId: childOutput.id,
              sheetThreadOutputId:
                mappedParentOutputId ?? fallbackParentOutputId,
            });
          }
          continue;
        }

        pushItem({
          queueKey:
            addfQueueEntryKey(makeAddfQueueNodeEntry(node.id)) ?? queueKey,
          node,
          sheetThreadOutputId:
            (typeof entry === "string"
              ? undefined
              : entry.sheetThreadOutputId) ?? defaultSheetThreadId,
        });
      }

      for (const node of eligible) {
        if (node.kind === "sheet") {
          const childSheet = getSheet(project, node.sheetId);
          const childOutputs = getSheetThreadOutputs(childSheet);
          const legacyThreadMap = node.hal?.threadMap ?? {};
          for (const childOutput of childOutputs) {
            const mappedParentOutputId =
              legacyThreadMap[childOutput.id] ?? defaultSheetThreadId;
            pushItem({
              queueKey:
                addfQueueEntryKey(
                  makeAddfQueueSubsheetOutputEntry(
                    node.id,
                    childOutput.id,
                    mappedParentOutputId,
                  ),
                ) ?? `subsheet:${node.id}:${childOutput.id}`,
              node,
              subsheetChildOutputId: childOutput.id,
              sheetThreadOutputId: mappedParentOutputId,
            });
          }
          continue;
        }
        const component = project.library.components[node.componentId];
        const functions = component?.functions ?? [];
        if (coveredByNodeEntry.has(node.id)) continue;
        if (functions.length === 0) {
          pushItem({
            queueKey:
              addfQueueEntryKey(makeAddfQueueNodeEntry(node.id)) ??
              `node:${node.id}`,
            node,
            sheetThreadOutputId: defaultSheetThreadId,
          });
          continue;
        }
        for (const fn of functions) {
          const covered = coveredFunctionKeysByNodeId.get(node.id);
          if (covered?.has(fn.key)) continue;
          const queueEntry = makeAddfQueueFunctionEntry(node.id, fn.key);
          pushItem({
            queueKey:
              addfQueueEntryKey(queueEntry) ?? `fn:${node.id}:${fn.key}`,
            node,
            functionKey: fn.key,
            sheetThreadOutputId: defaultSheetThreadId,
          });
        }
      }
      return ordered;
    }

    function collectAddfFromSheetInstance(
      sheetId: string,
      pathParts: string[],
      resolvedThreadByLocalOutput: Map<string, string>,
      onlyLocalOutputId?: string,
      stack: string[] = [],
    ): void {
      const cycleKey = `${sheetId}|${pathParts.join(".")}`;
      if (stack.includes(cycleKey)) {
        ctx.warnings.push(
          `Recursive sheet addf expansion skipped at '${pathParts.join(".") || "Top"}'`,
        );
        return;
      }
      const nextStack = [...stack, cycleKey];
      const sheet = getSheet(project, sheetId);
      for (const queueItem of orderedAddfQueueItemsForSheet(sheet)) {
        if (
          onlyLocalOutputId &&
          queueItem.sheetThreadOutputId !== onlyLocalOutputId
        ) {
          continue;
        }
        const node = queueItem.node;
        if (node.kind === "sheet") {
          const childSheet = getSheet(project, node.sheetId);
          const childOutputs = getSheetThreadOutputs(childSheet);
          const fallbackParentLocalOutputId =
            queueItem.sheetThreadOutputId || firstSheetThreadOutputId(sheet);
          const fallbackResolvedThread =
            resolvedThreadByLocalOutput.get(fallbackParentLocalOutputId) ??
            defaultThread;
          const childResolvedThreadByLocalOutput = new Map<string, string>();
          if (queueItem.subsheetChildOutputId) {
            childResolvedThreadByLocalOutput.set(
              queueItem.subsheetChildOutputId,
              fallbackResolvedThread,
            );
          } else {
            const map = node.hal?.threadMap ?? {};
            for (const childOutput of childOutputs) {
              const parentLocalOutputId =
                map[childOutput.id] ?? fallbackParentLocalOutputId;
              childResolvedThreadByLocalOutput.set(
                childOutput.id,
                resolvedThreadByLocalOutput.get(parentLocalOutputId) ??
                  fallbackResolvedThread,
              );
            }
          }
          collectAddfFromSheetInstance(
            node.sheetId,
            [...pathParts, node.instanceName],
            childResolvedThreadByLocalOutput,
            queueItem.subsheetChildOutputId,
            nextStack,
          );
          continue;
        }
        const component = project.library.components[node.componentId];
        if (!component) {
          ctx.warnings.push(
            `Missing component definition '${node.componentId}' for node '${node.instanceName}'`,
          );
          continue;
        }
        if (component.runtime?.kind !== "rt") continue;
        const componentName = component.halComponentName;
        const rule = rules[componentName];
        if (rule?.addf?.enabled === false) continue;
        const thread =
          resolvedThreadByLocalOutput.get(queueItem.sheetThreadOutputId) ??
          defaultThread;
        const item = {
          componentName,
          instancePath: resolveExportedInstancePath(
            pathParts,
            node.instanceName,
            component,
          ),
          parentSheetPath: joinInstancePath(pathParts),
        };
        if (queueItem.functionKey) {
          const fn = component.functions?.find(
            (candidate) => candidate.key === queueItem.functionKey,
          );
          if (!fn) {
            ctx.warnings.push(
              `Missing function '${queueItem.functionKey}' on component '${componentName}' for node '${node.instanceName}'`,
            );
            continue;
          }
          addfEntries.push({
            functionName: resolveAddfFunctionTarget(item.instancePath, fn),
            thread,
            parentSheetPath: item.parentSheetPath,
          });
          warnThreadFloatMismatch(
            thread,
            resolveAddfFunctionTarget(item.instancePath, fn),
            fn.floatMode,
          );
          continue;
        }
        const customTemplates = rule?.addf?.functionTemplates?.filter(
          (t) => t.trim().length > 0,
        );
        if (!customTemplates && (component.functions?.length ?? 0) > 0) {
          for (const fn of component.functions ?? []) {
            const functionName = resolveAddfFunctionTarget(
              item.instancePath,
              fn,
            );
            addfEntries.push({
              functionName,
              thread,
              parentSheetPath: item.parentSheetPath,
            });
            warnThreadFloatMismatch(thread, functionName, fn.floatMode);
          }
          continue;
        }
        const templates = (
          customTemplates ?? defaultAddfTemplatesForComponent(node.componentId)
        ).filter((t) => t.trim().length > 0);
        for (const template of templates) {
          addfEntries.push({
            functionName: replaceAddfTemplate(template, item),
            thread,
            parentSheetPath: item.parentSheetPath,
          });
        }
      }
    }
    const rootSheet = getSheet(project, project.rootSheetId);
    const rootResolvedThreadByLocalOutput = new Map<string, string>();
    const projectThreadsById = new Map(
      (project.halThreads ?? []).map((thread) => [thread.id, thread.name]),
    );
    for (const output of getSheetThreadOutputs(rootSheet)) {
      const halThreadId = output.halThreadId?.trim();
      const boundThreadName = halThreadId
        ? projectThreadsById.get(halThreadId)
        : undefined;
      if (!boundThreadName) {
        const reason = halThreadId ? "invalid binding" : "no binding";
        ctx.warnings.push(
          `Root sheet thread output '${output.name}' has ${reason}; using fallback thread '${defaultThread}'`,
        );
      }
      rootResolvedThreadByLocalOutput.set(
        output.id,
        boundThreadName ?? defaultThread,
      );
    }
    collectAddfFromSheetInstance(
      project.rootSheetId,
      [],
      rootResolvedThreadByLocalOutput,
      undefined,
    );
  }

  const addfLines: string[] = [];
  const positionByThread = new Map<string, number>();
  const lastGroupByThread = new Map<string, string>();
  for (const entry of addfEntries) {
    const group = entry.parentSheetPath || "(top)";
    const prev = lastGroupByThread.get(entry.thread);
    if (prev !== group) {
      addfLines.push(`# ${entry.thread} :: ${group}`);
      lastGroupByThread.set(entry.thread, group);
    }
    const nextPos = (positionByThread.get(entry.thread) ?? 0) + 1;
    positionByThread.set(entry.thread, nextPos);
    addfLines.push(
      emitPosition
        ? `addf ${entry.functionName} ${entry.thread} ${nextPos}`
        : `addf ${entry.functionName} ${entry.thread}`,
    );
  }

  return {
    customLoadLines,
    loadrtLines,
    loadusrLines: [...generatedRuntime.loadusrLines],
    addfLines,
    runtimeSummaryLines,
  };
}
