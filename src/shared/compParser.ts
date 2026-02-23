import path from "node:path";
import { safeKey, slugify } from "./id";
import type {
  ComponentDefinition,
  ComponentParamDefinition,
  ComponentPinDefinition,
  HalValueType,
  ImportedComponentDefinition,
  ParamDirection,
  PinDirection
} from "./types";

type CompDocKind =
  | "component"
  | "description"
  | "author"
  | "license"
  | "notes"
  | "examples"
  | "seeAlso";

interface TokenizedStatement {
  raw: string;
  tokens: string[];
}

const HAL_TYPES = new Set(["float", "bit", "signed", "unsigned", "u32", "s32", "u64", "s64", "port"]);

function normalizeType(value: string): HalValueType {
  if (value === "signed") return "s32";
  if (value === "unsigned") return "u32";
  if (value === "float" || value === "bit" || value === "u32" || value === "s32" || value === "u64" || value === "s64" || value === "port") {
    return value;
  }
  throw new Error(`Unsupported HAL type: ${value}`);
}

function splitCompHeader(text: string): { header: string; body: string } {
  const idx = text.indexOf(";;");
  if (idx < 0) {
    return { header: text, body: "" };
  }
  return {
    header: text.slice(0, idx),
    body: text.slice(idx + 2)
  };
}

function scanString(input: string, start: number): { token: string; end: number } {
  if (input.startsWith('r"""', start) || input.startsWith('R"""', start)) {
    const open = input.slice(start, start + 4);
    const end = input.indexOf('"""', start + 4);
    if (end < 0) throw new Error("Unterminated raw triple string");
    return { token: input.slice(start, end + 3), end: end + 3 };
  }
  if (input.startsWith('"""', start)) {
    let i = start + 3;
    while (i < input.length) {
      const hit = input.indexOf('"""', i);
      if (hit < 0) break;
      return { token: input.slice(start, hit + 3), end: hit + 3 };
    }
    throw new Error("Unterminated triple string");
  }
  if (input[start] !== "\"") {
    throw new Error("scanString called at non-string location");
  }
  let i = start + 1;
  while (i < input.length) {
    const ch = input[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "\"") {
      return { token: input.slice(start, i + 1), end: i + 1 };
    }
    i += 1;
  }
  throw new Error("Unterminated string");
}

