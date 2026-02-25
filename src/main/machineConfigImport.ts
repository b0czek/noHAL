import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parseHalImportDraft } from "../shared/halImport";
import {
  collectLinuxCncHalReferences,
  parseLinuxCncIni,
} from "../shared/linuxcncIni";
import type {
  LinuxCncIniDocument,
  MachineConfigHalFileSelection,
  MachineConfigHalSource,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
} from "../shared/types";

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function fileNameLower(filePath: string): string {
  return path.basename(filePath).toLowerCase();
}

function isHalPath(filePath: string): boolean {
  return filePath.toLowerCase().endsWith(".hal");
}

function normalizeMachineHalSelections(
  items: MachineConfigHalFileSelection[],
): MachineConfigHalFileSelection[] {
  const seen = new Set<string>();
  const out: MachineConfigHalFileSelection[] = [];
  for (const item of items) {
    const trimmed = item.filePath.trim();
    if (!trimmed) continue;
    const normalized = path.resolve(trimmed);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push({
      filePath: normalized,
      resolveIniSubstitutions: item.resolveIniSubstitutions !== false,
    });
  }
  return out;
}

function buildIniSubstitutionMap(
  ini: LinuxCncIniDocument,
): Map<string, string> {
  const out = new Map<string, string>();
  for (const section of ini.sections) {
    const sectionName = section.name.trim().toUpperCase();
    if (!sectionName) continue;
    for (const entry of section.entries) {
      const key = entry.key.trim().toUpperCase();
      if (!key) continue;
      out.set(`${sectionName}\u0000${key}`, entry.value);
    }
  }
  return out;
}

function resolveIniSubstitutionsInHalText(
  halText: string,
  ini: LinuxCncIniDocument,
  sourcePath: string,
): { text: string; warnings: string[] } {
  const lookup = buildIniSubstitutionMap(ini);
  const warnings: string[] = [];
  const warnedMissing = new Set<string>();
  const tokenPattern =
    /\[([^\]\r\n]+)\](?:([A-Za-z0-9_]+)|\(([A-Za-z0-9_]+)\))/g;
  const text = halText.replace(
    tokenPattern,
    (match, rawSection, rawKeyDirect, rawKeyParen) => {
      const rawKey = rawKeyDirect ?? rawKeyParen;
      const section = String(rawSection).trim().toUpperCase();
      const key = String(rawKey).trim().toUpperCase();
      const mapKey = `${section}\u0000${key}`;
      const value = lookup.get(mapKey);
      if (value !== undefined) return value;
      if (!warnedMissing.has(mapKey)) {
        warnedMissing.add(mapKey);
        warnings.push(
          `HAL file '${sourcePath}': unresolved INI substitution ${match}`,
        );
      }
      return match;
    },
  );
  return { text, warnings };
}

function defaultIniHalCandidatePath(
  iniDir: string,
  fileToken: string,
): string | null {
  if (fileToken.startsWith("LIB:")) return null;
  if (!isHalPath(fileToken)) return null;
  return path.isAbsolute(fileToken)
    ? path.resolve(fileToken)
    : path.resolve(iniDir, fileToken);
}

async function suggestResolvedHalFilesFromIni(
  iniPath: string,
  refs: MachineConfigImportSetupDraft["halReferences"],
): Promise<{ suggestedHalFilePaths: string[]; warnings: string[] }> {
  const iniDir = path.dirname(iniPath);
  const warnings: string[] = [];
  const suggestedHalFilePaths: string[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    if (ref.fileToken.startsWith("LIB:")) {
      warnings.push(
        `INI line ${ref.line}: '${ref.fileToken}' uses LIB: lookup and cannot be auto-resolved`,
      );
      continue;
    }
    if (!isHalPath(ref.fileToken)) {
      warnings.push(
        `INI line ${ref.line}: '${ref.fileToken}' is not a .hal file and will need separate support`,
      );
      continue;
    }
    const candidate = defaultIniHalCandidatePath(iniDir, ref.fileToken);
    if (!candidate || !(await fileExists(candidate))) continue;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    suggestedHalFilePaths.push(candidate);
  }

  return { suggestedHalFilePaths, warnings };
}

function pickSelectedMatchForRef(
  refFileToken: string,
  iniDir: string,
  selectedByAbs: Set<string>,
  selectedByBase: Map<string, string[]>,
): string | undefined {
  const preferred = defaultIniHalCandidatePath(iniDir, refFileToken);
  if (preferred && selectedByAbs.has(preferred)) return preferred;

  const basenameMatches = selectedByBase.get(fileNameLower(refFileToken)) ?? [];
  if (basenameMatches.length === 1) return basenameMatches[0];
  return undefined;
}

