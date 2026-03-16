import { exportProjectToHal } from "../halExport";
import { slugify } from "../id";
import type {
  LinuxCncIniDocument,
  LinuxCncIniSection,
  NoHALProject,
} from "../types";
import { stripManagedEntriesFromIni } from "./shared";

function buildHalFileName(project: NoHALProject): string {
  return `${slugify(project.name)}.hal`;
}

function buildPostguiHalFileName(project: NoHALProject): string {
  return `${slugify(project.name)}-postgui.hal`;
}

export function buildManagedMachineConfigIniSections(
  project: NoHALProject,
): LinuxCncIniSection[] {
  const hal = exportProjectToHal(project);
  return [
    {
      name: "HAL",
      line: 0,
      entries: [
        {
          key: "HALFILE",
          value: buildHalFileName(project),
          line: 0,
        },
        ...(hal.postguiText
          ? [
              {
                key: "POSTGUI_HALFILE",
                value: buildPostguiHalFileName(project),
                line: 0,
              },
            ]
          : []),
      ],
    },
  ];
}

export function buildEffectiveMachineConfigIni(
  project: NoHALProject,
): LinuxCncIniDocument | null {
  const userIni = project.machineConfig?.userIni;
  if (!userIni) return null;
  const managedSections = buildManagedMachineConfigIniSections(project);
  const managedHalEntries = managedSections[0]?.entries ?? [];
  const sections = stripManagedEntriesFromIni(userIni).sections.map(
    (section) =>
      section.name.trim().toUpperCase() === "HAL"
        ? {
            ...section,
            entries: [...managedHalEntries, ...section.entries],
          }
        : { ...section, entries: [...section.entries] },
  );

  if (
    managedHalEntries.length > 0 &&
    !sections.some((section) => section.name.trim().toUpperCase() === "HAL")
  ) {
    sections.push({
      name: "HAL",
      line: 0,
      entries: [...managedHalEntries],
    });
  }

  return {
    ...userIni,
    sections,
  };
}
