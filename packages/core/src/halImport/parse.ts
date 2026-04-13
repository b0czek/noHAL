import { flatMap, fromEntries, map, pipe, sortBy, unique } from "remeda";
import { slugify } from "../id";
import { interpolateLoadrtImport } from "../loadrt";
import type {
  HalImportComponentGroup,
  HalImportDraft,
  HalImportNet,
  HalImportObservedParam,
  HalImportObservedPin,
  PinDirection,
} from "../types";

const HAL_INSTANCE_FIELD_SEGMENT_COUNT = 3;

interface ParsedLine {
  line: number;
  text: string;
}

interface MutableObservedPin {
  name: string;
  directionHints: Set<PinDirection>;
}

interface MutableObservedParam {
  name: string;
  sampleValues: string[];
}

interface MutableInstance {
  instanceName: string;
  componentNameHint?: string;
  runtimeHint: "rt" | "userspace" | "unknown";
  pinNames: Set<string>;
  pins: Map<string, MutableObservedPin>;
  params: Map<string, MutableObservedParam>;
  instanceConfigValues: Record<string, string>;
  paramValues: Record<string, string>;
}

function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? filePath;
}

function stripComment(line: string): string {
  let out = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) {
      out += ch;
      if (ch === quote && line[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "#") break;
    out += ch;
  }
  return out.trim();
}

function normalizeLines(text: string): ParsedLine[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const lines: ParsedLine[] = [];
  let pending = "";
  let pendingLine = 1;

  for (let idx = 0; idx < raw.length; idx += 1) {
    const lineNo = idx + 1;
    const line = raw[idx] ?? "";
    if (!pending) pendingLine = lineNo;
    const joined = pending ? `${pending} ${line.trimStart()}` : line;
    const trimmedEnd = joined.replace(/\s+$/, "");
    if (trimmedEnd.endsWith("\\")) {
      pending = trimmedEnd.slice(0, -1).replace(/\s+$/, "");
      continue;
    }
    const content = stripComment(trimmedEnd);
    if (content) lines.push({ line: pendingLine, text: content });
    pending = "";
  }

  if (pending.trim()) {
    const content = stripComment(pending);
    if (content) lines.push({ line: pendingLine, text: content });
  }

  return lines;
}

function tokenizeHal(line: string): string[] {
  const matches = line.match(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\S+/g) ?? [];
  return matches.map((token) => {
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      return token.slice(1, -1);
    }
    return token;
  });
}

function splitHalPath(
  rawPath: string,
  knownInstances: Set<string>,
): { instanceName: string; fieldName: string } | null {
  const candidates = [...knownInstances]
    .filter((instance) => rawPath.startsWith(`${instance}.`))
    .sort((a, b) => b.length - a.length);
  if (candidates.length > 0) {
    const instanceName = candidates[0];
    return {
      instanceName,
      fieldName: rawPath.slice(instanceName.length + 1),
    };
  }

  const segments = rawPath.split(".");
  if (segments.length < 2) return null;
  const implicitDefaultInstance = `${segments[0]}.0`;
  if (knownInstances.has(implicitDefaultInstance)) {
    return {
      instanceName: implicitDefaultInstance,
      fieldName: segments.slice(1).join("."),
    };
  }
  if (
    segments.length >= HAL_INSTANCE_FIELD_SEGMENT_COUNT &&
    /^\d+$/.test(segments[1] ?? "")
  ) {
    return {
      instanceName: `${segments[0]}.${segments[1]}`,
      fieldName: segments.slice(2).join("."),
    };
  }
  return {
    instanceName: segments[0],
    fieldName: segments.slice(1).join("."),
  };
}

