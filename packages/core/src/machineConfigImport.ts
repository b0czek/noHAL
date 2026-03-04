import { parseHalImportDraft } from "./halImport";
import { collectLinuxCncHalReferences, parseLinuxCncIni } from "./linuxcncIni";
import type {
  CoreIo,
  LinuxCncIniDocument,
  MachineConfigHalFileSelection,
  MachineConfigHalSource,
  MachineConfigImportDraft,
  MachineConfigImportSetupDraft,
} from "./types";

export interface MachineConfigImportApi {
  parseMachineConfigImportSetupDraft(
    iniPathInput: string,
  ): Promise<MachineConfigImportSetupDraft>;
  buildMachineConfigImportDraft(
    iniPathInput: string,
    selectedHalFiles: MachineConfigHalFileSelection[],
  ): Promise<MachineConfigImportDraft>;
}

function fileNameLower(io: CoreIo, filePath: string): string {
  return io.path.basename(filePath).toLowerCase();
}

function isHalPath(filePath: string): boolean {
  return filePath.toLowerCase().endsWith(".hal");
}

function normalizeMachineHalSelections(
  io: CoreIo,
  items: MachineConfigHalFileSelection[],
): MachineConfigHalFileSelection[] {
  const seen = new Set<string>();
  const out: MachineConfigHalFileSelection[] = [];
  for (const item of items) {
    const trimmed = item.filePath.trim();
    if (!trimmed) continue;
    const normalized = io.path.resolve(trimmed);
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
  io: CoreIo,
  iniDir: string,
  fileToken: string,
): string | null {
  if (fileToken.startsWith("LIB:")) return null;
  if (!isHalPath(fileToken)) return null;
  return io.path.isAbsolute(fileToken)
    ? io.path.resolve(fileToken)
    : io.path.resolve(iniDir, fileToken);
}

async function suggestResolvedHalFilesFromIni(
  io: CoreIo,
  iniPath: string,
  refs: MachineConfigImportSetupDraft["halReferences"],
): Promise<{ suggestedHalFilePaths: string[]; warnings: string[] }> {
  const iniDir = io.path.dirname(iniPath);
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
    const candidate = defaultIniHalCandidatePath(io, iniDir, ref.fileToken);
    if (!candidate || !(await io.fs.exists(candidate))) continue;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    suggestedHalFilePaths.push(candidate);
  }

  return { suggestedHalFilePaths, warnings };
}

function pickSelectedMatchForRef(
  io: CoreIo,
  refFileToken: string,
  iniDir: string,
  selectedByAbs: Set<string>,
  selectedByBase: Map<string, string[]>,
): string | undefined {
  const preferred = defaultIniHalCandidatePath(io, iniDir, refFileToken);
  if (preferred && selectedByAbs.has(preferred)) return preferred;

  const basenameMatches =
    selectedByBase.get(fileNameLower(io, refFileToken)) ?? [];
  if (basenameMatches.length === 1) return basenameMatches[0];
  return undefined;
}

export const parseMachineConfigImportSetupDraft =
  (io: CoreIo) =>
  async (iniPathInput: string): Promise<MachineConfigImportSetupDraft> => {
    const iniPath = io.path.resolve(iniPathInput);
    const iniText = await io.fs.readTextFile(iniPath);
    const ini = parseLinuxCncIni(iniText, iniPath);
    const halReferences = collectLinuxCncHalReferences(ini);
    const suggestion = await suggestResolvedHalFilesFromIni(
      io,
      iniPath,
      halReferences,
    );
    return {
      ini,
      halReferences,
      suggestedHalFilePaths: suggestion.suggestedHalFilePaths,
      warnings: [...ini.warnings, ...suggestion.warnings],
    };
  };