function collectStatements(header: string): string[] {
  const statements: string[] = [];
  let i = 0;
  let current = "";

  while (i < header.length) {
    const ch = header[i];
    const next = header[i + 1] ?? "";

    if (ch === "/" && next === "/") {
      i += 2;
      while (i < header.length && header[i] !== "\n") i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      const end = header.indexOf("*/", i + 2);
      if (end < 0) throw new Error("Unterminated block comment in .comp header");
      i = end + 2;
      continue;
    }

    if (ch === "\""
      || header.startsWith('"""', i)
      || header.startsWith('r"""', i)
      || header.startsWith('R"""', i)) {
      const token = scanString(header, i);
      current += token.token;
      i = token.end;
      continue;
    }

    if (ch === ";") {
      const stmt = current.trim();
      if (stmt) statements.push(stmt);
      current = "";
      i += 1;
      continue;
    }

    current += ch;
    i += 1;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function tokenizeStatement(raw: string): TokenizedStatement {
  const tokens: string[] = [];
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (raw.startsWith('r"""', i) || raw.startsWith('R"""', i) || raw.startsWith('"""', i) || ch === "\"") {
      const token = scanString(raw, i);
      tokens.push(token.token);
      i = token.end;
      continue;
    }
    if (ch === "[") {
      let depth = 1;
      let j = i + 1;
      while (j < raw.length && depth > 0) {
        if (raw[j] === "[") depth += 1;
        else if (raw[j] === "]") depth -= 1;
        else if (raw[j] === "\"") {
          const s = scanString(raw, j);
          j = s.end;
          continue;
        }
        j += 1;
      }
      if (depth !== 0) throw new Error(`Unterminated [] expression in statement: ${raw}`);
      tokens.push(raw.slice(i, j));
      i = j;
      continue;
    }
    if (ch === "=") {
      tokens.push("=");
      i += 1;
      continue;
    }
    let j = i;
    while (j < raw.length && !/\s/.test(raw[j]) && raw[j] !== "=") j += 1;
    tokens.push(raw.slice(i, j));
    i = j;
  }
  return { raw, tokens };
}

function decodeCompString(token: string): string {
  if ((token.startsWith('r"""') || token.startsWith('R"""')) && token.endsWith('"""')) {
    return token.slice(4, -3);
  }
  if (token.startsWith('"""') && token.endsWith('"""')) {
    return token.slice(3, -3);
  }
  if (token.startsWith("\"") && token.endsWith("\"")) {
    return JSON.parse(token);
  }
  return token;
}

function parseArrayToken(token: string): { len?: number; expr?: string } {
  if (!token.startsWith("[") || !token.endsWith("]")) return {};
  const inner = token.slice(1, -1).trim();
  if (!inner) return {};
  const [lenPart, exprPart] = inner.split(":");
  const len = Number.parseInt((lenPart ?? "").trim(), 10);
  return {
    len: Number.isFinite(len) ? len : undefined,
    expr: exprPart?.trim() || undefined
  };
}

function parsePinOrParam(
  stmt: TokenizedStatement,
  kind: "pin" | "param",
  warnings: string[]
): ComponentPinDefinition | ComponentParamDefinition {
  const { tokens, raw } = stmt;
  if (tokens.length < 4) throw new Error(`Malformed ${kind} declaration: ${raw}`);

  const direction = tokens[1] as PinDirection | ParamDirection;
  const typeToken = tokens[2];
  const name = tokens[3];

  if (!HAL_TYPES.has(typeToken)) throw new Error(`Unknown ${kind} type in: ${raw}`);
  const type = normalizeType(typeToken);

  let idx = 4;
  let arrayLen: number | undefined;
  let arrayExpr: string | undefined;
  let defaultValue: string | undefined;

  if (tokens[idx]?.startsWith("[")) {
    const parsedArray = parseArrayToken(tokens[idx]);
    arrayLen = parsedArray.len;
    arrayExpr = parsedArray.expr;
    idx += 1;
  }

  if (tokens[idx] === "=") {
    defaultValue = tokens[idx + 1];
    idx += 2;
  }

  if (tokens[idx] === "if") {
    idx += 1;
    while (idx < tokens.length && !(tokens[idx].startsWith("\"") || tokens[idx].includes('"""'))) {
      idx += 1;
    }
  }

  let doc: string | undefined;
  if (idx < tokens.length) {
    const maybeDoc = tokens.slice(idx).find((token) => token.startsWith("\"") || token.includes('"""'));
    if (maybeDoc) doc = decodeCompString(maybeDoc);
  }

  if (name.includes("#") && arrayLen === undefined) {
    warnings.push(`${kind} '${name}' contains '#' but has no explicit array length`);
  }

  const common = {
    key: safeKey(name),
    name,
    type,
    doc,
    arrayLen,
    arrayExpr,
    defaultValue
  };

  if (kind === "pin") {
    return {
      ...common,
      direction: direction as PinDirection
    };
  }
  return {
    ...common,
    direction: direction as ParamDirection
  };
}

function parseDocStatement(tokens: string[]): { key: CompDocKind; value: string } | null {
  if (tokens.length < 2) return null;
  const keyMap: Record<string, CompDocKind> = {
    component: "component",
    description: "description",
    author: "author",
    license: "license",
    notes: "notes",
    examples: "examples",
    see_also: "seeAlso"
  };
  const key = keyMap[tokens[0]];
  if (!key) return null;
  const stringToken = tokens.find((token, index) => index > 0 && (token.startsWith("\"") || token.includes('"""')));
  if (!stringToken) return null;
  return { key, value: decodeCompString(stringToken) };
}

function toComponentId(halComponentName: string, filePath?: string): string {
  const base = filePath ? path.basename(filePath, ".comp") : halComponentName;
  return `comp:${slugify(base)}:${slugify(halComponentName)}`;
}

export function parseCompComponentDefinition(text: string, filePath?: string): ImportedComponentDefinition {
  const { header } = splitCompHeader(text);
  const statements = collectStatements(header).map(tokenizeStatement);
  const warnings: string[] = [];
  const pins: ComponentPinDefinition[] = [];
  const params: ComponentParamDefinition[] = [];
  const docs: ComponentDefinition["docs"] = {};
  const runtimeOptions: Record<string, string | number | boolean> = {};
  let componentName: string | null = null;

  for (const stmt of statements) {
    const [head] = stmt.tokens;
    if (!head) continue;

    if (head === "component") {
      if (stmt.tokens.length < 2) throw new Error(`Malformed component declaration: ${stmt.raw}`);
      componentName = stmt.tokens[1];
      const docToken = stmt.tokens.find((token, idx) => idx > 1 && (token.startsWith("\"") || token.includes('"""')));
      if (docToken) docs.component = decodeCompString(docToken);
      continue;
    }

    if (head === "pin") {
      pins.push(parsePinOrParam(stmt, "pin", warnings) as ComponentPinDefinition);
      continue;
    }

    if (head === "param") {
      params.push(parsePinOrParam(stmt, "param", warnings) as ComponentParamDefinition);
      continue;
    }

    if (head === "option") {
      const key = stmt.tokens[1];
      if (key) {
        const rawValue = stmt.tokens[2];
        if (rawValue === undefined) runtimeOptions[key] = true;
        else if (rawValue === "yes" || rawValue === "true" || rawValue === "TRUE") runtimeOptions[key] = true;
        else if (rawValue === "no" || rawValue === "false" || rawValue === "FALSE") runtimeOptions[key] = false;
        else if (/^[+-]?\d+$/.test(rawValue)) runtimeOptions[key] = Number.parseInt(rawValue, 10);
        else runtimeOptions[key] = rawValue;
      }
      continue;
    }

    const doc = parseDocStatement(stmt.tokens);
    if (doc) {
      docs[doc.key] = doc.value;
      continue;
    }
  }

  if (!componentName) {
    const fallback = filePath ? path.basename(filePath, path.extname(filePath)) : "component";
    componentName = fallback;
    warnings.push("No component declaration found before ';;'; using filename as component name");
  }

  const finalComponentName = componentName;

  return {
    id: toComponentId(finalComponentName, filePath),
    name: finalComponentName,
    halComponentName: finalComponentName,
    source: "comp",
    sourcePath: filePath,
    docs,
    pins,
    params,
    runtime: {
      kind: runtimeOptions.userspace ? "userspace" : "unknown",
      options: runtimeOptions
    },
    parseMeta: {
      parser: "nohal-comp-v1",
      warnings,
      rawHeader: header
    }
  };
}