function splitAddfFunctionTarget(
  rawTarget: string,
  knownInstances: Set<string>,
): { instanceName: string; functionSuffix?: string } | null {
  const candidates = [...knownInstances]
    .filter(
      (instance) =>
        rawTarget === instance || rawTarget.startsWith(`${instance}.`),
    )
    .sort((a, b) => b.length - a.length);
  if (candidates.length > 0) {
    const instanceName = candidates[0];
    if (rawTarget === instanceName) return { instanceName };
    const functionSuffix = rawTarget.slice(instanceName.length + 1);
    return {
      instanceName,
      ...(functionSuffix ? { functionSuffix } : {}),
    };
  }

  const implicitDefaultInstance = `${rawTarget}.0`;
  if (knownInstances.has(implicitDefaultInstance)) {
    return { instanceName: implicitDefaultInstance };
  }

  const segments = rawTarget.split(".");
  if (segments.length === 0 || !segments[0]) return null;
  const implicitFromBase = `${segments[0]}.0`;
  if (knownInstances.has(implicitFromBase)) {
    const functionSuffix = segments.slice(1).join(".");
    return {
      instanceName: implicitFromBase,
      ...(functionSuffix ? { functionSuffix } : {}),
    };
  }
  if (segments.length === 1) {
    return { instanceName: rawTarget };
  }
  if (segments.length === 2 && /^\d+$/.test(segments[1] ?? "")) {
    return { instanceName: rawTarget };
  }
  if (
    segments.length >= HAL_INSTANCE_FIELD_SEGMENT_COUNT &&
    /^\d+$/.test(segments[1] ?? "")
  ) {
    const functionSuffix = segments.slice(2).join(".");
    return {
      instanceName: `${segments[0]}.${segments[1]}`,
      ...(functionSuffix ? { functionSuffix } : {}),
    };
  }
  const functionSuffix = segments.slice(1).join(".");
  return {
    instanceName: segments[0],
    ...(functionSuffix ? { functionSuffix } : {}),
  };
}

function inferComponentName(instanceName: string): string {
  const segments = instanceName.split(".");
  if (segments.length >= 2 && /^\d+$/.test(segments[1] ?? ""))
    return segments[0];
  return segments[0] ?? instanceName;
}

function inferLoadusrProgramAndArgs(tokens: string[]): {
  programToken?: string;
  programArgs: string[];
  waitForName?: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let idx = 1;
  let waitForName: string | undefined;

  while (idx < tokens.length) {
    const token = tokens[idx];
    if (!token) break;
    if (token === "-W" || token === "-w" || token === "-i") {
      idx += 1;
      continue;
    }
    if (token === "-Wn") {
      const name = tokens[idx + 1];
      if (!name) {
        warnings.push("loadusr -Wn missing component name");
        idx += 1;
        break;
      }
      waitForName = name;
      idx += 2;
      continue;
    }
    break;
  }

  const programToken = tokens[idx];
  if (!programToken) {
    warnings.push("loadusr missing program/component name");
    return { programArgs: [], waitForName, warnings };
  }

  return {
    programToken,
    programArgs: tokens.slice(idx + 1),
    waitForName,
    warnings,
  };
}

function inferLoadusrInstanceName(
  programToken: string,
  programArgs: string[],
): { instanceName: string; explicitName?: string; warnings: string[] } {
  const warnings: string[] = [];
  const explicitNames: string[] = [];

  for (let i = 0; i < programArgs.length; i += 1) {
    const token = programArgs[i];
    if (token !== "-n" && token !== "-c") continue;
    const name = programArgs[i + 1];
    if (!name) {
      warnings.push(`loadusr ${token} missing component name`);
      continue;
    }
    explicitNames.push(name);
    i += 1;
  }

  const explicitName = explicitNames[0];
  if (explicitNames.length > 1) {
    const distinct = unique(explicitNames);
    if (distinct.length > 1) {
      warnings.push(
        `loadusr has multiple component-name candidates (${distinct.join(", ")})`,
      );
    }
  }

  return {
    instanceName: explicitName ?? basename(programToken),
    ...(explicitName ? { explicitName } : {}),
    warnings,
  };
}

