import {
  addfQueueEntryKey,
  addfQueueEntryNodeId,
  makeAddfQueueFunctionEntry,
  makeAddfQueueNodeEntry,
} from "./addfQueue";
import { getNodePins, getSheet, invertDirection } from "./graph";
import type {
  NoHALProject,
  PinDirection,
  SheetDefinition,
  SheetNodeInstance,
} from "./types";

interface ExportResult {
  text: string;
  warnings: string[];
}

interface EndpointRecord {
  id: string;
  kind: "component-pin" | "sheet-boundary" | "bridge";
  type: string;
  direction: PinDirection;
  halPinPath?: string;
  boundarySignalPath?: string;
}

interface Hint {
  kind: "global" | "hierarchical" | "local" | "boundary";
  name: string;
}

type RuntimeKind = "rt" | "userspace" | "unknown";

class UnionFind {
  private parent = new Map<string, string>();

  add(x: string): void {
    if (!this.parent.has(x)) this.parent.set(x, x);
  }

  find(x: string): string {
    const p = this.parent.get(x);
    if (!p) throw new Error(`UnionFind missing node: ${x}`);
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }

  union(a: string, b: string): void {
    this.add(a);
    this.add(b);
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }

  groups(): Map<string, string[]> {
    const out = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      const list = out.get(root);
      if (list) list.push(key);
      else out.set(root, [key]);
    }
    return out;
  }
}

interface ExportContext {
  union: UnionFind;
  endpoints: Map<string, EndpointRecord>;
  hintsByEndpointId: Map<string, Hint[]>;
  warnings: string[];
  globalLabelMembers: Map<string, string[]>;
  componentInstances: Array<{
    componentName: string;
    componentId: string;
    instancePath: string;
    parentSheetPath: string;
    runtimeKind: RuntimeKind;
  }>;
  endpointSeq: number;
}

function createExportContext(): ExportContext {
  return {
    union: new UnionFind(),
    endpoints: new Map(),
    hintsByEndpointId: new Map(),
    warnings: [],
    globalLabelMembers: new Map(),
    componentInstances: [],
    endpointSeq: 0,
  };
}

function endpointId(ctx: ExportContext, prefix: string): string {
  ctx.endpointSeq += 1;
  return `${prefix}_${ctx.endpointSeq}`;
}

function addHint(
  ctx: ExportContext,
  endpointIdValue: string,
  hint: Hint,
): void {
  const list = ctx.hintsByEndpointId.get(endpointIdValue);
  if (list) {
    list.push(hint);
  } else {
    ctx.hintsByEndpointId.set(endpointIdValue, [hint]);
  }
}

function registerEndpoint(ctx: ExportContext, record: EndpointRecord): void {
  ctx.endpoints.set(record.id, record);
  ctx.union.add(record.id);
}

function pushGlobalLabelMember(
  ctx: ExportContext,
  name: string,
  endpointIdValue: string,
): void {
  const list = ctx.globalLabelMembers.get(name);
  if (list) list.push(endpointIdValue);
  else ctx.globalLabelMembers.set(name, [endpointIdValue]);
}

interface TraversalResult {
  boundaryPortEndpointIds: Record<string, string>;
}

function joinInstancePath(parts: string[]): string {
  return parts.join(".");
}

function chooseBoundarySignalName(
  pathParts: string[],
  portName: string,
): string {
  return pathParts.length > 0
    ? `${joinInstancePath(pathParts)}.${portName}`
    : portName;
}

function createLocalEndpointIdMap(
  ctx: ExportContext,
  project: NoHALProject,
  sheet: SheetDefinition,
  pathParts: string[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const port of sheet.ports) {
    const id = endpointId(ctx, "boundary");
    registerEndpoint(ctx, {
      id,
      kind: "sheet-boundary",
      type: port.type,
      direction: invertDirection(port.direction),
      boundarySignalPath: chooseBoundarySignalName(pathParts, port.name),
    });
    addHint(ctx, id, {
      kind: "boundary",
      name: chooseBoundarySignalName(pathParts, port.name),
    });
    map.set(`port:${port.id}`, id);
  }

  for (const node of sheet.nodes) {
    const pins = getNodePins(project, node);
    for (const pin of pins) {
      const localKey = `node:${node.id}:${pin.key}`;
      const id = endpointId(ctx, "ep");
      if (node.kind === "component") {
        const instancePath = joinInstancePath([
          ...pathParts,
          node.instanceName,
        ]);
        registerEndpoint(ctx, {
          id,
          kind: "component-pin",
          type: pin.type,
          direction: pin.direction,
          halPinPath: `${instancePath}.${pin.name}`,
        });
      } else {
        registerEndpoint(ctx, {
          id,
          kind: "bridge",
          type: pin.type,
          direction: pin.direction,
        });
      }
      map.set(localKey, id);
    }
  }

  return map;
}

