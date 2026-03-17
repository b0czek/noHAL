import { exportProjectToHal } from "../halExport";
import { slugify } from "../id";
import type {
  LinuxCncIniDocument,
  LinuxCncIniEntry,
  LinuxCncIniSection,
  NoHALProject,
} from "../types";

export type MachineConfigIniLockMode = "none" | "entry";

export interface MachineConfigIniSectionPolicy {
  sectionName: string;
  managedKeys: readonly string[];
  lockedKeys?: readonly string[];
  buildManagedEntries?: (project: NoHALProject) => LinuxCncIniEntry[];
}

function normalizeIniIdentifier(value: string): string {
  return value.trim().toUpperCase();
}

function buildManagedHalEntries(project: NoHALProject): LinuxCncIniEntry[] {
  const hal = exportProjectToHal(project);
  const entries: LinuxCncIniEntry[] = [
    {
      key: "HALFILE",
      value: `${slugify(project.name)}.hal`,
      line: 0,
    },
  ];
  if (hal.postguiText) {
    entries.push({
      key: "POSTGUI_HALFILE",
      value: `${slugify(project.name)}-postgui.hal`,
      line: 0,
    });
  }
  return entries;
}

export const MACHINE_CONFIG_INI_SECTION_POLICIES: readonly MachineConfigIniSectionPolicy[] =
  [
    {
      sectionName: "HAL",
      managedKeys: ["HALFILE", "POSTGUI_HALFILE", "SHUTDOWN"],
      buildManagedEntries: buildManagedHalEntries,
    },
  ];

function findMachineConfigIniSectionPolicy(
  sectionName: string,
): MachineConfigIniSectionPolicy | undefined {
  const normalizedSectionName = normalizeIniIdentifier(sectionName);
  return MACHINE_CONFIG_INI_SECTION_POLICIES.find(
    (policy) =>
      normalizeIniIdentifier(policy.sectionName) === normalizedSectionName,
  );
}

function hasMatchingPolicyKey(
  keys: readonly string[] | undefined,
  key: string,
): boolean {
  if (!keys || keys.length === 0) return false;
  const normalizedKey = normalizeIniIdentifier(key);
  return keys.some(
    (candidate) => normalizeIniIdentifier(candidate) === normalizedKey,
  );
}

export function isManagedMachineConfigIniEntry(
  sectionName: string,
  key: string,
): boolean {
  const policy = findMachineConfigIniSectionPolicy(sectionName);
  return hasMatchingPolicyKey(policy?.managedKeys, key);
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

export function getMachineConfigIniEntryLockMode(
  sectionName: string,
  key: string,
): MachineConfigIniLockMode {
  const policy = findMachineConfigIniSectionPolicy(sectionName);
  if (!policy) return "none";
  if (
    hasMatchingPolicyKey(policy.lockedKeys, key) ||
    hasMatchingPolicyKey(policy.managedKeys, key)
  ) {
    return "entry";
  }
  return "none";
}

export function buildManagedMachineConfigIniSections(
  project: NoHALProject,
): LinuxCncIniSection[] {
  return MACHINE_CONFIG_INI_SECTION_POLICIES.flatMap((policy) => {
    const entries = policy.buildManagedEntries?.(project) ?? [];
    if (entries.length === 0) return [];
    return [
      {
        name: policy.sectionName,
        line: 0,
        entries,
      },
    ];
  });
}

export function buildEffectiveMachineConfigIni(
  project: NoHALProject,
): LinuxCncIniDocument | null {
  const userIni = project.machineConfig?.userIni;
  if (!userIni) return null;

  const managedSections = buildManagedMachineConfigIniSections(project);
  const managedByName = new Map(
    managedSections.map((section) => [
      normalizeIniIdentifier(section.name),
      section,
    ]),
  );
  const strippedUserIni = stripManagedEntriesFromIni(userIni);
  const sections = strippedUserIni.sections.map((section) => {
    const managedSection = managedByName.get(
      normalizeIniIdentifier(section.name),
    );
    return managedSection
      ? {
          ...section,
          entries: [...managedSection.entries, ...section.entries],
        }
      : { ...section, entries: [...section.entries] };
  });

  for (const managedSection of managedSections) {
    const normalizedName = normalizeIniIdentifier(managedSection.name);
    if (
      sections.some(
        (section) => normalizeIniIdentifier(section.name) === normalizedName,
      )
    ) {
      continue;
    }
    sections.push({
      name: managedSection.name,
      line: managedSection.line,
      entries: [...managedSection.entries],
    });
  }

  return {
    ...userIni,
    sections,
  };
}