function ensureInstanceRecord(
  instances: Map<string, MutableInstance>,
  instanceName: string,
  componentNameHint?: string,
  runtimeHint?: "rt" | "userspace" | "unknown",
  instanceConfigValues?: Record<string, string>,
): MutableInstance {
  let record = instances.get(instanceName);
  if (!record) {
    record = {
      instanceName,
      componentNameHint,
      runtimeHint: runtimeHint ?? "unknown",
      pinNames: new Set(),
      pins: new Map(),
      params: new Map(),
      instanceConfigValues: {},
      paramValues: {},
    };
    instances.set(instanceName, record);
  }
  if (!record.componentNameHint && componentNameHint) {
    record.componentNameHint = componentNameHint;
  }
  if (runtimeHint && record.runtimeHint !== "rt") {
    if (runtimeHint === "rt" || record.runtimeHint === "unknown") {
      record.runtimeHint = runtimeHint;
    }
  }
  if (instanceConfigValues) {
    record.instanceConfigValues = {
      ...record.instanceConfigValues,
      ...instanceConfigValues,
    };
  }
  return record;
}

function addObservedPin(
  record: MutableInstance,
  pinName: string,
  direction: PinDirection,
): void {
  record.pinNames.add(pinName);
  const existing = record.pins.get(pinName);
  if (existing) {
    existing.directionHints.add(direction);
    return;
  }
  record.pins.set(pinName, {
    name: pinName,
    directionHints: new Set([direction]),
  });
}

function addObservedParam(
  record: MutableInstance,
  fieldName: string,
  value: string,
): void {
  const existing = record.params.get(fieldName);
  if (existing) {
    if (!existing.sampleValues.includes(value))
      existing.sampleValues.push(value);
  } else {
    record.params.set(fieldName, { name: fieldName, sampleValues: [value] });
  }
  record.paramValues[fieldName] = value;
}

function parseKeyValueArgs(tokens: string[]): Record<string, string> {
  return pipe(
    tokens,
    flatMap((token) => {
      const eq = token.indexOf("=");
      return eq <= 0
        ? []
        : [[token.slice(0, eq), token.slice(eq + 1)] as const];
    }),
    fromEntries(),
  );
}

function isArrowToken(token: string): boolean {
  return token === "=>" || token === "<=" || token === "<=>";
}

function arrowRoles(
  token: string,
): { before: PinDirection; after: PinDirection } | null {
  if (token === "=>") return { before: "out", after: "in" };
  if (token === "<=") return { before: "in", after: "out" };
  if (token === "<=>") return { before: "io", after: "io" };
  return null;
}