function localEndpointRefToId(
  map: Map<string, string>,
  ref:
    | { kind: "node-pin"; nodeId: string; pinKey: string }
    | { kind: "sheet-port"; portId: string },
): string {
  const key =
    ref.kind === "node-pin"
      ? `node:${ref.nodeId}:${ref.pinKey}`
      : `port:${ref.portId}`;
  const value = map.get(key);
  if (!value) throw new Error(`Missing local endpoint map entry: ${key}`);
  return value;
}

function traverseSheetInstance(
  ctx: ExportContext,
  project: NoHALProject,
  sheetId: string,
  pathParts: string[],
  sheetStack: string[] = [],
): TraversalResult {
  if (sheetStack.includes(sheetId)) {
    ctx.warnings.push(
      `Recursive sheet hierarchy detected at '${[...pathParts].join(".") || "Top"}' (${sheetId}); skipping nested expansion`,
    );
    return { boundaryPortEndpointIds: {} };
  }

  const nextStack = [...sheetStack, sheetId];
  const sheet = getSheet(project, sheetId);
  const localIds = createLocalEndpointIdMap(ctx, project, sheet, pathParts);

  for (const node of sheet.nodes) {
    if (node.kind === "component") {
      const component = project.library.components[node.componentId];
      if (component) {
        ctx.componentInstances.push({
          componentName: component.halComponentName,
          componentId: node.componentId,
          instancePath: joinInstancePath([...pathParts, node.instanceName]),
          parentSheetPath: joinInstancePath(pathParts),
          runtimeKind: component.runtime?.kind ?? "unknown",
        });
        for (const pin of component.pins) {
          if (pin.arrayLen !== undefined || pin.name.includes("#")) {
            ctx.warnings.push(
              `Array pin export is not expanded yet (${component.halComponentName}.${pin.name}) on ${node.instanceName}`,
            );
          }
        }
      } else {
        ctx.warnings.push(
          `Missing component definition '${node.componentId}' for node '${node.instanceName}'`,
        );
      }
    }
  }

  for (const conn of sheet.directConnections) {
    const a = localEndpointRefToId(localIds, conn.a);
    const b = localEndpointRefToId(localIds, conn.b);
    ctx.union.union(a, b);
  }

  const labelsById = new Map(sheet.labels.map((label) => [label.id, label]));
  const localBuckets = new Map<string, string[]>();
  const hierBuckets = new Map<string, string[]>();

  for (const anchor of sheet.labelAnchors) {
    const label = labelsById.get(anchor.labelId);
    if (!label) {
      ctx.warnings.push(
        `Missing label '${anchor.labelId}' in sheet '${sheet.name}'`,
      );
      continue;
    }
    const endpoint = localEndpointRefToId(localIds, anchor.endpoint);
    const scopeKey = label.name;

    if (label.scope === "global") {
      addHint(ctx, endpoint, { kind: "global", name: label.name });
      pushGlobalLabelMember(ctx, label.name, endpoint);
      continue;
    }

    if (label.scope === "hierarchical") {
      addHint(ctx, endpoint, {
        kind: "hierarchical",
        name: chooseBoundarySignalName(pathParts, label.name),
      });
      const list = hierBuckets.get(scopeKey);
      if (list) list.push(endpoint);
      else hierBuckets.set(scopeKey, [endpoint]);
      continue;
    }

    addHint(ctx, endpoint, {
      kind: "local",
      name: chooseBoundarySignalName(pathParts, label.name),
    });
    const list = localBuckets.get(scopeKey);
    if (list) list.push(endpoint);
    else localBuckets.set(scopeKey, [endpoint]);
  }

  for (const endpoints of localBuckets.values()) {
    for (let i = 1; i < endpoints.length; i += 1)
      ctx.union.union(endpoints[0], endpoints[i]);
  }

  for (const [labelName, endpoints] of hierBuckets.entries()) {
    for (let i = 1; i < endpoints.length; i += 1)
      ctx.union.union(endpoints[0], endpoints[i]);
    const matchingPort = sheet.ports.find((port) => port.name === labelName);
    if (matchingPort) {
      const portEndpointId = localIds.get(`port:${matchingPort.id}`);
      if (portEndpointId) {
        for (const endpoint of endpoints)
          ctx.union.union(portEndpointId, endpoint);
      }
    } else {
      ctx.warnings.push(
        `Hierarchical label '${labelName}' in sheet '${sheet.name}' has no matching sheet port`,
      );
    }
  }

  for (const node of sheet.nodes) {
    if (node.kind !== "sheet") continue;

    const child = traverseSheetInstance(
      ctx,
      project,
      node.sheetId,
      [...pathParts, node.instanceName],
      nextStack,
    );
    const childSheet = getSheet(project, node.sheetId);
    for (const port of childSheet.ports) {
      const parentPinId = localIds.get(`node:${node.id}:${port.id}`);
      const childBoundaryId = child.boundaryPortEndpointIds[port.id];
      if (!parentPinId || !childBoundaryId) {
        ctx.warnings.push(
          `Sheet boundary bridge missing for subsheet '${node.instanceName}' port '${port.name}'`,
        );
        continue;
      }
      ctx.union.union(parentPinId, childBoundaryId);
    }
  }

  const boundaryPortEndpointIds: Record<string, string> = {};
  for (const port of sheet.ports) {
    const id = localIds.get(`port:${port.id}`);
    if (id) boundaryPortEndpointIds[port.id] = id;
  }
  return { boundaryPortEndpointIds };
}

