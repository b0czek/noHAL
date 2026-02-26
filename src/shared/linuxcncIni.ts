import type {
  LinuxCncIniDocument,
  LinuxCncIniHalReference,
  LinuxCncIniSection,
} from "./types";

function basename(filePath: string): string {
  const parts = filePath.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? filePath;
}

function stripInlineComment(value: string): string {
  let out = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (quote) {
      out += ch;
      if (ch === quote && value[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "#" || ch === ";") break;
    out += ch;
  }
  return out.trim();
}

function tokenizeIniCommand(value: string): string[] {
  const matches = value.match(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|\S+/g) ?? [];
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

export function parseLinuxCncIni(
  text: string,
  sourcePath?: string,
): LinuxCncIniDocument {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const sections: LinuxCncIniSection[] = [];
  const warnings: string[] = [];
  let currentSection: LinuxCncIniSection | null = null;

  for (let idx = 0; idx < lines.length; idx += 1) {
    const lineNo = idx + 1;
    const raw = lines[idx] ?? "";
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#") || trimmed.startsWith(";")) continue;

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const name = trimmed.slice(1, -1).trim();
      if (!name) {
        warnings.push(`Line ${lineNo}: empty section header`);
        currentSection = null;
        continue;
      }
      currentSection = { name, entries: [], line: lineNo };
      sections.push(currentSection);
      continue;
    }

    const eq = raw.indexOf("=");
    if (eq < 0) {
      warnings.push(`Line ${lineNo}: expected KEY = VALUE`);
      continue;
    }
    if (!currentSection) {
      warnings.push(`Line ${lineNo}: key/value appears before any section`);
      continue;
    }

    const key = raw.slice(0, eq).trim();
    if (!key) {
      warnings.push(`Line ${lineNo}: empty key`);
      continue;
    }
    const value = stripInlineComment(raw.slice(eq + 1));
    currentSection.entries.push({ key, value, line: lineNo });
  }

  return {
    parser: "nohal-ini-v1",
    ...(sourcePath ? { sourcePath, sourceFileName: basename(sourcePath) } : {}),
    lineCount: lines.length,
    sections,
    warnings,
  };
}

export function collectLinuxCncHalReferences(
  ini: LinuxCncIniDocument,
): LinuxCncIniHalReference[] {
  const refs: LinuxCncIniHalReference[] = [];
  for (const section of ini.sections) {
    if (section.name.toUpperCase() !== "HAL") continue;
    for (const entry of section.entries) {
      const keyUpper = entry.key.toUpperCase();
      const kind =
        keyUpper === "HALFILE"
          ? "HALFILE"
          : keyUpper === "POSTGUI_HALFILE"
            ? "POSTGUI_HALFILE"
            : keyUpper === "SHUTDOWN"
              ? "SHUTDOWN"
              : null;
      if (!kind) continue;
      const tokens = tokenizeIniCommand(entry.value);
      const fileToken = tokens[0];
      if (!fileToken) continue;
      refs.push({
        kind,
        sectionName: section.name,
        key: entry.key,
        rawValue: entry.value,
        fileToken,
        args: tokens.slice(1),
        line: entry.line,
      });
    }
  }
  return refs;
}
