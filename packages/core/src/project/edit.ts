import type {
  LinuxCncIniEntry,
  LinuxCncIniSection,
  NoHALProject,
  ProjectMachineConfig,
  ProjectWireLayerPosition,
  ProjectWireStyle,
} from "../types";
import { createEmptyMachineConfig } from "./project";

function nextUniqueIniLabel(base: string, existing: readonly string[]): string {
  if (!existing.includes(base)) return base;
  let index = 1;
  while (existing.includes(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

export function updateProjectName(
  project: NoHALProject,
  name: string,
): boolean {
  const normalized = name.trim();
  if (!normalized || normalized === project.name) return false;
  project.name = normalized;
  return true;
}

export function updateProjectShutdown(
  project: NoHALProject,
  shutdown: string,
): boolean {
  if (project.shutdown === shutdown) return false;
  project.shutdown = shutdown;
  return true;
}

export function updateProjectWireLayerPosition(
  project: NoHALProject,
  position: ProjectWireLayerPosition,
): boolean {
  if (project.ui.wireLayerPosition === position) return false;
  project.ui.wireLayerPosition = position;
  return true;
}

export function updateProjectWireStyle(
  project: NoHALProject,
  style: ProjectWireStyle,
): boolean {
  if (project.ui.wireStyle === style) return false;
  project.ui.wireStyle = style;
  return true;
}

export function ensureMachineConfig(project: NoHALProject): {
  created: boolean;
  machineConfig: ProjectMachineConfig;
} {
  if (project.machineConfig) {
    return { created: false, machineConfig: project.machineConfig };
  }
  const machineConfig = createEmptyMachineConfig();
  project.machineConfig = machineConfig;
  return { created: true, machineConfig };
}

export function addMachineIniSection(
  project: NoHALProject,
): LinuxCncIniSection {
  const { machineConfig } = ensureMachineConfig(project);
  const nextLine = Math.max(0, machineConfig.userIni.lineCount) + 1;
  const section: LinuxCncIniSection = {
    name: nextUniqueIniLabel(
      "SECTION",
      machineConfig.userIni.sections.map((candidate) => candidate.name),
    ),
    entries: [],
    line: nextLine,
  };
  machineConfig.userIni.sections.push(section);
  machineConfig.userIni.lineCount = nextLine;
  return section;
}

export function removeMachineIniSection(
  project: NoHALProject,
  sectionIndex: number,
): LinuxCncIniSection | null {
  const sections = project.machineConfig?.userIni.sections;
  const section = sections?.[sectionIndex];
  if (!sections || !section) return null;
  sections.splice(sectionIndex, 1);
  return section;
}

export function updateMachineIniSectionName(
  project: NoHALProject,
  sectionIndex: number,
  name: string,
): boolean {
  const section = project.machineConfig?.userIni.sections[sectionIndex];
  if (!section || section.name === name) return false;
  section.name = name;
  return true;
}

export function addMachineIniField(
  project: NoHALProject,
  sectionIndex: number,
): LinuxCncIniEntry | null {
  const machineConfig = project.machineConfig;
  const targetSection = machineConfig?.userIni.sections[sectionIndex];
  if (!machineConfig || !targetSection) return null;
  const nextLine = Math.max(0, machineConfig.userIni.lineCount) + 1;
  const entry: LinuxCncIniEntry = {
    key: nextUniqueIniLabel(
      "KEY",
      targetSection.entries.map((candidate) => candidate.key),
    ),
    value: "",
    line: nextLine,
  };
  targetSection.entries.push(entry);
  machineConfig.userIni.lineCount = nextLine;
  return entry;
}

export function removeMachineIniField(
  project: NoHALProject,
  sectionIndex: number,
  entryIndex: number,
): LinuxCncIniEntry | null {
  const entries =
    project.machineConfig?.userIni.sections[sectionIndex]?.entries;
  const entry = entries?.[entryIndex];
  if (!entries || !entry) return null;
  entries.splice(entryIndex, 1);
  return entry;
}

export function updateMachineIniKey(
  project: NoHALProject,
  sectionIndex: number,
  entryIndex: number,
  key: string,
): boolean {
  const entry =
    project.machineConfig?.userIni.sections[sectionIndex]?.entries[entryIndex];
  if (!entry || entry.key === key) return false;
  entry.key = key;
  return true;
}

export function updateMachineIniValue(
  project: NoHALProject,
  sectionIndex: number,
  entryIndex: number,
  value: string,
): boolean {
  const entry =
    project.machineConfig?.userIni.sections[sectionIndex]?.entries[entryIndex];
  if (!entry || entry.value === value) return false;
  entry.value = value;
  return true;
}

export const projectEdits = {
  project: {
    name: {
      update: updateProjectName,
    },
    shutdown: {
      update: updateProjectShutdown,
    },
    wire: {
      visibility: {
        update: updateProjectWireLayerPosition,
      },
      style: {
        update: updateProjectWireStyle,
      },
    },
  },
  machineConfig: {
    ensure: ensureMachineConfig,
    ini: {
      section: {
        add: addMachineIniSection,
        remove: removeMachineIniSection,
        name: {
          update: updateMachineIniSectionName,
        },
      },
      field: {
        add: addMachineIniField,
        remove: removeMachineIniField,
        key: {
          update: updateMachineIniKey,
        },
        value: {
          update: updateMachineIniValue,
        },
      },
    },
  },
} as const;