function chooseNetName(hints: Hint[], fallbackIndex: number): string {
  const unique = Array.from(
    new Map(hints.map((hint) => [`${hint.kind}:${hint.name}`, hint])).values(),
  );
  const preferred =
    unique.find((h) => h.kind === "global") ??
    unique.find((h) => h.kind === "boundary") ??
    unique.find((h) => h.kind === "hierarchical") ??
    unique.find((h) => h.kind === "local");
  return preferred?.name ?? `auto_net_${fallbackIndex}`;
}

function formatNetLine(netName: string, pinPaths: string[]): string {
  return `net ${netName} ${pinPaths.join(" ")}`;
}

function sortPinsForHal(records: EndpointRecord[]): EndpointRecord[] {
  const rank = (r: EndpointRecord): number => {
    if (r.direction === "out") return 0;
    if (r.direction === "io") return 1;
    return 2;
  };
  return [...records].sort((a, b) => rank(a) - rank(b));
}

function describeEndpointForWarning(record: EndpointRecord): string {
  if (record.halPinPath) return `${record.halPinPath} [${record.type}]`;
  if (record.boundarySignalPath)
    return `${record.boundarySignalPath} (${record.kind}) [${record.type}]`;
  return `${record.kind}:${record.id} [${record.type}]`;
}

type RuntimeInstanceRecord = ExportContext["componentInstances"][number];

interface AddfEntry {
  functionName: string;
  thread: string;
  parentSheetPath: string;
}

