import type { PinDirection } from "../types";

export interface ExportResult {
  text: string;
  postguiText?: string;
  warnings: string[];
}

export interface EndpointRecord {
  id: string;
  kind: "component-pin" | "sheet-boundary" | "bridge";
  type: string;
  direction: PinDirection;
  halPinPath?: string;
  boundarySignalPath?: string;
  exportStage?: "main" | "postgui";
}

export interface Hint {
  kind: "connection" | "global" | "local" | "boundary";
  name: string;
}

export type RuntimeKind = "rt" | "userspace" | "unknown";

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

export interface ExportContext {
  union: UnionFind;
  endpoints: Map<string, EndpointRecord>;
  hintsByEndpointId: Map<string, Hint[]>;
  warnings: string[];
  fatalErrors: string[];
  globalLabelMembers: Map<string, string[]>;
  componentInstances: Array<{
    componentName: string;
    componentId: string;
    instancePath: string;
    instanceConfigValues?: Record<string, string>;
    parentSheetPath: string;
    runtimeKind: RuntimeKind;
    exportStage: "main" | "postgui";
  }>;
  endpointSeq: number;
}

export function createExportContext(): ExportContext {
  return {
    union: new UnionFind(),
    endpoints: new Map(),
    hintsByEndpointId: new Map(),
    warnings: [],
    fatalErrors: [],
    globalLabelMembers: new Map(),
    componentInstances: [],
    endpointSeq: 0,
  };
}

export function pushFatal(ctx: ExportContext, message: string): void {
  ctx.fatalErrors.push(message);
  ctx.warnings.push(message);
}

export function endpointId(ctx: ExportContext, prefix: string): string {
  ctx.endpointSeq += 1;
  return `${prefix}_${ctx.endpointSeq}`;
}

export function addHint(
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

export function registerEndpoint(
  ctx: ExportContext,
  record: EndpointRecord,
): void {
  ctx.endpoints.set(record.id, record);
  ctx.union.add(record.id);
}

export function pushGlobalLabelMember(
  ctx: ExportContext,
  name: string,
  endpointIdValue: string,
): void {
  const list = ctx.globalLabelMembers.get(name);
  if (list) list.push(endpointIdValue);
  else ctx.globalLabelMembers.set(name, [endpointIdValue]);
}