export async function parseMachineConfigImportSetupDraft(
  iniPathInput: string,
): Promise<MachineConfigImportSetupDraft> {
  const iniPath = path.resolve(iniPathInput);
  const iniText = (await readFile(iniPath)).toString("utf8");
  const ini = parseLinuxCncIni(iniText, iniPath);
  const halReferences = collectLinuxCncHalReferences(ini);
  const suggestion = await suggestResolvedHalFilesFromIni(
    iniPath,
    halReferences,
  );
  return {
    ini,
    halReferences,
    suggestedHalFilePaths: suggestion.suggestedHalFilePaths,
    warnings: [...ini.warnings, ...suggestion.warnings],
  };
}

export async function buildMachineConfigImportDraft(
  iniPathInput: string,
  selectedHalFiles: MachineConfigHalFileSelection[],
): Promise<MachineConfigImportDraft> {
  const iniPath = path.resolve(iniPathInput);
  const normalizedSelections = normalizeMachineHalSelections(selectedHalFiles);
  const normalized = normalizedSelections.map((item) => item.filePath);
  const resolveIniByPath = new Map(
    normalizedSelections.map((item) => [
      item.filePath,
      item.resolveIniSubstitutions,
    ]),
  );
  const iniText = (await readFile(iniPath)).toString("utf8");
  const ini = parseLinuxCncIni(iniText, iniPath);
  const iniDir = path.dirname(iniPath);
  const refs = collectLinuxCncHalReferences(ini);

  const selectedByAbs = new Set(normalized);
  const selectedByBase = new Map<string, string[]>();
  for (const filePath of normalized) {
    const key = fileNameLower(filePath);
    const list = selectedByBase.get(key);
    if (list) list.push(filePath);
    else selectedByBase.set(key, [filePath]);
  }

  const halSources: MachineConfigHalSource[] = [];
  const resolverWarnings: string[] = [];
  const loadedHalPaths = new Set<string>();
  const halChunks: string[] = [];

  for (const ref of refs) {
    if (ref.fileToken.startsWith("LIB:")) {
      halSources.push({
        kind: ref.kind,
        iniLine: ref.line,
        iniValue: ref.rawValue,
        requestedPath: ref.fileToken,
        status: "skipped-lib",
      });
      resolverWarnings.push(
        `INI line ${ref.line}: '${ref.fileToken}' uses LIB: lookup and was not auto-loaded`,
      );
      continue;
    }

    const ext = path.extname(ref.fileToken).toLowerCase();
    if (ext !== ".hal") {
      halSources.push({
        kind: ref.kind,
        iniLine: ref.line,
        iniValue: ref.rawValue,
        requestedPath: ref.fileToken,
        status: "skipped-non-hal",
      });
      resolverWarnings.push(
        `INI line ${ref.line}: '${ref.fileToken}' is not a .hal file (tcl/haltcl import is not implemented yet)`,
      );
      continue;
    }

    const resolvedPathCandidate = pickSelectedMatchForRef(
      ref.fileToken,
      iniDir,
      selectedByAbs,
      selectedByBase,
    );
    let resolvedPath: string | undefined;
    if (resolvedPathCandidate && (await fileExists(resolvedPathCandidate))) {
      resolvedPath = resolvedPathCandidate;
    }

    if (!resolvedPath) {
      halSources.push({
        kind: ref.kind,
        iniLine: ref.line,
        iniValue: ref.rawValue,
        requestedPath: ref.fileToken,
        status: "missing",
      });
      resolverWarnings.push(
        `INI line ${ref.line}: no selected HAL file matched '${ref.fileToken}'`,
      );
      continue;
    }

    halSources.push({
      kind: ref.kind,
      iniLine: ref.line,
      iniValue: ref.rawValue,
      requestedPath: ref.fileToken,
      resolvedPath,
      status: "loaded",
    });
  }

  for (const selectedPath of normalized) {
    if (!isHalPath(selectedPath)) {
      resolverWarnings.push(
        `Selected file is not a .hal file and was ignored: ${selectedPath}`,
      );
      continue;
    }
    if (!(await fileExists(selectedPath))) {
      resolverWarnings.push(
        `Selected HAL file does not exist: ${selectedPath}`,
      );
      continue;
    }
    if (loadedHalPaths.has(selectedPath)) continue;
    loadedHalPaths.add(selectedPath);
    let halText = (await readFile(selectedPath)).toString("utf8");
    if (resolveIniByPath.get(selectedPath)) {
      const resolved = resolveIniSubstitutionsInHalText(
        halText,
        ini,
        selectedPath,
      );
      halText = resolved.text;
      resolverWarnings.push(...resolved.warnings);
    }
    halChunks.push(
      `# noHAL import source: ${selectedPath}\n${halText.trimEnd()}\n`,
    );
  }

  const halImportDraft = parseHalImportDraft(halChunks.join("\n"), iniPath);
  halImportDraft.warnings = [...resolverWarnings, ...halImportDraft.warnings];

  return {
    machineConfig: {
      source: "imported-linuxcnc-config",
      ini,
      halSources,
    },
    halImport: halImportDraft,
    warnings: [
      ...ini.warnings,
      ...resolverWarnings,
      ...halImportDraft.warnings,
    ],
  };
}