interface RuntimeSections {
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

function buildRuntimeSections(
  project: NoHALProject,
  ctx: ExportContext,
): RuntimeSections {
  const rules = project.halExport?.componentRules ?? {};
  const addfConfig = project.halExport?.addf;
  const loadOrderList = project.halExport?.loadOrder ?? [];
  const loadOrderIndex = new Map(loadOrderList.map((name, idx) => [name, idx]));

  const allInstances = [...ctx.componentInstances].sort((a, b) =>
    a.instancePath.localeCompare(b.instancePath),
  );
  const rtInstances = allInstances.filter((item) => item.runtimeKind === "rt");
  const userspaceInstances = allInstances.filter(
    (item) => item.runtimeKind === "userspace",
  );
  const unknownRuntimeInstances = allInstances.filter(
    (item) => item.runtimeKind === "unknown",
  );

  for (const item of unknownRuntimeInstances) {
    ctx.warnings.push(
      `Component '${item.instancePath}' (${item.componentName}) has unknown runtime kind; skipping loadrt/addf generation for it`,
    );
  }

  const rtGroups = new Map<string, RuntimeInstanceRecord[]>();
  for (const item of rtInstances) {
    const list = rtGroups.get(item.componentName);
    if (list) list.push(item);
    else rtGroups.set(item.componentName, [item]);
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

  const loadrtLines: string[] = [];
  for (const [componentName, items] of sortedRtGroups) {
    const rule = rules[componentName];
    const combine = rule?.loadCombine ?? "names";
    const extraArgs = (rule?.loadrtArgs ?? [])
      .map((arg) => `${arg}`.trim())
      .filter(Boolean);
    const sortedNames = items
      .map((item) => item.instancePath)
      .sort((a, b) => a.localeCompare(b));
    if (combine === "separate") {
      for (const instanceName of sortedNames) {
        const args = [`names=${instanceName}`, ...extraArgs];
        loadrtLines.push(`loadrt ${componentName} ${args.join(" ")}`.trim());
      }
      continue;
    }
    const args = [`names=${sortedNames.join(",")}`, ...extraArgs];
    loadrtLines.push(`loadrt ${componentName} ${args.join(" ")}`.trim());
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

  function defaultAddfTemplatesForComponent(
    componentId: string,
  ): string[] {
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
      const ordered: OrderedAddfQueueItem[] = [];
      const seen = new Set<string>();
      const coveredByNodeEntry = new Set<string>();

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
          pushItem({ queueKey, node, functionKey: entry.functionKey });
          continue;
        }

        if (node.kind === "component") {
          const component = project.library.components[node.componentId];
          if ((component?.functions?.length ?? 0) > 0) {
            coveredByNodeEntry.add(node.id);
          }
        }
        pushItem({
          queueKey: addfQueueEntryKey(makeAddfQueueNodeEntry(node.id)) ?? queueKey,
          node,
        });
      }

      for (const node of eligible) {
        if (node.kind === "sheet") {
          pushItem({
            queueKey:
              addfQueueEntryKey(makeAddfQueueNodeEntry(node.id)) ??
              `node:${node.id}`,
            node,
          });
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
          });
          continue;
        }
        for (const fn of functions) {
          const queueEntry = makeAddfQueueFunctionEntry(node.id, fn.key);
          pushItem({
            queueKey:
              addfQueueEntryKey(queueEntry) ?? `fn:${node.id}:${fn.key}`,
            node,
            functionKey: fn.key,
          });
        }
      }
      return ordered;
    }

    function collectAddfFromSheetInstance(
      sheetId: string,
      pathParts: string[],
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
        const node = queueItem.node;
        if (node.kind === "sheet") {
          collectAddfFromSheetInstance(
            node.sheetId,
            [...pathParts, node.instanceName],
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
        const thread = rule?.addf?.thread?.trim() || defaultThread;
        const item = {
          componentName,
          instancePath: joinInstancePath([...pathParts, node.instanceName]),
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
            functionName: fn.halSuffix
              ? `${item.instancePath}.${fn.halSuffix}`
              : item.instancePath,
            thread,
            parentSheetPath: item.parentSheetPath,
          });
          continue;
        }
        const templates = (
          rule?.addf?.functionTemplates ??
          defaultAddfTemplatesForComponent(node.componentId)
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
    collectAddfFromSheetInstance(project.rootSheetId, []);
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
    loadrtLines,
    loadusrLines: [],
    addfLines,
    runtimeSummaryLines,
  };
}

