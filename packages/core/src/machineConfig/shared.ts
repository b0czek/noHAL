import type {
  LinuxCncIniDocument,
  LinuxCncIniEntry,
  LinuxCncIniSection,
  MachineConfigHalSource,
  ProjectMachineConfig,
} from "../types";

const MANAGED_MACHINE_CONFIG_HAL_KEYS = new Set([
  "HALFILE",
  "POSTGUI_HALFILE",
  "SHUTDOWN",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeIniEntry(
  value: unknown,
  fallbackLine: number,
): LinuxCncIniEntry {
  const raw = isRecord(value) ? value : {};
  const line = Number.isFinite(raw.line)
    ? Math.max(0, Math.round(raw.line as number))
    : fallbackLine;
  return {
    key: typeof raw.key === "string" ? raw.key : "",
    value: typeof raw.value === "string" ? raw.value : "",
    line,
  };
}

function normalizeIniSection(
  value: unknown,
  fallbackLine: number,
): LinuxCncIniSection {
  const raw = isRecord(value) ? value : {};
  const line = Number.isFinite(raw.line)
    ? Math.max(0, Math.round(raw.line as number))
    : fallbackLine;
  const rawEntries = Array.isArray(raw.entries) ? raw.entries : [];
  return {
    name: typeof raw.name === "string" ? raw.name : "",
    line,
    entries: rawEntries.map((entry, index) =>
      normalizeIniEntry(entry, line + index + 1),
    ),
  };
}

export function createEmptyLinuxCncIniDocument(): LinuxCncIniDocument {
  return {
    parser: "nohal-ini-v1",
    lineCount: 0,
    sections: [],
    warnings: [],
  };
}

export function normalizeLinuxCncIniDocument(
  value: unknown,
): LinuxCncIniDocument {
  const raw = isRecord(value) ? value : {};
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const sections = rawSections.map((section, index) =>
    normalizeIniSection(section, index + 1),
  );
  const maxLine = sections.reduce((best, section) => {
    const sectionMax = section.entries.reduce(
      (entryBest, entry) => Math.max(entryBest, entry.line),
      section.line,
    );
    return Math.max(best, sectionMax);
  }, 0);
  const lineCount = Number.isFinite(raw.lineCount)
    ? Math.max(maxLine, Math.round(raw.lineCount as number))
    : maxLine;
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.filter(
        (warning): warning is string => typeof warning === "string",
      )
    : [];

  return {
    parser: "nohal-ini-v1",
    ...(typeof raw.sourcePath === "string" && raw.sourcePath
      ? { sourcePath: raw.sourcePath }
      : {}),
    ...(typeof raw.sourceFileName === "string" && raw.sourceFileName
      ? { sourceFileName: raw.sourceFileName }
      : {}),
    lineCount,
    sections,
    warnings,
  };
}

export function isManagedMachineConfigIniEntry(
  sectionName: string,
  key: string,
): boolean {
  return (
    sectionName.trim().toUpperCase() === "HAL" &&
    MANAGED_MACHINE_CONFIG_HAL_KEYS.has(key.trim().toUpperCase())
  );
}

export function stripManagedEntriesFromIni(
  ini: LinuxCncIniDocument,
): LinuxCncIniDocument {
  return {
    ...ini,
    sections: ini.sections.map((section) => ({
      ...section,
      entries: section.entries.filter(
        (entry) => !isManagedMachineConfigIniEntry(section.name, entry.key),
      ),
    })),
  };
}

function normalizeMachineConfigHalSource(
  value: unknown,
): MachineConfigHalSource | null {
  const raw = isRecord(value) ? value : {};
  const kind =
    raw.kind === "HALFILE" ||
    raw.kind === "POSTGUI_HALFILE" ||
    raw.kind === "SHUTDOWN"
      ? raw.kind
      : null;
  const requestedPath =
    typeof raw.requestedPath === "string" ? raw.requestedPath : "";
  const status =
    raw.status === "loaded" ||
    raw.status === "missing" ||
    raw.status === "skipped-lib" ||
    raw.status === "skipped-non-hal"
      ? raw.status
      : null;
  if (!kind || !requestedPath || !status) return null;
  return {
    kind,
    requestedPath,
    status,
    iniLine: Number.isFinite(raw.iniLine)
      ? Math.max(0, Math.round(raw.iniLine as number))
      : 0,
    iniValue: typeof raw.iniValue === "string" ? raw.iniValue : "",
    ...(typeof raw.resolvedPath === "string" && raw.resolvedPath
      ? { resolvedPath: raw.resolvedPath }
      : {}),
  };
}

export function normalizeProjectMachineConfig(
  value: unknown,
): ProjectMachineConfig | undefined {
  if (!isRecord(value)) return undefined;
  const halSources = Array.isArray(value.halSources)
    ? value.halSources
        .map((source) => normalizeMachineConfigHalSource(source))
        .filter((source): source is MachineConfigHalSource => Boolean(source))
    : [];
  const userIni = stripManagedEntriesFromIni(
    normalizeLinuxCncIniDocument(
      "userIni" in value ? value.userIni : value.ini,
    ),
  );
  return {
    source: "imported-linuxcnc-config",
    userIni,
    halSources,
  };
}