export const buildMachineConfigImportDraft =
  (io: CoreIo) =>
  async (
    iniPathInput: string,
    selectedHalFiles: MachineConfigHalFileSelection[],
  ): Promise<MachineConfigImportDraft> => {
    const iniPath = io.path.resolve(iniPathInput);
    const normalizedSelections = normalizeMachineHalSelections(
      io,
      selectedHalFiles,
    );
    const normalized = normalizedSelections.map((item) => item.filePath);
    const resolveIniByPath = new Map(
      normalizedSelections.map((item) => [
        item.filePath,
        item.resolveIniSubstitutions,
      ]),
    );
    const iniText = await io.fs.readTextFile(iniPath);
    const ini = parseLinuxCncIni(iniText, iniPath);
    const iniDir = io.path.dirname(iniPath);
    const refs = collectLinuxCncHalReferences(ini);

    const selectedByAbs = new Set(normalized);
    const selectedByBase = new Map<string, string[]>();
    for (const filePath of normalized) {
      const key = fileNameLower(io, filePath);
      const list = selectedByBase.get(key);
      if (list) list.push(filePath);
      else selectedByBase.set(key, [filePath]);
    }

    const halSources: MachineConfigHalSource[] = [];
    const resolverWarnings: string[] = [];
    const loadedHalPaths = new Set<string>();
    const halChunks: string[] = [];
    const parsedInstanceNamesByPath = new Map<string, Set<string>>();

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

      const ext = io.path.extname(ref.fileToken).toLowerCase();
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
        io,
        ref.fileToken,
        iniDir,
        selectedByAbs,
        selectedByBase,
      );
      let resolvedPath: string | undefined;
      if (
        resolvedPathCandidate &&
        (await io.fs.exists(resolvedPathCandidate))
      ) {
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
      if (!(await io.fs.exists(selectedPath))) {
        resolverWarnings.push(
          `Selected HAL file does not exist: ${selectedPath}`,
        );
        continue;
      }
      if (loadedHalPaths.has(selectedPath)) continue;
      loadedHalPaths.add(selectedPath);
      let halText = await io.fs.readTextFile(selectedPath);
      if (resolveIniByPath.get(selectedPath)) {
        const resolved = resolveIniSubstitutionsInHalText(
          halText,
          ini,
          selectedPath,
        );
        halText = resolved.text;
        resolverWarnings.push(...resolved.warnings);
      }
      const parsedSingleDraft = parseHalImportDraft(halText, selectedPath);
      const parsedSingleInstances = new Set<string>();
      for (const group of parsedSingleDraft.componentGroups) {
        for (const instance of group.instances) {
          if (instance.instanceName.trim()) {
            parsedSingleInstances.add(instance.instanceName.trim());
          }
        }
      }
      parsedInstanceNamesByPath.set(selectedPath, parsedSingleInstances);
      halChunks.push(
        `# noHAL import source: ${selectedPath}\n${halText.trimEnd()}\n`,
      );
    }

    const halImportDraft = parseHalImportDraft(halChunks.join("\n"), iniPath);
    const postguiResolvedPaths = new Set(
      halSources
        .filter(
          (source) =>
            source.status === "loaded" &&
            source.kind === "POSTGUI_HALFILE" &&
            source.resolvedPath,
        )
        .map((source) => source.resolvedPath as string),
    );
    const mainResolvedPaths = new Set(
      halSources
        .filter(
          (source) =>
            source.status === "loaded" &&
            source.kind === "HALFILE" &&
            source.resolvedPath,
        )
        .map((source) => source.resolvedPath as string),
    );
    const postguiInstances = new Set<string>();
    const mainInstances = new Set<string>();
    for (const sourcePath of postguiResolvedPaths) {
      for (const instanceName of parsedInstanceNamesByPath.get(sourcePath) ??
        []) {
        postguiInstances.add(instanceName);
      }
    }
    for (const sourcePath of mainResolvedPaths) {
      for (const instanceName of parsedInstanceNamesByPath.get(sourcePath) ??
        []) {
        mainInstances.add(instanceName);
      }
    }
    const postguiOnlyInstances = [...postguiInstances]
      .filter((instanceName) => !mainInstances.has(instanceName))
      .sort((a, b) => a.localeCompare(b));
    if (postguiOnlyInstances.length > 0) {
      halImportDraft.postguiOnlyInstances = postguiOnlyInstances;
    }
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
  };

export function createMachineConfigImportApi(
  io: CoreIo,
): MachineConfigImportApi {
  return {
    parseMachineConfigImportSetupDraft: parseMachineConfigImportSetupDraft(io),
    buildMachineConfigImportDraft: buildMachineConfigImportDraft(io),
  };
}