function looksLikeHalPinPath(token: string): boolean {
  if (!token.includes(".")) return false;
  if (/^[+-]?\d+(\.\d+)?$/.test(token)) return false;
  return /^[A-Za-z0-9_:-][A-Za-z0-9_.:#/-]*$/.test(token);
}

function rememberLoadCommand(args: {
  loadCommandByComponentName: Map<string, string>;
  warnings: string[];
  componentName: string;
  loadCommand: string;
  lineNo: number;
}): void {
  const normalizedCommand = args.loadCommand.trim();
  if (!normalizedCommand) return;
  const existing = args.loadCommandByComponentName.get(args.componentName);
  if (!existing) {
    args.loadCommandByComponentName.set(args.componentName, normalizedCommand);
    return;
  }
  if (existing === normalizedCommand) return;
  args.warnings.push(
    `Line ${args.lineNo}: multiple load commands detected for '${args.componentName}'; keeping first`,
  );
}

function processLoadrtLine(args: {
  line: ParsedLine;
  tokens: string[];
  warnings: string[];
  loadCommandByComponentName: Map<string, string>;
  knownInstances: Set<string>;
  instances: Map<string, MutableInstance>;
  setMotmodDraft: (value: HalImportDraft["motmod"]) => void;
}): void {
  const componentName = args.tokens[1];
  if (!componentName) {
    args.warnings.push(`Line ${args.line.line}: loadrt missing component name`);
    return;
  }
  rememberLoadCommand({
    loadCommandByComponentName: args.loadCommandByComponentName,
    warnings: args.warnings,
    componentName,
    loadCommand: args.line.text,
    lineNo: args.line.line,
  });
  const loadrtImport = interpolateLoadrtImport({
    componentName,
    args: parseKeyValueArgs(args.tokens.slice(2)),
  });
  for (const event of loadrtImport.events ?? []) {
    if (event.topic === "project.motmod" && event.payload) {
      args.setMotmodDraft(event.payload as HalImportDraft["motmod"]);
    }
  }
  for (const warning of loadrtImport.warnings ?? []) {
    args.warnings.push(`Line ${args.line.line}: ${warning}`);
  }
  for (const instanceName of loadrtImport.instancePaths) {
    args.knownInstances.add(instanceName);
    ensureInstanceRecord(
      args.instances,
      instanceName,
      componentName,
      "rt",
      loadrtImport.instanceConfigByPath?.[instanceName],
    );
  }
}

function processLoadusrLine(args: {
  line: ParsedLine;
  tokens: string[];
  warnings: string[];
  loadCommandByComponentName: Map<string, string>;
  knownInstances: Set<string>;
  instances: Map<string, MutableInstance>;
}): void {
  const parsed = inferLoadusrProgramAndArgs(args.tokens);
  for (const warning of parsed.warnings) {
    args.warnings.push(`Line ${args.line.line}: ${warning}`);
  }
  if (!parsed.programToken) return;
  const componentNameHint = basename(parsed.programToken);
  rememberLoadCommand({
    loadCommandByComponentName: args.loadCommandByComponentName,
    warnings: args.warnings,
    componentName: componentNameHint,
    loadCommand: args.line.text,
    lineNo: args.line.line,
  });

  const named = inferLoadusrInstanceName(
    parsed.programToken,
    parsed.programArgs,
  );
  for (const warning of named.warnings) {
    args.warnings.push(`Line ${args.line.line}: ${warning}`);
  }

  const instanceName = parsed.waitForName ?? named.instanceName;
  if (
    parsed.waitForName &&
    named.explicitName &&
    parsed.waitForName !== named.explicitName
  ) {
    args.warnings.push(
      `Line ${args.line.line}: loadusr -Wn name '${parsed.waitForName}' does not match component name option '${named.explicitName}'`,
    );
  }

  args.knownInstances.add(instanceName);
  ensureInstanceRecord(
    args.instances,
    instanceName,
    componentNameHint,
    "userspace",
  );
}

function processAddfLine(args: {
  line: ParsedLine;
  tokens: string[];
  warnings: string[];
  knownInstances: Set<string>;
  addfs: HalImportDraft["addfs"];
}): void {
  const functionName = args.tokens[1];
  if (!functionName) {
    args.warnings.push(`Line ${args.line.line}: addf missing function name`);
    return;
  }
  const thread = args.tokens[2];
  const position = Number.parseInt(args.tokens[3] ?? "", 10);
  const parsedTarget = splitAddfFunctionTarget(
    functionName,
    args.knownInstances,
  );
  args.addfs.push({
    line: args.line.line,
    functionName,
    ...(parsedTarget ? { instanceName: parsedTarget.instanceName } : {}),
    ...(parsedTarget?.functionSuffix
      ? { functionSuffix: parsedTarget.functionSuffix }
      : {}),
    ...(parsedTarget
      ? { isDefaultFunction: !parsedTarget.functionSuffix }
      : {}),
    ...(thread ? { thread } : {}),
    ...(Number.isFinite(position) ? { position } : {}),
  });
}

function processSetpLine(args: {
  line: ParsedLine;
  tokens: string[];
  warnings: string[];
  knownInstances: Set<string>;
  instances: Map<string, MutableInstance>;
  setps: HalImportDraft["setps"];
}): void {
  const rawPath = args.tokens[1];
  if (!rawPath) {
    args.warnings.push(`Line ${args.line.line}: setp missing path`);
    return;
  }
  const value = args.tokens.slice(2).join(" ").trim();
  const split = splitHalPath(rawPath, args.knownInstances);
  if (!split?.fieldName) {
    args.warnings.push(
      `Line ${args.line.line}: could not parse setp path '${rawPath}'`,
    );
    return;
  }
  const record = ensureInstanceRecord(args.instances, split.instanceName);
  addObservedParam(record, split.fieldName, value);
  args.setps.push({
    line: args.line.line,
    rawPath,
    instanceName: split.instanceName,
    fieldName: split.fieldName,
    value,
  });
}

function collectNetEndpoints(args: {
  line: ParsedLine;
  tokens: string[];
  warnings: string[];
  knownInstances: Set<string>;
  instances: Map<string, MutableInstance>;
}): {
  endpoints: HalImportNet["endpoints"];
  endpointRoles: Array<PinDirection | null>;
} {
  const endpointTokens = args.tokens.slice(2);
  const endpoints: HalImportNet["endpoints"] = [];
  const endpointRoles: Array<PinDirection | null> = [];
  let arrowRoleAfter: PinDirection | null = null;
  let sawArrow = false;

  for (const token of endpointTokens) {
    if (isArrowToken(token)) {
      const roles = arrowRoles(token);
      if (!roles) continue;
      if (!sawArrow) {
        for (let i = 0; i < endpointRoles.length; i += 1) {
          if (endpointRoles[i] == null) endpointRoles[i] = roles.before;
        }
      }
      sawArrow = true;
      arrowRoleAfter = roles.after;
      continue;
    }
    if (!looksLikeHalPinPath(token)) continue;
    const split = splitHalPath(token, args.knownInstances);
    if (!split?.fieldName) {
      args.warnings.push(
        `Line ${args.line.line}: could not parse net pin '${token}'`,
      );
      continue;
    }
    endpoints.push({
      rawPath: token,
      instanceName: split.instanceName,
      pinName: split.fieldName,
    });
    endpointRoles.push(arrowRoleAfter);
    ensureInstanceRecord(args.instances, split.instanceName).pinNames.add(
      split.fieldName,
    );
  }

  return { endpoints, endpointRoles };
}

function defaultNetEndpointDirection(
  endpointCount: number,
  index: number,
): PinDirection {
  if (endpointCount <= 1) return "io";
  return index === 0 ? "out" : "in";
}

function applyNetEndpointDirections(args: {
  endpoints: HalImportNet["endpoints"];
  endpointRoles: Array<PinDirection | null>;
  instances: Map<string, MutableInstance>;
}): void {
  for (let i = 0; i < args.endpoints.length; i += 1) {
    const endpoint = args.endpoints[i];
    const explicit = args.endpointRoles[i];
    const direction =
      explicit ?? defaultNetEndpointDirection(args.endpoints.length, i);
    const record = ensureInstanceRecord(args.instances, endpoint.instanceName);
    addObservedPin(record, endpoint.pinName, direction);
  }
}

function processNetLine(args: {
  line: ParsedLine;
  tokens: string[];
  warnings: string[];
  knownInstances: Set<string>;
  instances: Map<string, MutableInstance>;
  nets: HalImportNet[];
}): void {
  const netName = args.tokens[1];
  if (!netName) {
    args.warnings.push(`Line ${args.line.line}: net missing signal name`);
    return;
  }
  const { endpoints, endpointRoles } = collectNetEndpoints(args);
  applyNetEndpointDirections({
    endpoints,
    endpointRoles,
    instances: args.instances,
  });

  args.nets.push({ line: args.line.line, name: netName, endpoints });
}

function buildGroupIdByComponentName(
  groupsByName: Map<string, MutableInstance[]>,
): Map<string, string> {
  const groupIdsByName = new Map<string, string>();
  const usedGroupIds = new Set<string>();
  for (const name of sortBy([...groupsByName.keys()], (name) => name)) {
    let id = `halcmp:${slugify(name)}`;
    let suffix = 2;
    while (usedGroupIds.has(id)) {
      id = `halcmp:${slugify(name)}-${suffix}`;
      suffix += 1;
    }
    usedGroupIds.add(id);
    groupIdsByName.set(name, id);
  }
  return groupIdsByName;
}

function buildComponentGroups(args: {
  groupsByName: Map<string, MutableInstance[]>;
  groupIdsByName: Map<string, string>;
  loadCommandByComponentName: Map<string, string>;
}): HalImportComponentGroup[] {
  function inferGroupRuntimeHint(
    groupInstances: MutableInstance[],
  ): "rt" | "userspace" | "unknown" {
    if (groupInstances.some((item) => item.runtimeHint === "rt")) return "rt";
    if (groupInstances.some((item) => item.runtimeHint === "userspace")) {
      return "userspace";
    }
    return "unknown";
  }

  function mergeGroupPins(
    pinMap: Map<string, HalImportObservedPin>,
    item: MutableInstance,
  ): void {
    for (const pin of item.pins.values()) {
      const existing = pinMap.get(pin.name);
      const directions = [...pin.directionHints].sort();
      if (existing) {
        for (const direction of directions) {
          if (!existing.observedDirections.includes(direction)) {
            existing.observedDirections.push(direction);
          }
        }
        continue;
      }
      pinMap.set(pin.name, {
        name: pin.name,
        observedDirections: directions,
      });
    }
  }

  function mergeGroupParams(
    paramMap: Map<string, HalImportObservedParam>,
    item: MutableInstance,
  ): void {
    for (const param of item.params.values()) {
      const existing = paramMap.get(param.name);
      if (existing) {
        for (const sample of param.sampleValues) {
          if (!existing.sampleValues.includes(sample)) {
            existing.sampleValues.push(sample);
          }
        }
        continue;
      }
      paramMap.set(param.name, {
        name: param.name,
        sampleValues: [...param.sampleValues],
      });
    }
  }

  function buildGroupInstanceOutput(
    pinMap: Map<string, HalImportObservedPin>,
    paramMap: Map<string, HalImportObservedParam>,
    componentName: string,
    item: MutableInstance,
  ) {
    mergeGroupPins(pinMap, item);
    mergeGroupParams(paramMap, item);
    return {
      instanceName: item.instanceName,
      componentGroupId: args.groupIdsByName.get(componentName) ?? componentName,
      pinNames: [...item.pinNames].sort((a, b) => a.localeCompare(b)),
      ...(Object.keys(item.instanceConfigValues).length > 0
        ? { instanceConfigValues: { ...item.instanceConfigValues } }
        : {}),
      paramValues: { ...item.paramValues },
    };
  }

  function buildComponentGroup(
    pinMap: Map<string, HalImportObservedPin>,
    paramMap: Map<string, HalImportObservedParam>,
    componentName: string,
    groupInstances: MutableInstance[],
  ): HalImportComponentGroup {
    const runtimeHint = inferGroupRuntimeHint(groupInstances);
    const instancesOut = pipe(
      groupInstances,
      sortBy((item) => item.instanceName),
      map((item) =>
        buildGroupInstanceOutput(pinMap, paramMap, componentName, item),
      ),
    );

    return {
      id: args.groupIdsByName.get(componentName) ?? componentName,
      inferredHalComponentName: componentName,
      ...(args.loadCommandByComponentName.get(componentName)
        ? { loadCommand: args.loadCommandByComponentName.get(componentName) }
        : {}),
      runtimeHint,
      instances: instancesOut,
      pins: [...pinMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      params: [...paramMap.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    };
  }

  return pipe(
    [...args.groupsByName.entries()],
    sortBy(([componentName]) => componentName),
    map(([componentName, groupInstances]) => {
      const pinMap = new Map<string, HalImportObservedPin>();
      const paramMap = new Map<string, HalImportObservedParam>();
      return buildComponentGroup(
        pinMap,
        paramMap,
        componentName,
        groupInstances,
      );
    }),
  );
}

interface ParseHalImportState {
  warnings: string[];
  loadCommandByComponentName: Map<string, string>;
  knownInstances: Set<string>;
  instances: Map<string, MutableInstance>;
  nets: HalImportNet[];
  setps: HalImportDraft["setps"];
  addfs: HalImportDraft["addfs"];
  motmodDraft?: HalImportDraft["motmod"];
}

function processParsedHalLine(
  line: ParsedLine,
  state: ParseHalImportState,
): void {
  const tokens = tokenizeHal(line.text);
  if (tokens.length === 0) return;
  const cmd = tokens[0]?.toLowerCase();
  if (!cmd) return;

  if (cmd === "loadrt") {
    processLoadrtLine({
      line,
      tokens,
      warnings: state.warnings,
      loadCommandByComponentName: state.loadCommandByComponentName,
      knownInstances: state.knownInstances,
      instances: state.instances,
      setMotmodDraft: (value) => {
        state.motmodDraft = { ...(state.motmodDraft ?? {}), ...(value ?? {}) };
      },
    });
    return;
  }

  if (cmd === "loadusr") {
    processLoadusrLine({
      line,
      tokens,
      warnings: state.warnings,
      loadCommandByComponentName: state.loadCommandByComponentName,
      knownInstances: state.knownInstances,
      instances: state.instances,
    });
    return;
  }

  if (cmd === "addf") {
    processAddfLine({
      line,
      tokens,
      warnings: state.warnings,
      knownInstances: state.knownInstances,
      addfs: state.addfs,
    });
    return;
  }

  if (cmd === "setp") {
    processSetpLine({
      line,
      tokens,
      warnings: state.warnings,
      knownInstances: state.knownInstances,
      instances: state.instances,
      setps: state.setps,
    });
    return;
  }

  if (cmd === "net") {
    processNetLine({
      line,
      tokens,
      warnings: state.warnings,
      knownInstances: state.knownInstances,
      instances: state.instances,
      nets: state.nets,
    });
  }
}

function groupInstancesByComponent(
  instances: Map<string, MutableInstance>,
): Map<string, MutableInstance[]> {
  const groupsByName = new Map<string, MutableInstance[]>();
  for (const instance of instances.values()) {
    const componentName =
      instance.componentNameHint ?? inferComponentName(instance.instanceName);
    const list = groupsByName.get(componentName);
    if (list) list.push(instance);
    else groupsByName.set(componentName, [instance]);
  }
  return groupsByName;
}

function buildGroupIdByInstanceName(
  componentGroups: HalImportComponentGroup[],
): Map<string, string> {
  const groupIdByInstanceName = new Map<string, string>();
  for (const group of componentGroups) {
    for (const instance of group.instances) {
      groupIdByInstanceName.set(instance.instanceName, group.id);
    }
  }
  return groupIdByInstanceName;
}

function warnForUngroupedNetEndpoints(args: {
  warnings: string[];
  nets: HalImportNet[];
  groupIdByInstanceName: Map<string, string>;
}): void {
  for (const net of args.nets) {
    for (const endpoint of net.endpoints) {
      const groupId = args.groupIdByInstanceName.get(endpoint.instanceName);
      if (!groupId) {
        args.warnings.push(
          `Line ${net.line}: endpoint '${endpoint.rawPath}' was not assigned to a component group`,
        );
      }
    }
  }
}

export function parseHalImportDraft(
  text: string,
  sourcePath?: string,
): HalImportDraft {
  const normalized = normalizeLines(text);
  const state: ParseHalImportState = {
    warnings: [],
    loadCommandByComponentName: new Map<string, string>(),
    knownInstances: new Set<string>(),
    instances: new Map<string, MutableInstance>(),
    nets: [],
    setps: [],
    addfs: [],
  };

  for (const line of normalized) {
    processParsedHalLine(line, state);
  }

  const groupsByName = groupInstancesByComponent(state.instances);

  const groupIdsByName = buildGroupIdByComponentName(groupsByName);
  const componentGroups = buildComponentGroups({
    groupsByName,
    groupIdsByName,
    loadCommandByComponentName: state.loadCommandByComponentName,
  });

  const groupIdByInstanceName = buildGroupIdByInstanceName(componentGroups);
  warnForUngroupedNetEndpoints({
    warnings: state.warnings,
    nets: state.nets,
    groupIdByInstanceName,
  });

  return {
    parser: "nohal-hal-v1",
    ...(sourcePath ? { sourcePath, sourceFileName: basename(sourcePath) } : {}),
    lineCount: text.replace(/\r\n/g, "\n").split("\n").length,
    componentGroups,
    nets: state.nets,
    setps: state.setps,
    addfs: state.addfs,
    ...(state.motmodDraft ? { motmod: state.motmodDraft } : {}),
    warnings: state.warnings,
  };
}