export function exportProjectToHal(project: NoHALProject): ExportResult {
  const ctx = createExportContext();
  traverseSheetInstance(ctx, project, project.rootSheetId, [], []);

  for (const members of ctx.globalLabelMembers.values()) {
    for (let i = 1; i < members.length; i += 1)
      ctx.union.union(members[0], members[i]);
  }

  const groups = ctx.union.groups();
  const netLines: string[] = [];
  let autoIndex = 1;

  for (const groupMembers of groups.values()) {
    const records = groupMembers
      .map((id) => ctx.endpoints.get(id))
      .filter((item): item is EndpointRecord => Boolean(item));

    const leafPins = records.filter(
      (r) => r.kind === "component-pin" && r.halPinPath,
    );
    if (leafPins.length < 2) continue;

    const hints = groupMembers.flatMap(
      (id) => ctx.hintsByEndpointId.get(id) ?? [],
    );
    const netName = chooseNetName(hints, autoIndex++);

    const outputs = leafPins.filter((r) => r.direction === "out");
    if (outputs.length > 1) {
      ctx.warnings.push(
        `Multiple output pins share one signal on net '${netName}': ${outputs.map((r) => r.halPinPath).join(", ")}`,
      );
    }

    const types = new Set(records.map((r) => r.type));
    if (types.size > 1) {
      const endpointDetails = records
        .map(describeEndpointForWarning)
        .sort()
        .join(", ");
      ctx.warnings.push(
        `Mixed signal types found during export on net '${netName}': ${Array.from(types).join(", ")}. Endpoints: ${endpointDetails}`,
      );
    }

    const sortedLeafs = sortPinsForHal(leafPins);
    const pinPaths = sortedLeafs
      .map((r) => r.halPinPath)
      .filter((v): v is string => Boolean(v));
    netLines.push(formatNetLine(netName, Array.from(new Set(pinPaths))));
  }

  const setpLines: string[] = [];
  const seenSheets = new Set<string>();

  function emitParams(sheetId: string, pathParts: string[]): void {
    const cycleKey = `${sheetId}|${pathParts.join(".")}`;
    if (seenSheets.has(cycleKey)) return;
    seenSheets.add(cycleKey);

    const sheet = getSheet(project, sheetId);
    for (const node of sheet.nodes) {
      if (node.kind === "component") {
        const component = project.library.components[node.componentId];
        if (!component) continue;
        const instancePath = [...pathParts, node.instanceName].join(".");
        for (const [pinKey, value] of Object.entries(
          node.pinInitialValues ?? {},
        )) {
          const pinDef = component.pins.find((p) => p.key === pinKey);
          if (!pinDef) {
            ctx.warnings.push(
              `Unknown pin '${pinKey}' on node '${node.instanceName}'`,
            );
            continue;
          }
          if (!value.trim()) continue;
          setpLines.push(`setp ${instancePath}.${pinDef.name} ${value}`);
        }
        for (const [paramKey, value] of Object.entries(node.paramValues)) {
          const paramDef = component.params.find((p) => p.key === paramKey);
          if (!paramDef) {
            ctx.warnings.push(
              `Unknown param '${paramKey}' on node '${node.instanceName}'`,
            );
            continue;
          }
          if (!value.trim()) continue;
          setpLines.push(`setp ${instancePath}.${paramDef.name} ${value}`);
        }
      } else {
        emitParams(node.sheetId, [...pathParts, node.instanceName]);
      }
    }
  }

  emitParams(project.rootSheetId, []);
  const runtimeSections = buildRuntimeSections(project, ctx);

  const lines: string[] = [];
  lines.push(`# NoHAL HAL export`);
  lines.push(
    `# Target LinuxCNC ${project.target.linuxcncVersion} (${project.target.platform})`,
  );
  lines.push(`# Project: ${project.name}`);
  lines.push(`#`);
  lines.push(`# Notes:`);
  lines.push(
    `# - loadrt is generated for RT components using names=... grouping (override via project.halExport.componentRules).`,
  );
  lines.push(
    `# - addf is emitted per thread and expanded from per-sheet queues (sheet.hal.addfQueue), with subsheets acting as ordered blocks.`,
  );
  lines.push("");
  lines.push(`# Runtime`);
  if (
    runtimeSections.loadrtLines.length === 0 &&
    runtimeSections.addfLines.length === 0 &&
    runtimeSections.runtimeSummaryLines.length === 0
  ) {
    lines.push("# (no runtime component actions generated)");
    lines.push("");
  } else {
    if (runtimeSections.loadrtLines.length > 0) {
      lines.push(`# loadrt`);
      lines.push(...runtimeSections.loadrtLines);
      lines.push("");
    }
    if (runtimeSections.loadusrLines.length > 0) {
      lines.push(`# loadusr`);
      lines.push(...runtimeSections.loadusrLines);
      lines.push("");
    }
    if (runtimeSections.addfLines.length > 0) {
      lines.push(`# addf`);
      lines.push(...runtimeSections.addfLines);
      lines.push("");
    }
    if (runtimeSections.runtimeSummaryLines.length > 0) {
      lines.push(...runtimeSections.runtimeSummaryLines);
      lines.push("");
    }
  }
  if (setpLines.length > 0) {
    lines.push(`# Parameters`);
    lines.push(...setpLines);
    lines.push("");
  }
  lines.push(`# Signals`);
  if (netLines.length === 0) {
    lines.push("# (no nets exported)");
  } else {
    lines.push(...netLines);
  }
  lines.push("");

  return {
    text: `${lines.join("\n")}\n`,
    warnings: Array.from(new Set(ctx.warnings)),
  };
}
