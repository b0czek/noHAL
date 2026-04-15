import { groupBy, map, pipe, pullObject, sortBy } from "remeda";
import {
  addfQueueEntryKey,
  addfQueueEntryNodeId,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
  makeAddfQueueSubsheetOutputEntry,
} from "../addfQueue";
import { resolveAddfFunctionTarget } from "../component/functions";
import { interpolateCustomLoadCommand } from "../customComponent/loadCommand";
import { getSheet } from "../graph";
import { isValidHalName } from "../halNames";
import { interpolateLoadrt, interpolateLoadrtByStrategy } from "../loadrt";
import { firstSheetThreadOutputId, getSheetThreadOutputs } from "../sheet";
import type {
  ComponentDefinition,
  ComponentNode,
  NoHALProject,
  SheetAddfQueueFunctionEntry,
  SheetAddfQueueStoredEntry,
  SheetAddfQueueSubsheetOutputEntry,
  SheetDefinition,
  SheetNode,
  SheetNodeInstance,
} from "../types";
import type { ExportContext } from "./context";
import { pushFatal } from "./context";
import { collectGeneratedRuntimeContributions } from "./contributions";
import { joinInstancePath, resolveExportedInstancePath } from "./naming";

const HAL_THREADS_LOADRT_CHUNK_SIZE = 3;

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

type ComponentRules = NonNullable<
  NonNullable<NoHALProject["halExport"]>["componentRules"]
>;

interface RuntimeInstanceBuckets {
  rtInstances: RuntimeInstanceRecord[];
  userspaceInstances: RuntimeInstanceRecord[];
  unknownRuntimeInstances: RuntimeInstanceRecord[];
}

interface OrderedAddfQueueItem {
  queueKey: string;
  node: SheetNodeInstance;
  functionKey?: string;
  subsheetChildOutputId?: string;
  sheetThreadOutputId: string;
}

