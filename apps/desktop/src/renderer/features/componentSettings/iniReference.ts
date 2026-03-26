import { buildEffectiveMachineConfigIni } from "@nohal/core/src/machineConfig/policy";
import type { NoHALProject } from "@nohal/core/src/types";

/**
 * A single selectable INI entry exposed in the component-settings picker.
 */
export interface IniReferenceEntry {
  key: string;
  value: string;
  token: string;
}

/**
 * A picker group that maps one INI section to its available keys.
 */
export interface IniReferenceSection {
  name: string;
  entries: IniReferenceEntry[];
}

/**
 * A parsed INI reference that was matched back to a known section/key pair.
 */
export interface MatchedIniReference extends IniReferenceEntry {
  sectionName: string;
}

const INI_REFERENCE_PATTERN = /^\s*\[([^\]\r\n]+)\]([^\r\n]+?)\s*$/;

function normalizeIniIdentifier(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Builds the raw LinuxCNC-style INI reference token stored on nodes and exported
 * verbatim in generated HAL, for example `[DISPLAY]MAX_FEED_OVERRIDE`.
 */
export function formatIniReferenceToken(
  sectionName: string,
  key: string,
): string {
  return `[${sectionName.trim()}]${key.trim()}`;
}

/**
 * Parses a user-typed token into its section/key parts.
 *
 * Returns `null` when the value is not a simple `[SECTION]KEY` reference.
 */
export function parseIniReferenceToken(value: string): {
  sectionName: string;
  key: string;
  token: string;
} | null {
  const match = INI_REFERENCE_PATTERN.exec(value);
  if (!match) return null;
  const sectionName = match[1]?.trim() ?? "";
  const key = match[2]?.trim() ?? "";
  if (!sectionName || !key) return null;
  return {
    sectionName,
    key,
    token: formatIniReferenceToken(sectionName, key),
  };
}

/**
 * Projects the effective machine INI into picker-friendly sections, including
 * managed entries that are synthesized by NoHAL.
 */
export function buildIniReferenceSections(
  project: NoHALProject,
): IniReferenceSection[] {
  const ini = buildEffectiveMachineConfigIni(project);
  if (!ini) return [];

  return ini.sections.flatMap((section) => {
    const sectionName = section.name.trim();
    if (!sectionName) return [];

    const entries = section.entries.flatMap((entry) => {
      const key = entry.key.trim();
      if (!key) return [];
      return [
        {
          key,
          value: entry.value,
          token: formatIniReferenceToken(sectionName, key),
        },
      ];
    });

    if (entries.length === 0) return [];
    return [{ name: sectionName, entries }];
  });
}

/**
 * Resolves a user-entered token against the currently available effective INI
 * entries so the UI can show metadata such as the referenced value.
 */
export function matchIniReferenceToken(
  sections: readonly IniReferenceSection[],
  value: string,
): MatchedIniReference | null {
  const parsed = parseIniReferenceToken(value);
  if (!parsed) return null;

  const normalizedSectionName = normalizeIniIdentifier(parsed.sectionName);
  const normalizedKey = normalizeIniIdentifier(parsed.key);

  for (const section of sections) {
    if (normalizeIniIdentifier(section.name) !== normalizedSectionName) {
      continue;
    }
    for (const entry of section.entries) {
      if (normalizeIniIdentifier(entry.key) !== normalizedKey) continue;
      return {
        ...entry,
        sectionName: section.name,
      };
    }
  }

  return null;
}
