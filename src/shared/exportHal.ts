import { getNodePins, getSheet, invertDirection, resolveEndpointInSheet } from "./graph";
import type {
  ComponentNode,
  NochalProject,
  PinDirection,
  SheetDefinition,
  SheetNode,
  SheetNodeInstance
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
  componentInstances: Array<{ componentName: string; instancePath: string }>;
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
    endpointSeq: 0
  };
}

function endpointId(ctx: ExportContext, prefix: string): string {
  ctx.endpointSeq += 1;
  return `${prefix}_${ctx.endpointSeq}`;
}

function addHint(ctx: ExportContext, endpointIdValue: string, hint: Hint): void {
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

function pushGlobalLabelMember(ctx: ExportContext, name: string, endpointIdValue: string): void {
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

function chooseBoundarySignalName(pathParts: string[], portName: string): string {
  return pathParts.length > 0 ? `${joinInstancePath(pathParts)}.${portName}` : portName;
}

function createLocalEndpointIdMap(
  ctx: ExportContext,
  project: NochalProject,
  sheet: SheetDefinition,
  pathParts: string[]
): Map<string, string> {
  const map = new Map<string, string>();

  for (const port of sheet.ports) {
    const id = endpointId(ctx, "boundary");
    registerEndpoint(ctx, {
      id,
      kind: "sheet-boundary",
      type: port.type,
      direction: invertDirection(port.direction),
      boundarySignalPath: chooseBoundarySignalName(pathParts, port.name)
    });
    addHint(ctx, id, { kind: "boundary", name: chooseBoundarySignalName(pathParts, port.name) });
    map.set(`port:${port.id}`, id);
  }

  for (const node of sheet.nodes) {
    const pins = getNodePins(project, node);
    for (const pin of pins) {
      const localKey = `node:${node.id}:${pin.key}`;
      const id = endpointId(ctx, "ep");
      if (node.kind === "component") {
        const instancePath = joinInstancePath([...pathParts, node.instanceName]);
        registerEndpoint(ctx, {
          id,
          kind: "component-pin",
          type: pin.type,
          direction: pin.direction,
          halPinPath: `${instancePath}.${pin.name}`
        });
      } else {
        registerEndpoint(ctx, {
          id,
          kind: "bridge",
          type: pin.type,
          direction: pin.direction
        });
      }
      map.set(localKey, id);
    }
  }

  return map;
}

function localEndpointRefToId(map: Map<string, string>, ref: { kind: "node-pin"; nodeId: string; pinKey: string } | { kind: "sheet-port"; portId: string }): string {
  const key = ref.kind === "node-pin" ? `node:${ref.nodeId}:${ref.pinKey}` : `port:${ref.portId}`;
  const value = map.get(key);
  if (!value) throw new Error(`Missing local endpoint map entry: ${key}`);
  return value;
}

function traverseSheetInstance(
  ctx: ExportContext,
  project: NochalProject,
  sheetId: string,
  pathParts: string[],
  sheetStack: string[] = []
): TraversalResult {
  if (sheetStack.includes(sheetId)) {
    ctx.warnings.push(
      `Recursive sheet hierarchy detected at '${[...pathParts].join(".") || "Top"}' (${sheetId}); skipping nested expansion`
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
          instancePath: joinInstancePath([...pathParts, node.instanceName])
        });
        for (const pin of component.pins) {
          if (pin.arrayLen !== undefined || pin.name.includes("#")) {
            ctx.warnings.push(
              `Array pin export is not expanded yet (${component.halComponentName}.${pin.name}) on ${node.instanceName}`
            );
          }
        }
      } else {
        ctx.warnings.push(`Missing component definition '${node.componentId}' for node '${node.instanceName}'`);
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
      ctx.warnings.push(`Missing label '${anchor.labelId}' in sheet '${sheet.name}'`);
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
        name: chooseBoundarySignalName(pathParts, label.name)
      });
      const list = hierBuckets.get(scopeKey);
      if (list) list.push(endpoint);
      else hierBuckets.set(scopeKey, [endpoint]);
      continue;
    }

    addHint(ctx, endpoint, {
      kind: "local",
      name: chooseBoundarySignalName(pathParts, label.name)
    });
    const list = localBuckets.get(scopeKey);
    if (list) list.push(endpoint);
    else localBuckets.set(scopeKey, [endpoint]);
  }

  for (const endpoints of localBuckets.values()) {
    for (let i = 1; i < endpoints.length; i += 1) ctx.union.union(endpoints[0], endpoints[i]);
  }

  for (const [labelName, endpoints] of hierBuckets.entries()) {
    for (let i = 1; i < endpoints.length; i += 1) ctx.union.union(endpoints[0], endpoints[i]);
    const matchingPort = sheet.ports.find((port) => port.name === labelName);
    if (matchingPort) {
      const portEndpointId = localIds.get(`port:${matchingPort.id}`);
      if (portEndpointId) {
        for (const endpoint of endpoints) ctx.union.union(portEndpointId, endpoint);
      }
    } else {
      ctx.warnings.push(
        `Hierarchical label '${labelName}' in sheet '${sheet.name}' has no matching sheet port`
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
      nextStack
    );
    const childSheet = getSheet(project, node.sheetId);
    for (const port of childSheet.ports) {
      const parentPinId = localIds.get(`node:${node.id}:${port.id}`);
      const childBoundaryId = child.boundaryPortEndpointIds[port.id];
      if (!parentPinId || !childBoundaryId) {
        ctx.warnings.push(
          `Sheet boundary bridge missing for subsheet '${node.instanceName}' port '${port.name}'`
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
  const unique = Array.from(new Map(hints.map((hint) => [hint.kind + ":" + hint.name, hint])).values());
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

export function exportProjectToHal(project: NochalProject): ExportResult {
  const ctx = createExportContext();
  traverseSheetInstance(ctx, project, project.rootSheetId, [], []);

  for (const members of ctx.globalLabelMembers.values()) {
    for (let i = 1; i < members.length; i += 1) ctx.union.union(members[0], members[i]);
  }

  const groups = ctx.union.groups();
  const netLines: string[] = [];
  let autoIndex = 1;

  for (const groupMembers of groups.values()) {
    const records = groupMembers
      .map((id) => ctx.endpoints.get(id))
      .filter((item): item is EndpointRecord => Boolean(item));

    const leafPins = records.filter((r) => r.kind === "component-pin" && r.halPinPath);
    if (leafPins.length < 2) continue;

    const outputs = leafPins.filter((r) => r.direction === "out");
    if (outputs.length > 1) {
      ctx.warnings.push(
        `Multiple output pins share one signal: ${outputs.map((r) => r.halPinPath).join(", ")}`
      );
    }

    const types = new Set(records.map((r) => r.type));
    if (types.size > 1) {
      ctx.warnings.push(`Mixed signal types found during export: ${Array.from(types).join(", ")}`);
    }

    const hints = groupMembers.flatMap((id) => ctx.hintsByEndpointId.get(id) ?? []);
    const netName = chooseNetName(hints, autoIndex++);

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
        for (const [paramKey, value] of Object.entries(node.paramValues)) {
          const paramDef = component.params.find((p) => p.key === paramKey);
          if (!paramDef) {
            ctx.warnings.push(`Unknown param '${paramKey}' on node '${node.instanceName}'`);
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

  const loadSuggestions = new Map<string, string[]>();
  for (const item of ctx.componentInstances) {
    const list = loadSuggestions.get(item.componentName);
    if (list) list.push(item.instancePath);
    else loadSuggestions.set(item.componentName, [item.instancePath]);
  }

  const lines: string[] = [];
  lines.push(`# Nochal HAL export`);
  lines.push(`# Target LinuxCNC ${project.target.linuxcncVersion} (${project.target.platform})`);
  lines.push(`# Project: ${project.name}`);
  lines.push(`#`);
  lines.push(`# Notes:`);
  lines.push(`# - Export currently focuses on signal netting (net/setp).`);
  lines.push(`# - loadrt/loadusr/addf generation is not inferred yet and remains manual.`);
  lines.push("");
  if (loadSuggestions.size > 0) {
    lines.push(`# Component instance summary (manual loadrt/loadusr wiring still required):`);
    for (const [componentName, instances] of [...loadSuggestions.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`#   ${componentName}: ${instances.join(", ")}`);
    }
    lines.push("");
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
    warnings: Array.from(new Set(ctx.warnings))
  };
}
