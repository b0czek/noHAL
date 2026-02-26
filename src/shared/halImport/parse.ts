import { slugify } from "../id";
import type {
  HalImportComponentGroup,
  HalImportDraft,
  HalImportNet,
  HalImportObservedParam,
  HalImportObservedPin,
  PinDirection,
} from "../types";

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

  const segments = rawTarget.split(".");
  if (segments.length === 0 || !segments[0]) return null;
  if (segments.length === 1) {
    return { instanceName: rawTarget };
  }
  if (segments.length === 2 && /^\d+$/.test(segments[1] ?? "")) {
    return { instanceName: rawTarget };
  }
  if (segments.length >= 3 && /^\d+$/.test(segments[1] ?? "")) {
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
    const distinct = [...new Set(explicitNames)];
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
  let motmodDraft: HalImportDraft["motmod"] | undefined;

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
      if (componentName === "motmod") {
        const parseIntArg = (key: string): number | undefined => {
          const value = Number.parseInt(args[key] ?? "", 10);
          return Number.isFinite(value) ? value : undefined;
        };
        const numJoints = parseIntArg("num_joints");
        const numDio = parseIntArg("num_dio");
        const numAio = parseIntArg("num_aio");
        const numSpindles = parseIntArg("num_spindles");
        const numMiscError = parseIntArg("num_misc_error");
        const trajPeriodNs = parseIntArg("traj_period_nsec");
        motmodDraft = {
          ...(motmodDraft ?? {}),
          ...(numJoints !== undefined ? { numJoints } : {}),
          ...(numDio !== undefined ? { numDio } : {}),
          ...(numAio !== undefined ? { numAio } : {}),
          ...(numSpindles !== undefined ? { numSpindles } : {}),
          ...(numMiscError !== undefined ? { numMiscError } : {}),
          ...(trajPeriodNs !== undefined ? { trajPeriodNs } : {}),
        };
      }
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
      const parsed = inferLoadusrProgramAndArgs(tokens);
      for (const warning of parsed.warnings) {
        warnings.push(`Line ${line.line}: ${warning}`);
      }
      if (!parsed.programToken) continue;

      const named = inferLoadusrInstanceName(
        parsed.programToken,
        parsed.programArgs,
      );
      for (const warning of named.warnings) {
        warnings.push(`Line ${line.line}: ${warning}`);
      }

      const instanceName = parsed.waitForName ?? named.instanceName;
      if (
        parsed.waitForName &&
        named.explicitName &&
        parsed.waitForName !== named.explicitName
      ) {
        warnings.push(
          `Line ${line.line}: loadusr -Wn name '${parsed.waitForName}' does not match component name option '${named.explicitName}'`,
        );
      }

      knownInstances.add(instanceName);
      ensureInstanceRecord(
        instances,
        instanceName,
        basename(parsed.programToken),
        "userspace",
      );
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
      const parsedTarget = splitAddfFunctionTarget(
        functionName,
        knownInstances,
      );
      addfs.push({
        line: line.line,
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
        endpointRoles.push(arrowRoleAfter);
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
    ...(motmodDraft ? { motmod: motmodDraft } : {}),
    warnings,
  };
}
