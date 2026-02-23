import { createId, safeKey, slugify } from "./id";
import { createEmptyProject } from "./project";
import type {
  ComponentDefinition,
  ComponentPinDefinition,
  ComponentStore,
  HalImportBuildOptions,
  HalImportBuildResult,
  HalImportComponentGroup,
  HalImportDraft,
  HalImportLinkSelection,
  HalImportLinkSuggestion,
  HalImportNet,
  HalImportObservedParam,
  HalImportObservedPin,
  HalValueType,
  PinDirection,
} from "./types";

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
  paramValues: Record<string, string>;
}

function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? filePath;
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
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
  if (segments.length >= 3 && /^\d+$/.test(segments[1] ?? "")) {
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

function inferComponentName(instanceName: string): string {
  const segments = instanceName.split(".");
  if (segments.length >= 2 && /^\d+$/.test(segments[1] ?? ""))
    return segments[0];
  return segments[0] ?? instanceName;
}

function ensureInstanceRecord(
  instances: Map<string, MutableInstance>,
  instanceName: string,
  componentNameHint?: string,
  runtimeHint?: "rt" | "userspace" | "unknown",
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
  const out: Record<string, string> = {};
  for (const token of tokens) {
    const eq = token.indexOf("=");
    if (eq <= 0) continue;
    out[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return out;
}

function isArrowToken(token: string): boolean {
  return token === "=>" || token === "<=" || token === "<=>";
}

function looksLikeHalPinPath(token: string): boolean {
  if (!token.includes(".")) return false;
  if (/^[+-]?\d+(\.\d+)?$/.test(token)) return false;
  return /^[A-Za-z0-9_:-][A-Za-z0-9_.:#/-]*$/.test(token);
}

export function parseHalImportDraft(
  text: string,
  sourcePath?: string,
): HalImportDraft {
  const normalized = normalizeLines(text);
  const warnings: string[] = [];
  const knownInstances = new Set<string>();
  const instances = new Map<string, MutableInstance>();
  const nets: HalImportNet[] = [];
  const setps: HalImportDraft["setps"] = [];
  const addfs: HalImportDraft["addfs"] = [];

  for (const line of normalized) {
    const tokens = tokenizeHal(line.text);
    if (tokens.length === 0) continue;
    const cmd = tokens[0]?.toLowerCase();
    if (!cmd) continue;

    if (cmd === "loadrt") {
      const componentName = tokens[1];
      if (!componentName) {
        warnings.push(`Line ${line.line}: loadrt missing component name`);
        continue;
      }
      const args = parseKeyValueArgs(tokens.slice(2));
      const namesArg = args.names?.trim();
      if (namesArg) {
        for (const rawName of namesArg.split(",")) {
          const instanceName = rawName.trim();
          if (!instanceName) continue;
          knownInstances.add(instanceName);
          ensureInstanceRecord(instances, instanceName, componentName, "rt");
        }
        continue;
      }
      const count = Number.parseInt(args.count ?? "", 10);
      if (Number.isFinite(count) && count > 0) {
        for (let i = 0; i < count; i += 1) {
          const instanceName = `${componentName}.${i}`;
          knownInstances.add(instanceName);
          ensureInstanceRecord(instances, instanceName, componentName, "rt");
        }
      } else {
        // Single unnamed instance typically uses the component name as instance prefix.
        knownInstances.add(componentName);
        ensureInstanceRecord(instances, componentName, componentName, "rt");
      }
      continue;
    }

    if (cmd === "loadusr") {
      // We don't parse loadusr flags fully yet; net/setp usage will still discover instances.
      if (tokens.length >= 2) {
        const programName = tokens[tokens.length - 1];
        if (programName) {
          warnings.push(
            `Line ${line.line}: loadusr parsing is partial (program '${programName}')`,
          );
        }
      }
      continue;
    }

    if (cmd === "addf") {
      const functionName = tokens[1];
      if (!functionName) {
        warnings.push(`Line ${line.line}: addf missing function name`);
        continue;
      }
      const thread = tokens[2];
      const position = Number.parseInt(tokens[3] ?? "", 10);
      addfs.push({
        line: line.line,
        functionName,
        ...(thread ? { thread } : {}),
        ...(Number.isFinite(position) ? { position } : {}),
      });
      continue;
    }

    if (cmd === "setp") {
      const rawPath = tokens[1];
      if (!rawPath) {
        warnings.push(`Line ${line.line}: setp missing path`);
        continue;
      }
      const value = tokens.slice(2).join(" ").trim();
      const split = splitHalPath(rawPath, knownInstances);
      if (!split || !split.fieldName) {
        warnings.push(
          `Line ${line.line}: could not parse setp path '${rawPath}'`,
        );
        continue;
      }
      const record = ensureInstanceRecord(instances, split.instanceName);
      addObservedParam(record, split.fieldName, value);
      setps.push({
        line: line.line,
        rawPath,
        instanceName: split.instanceName,
        fieldName: split.fieldName,
        value,
      });
      continue;
    }

    if (cmd === "net") {
      const netName = tokens[1];
      if (!netName) {
        warnings.push(`Line ${line.line}: net missing signal name`);
        continue;
      }
      const endpointTokens = tokens.slice(2);
      const endpoints: HalImportNet["endpoints"] = [];
      const endpointRoles: Array<PinDirection | null> = [];
      let arrowRole: PinDirection | null = null;

      for (const token of endpointTokens) {
        if (isArrowToken(token)) {
          arrowRole = token === "=>" ? "in" : token === "<=" ? "out" : "io";
          continue;
        }
        if (!looksLikeHalPinPath(token)) continue;
        const split = splitHalPath(token, knownInstances);
        if (!split || !split.fieldName) {
          warnings.push(
            `Line ${line.line}: could not parse net pin '${token}'`,
          );
          continue;
        }
        endpoints.push({
          rawPath: token,
          instanceName: split.instanceName,
          pinName: split.fieldName,
        });
        endpointRoles.push(arrowRole);
        ensureInstanceRecord(instances, split.instanceName).pinNames.add(
          split.fieldName,
        );
      }

      for (let i = 0; i < endpoints.length; i += 1) {
        const endpoint = endpoints[i];
        const explicit = endpointRoles[i];
        const direction =
          explicit ?? (endpoints.length <= 1 ? "io" : i === 0 ? "out" : "in");
        const record = ensureInstanceRecord(instances, endpoint.instanceName);
        addObservedPin(record, endpoint.pinName, direction);
      }

      nets.push({ line: line.line, name: netName, endpoints });
    }
  }

  const groupsByName = new Map<string, MutableInstance[]>();
  for (const instance of instances.values()) {
    const componentName =
      instance.componentNameHint ?? inferComponentName(instance.instanceName);
    const list = groupsByName.get(componentName);
    if (list) list.push(instance);
    else groupsByName.set(componentName, [instance]);
  }

  const groupIdsByName = new Map<string, string>();
  const usedGroupIds = new Set<string>();
  for (const name of [...groupsByName.keys()].sort((a, b) =>
    a.localeCompare(b),
  )) {
    let id = `halcmp:${slugify(name)}`;
    let suffix = 2;
    while (usedGroupIds.has(id)) {
      id = `halcmp:${slugify(name)}-${suffix}`;
      suffix += 1;
    }
    usedGroupIds.add(id);
    groupIdsByName.set(name, id);
  }

  const componentGroups: HalImportComponentGroup[] = [...groupsByName.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([componentName, groupInstances]) => {
      const runtimeHint = groupInstances.some(
        (item) => item.runtimeHint === "rt",
      )
        ? "rt"
        : groupInstances.some((item) => item.runtimeHint === "userspace")
          ? "userspace"
          : "unknown";

      const pinMap = new Map<string, HalImportObservedPin>();
      const paramMap = new Map<string, HalImportObservedParam>();

      const instancesOut = groupInstances
        .sort((a, b) => a.instanceName.localeCompare(b.instanceName))
        .map((item) => {
          for (const pin of item.pins.values()) {
            const existing = pinMap.get(pin.name);
            const directions = [...pin.directionHints].sort();
            if (existing) {
              for (const direction of directions) {
                if (!existing.observedDirections.includes(direction)) {
                  existing.observedDirections.push(direction);
                }
              }
            } else {
              pinMap.set(pin.name, {
                name: pin.name,
                observedDirections: directions,
              });
            }
          }
          for (const param of item.params.values()) {
            const existing = paramMap.get(param.name);
            if (existing) {
              for (const sample of param.sampleValues) {
                if (!existing.sampleValues.includes(sample)) {
                  existing.sampleValues.push(sample);
                }
              }
            } else {
              paramMap.set(param.name, {
                name: param.name,
                sampleValues: [...param.sampleValues],
              });
            }
          }
          return {
            instanceName: item.instanceName,
            componentGroupId:
              groupIdsByName.get(componentName) ?? componentName,
            pinNames: [...item.pinNames].sort((a, b) => a.localeCompare(b)),
            paramValues: { ...item.paramValues },
          };
        });

      return {
        id: groupIdsByName.get(componentName) ?? componentName,
        inferredHalComponentName: componentName,
        runtimeHint,
        instances: instancesOut,
        pins: [...pinMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
        params: [...paramMap.values()].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      };
    });

  const groupIdByInstanceName = new Map<string, string>();
  for (const group of componentGroups) {
    for (const instance of group.instances) {
      groupIdByInstanceName.set(instance.instanceName, group.id);
    }
  }

  for (const net of nets) {
    for (const endpoint of net.endpoints) {
      const groupId = groupIdByInstanceName.get(endpoint.instanceName);
      if (!groupId) {
        warnings.push(
          `Line ${net.line}: endpoint '${endpoint.rawPath}' was not assigned to a component group`,
        );
      }
    }
  }

  return {
    parser: "nohal-hal-v1",
    ...(sourcePath ? { sourcePath, sourceFileName: basename(sourcePath) } : {}),
    lineCount: text.replace(/\r\n/g, "\n").split("\n").length,
    componentGroups,
    nets,
    setps,
    addfs,
    warnings,
  };
}

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function suggestHalImportLinks(
  draft: HalImportDraft,
  componentStore: ComponentStore,
): HalImportLinkSuggestion[] {
  const storeEntries = Object.values(componentStore.components);
  return draft.componentGroups.map((group) => {
    const exact = storeEntries
      .filter(
        (entry) =>
          entry.parsed.halComponentName === group.inferredHalComponentName,
      )
      .sort((a, b) => a.parsed.id.localeCompare(b.parsed.id));
    if (exact.length > 0) {
      return {
        groupId: group.id,
        selection: {
          groupId: group.id,
          mode: "store",
          componentId: exact[0].componentId,
        },
        reason: "exact halComponentName match",
      };
    }

    const normalized = normalizeName(group.inferredHalComponentName);
    const loose = storeEntries
      .filter(
        (entry) => normalizeName(entry.parsed.halComponentName) === normalized,
      )
      .sort((a, b) =>
        a.parsed.halComponentName.localeCompare(b.parsed.halComponentName),
      );
    if (loose.length > 0) {
      return {
        groupId: group.id,
        selection: {
          groupId: group.id,
          mode: "store",
          componentId: loose[0].componentId,
        },
        reason: "normalized halComponentName match",
      };
    }

    return {
      groupId: group.id,
      selection: { groupId: group.id, mode: "project-local" },
      reason: "no store match",
    };
  });
}

function parseValueType(value: string): HalValueType {
  const v = value.trim().toLowerCase();
  if (!v) return "float";
  if (v === "true" || v === "false") return "bit";
  if (/^[+-]?\d+$/.test(v)) {
    const n = Number.parseInt(v, 10);
    if (n >= 0) return "u32";
    return "s32";
  }
  if (
    /^[+-]?\d*\.\d+([eE][+-]?\d+)?$/.test(v) ||
    /^[+-]?\d+[eE][+-]?\d+$/.test(v)
  ) {
    return "float";
  }
  return "float";
}

function mergeDirections(values: Array<PinDirection>): PinDirection {
  const set = new Set(values);
  if (set.size === 0) return "io";
  if (set.size === 1) return values[0] ?? "io";
  if (set.has("io")) return "io";
  return "io";
}

function uniqueKeyForNames(
  names: string[],
  fallbackPrefix: string,
): Record<string, string> {
  const used = new Set<string>();
  const out: Record<string, string> = {};
  for (const name of names) {
    let key = safeKey(name);
    if (!key) key = fallbackPrefix;
    let candidate = key;
    let idx = 2;
    while (used.has(candidate)) {
      candidate = `${key}_${idx}`;
      idx += 1;
    }
    used.add(candidate);
    out[name] = candidate;
  }
  return out;
}

function chooseLocalComponentId(
  preferredName: string,
  used: Set<string>,
): string {
  let id = `halimport:${slugify(preferredName)}`;
  let idx = 2;
  while (used.has(id)) {
    id = `halimport:${slugify(preferredName)}-${idx}`;
    idx += 1;
  }
  used.add(id);
  return id;
}

export function buildProjectFromHalImport(
  options: HalImportBuildOptions,
): HalImportBuildResult {
  const { draft, componentStore, linkSelections } = options;
  const warnings = [...draft.warnings];
  const fileBase =
    options.projectName?.trim() ||
    (draft.sourceFileName
      ? stripExtension(draft.sourceFileName)
      : "Imported HAL");
  const project = createEmptyProject(fileBase || "Imported HAL");
  project.name = fileBase || "Imported HAL";

  const rootSheet = project.sheets[project.rootSheetId];
  rootSheet.name = "Top";
  rootSheet.nodes = [];
  rootSheet.labels = [];
  rootSheet.labelAnchors = [];
  rootSheet.directConnections = [];
  rootSheet.ports = [];
  delete rootSheet.hal;

  const _groupById = new Map(
    draft.componentGroups.map((group) => [group.id, group]),
  );
  const groupByInstance = new Map<string, HalImportComponentGroup>();
  for (const group of draft.componentGroups) {
    for (const instance of group.instances) {
      groupByInstance.set(instance.instanceName, group);
    }
  }

  const storeComponentsById = new Map(
    Object.values(componentStore.components).map((entry) => [
      entry.componentId,
      entry.parsed,
    ]),
  );

  const selections = new Map<string, HalImportLinkSelection>();
  for (const group of draft.componentGroups) {
    const selection = linkSelections[group.id];
    selections.set(
      group.id,
      selection ?? { groupId: group.id, mode: "project-local" },
    );
  }

  const mappedStorePinTypes = new Map<string, HalValueType[]>();
  for (const net of draft.nets) {
    const knownTypes: HalValueType[] = [];
    for (const endpoint of net.endpoints) {
      const group = groupByInstance.get(endpoint.instanceName);
      if (!group) continue;
      const sel = selections.get(group.id);
      if (!sel || sel.mode !== "store") continue;
      const comp = storeComponentsById.get(sel.componentId);
      const pin = comp?.pins.find((item) => item.name === endpoint.pinName);
      if (pin) knownTypes.push(pin.type);
    }
    if (knownTypes.length === 0) continue;
    for (const endpoint of net.endpoints) {
      const group = groupByInstance.get(endpoint.instanceName);
      if (!group) continue;
      const sel = selections.get(group.id);
      if (sel?.mode === "store") continue;
      const key = `${group.id}::${endpoint.pinName}`;
      const list = mappedStorePinTypes.get(key);
      if (list) list.push(...knownTypes);
      else mappedStorePinTypes.set(key, [...knownTypes]);
    }
  }

  const usedProjectComponentIds = new Set<string>(
    Object.keys(project.library.components),
  );
  const resolvedComponentByGroupId = new Map<string, ComponentDefinition>();
  const resolvedComponentIdByGroupId = new Map<string, string>();

  for (const group of draft.componentGroups) {
    const selection = selections.get(group.id);
    if (selection?.mode === "store") {
      const comp = storeComponentsById.get(selection.componentId);
      if (comp) {
        resolvedComponentByGroupId.set(group.id, comp);
        resolvedComponentIdByGroupId.set(group.id, selection.componentId);
        project.library.components[selection.componentId] = comp;
        continue;
      }
      warnings.push(
        `Selected store component '${selection.componentId}' for '${group.inferredHalComponentName}' was not found; generating project-local component`,
      );
    }

    const pinNames = group.pins.map((pin) => pin.name);
    const pinNameSet = new Set(pinNames);
    const pinKeys = uniqueKeyForNames(pinNames, "pin");
    const filteredGroupParams = group.params.filter((param) => {
      if (!pinNameSet.has(param.name)) return true;
      warnings.push(
        `Treating '${group.inferredHalComponentName}.${param.name}' as pin-initial-value target during import (not generating duplicate param)`,
      );
      return false;
    });
    const paramNames = filteredGroupParams.map((param) => param.name);
    const paramKeys = uniqueKeyForNames(paramNames, "param");

    const pins: ComponentPinDefinition[] = group.pins.map((pin) => {
      const typeHints =
        mappedStorePinTypes.get(`${group.id}::${pin.name}`) ?? [];
      const uniqueTypes = Array.from(new Set(typeHints));
      let type: HalValueType = "bit";
      if (uniqueTypes.length === 1) type = uniqueTypes[0] ?? "bit";
      else if (uniqueTypes.length > 1) {
        warnings.push(
          `Type inference conflict for ${group.inferredHalComponentName}.${pin.name}: ${uniqueTypes.join(", ")} (defaulting to bit)`,
        );
      }
      return {
        key: pinKeys[pin.name] ?? safeKey(pin.name),
        name: pin.name,
        direction: mergeDirections(pin.observedDirections),
        type,
      };
    });

    const params = filteredGroupParams.map((param) => {
      const inferredType =
        param.sampleValues.length > 0
          ? parseValueType(
              param.sampleValues[param.sampleValues.length - 1] ?? "",
            )
          : "float";
      return {
        key: paramKeys[param.name] ?? safeKey(param.name),
        name: param.name,
        direction: "rw" as const,
        type: inferredType,
        ...(param.sampleValues.length > 0
          ? {
              defaultValue:
                param.sampleValues[param.sampleValues.length - 1] ?? "",
            }
          : {}),
      };
    });

    const localId = chooseLocalComponentId(
      group.inferredHalComponentName,
      usedProjectComponentIds,
    );
    const generated: ComponentDefinition = {
      id: localId,
      name: group.inferredHalComponentName,
      halComponentName: group.inferredHalComponentName,
      source: "manual",
      runtime: { kind: group.runtimeHint },
      pins,
      params,
      docs: {
        description:
          "Generated from imported HAL file (project-local component)",
      },
    };
    project.library.components[localId] = generated;
    resolvedComponentByGroupId.set(group.id, generated);
    resolvedComponentIdByGroupId.set(group.id, localId);
  }

  const nodeIdByInstanceName = new Map<string, string>();
  const pinKeyByInstanceAndPinName = new Map<string, string>();
  const pinDirectionByInstanceAndPinName = new Map<string, PinDirection>();

  const allInstances = draft.componentGroups
    .flatMap((group) =>
      group.instances.map((instance) => ({ group, instance })),
    )
    .sort((a, b) =>
      a.instance.instanceName.localeCompare(b.instance.instanceName),
    );

  allInstances.forEach(({ group, instance }, index) => {
    const componentId = resolvedComponentIdByGroupId.get(group.id);
    const component = resolvedComponentByGroupId.get(group.id);
    if (!componentId || !component) {
      warnings.push(
        `Missing resolved component for instance '${instance.instanceName}'`,
      );
      return;
    }

    const paramNameToDef = new Map(
      component.params.map((param) => [param.name, param]),
    );
    const pinNameToDef = new Map(component.pins.map((pin) => [pin.name, pin]));
    const paramValues: Record<string, string> = {};
    const pinInitialValues: Record<string, string> = {};
    for (const [name, value] of Object.entries(instance.paramValues)) {
      const param = paramNameToDef.get(name);
      if (param) {
        paramValues[param.key] = value;
        continue;
      }
      const pin = pinNameToDef.get(name);
      if (pin) {
        pinInitialValues[pin.key] = value;
        continue;
      }
      warnings.push(
        `Ignoring setp '${instance.instanceName}.${name}' because '${component.halComponentName}' has no matching param or pin '${name}'`,
      );
    }

    const nodeId = createId("node");
    rootSheet.nodes.push({
      id: nodeId,
      kind: "component",
      componentId,
      instanceName: instance.instanceName,
      position: {
        x: 120 + (index % 4) * 300,
        y: 120 + Math.floor(index / 4) * 200,
      },
      paramValues,
      ...(Object.keys(pinInitialValues).length > 0 ? { pinInitialValues } : {}),
    });
    nodeIdByInstanceName.set(instance.instanceName, nodeId);

    for (const pin of component.pins) {
      const pinRefKey = `${instance.instanceName}::${pin.name}`;
      pinKeyByInstanceAndPinName.set(pinRefKey, pin.key);
      pinDirectionByInstanceAndPinName.set(pinRefKey, pin.direction);
    }
  });

  const anchoredNetEndpoints = new Set<string>();
  const directConnectionPairs = new Set<string>();
  const labelSlotByNodeSide = new Map<string, number>();
  const netNameUsageCount = new Map<string, number>();
  for (const net of draft.nets) {
    netNameUsageCount.set(net.name, (netNameUsageCount.get(net.name) ?? 0) + 1);
  }
  const nodePosById = new Map(
    rootSheet.nodes
      .filter((node) => node.kind === "component")
      .map((node) => [node.id, node.position]),
  );

  const nextImportedLabelPosition = (
    nodeId: string,
    direction: PinDirection | undefined,
    netIndex: number,
    endpointIndex: number,
  ) => {
    const pos = nodePosById.get(nodeId);
    if (!pos) {
      return {
        x: 90 + (netIndex % 6) * 220,
        y: 80 + Math.floor(netIndex / 6) * 70 + endpointIndex * 4,
      };
    }
    const side =
      direction === "out" ? "right" : direction === "in" ? "left" : "bottom";
    const slotKey = `${nodeId}:${side}`;
    const slot = labelSlotByNodeSide.get(slotKey) ?? 0;
    labelSlotByNodeSide.set(slotKey, slot + 1);
    if (side === "left") {
      return { x: pos.x - 120, y: pos.y + 44 + slot * 28 };
    }
    if (side === "right") {
      return { x: pos.x + 252, y: pos.y + 44 + slot * 28 };
    }
    return {
      x: pos.x + 20 + (slot % 4) * 58,
      y: pos.y + 154 + Math.floor(slot / 4) * 28,
    };
  };

  const directionsCompatibleForDirectImport = (
    a: PinDirection | undefined,
    b: PinDirection | undefined,
  ) => {
    if (!a || !b) return false;
    if (a === "in" && b === "in") return false;
    if (a === "out" && b === "out") return false;
    return true;
  };

  draft.nets.forEach((net, index) => {
    if (net.endpoints.length === 0) {
      warnings.push(
        `Line ${net.line}: net '${net.name}' has no parsed endpoints`,
      );
      return;
    }
    const resolvedEndpoints: Array<{
      nodeId: string;
      pinKey: string;
      pinRefKey: string;
      direction: PinDirection | undefined;
    }> = [];

    for (const endpoint of net.endpoints) {
      const nodeId = nodeIdByInstanceName.get(endpoint.instanceName);
      if (!nodeId) {
        warnings.push(
          `Line ${net.line}: missing node for endpoint '${endpoint.rawPath}'`,
        );
        continue;
      }
      const pinKey = pinKeyByInstanceAndPinName.get(
        `${endpoint.instanceName}::${endpoint.pinName}`,
      );
      if (!pinKey) {
        warnings.push(
          `Line ${net.line}: component pin '${endpoint.pinName}' not found on '${endpoint.instanceName}'`,
        );
        continue;
      }
      const pinRefKey = `${endpoint.instanceName}::${endpoint.pinName}`;
      const endpointDedupeKey = `${net.name}::${nodeId}::${pinKey}`;
      if (
        !resolvedEndpoints.some(
          (item) => item.nodeId === nodeId && item.pinKey === pinKey,
        )
      ) {
        resolvedEndpoints.push({
          nodeId,
          pinKey,
          pinRefKey,
          direction: pinDirectionByInstanceAndPinName.get(pinRefKey),
        });
      }
      const dedupeKey = endpointDedupeKey;
      if (anchoredNetEndpoints.has(dedupeKey)) continue;
    }

    const singleLineNet = (netNameUsageCount.get(net.name) ?? 0) === 1;
    const canUseDirectConnection =
      singleLineNet &&
      resolvedEndpoints.length === 2 &&
      directionsCompatibleForDirectImport(
        resolvedEndpoints[0]?.direction,
        resolvedEndpoints[1]?.direction,
      );

    if (canUseDirectConnection) {
      const a = resolvedEndpoints[0];
      const b = resolvedEndpoints[1];
      if (!a || !b) return;
      const pairKeyA = `${a.nodeId}:${a.pinKey}`;
      const pairKeyB = `${b.nodeId}:${b.pinKey}`;
      const pairKey =
        pairKeyA < pairKeyB
          ? `${pairKeyA}|${pairKeyB}`
          : `${pairKeyB}|${pairKeyA}`;
      if (!directConnectionPairs.has(pairKey)) {
        directConnectionPairs.add(pairKey);
        rootSheet.directConnections.push({
          id: createId("conn"),
          a: { kind: "node-pin", nodeId: a.nodeId, pinKey: a.pinKey },
          b: { kind: "node-pin", nodeId: b.nodeId, pinKey: b.pinKey },
        });
      }
      return;
    }

    for (const [endpointIndex, item] of resolvedEndpoints.entries()) {
      const dedupeKey = `${net.name}::${item.nodeId}::${item.pinKey}`;
      if (anchoredNetEndpoints.has(dedupeKey)) continue;
      anchoredNetEndpoints.add(dedupeKey);
      const labelId = createId("label");
      rootSheet.labels.push({
        id: labelId,
        name: net.name,
        scope: "global",
        position: nextImportedLabelPosition(
          item.nodeId,
          item.direction,
          index,
          endpointIndex,
        ),
      });
      rootSheet.labelAnchors.push({
        id: createId("anchor"),
        labelId,
        endpoint: {
          kind: "node-pin",
          nodeId: item.nodeId,
          pinKey: item.pinKey,
        },
      });
    }
  });

  const addfQueue: string[] = [];
  const seenQueueNodes = new Set<string>();
  for (const addf of draft.addfs) {
    const nodeId = nodeIdByInstanceName.get(addf.functionName);
    if (!nodeId) continue;
    if (seenQueueNodes.has(nodeId)) continue;
    seenQueueNodes.add(nodeId);
    addfQueue.push(nodeId);
  }
  if (addfQueue.length > 0) {
    rootSheet.hal = { ...(rootSheet.hal ?? {}), addfQueue };
  }

  return { project, warnings };
}