interface OrderedAddfCollectorState {
  ordered: OrderedAddfQueueItem[];
  seen: Set<string>;
  coveredByNodeEntry: Set<string>;
  coveredFunctionKeysByNodeId: Map<string, Set<string>>;
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
  const instanceConfigByPath = pullObject(
    items.filter(
      (item) =>
        item.instanceConfigValues &&
        Object.keys(item.instanceConfigValues).length > 0,
    ),
    (item) => item.instancePath,
    (item) => ({
      ...item.instanceConfigValues,
    }),
  );
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
  const sortedNames = pipe(
    items,
    map((item) => item.instancePath),
    sortBy((name) => name),
  );
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

function compareComponentLoadOrder(
  nameA: string,
  nameB: string,
  rules: ComponentRules,
  loadOrderIndex: Map<string, number>,
): number {
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
}

function collectValidRuntimeInstances(
  ctx: ExportContext,
): RuntimeInstanceRecord[] {
  const seenInstancePaths = new Set<string>();
  return [...ctx.componentInstances]
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
}

function groupRuntimeInstancesByComponentName(
  allInstances: RuntimeInstanceRecord[],
): Map<string, RuntimeInstanceRecord[]> {
  return new Map(
    Object.entries(groupBy(allInstances, (item) => item.componentName)),
  );
}

function collectCustomLoadByComponentName(
  project: NoHALProject,
  ctx: ExportContext,
  allInstances: RuntimeInstanceRecord[],
): Map<string, string> {
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
  return customLoadByComponentName;
}

function bucketRuntimeInstances(
  allInstances: RuntimeInstanceRecord[],
  customLoadByComponentName: Map<string, string>,
): RuntimeInstanceBuckets {
  const hasCustomLoad = (item: RuntimeInstanceRecord) =>
    customLoadByComponentName.has(item.componentName);
  return {
    rtInstances: allInstances.filter(
      (item) => item.runtimeKind === "rt" && !hasCustomLoad(item),
    ),
    userspaceInstances: allInstances.filter(
      (item) => item.runtimeKind === "userspace" && !hasCustomLoad(item),
    ),
    unknownRuntimeInstances: allInstances.filter(
      (item) => item.runtimeKind === "unknown" && !hasCustomLoad(item),
    ),
  };
}

function prepareRuntimeGroups(
  project: NoHALProject,
  ctx: ExportContext,
  itemsByComponentName: Map<string, RuntimeInstanceRecord[]>,
): Map<string, PreparedComponentRuntimeGroup> {
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
  return preparedByComponentName;
}

function collectSortedRtGroups(
  rtInstances: RuntimeInstanceRecord[],
  preparedByComponentName: Map<string, PreparedComponentRuntimeGroup>,
  rules: ComponentRules,
  loadOrderIndex: Map<string, number>,
): [string, PreparedComponentRuntimeGroup][] {
  const rtGroups = new Map<string, PreparedComponentRuntimeGroup>();
  for (const item of rtInstances) {
    const prepared = preparedByComponentName.get(item.componentName);
    if (!prepared) continue;
    rtGroups.set(item.componentName, prepared);
  }
  return [...rtGroups.entries()].sort(([nameA], [nameB]) =>
    compareComponentLoadOrder(nameA, nameB, rules, loadOrderIndex),
  );
}

function buildCustomLoadLines(args: {
  preparedByComponentName: Map<string, PreparedComponentRuntimeGroup>;
  customLoadByComponentName: Map<string, string>;
  rules: ComponentRules;
  loadOrderIndex: Map<string, number>;
}): string[] {
  return [...args.customLoadByComponentName.entries()]
    .sort(([nameA], [nameB]) =>
      compareComponentLoadOrder(nameA, nameB, args.rules, args.loadOrderIndex),
    )
    .flatMap(([componentName, line]) => {
      const prepared = args.preparedByComponentName.get(componentName);
      if (!prepared) return [];
      const result = interpolateCustomLoadCommand({
        componentName,
        instancePaths: prepared.sortedNames,
        loadCommand: line,
      });
      return [result.line];
    });
}

function appendMotmodLoadrtLines(args: {
  project: NoHALProject;
  ctx: ExportContext;
  rules: ComponentRules;
  rtGroups: Map<string, PreparedComponentRuntimeGroup>;
  loadrtLines: string[];
}): void {
  const projectHalThreads = (args.project.halThreads ?? []).filter(
    (thread) =>
      thread.name.trim().length > 0 && Number.isFinite(thread.periodNs),
  );
  const motmodRule = args.rules.motmod;
  const motmodExtraArgs = (motmodRule?.loadrtArgs ?? [])
    .map((arg) => `${arg}`.trim())
    .filter(Boolean);
  const motmodGroup = args.rtGroups.get("motmod");
  const motmodLoadrtResult = interpolateLoadrtByStrategy("motmod", {
    componentName: "motmod",
    instancePaths: motmodGroup?.sortedNames ?? [],
    extraArgs: motmodExtraArgs,
    runtime: { kind: "rt" },
    project: { halThreads: projectHalThreads, motmod: args.project.motmod },
  });
  args.loadrtLines.push(...motmodLoadrtResult.lines);
  if (motmodLoadrtResult.warnings?.length) {
    args.ctx.warnings.push(...motmodLoadrtResult.warnings);
  }
}

function buildThreadsLoadrtLines(
  project: NoHALProject,
  ctx: ExportContext,
): string[] {
  const loadrtLines: string[] = [];
  const projectHalThreads = (project.halThreads ?? []).filter(
    (thread) =>
      thread.name.trim().length > 0 && Number.isFinite(thread.periodNs),
  );
  const motionOwnedThreadNames = new Set(["servo-thread", "base-thread"]);
  const exportableHalThreads = projectHalThreads.filter(
    (thread) => !motionOwnedThreadNames.has(thread.name),
  );
  if (exportableHalThreads.length === 0) return loadrtLines;

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
  for (
    let offset = 0;
    offset < sortedHalThreads.length;
    offset += HAL_THREADS_LOADRT_CHUNK_SIZE
  ) {
    const chunk = sortedHalThreads.slice(
      offset,
      offset + HAL_THREADS_LOADRT_CHUNK_SIZE,
    );
    const args: string[] = [];
    for (const [index, thread] of chunk.entries()) {
      const slot = index + 1;
      args.push(`name${slot}=${thread.name}`);
      args.push(`period${slot}=${Math.max(1, Math.round(thread.periodNs))}`);
      args.push(`fp${slot}=${thread.floatMode === "nofp" ? 0 : 1}`);
    }
    loadrtLines.push(`loadrt threads ${args.join(" ")}`);
  }
  return loadrtLines;
}

function appendRtComponentLoadrtLines(args: {
  sortedRtGroups: [string, PreparedComponentRuntimeGroup][];
  rules: ComponentRules;
  ctx: ExportContext;
  loadrtLines: string[];
}): void {
  for (const [componentName, prepared] of args.sortedRtGroups) {
    if (componentName === "motmod") continue;
    const rule = args.rules[componentName];
    const extraArgs = (rule?.loadrtArgs ?? [])
      .map((arg) => `${arg}`.trim())
      .filter(Boolean);
    const loadrtResult = interpolateLoadrt({
      componentName,
      instancePaths: prepared.sortedNames,
      ...(prepared.instanceConfigByPath
        ? { instanceConfigByPath: prepared.instanceConfigByPath }
        : {}),
      extraArgs,
      runtime: prepared.component?.runtime,
    });
    args.loadrtLines.push(...loadrtResult.lines);
    if (loadrtResult.warnings?.length) {
      args.ctx.warnings.push(...loadrtResult.warnings);
    }
  }
}

function buildRuntimeSummaryLines(
  userspaceInstances: RuntimeInstanceRecord[],
  unknownRuntimeInstances: RuntimeInstanceRecord[],
): string[] {
  const runtimeSummaryLines: string[] = [];
  if (userspaceInstances.length > 0) {
    runtimeSummaryLines.push(
      `# Userspace components still need manual loadusr flags/args:`,
    );
    const byComponent = groupBy(
      userspaceInstances,
      (item) => item.componentName,
    );
    for (const componentName of sortBy(
      Object.keys(byComponent),
      (name) => name,
    )) {
      const instances = pipe(
        byComponent[componentName] ?? [],
        map((item) => item.instancePath),
      );
      runtimeSummaryLines.push(`#   ${componentName}: ${instances.join(", ")}`);
    }
  }
  if (unknownRuntimeInstances.length > 0) {
    runtimeSummaryLines.push(
      `# Runtime not generated for externally managed/unknown components(set runtime.kind to enable loadrt/addf generation):`,
    );
    for (const item of unknownRuntimeInstances) {
      runtimeSummaryLines.push(
        `#   ${item.instancePath} (${item.componentName})`,
      );
    }
  }
  return runtimeSummaryLines;
}

function warnThreadFloatMismatch(args: {
  ctx: ExportContext;
  warnedFpThreadMismatch: Set<string>;
  halThreadFloatModeByName: Map<string, "fp" | "nofp">;
  threadName: string;
  functionTarget: string;
  floatMode: "fp" | "nofp" | "unknown";
}): void {
  if (args.floatMode !== "fp") return;
  const threadFloatMode = args.halThreadFloatModeByName.get(args.threadName);
  if (threadFloatMode !== "nofp") return;
  const key = `${args.threadName}::${args.functionTarget}`;
  if (args.warnedFpThreadMismatch.has(key)) return;
  args.warnedFpThreadMismatch.add(key);
  args.ctx.warnings.push(
    `Function '${args.functionTarget}' requires fp but is scheduled in nofp thread '${args.threadName}'`,
  );
}

function defaultAddfTemplatesForComponent(
  project: NoHALProject,
  componentId: string,
): string[] {
  const component = project.library.components[componentId];
  const functions = component?.functions ?? [];
  if (functions.length === 0) return ["{instance}"];
  return functions.map((fn) =>
    fn.halSuffix ? `{instance}.${fn.halSuffix}` : "{instance}",
  );
}

function createOrderedAddfCollectorState(): OrderedAddfCollectorState {
  return {
    ordered: [],
    seen: new Set<string>(),
    coveredByNodeEntry: new Set<string>(),
    coveredFunctionKeysByNodeId: new Map<string, Set<string>>(),
  };
}

function pushOrderedAddfItem(
  state: OrderedAddfCollectorState,
  item: OrderedAddfQueueItem,
): void {
  if (state.seen.has(item.queueKey)) return;
  state.seen.add(item.queueKey);
  state.ordered.push(item);
}

function markCoveredFunctionKey(
  state: OrderedAddfCollectorState,
  nodeId: string,
  functionKey: string,
): void {
  const covered = state.coveredFunctionKeysByNodeId.get(nodeId);
  if (covered) {
    covered.add(functionKey);
    return;
  }
  state.coveredFunctionKeysByNodeId.set(nodeId, new Set([functionKey]));
}

function eligibleAddfNodesForSheet(
  project: NoHALProject,
  sheet: SheetDefinition,
): SheetNodeInstance[] {
  return sheet.nodes.filter((node) => {
    if (node.kind === "sheet") return true;
    const component = project.library.components[node.componentId];
    return component?.runtime?.kind === "rt";
  });
}

function pushSubsheetQueueItems(args: {
  project: NoHALProject;
  node: SheetNode;
  fallbackParentOutputId: string;
  state: OrderedAddfCollectorState;
}): void {
  const childSheet = getSheet(args.project, args.node.sheetId);
  const childOutputs = getSheetThreadOutputs(childSheet);
  const legacyThreadMap = args.node.hal?.threadMap ?? {};
  for (const childOutput of childOutputs) {
    const mappedParentOutputId =
      legacyThreadMap[childOutput.id] ?? args.fallbackParentOutputId;
    pushOrderedAddfItem(args.state, {
      queueKey:
        addfQueueEntryKey(
          makeAddfQueueSubsheetOutputEntry(
            args.node.id,
            childOutput.id,
            mappedParentOutputId,
          ),
        ) ?? `subsheet:${args.node.id}:${childOutput.id}`,
      node: args.node,
      subsheetChildOutputId: childOutput.id,
      sheetThreadOutputId: mappedParentOutputId,
    });
  }
}

function pushExplicitFunctionQueueItem(args: {
  project: NoHALProject;
  node: SheetNodeInstance;
  entry: SheetAddfQueueFunctionEntry;
  state: OrderedAddfCollectorState;
  defaultSheetThreadId: string;
}): void {
  if (args.node.kind !== "component") return;
  const component = args.project.library.components[args.node.componentId];
  const fn = component?.functions?.find(
    (item) => item.key === args.entry.functionKey,
  );
  if (!fn) return;
  markCoveredFunctionKey(args.state, args.node.id, args.entry.functionKey);
  pushOrderedAddfItem(args.state, {
    queueKey: addfQueueEntryKey(args.entry) ?? `fn:${args.node.id}:${fn.key}`,
    node: args.node,
    functionKey: args.entry.functionKey,
    sheetThreadOutputId:
      args.entry.sheetThreadOutputId ?? args.defaultSheetThreadId,
  });
}

function pushExplicitSubsheetQueueItem(args: {
  project: NoHALProject;
  node: SheetNodeInstance;
  entry: SheetAddfQueueSubsheetOutputEntry;
  state: OrderedAddfCollectorState;
  defaultSheetThreadId: string;
}): void {
  if (args.node.kind !== "sheet") return;
  const childSheet = getSheet(args.project, args.node.sheetId);
  const childOutput = getSheetThreadOutputs(childSheet).find(
    (output) => output.id === args.entry.childThreadOutputId,
  );
  if (!childOutput) return;
  pushOrderedAddfItem(args.state, {
    queueKey:
      addfQueueEntryKey(args.entry) ??
      `subsheet:${args.node.id}:${childOutput.id}`,
    node: args.node,
    subsheetChildOutputId: childOutput.id,
    sheetThreadOutputId:
      args.entry.sheetThreadOutputId ?? args.defaultSheetThreadId,
  });
}

function pushExplicitNodeQueueItem(args: {
  project: NoHALProject;
  node: SheetNodeInstance;
  entry: SheetAddfQueueStoredEntry;
  state: OrderedAddfCollectorState;
  defaultSheetThreadId: string;
  queueKey: string;
}): void {
  if (args.node.kind === "component") {
    const component = args.project.library.components[args.node.componentId];
    if ((component?.functions?.length ?? 0) > 0) {
      args.state.coveredByNodeEntry.add(args.node.id);
    }
  }
  if (args.node.kind === "sheet") {
    const fallbackParentOutputId =
      (typeof args.entry === "string"
        ? undefined
        : args.entry.sheetThreadOutputId) ?? args.defaultSheetThreadId;
    pushSubsheetQueueItems({
      project: args.project,
      node: args.node,
      fallbackParentOutputId,
      state: args.state,
    });
    return;
  }
  pushOrderedAddfItem(args.state, {
    queueKey:
      addfQueueEntryKey(makeAddfQueueNodeEntry(args.node.id)) ?? args.queueKey,
    node: args.node,
    sheetThreadOutputId:
      (typeof args.entry === "string"
        ? undefined
        : args.entry.sheetThreadOutputId) ?? args.defaultSheetThreadId,
  });
}

function processExplicitAddfQueueEntry(args: {
  project: NoHALProject;
  entry: SheetAddfQueueStoredEntry;
  byId: Map<string, SheetNodeInstance>;
  state: OrderedAddfCollectorState;
  defaultSheetThreadId: string;
}): void {
  const queueKey = addfQueueEntryKey(args.entry);
  const nodeId = addfQueueEntryNodeId(args.entry);
  if (!queueKey || !nodeId) return;
  const node = args.byId.get(nodeId);
  if (!node) return;
  if (
    typeof args.entry !== "string" &&
    args.entry.kind === "component-function"
  ) {
    pushExplicitFunctionQueueItem({
      project: args.project,
      node,
      entry: args.entry,
      state: args.state,
      defaultSheetThreadId: args.defaultSheetThreadId,
    });
    return;
  }
  if (typeof args.entry !== "string" && args.entry.kind === "subsheet-output") {
    pushExplicitSubsheetQueueItem({
      project: args.project,
      node,
      entry: args.entry,
      state: args.state,
      defaultSheetThreadId: args.defaultSheetThreadId,
    });
    return;
  }
  pushExplicitNodeQueueItem({
    project: args.project,
    node,
    entry: args.entry,
    state: args.state,
    defaultSheetThreadId: args.defaultSheetThreadId,
    queueKey,
  });
}

function pushDefaultComponentQueueItems(args: {
  project: NoHALProject;
  node: ComponentNode;
  state: OrderedAddfCollectorState;
  defaultSheetThreadId: string;
}): void {
  const component = args.project.library.components[args.node.componentId];
  const functions = component?.functions ?? [];
  if (args.state.coveredByNodeEntry.has(args.node.id)) return;
  if (functions.length === 0) {
    pushOrderedAddfItem(args.state, {
      queueKey:
        addfQueueEntryKey(makeAddfQueueNodeEntry(args.node.id)) ??
        `node:${args.node.id}`,
      node: args.node,
      sheetThreadOutputId: args.defaultSheetThreadId,
    });
    return;
  }
  const covered = args.state.coveredFunctionKeysByNodeId.get(args.node.id);
  for (const fn of functions) {
    if (covered?.has(fn.key)) continue;
    const queueEntry = makeAddfQueueFunctionEntry(args.node.id, fn.key);
    pushOrderedAddfItem(args.state, {
      queueKey: addfQueueEntryKey(queueEntry) ?? `fn:${args.node.id}:${fn.key}`,
      node: args.node,
      functionKey: fn.key,
      sheetThreadOutputId: args.defaultSheetThreadId,
    });
  }
}

function appendDefaultAddfQueueItems(args: {
  project: NoHALProject;
  node: SheetNodeInstance;
  state: OrderedAddfCollectorState;
  defaultSheetThreadId: string;
}): void {
  if (args.node.kind === "sheet") {
    pushSubsheetQueueItems({
      project: args.project,
      node: args.node,
      fallbackParentOutputId: args.defaultSheetThreadId,
      state: args.state,
    });
    return;
  }
  pushDefaultComponentQueueItems({
    project: args.project,
    node: args.node,
    state: args.state,
    defaultSheetThreadId: args.defaultSheetThreadId,
  });
}

function orderedAddfQueueItemsForSheet(
  project: NoHALProject,
  sheet: SheetDefinition,
): OrderedAddfQueueItem[] {
  const eligible = eligibleAddfNodesForSheet(project, sheet);
  const byId = new Map(eligible.map((node) => [node.id, node]));
  const defaultSheetThreadId = firstSheetThreadOutputId(sheet);
  const state = createOrderedAddfCollectorState();

  for (const entry of sheet.hal?.addfQueue ?? []) {
    processExplicitAddfQueueEntry({
      project,
      entry,
      byId,
      state,
      defaultSheetThreadId,
    });
  }

  for (const node of eligible) {
    appendDefaultAddfQueueItems({
      project,
      node,
      state,
      defaultSheetThreadId,
    });
  }

  return state.ordered;
}

function buildChildResolvedThreadMap(args: {
  project: NoHALProject;
  sheet: SheetDefinition;
  node: SheetNode;
  queueItem: OrderedAddfQueueItem;
  resolvedThreadByLocalOutput: Map<string, string>;
  defaultThread: string;
}): Map<string, string> {
  const childSheet = getSheet(args.project, args.node.sheetId);
  const childOutputs = getSheetThreadOutputs(childSheet);
  const fallbackParentLocalOutputId =
    args.queueItem.sheetThreadOutputId || firstSheetThreadOutputId(args.sheet);
  const fallbackResolvedThread =
    args.resolvedThreadByLocalOutput.get(fallbackParentLocalOutputId) ??
    args.defaultThread;
  const childResolvedThreadByLocalOutput = new Map<string, string>();
  if (args.queueItem.subsheetChildOutputId) {
    childResolvedThreadByLocalOutput.set(
      args.queueItem.subsheetChildOutputId,
      fallbackResolvedThread,
    );
    return childResolvedThreadByLocalOutput;
  }
  const threadMap = args.node.hal?.threadMap ?? {};
  for (const childOutput of childOutputs) {
    const parentLocalOutputId =
      threadMap[childOutput.id] ?? fallbackParentLocalOutputId;
    childResolvedThreadByLocalOutput.set(
      childOutput.id,
      args.resolvedThreadByLocalOutput.get(parentLocalOutputId) ??
        fallbackResolvedThread,
    );
  }
  return childResolvedThreadByLocalOutput;
}

function emitFunctionAddfEntries(args: {
  ctx: ExportContext;
  halThreadFloatModeByName: Map<string, "fp" | "nofp">;
  warnedFpThreadMismatch: Set<string>;
  addfEntries: AddfEntry[];
  component: ComponentDefinition;
  queueItem: OrderedAddfQueueItem;
  instancePath: string;
  parentSheetPath: string;
  thread: string;
}): boolean {
  if (!args.queueItem.functionKey) return false;
  const fn = args.component.functions?.find(
    (candidate) => candidate.key === args.queueItem.functionKey,
  );
  if (!fn) {
    args.ctx.warnings.push(
      `Missing function '${args.queueItem.functionKey}' on component '${args.component.halComponentName}' for node '${args.queueItem.node.instanceName}'`,
    );
    return true;
  }
  const functionName = resolveAddfFunctionTarget(args.instancePath, fn);
  args.addfEntries.push({
    functionName,
    thread: args.thread,
    parentSheetPath: args.parentSheetPath,
  });
  warnThreadFloatMismatch({
    ctx: args.ctx,
    warnedFpThreadMismatch: args.warnedFpThreadMismatch,
    halThreadFloatModeByName: args.halThreadFloatModeByName,
    threadName: args.thread,
    functionTarget: functionName,
    floatMode: fn.floatMode,
  });
  return true;
}

function emitAllComponentFunctionAddfs(args: {
  ctx: ExportContext;
  halThreadFloatModeByName: Map<string, "fp" | "nofp">;
  warnedFpThreadMismatch: Set<string>;
  addfEntries: AddfEntry[];
  component: ComponentDefinition;
  instancePath: string;
  parentSheetPath: string;
  thread: string;
}): void {
  for (const fn of args.component.functions ?? []) {
    const functionName = resolveAddfFunctionTarget(args.instancePath, fn);
    args.addfEntries.push({
      functionName,
      thread: args.thread,
      parentSheetPath: args.parentSheetPath,
    });
    warnThreadFloatMismatch({
      ctx: args.ctx,
      warnedFpThreadMismatch: args.warnedFpThreadMismatch,
      halThreadFloatModeByName: args.halThreadFloatModeByName,
      threadName: args.thread,
      functionTarget: functionName,
      floatMode: fn.floatMode,
    });
  }
}

function emitTemplatedAddfEntries(args: {
  addfEntries: AddfEntry[];
  templates: string[];
  item: Pick<
    RuntimeInstanceRecord,
    "componentName" | "instancePath" | "parentSheetPath"
  >;
  thread: string;
}): void {
  for (const template of args.templates) {
    args.addfEntries.push({
      functionName: replaceAddfTemplate(template, args.item),
      thread: args.thread,
      parentSheetPath: args.item.parentSheetPath,
    });
  }
}

function emitComponentAddfEntries(args: {
  project: NoHALProject;
  ctx: ExportContext;
  rules: ComponentRules;
  defaultThread: string;
  resolvedThreadByLocalOutput: Map<string, string>;
  queueItem: OrderedAddfQueueItem;
  pathParts: string[];
  addfEntries: AddfEntry[];
  halThreadFloatModeByName: Map<string, "fp" | "nofp">;
  warnedFpThreadMismatch: Set<string>;
}): void {
  if (args.queueItem.node.kind !== "component") return;
  const component =
    args.project.library.components[args.queueItem.node.componentId];
  if (!component) {
    args.ctx.warnings.push(
      `Missing component definition '${args.queueItem.node.componentId}' for node '${args.queueItem.node.instanceName}'`,
    );
    return;
  }
  if (component.runtime?.kind !== "rt") return;
  const componentName = component.halComponentName;
  const rule = args.rules[componentName];
  if (rule?.addf?.enabled === false) return;
  const thread =
    args.resolvedThreadByLocalOutput.get(args.queueItem.sheetThreadOutputId) ??
    args.defaultThread;
  const item = {
    componentName,
    instancePath: resolveExportedInstancePath(
      args.pathParts,
      args.queueItem.node.instanceName,
      component,
    ),
    parentSheetPath: joinInstancePath(args.pathParts),
  };
  if (
    emitFunctionAddfEntries({
      ctx: args.ctx,
      halThreadFloatModeByName: args.halThreadFloatModeByName,
      warnedFpThreadMismatch: args.warnedFpThreadMismatch,
      addfEntries: args.addfEntries,
      component,
      queueItem: args.queueItem,
      instancePath: item.instancePath,
      parentSheetPath: item.parentSheetPath,
      thread,
    })
  ) {
    return;
  }
  const customTemplates = rule?.addf?.functionTemplates?.filter(
    (template) => template.trim().length > 0,
  );
  if (!customTemplates && (component.functions?.length ?? 0) > 0) {
    emitAllComponentFunctionAddfs({
      ctx: args.ctx,
      halThreadFloatModeByName: args.halThreadFloatModeByName,
      warnedFpThreadMismatch: args.warnedFpThreadMismatch,
      addfEntries: args.addfEntries,
      component,
      instancePath: item.instancePath,
      parentSheetPath: item.parentSheetPath,
      thread,
    });
    return;
  }
  const templates = (
    customTemplates ??
    defaultAddfTemplatesForComponent(
      args.project,
      args.queueItem.node.componentId,
    )
  ).filter((template) => template.trim().length > 0);
  emitTemplatedAddfEntries({
    addfEntries: args.addfEntries,
    templates,
    item,
    thread,
  });
}

function collectAddfFromSheetInstance(args: {
  project: NoHALProject;
  ctx: ExportContext;
  rules: ComponentRules;
  sheetId: string;
  pathParts: string[];
  resolvedThreadByLocalOutput: Map<string, string>;
  defaultThread: string;
  addfEntries: AddfEntry[];
  halThreadFloatModeByName: Map<string, "fp" | "nofp">;
  warnedFpThreadMismatch: Set<string>;
  onlyLocalOutputId?: string;
  stack?: string[];
}): void {
  const cycleKey = `${args.sheetId}|${args.pathParts.join(".")}`;
  const stack = args.stack ?? [];
  if (stack.includes(cycleKey)) {
    args.ctx.warnings.push(
      `Recursive sheet addf expansion skipped at '${args.pathParts.join(".") || "Top"}'`,
    );
    return;
  }
  const nextStack = [...stack, cycleKey];
  const sheet = getSheet(args.project, args.sheetId);
  for (const queueItem of orderedAddfQueueItemsForSheet(args.project, sheet)) {
    if (
      args.onlyLocalOutputId &&
      queueItem.sheetThreadOutputId !== args.onlyLocalOutputId
    ) {
      continue;
    }
    if (queueItem.node.kind === "sheet") {
      collectAddfFromSheetInstance({
        project: args.project,
        ctx: args.ctx,
        rules: args.rules,
        sheetId: queueItem.node.sheetId,
        pathParts: [...args.pathParts, queueItem.node.instanceName],
        resolvedThreadByLocalOutput: buildChildResolvedThreadMap({
          project: args.project,
          sheet,
          node: queueItem.node,
          queueItem,
          resolvedThreadByLocalOutput: args.resolvedThreadByLocalOutput,
          defaultThread: args.defaultThread,
        }),
        defaultThread: args.defaultThread,
        addfEntries: args.addfEntries,
        halThreadFloatModeByName: args.halThreadFloatModeByName,
        warnedFpThreadMismatch: args.warnedFpThreadMismatch,
        onlyLocalOutputId: queueItem.subsheetChildOutputId,
        stack: nextStack,
      });
      continue;
    }
    emitComponentAddfEntries({
      project: args.project,
      ctx: args.ctx,
      rules: args.rules,
      defaultThread: args.defaultThread,
      resolvedThreadByLocalOutput: args.resolvedThreadByLocalOutput,
      queueItem,
      pathParts: args.pathParts,
      addfEntries: args.addfEntries,
      halThreadFloatModeByName: args.halThreadFloatModeByName,
      warnedFpThreadMismatch: args.warnedFpThreadMismatch,
    });
  }
}

function buildRootResolvedThreadByLocalOutput(
  project: NoHALProject,
  ctx: ExportContext,
  defaultThread: string,
): Map<string, string> {
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
  return rootResolvedThreadByLocalOutput;
}

function buildAddfLines(
  addfEntries: AddfEntry[],
  emitPosition: boolean,
): string[] {
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
  return addfLines;
}

export function buildRuntimeSections(
  project: NoHALProject,
  ctx: ExportContext,
): RuntimeSections {
  const generatedRuntime = collectGeneratedRuntimeContributions(project, ctx);
  const rules = project.halExport?.componentRules ?? {};
  const addfConfig = project.halExport?.addf;
  const loadOrderIndex = new Map(
    (project.halExport?.loadOrder ?? []).map((name, idx) => [name, idx]),
  );
  const allInstances = collectValidRuntimeInstances(ctx);
  const itemsByComponentName =
    groupRuntimeInstancesByComponentName(allInstances);
  const customLoadByComponentName = collectCustomLoadByComponentName(
    project,
    ctx,
    allInstances,
  );
  const { rtInstances, userspaceInstances, unknownRuntimeInstances } =
    bucketRuntimeInstances(allInstances, customLoadByComponentName);
  const preparedByComponentName = prepareRuntimeGroups(
    project,
    ctx,
    itemsByComponentName,
  );
  const sortedRtGroups = collectSortedRtGroups(
    rtInstances,
    preparedByComponentName,
    rules,
    loadOrderIndex,
  );
  const customLoadLines = buildCustomLoadLines({
    preparedByComponentName,
    customLoadByComponentName,
    rules,
    loadOrderIndex,
  });
  const loadrtLines: string[] = [];
  appendMotmodLoadrtLines({
    project,
    ctx,
    rules,
    rtGroups: new Map(sortedRtGroups),
    loadrtLines,
  });
  loadrtLines.push(...generatedRuntime.loadrtLines);
  loadrtLines.push(...buildThreadsLoadrtLines(project, ctx));
  appendRtComponentLoadrtLines({
    sortedRtGroups,
    rules,
    ctx,
    loadrtLines,
  });
  const runtimeSummaryLines = buildRuntimeSummaryLines(
    userspaceInstances,
    unknownRuntimeInstances,
  );
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

  if (addfEnabled) {
    collectAddfFromSheetInstance({
      project,
      ctx,
      rules,
      sheetId: project.rootSheetId,
      pathParts: [],
      resolvedThreadByLocalOutput: buildRootResolvedThreadByLocalOutput(
        project,
        ctx,
        defaultThread,
      ),
      defaultThread,
      addfEntries,
      halThreadFloatModeByName,
      warnedFpThreadMismatch,
    });
  }

  return {
    customLoadLines,
    loadrtLines,
    loadusrLines: [...generatedRuntime.loadusrLines],
    addfLines: buildAddfLines(addfEntries, emitPosition),
    runtimeSummaryLines,
  };
}
