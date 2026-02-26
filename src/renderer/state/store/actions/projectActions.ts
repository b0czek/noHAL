import { createId } from "../../../../shared/id";
import { createEmptyMachineConfig } from "../../../../shared/project";
import type {
  HalThreadDefinition,
  LinuxCncIniEntry,
  LinuxCncIniSection,
  NoHALProject,
} from "../../../../shared/types";
import type { TranslationKey } from "../../../i18n";
import { toErrorMessage } from "../helpers";
import type { EditorStoreActionContext } from "./types";

type ProjectTransition = {
  project: NoHALProject;
  projectPath: string | null;
  status: string;
  warnings?: string[];
};

type OpenedProjectResult = {
  project: NoHALProject;
  projectPath: string;
};

function nextUniqueIniLabel(
  base: string,
  existing: ReadonlyArray<string>,
): string {
  if (!existing.includes(base)) return base;
  let index = 1;
  while (existing.includes(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function nextUniqueThreadName(
  base: string,
  existing: ReadonlyArray<string>,
): string {
  const normalized = base.trim() || "thread";
  if (!existing.includes(normalized)) return normalized;
  let index = 1;
  while (existing.includes(`${normalized}-${index}`)) index += 1;
  return `${normalized}-${index}`;
}

function openedProjectPathStatus(
  deps: EditorStoreActionContext,
  projectPath: string,
): string {
  return deps.t("store.status.openedProjectPath", { projectPath });
}

function projectTransitionFromOpenedResult(
  deps: EditorStoreActionContext,
  result: OpenedProjectResult,
): ProjectTransition {
  return {
    project: result.project,
    projectPath: result.projectPath,
    status: openedProjectPathStatus(deps, result.projectPath),
  };
}

async function runProjectTransition(
  deps: EditorStoreActionContext,
  load: () => Promise<ProjectTransition | null>,
  errorStatusKey: TranslationKey,
): Promise<boolean> {
  if (!(await deps.confirmProceedWithUnsavedChanges())) return false;
  try {
    const next = await load();
    if (!next) return false;
    deps.replaceProjectState(next.project, next.projectPath, next.status);
    if (next.warnings) deps.setState("exportWarnings", [...next.warnings]);
    return true;
  } catch (error) {
    deps.setStatusT(errorStatusKey, { error: toErrorMessage(error) });
    return false;
  }
}

export function createProjectActions(deps: EditorStoreActionContext) {
  return {
    async newProject(): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => {
          const result = await window.nohal.newProject();
          if (!result) return null;
          return {
            project: result.project,
            projectPath: result.projectPath,
            status: deps.t("store.status.createdNewProject"),
          };
        },
        "store.status.failedCreateProject",
      );
    },

    async openPreparedProject(
      project: NoHALProject,
      options?: {
        projectPath?: string | null;
        status?: string;
        warnings?: string[];
      },
    ): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => ({
          project,
          projectPath: options?.projectPath ?? null,
          status: options?.status ?? deps.t("store.status.openedProject"),
          warnings: options?.warnings,
        }),
        "store.status.failedLoadPreparedProject",
      );
    },

    async openProject(): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => {
          const result = await window.nohal.openProject();
          if (!result) return null;
          return projectTransitionFromOpenedResult(deps, result);
        },
        "store.status.failedOpenProject",
      );
    },

    async openProjectAt(projectPath: string): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () =>
          projectTransitionFromOpenedResult(
            deps,
            await window.nohal.openProjectAt(projectPath),
          ),
        "store.status.failedOpenProject",
      );
    },

    ensureMachineConfig(): void {
      if (deps.state.project.machineConfig) return;
      deps.withProject((project) => {
        project.machineConfig = createEmptyMachineConfig();
      });
      deps.setStatusT("store.status.createdEmptyMachineConfig");
    },

    addMachineIniSection(): void {
      deps.withProject((project) => {
        let machineConfig = project.machineConfig;
        if (!machineConfig) {
          machineConfig = createEmptyMachineConfig();
          project.machineConfig = machineConfig;
        }
        const nextLine = Math.max(0, machineConfig.ini.lineCount) + 1;
        const nextName = nextUniqueIniLabel(
          "SECTION",
          machineConfig.ini.sections.map((section) => section.name),
        );
        const section: LinuxCncIniSection = {
          name: nextName,
          entries: [],
          line: nextLine,
        };
        machineConfig.ini.sections.push(section);
        machineConfig.ini.lineCount = nextLine;
      });
      deps.setStatusT("store.status.addedIniSection");
    },

    removeMachineIniSection(sectionIndex: number): void {
      const section =
        deps.state.project.machineConfig?.ini.sections[sectionIndex];
      if (!section) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      deps.withProject((project) => {
        const sections = project.machineConfig?.ini.sections;
        if (!sections || !sections[sectionIndex]) return;
        sections.splice(sectionIndex, 1);
      });
      deps.setStatusT("store.status.removedIniSection");
    },

    updateMachineIniSectionName(sectionIndex: number, name: string): void {
      const existing =
        deps.state.project.machineConfig?.ini.sections[sectionIndex];
      if (!existing) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      if (existing.name === name) return;
      deps.withProject((project) => {
        const section = project.machineConfig?.ini.sections[sectionIndex];
        if (section) section.name = name;
      });
      deps.setStatusT("store.status.updatedIniSectionName");
    },

    addMachineIniField(sectionIndex: number): void {
      const section =
        deps.state.project.machineConfig?.ini.sections[sectionIndex];
      if (!section) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      deps.withProject((project) => {
        const machineConfig = project.machineConfig;
        const targetSection = machineConfig?.ini.sections[sectionIndex];
        if (!machineConfig || !targetSection) return;
        const nextLine = Math.max(0, machineConfig.ini.lineCount) + 1;
        const nextKey = nextUniqueIniLabel(
          "KEY",
          targetSection.entries.map((entry) => entry.key),
        );
        const entry: LinuxCncIniEntry = {
          key: nextKey,
          value: "",
          line: nextLine,
        };
        targetSection.entries.push(entry);
        machineConfig.ini.lineCount = nextLine;
      });
      deps.setStatusT("store.status.addedIniField");
    },

    removeMachineIniField(sectionIndex: number, entryIndex: number): void {
      const entry =
        deps.state.project.machineConfig?.ini.sections[sectionIndex]?.entries[
          entryIndex
        ];
      if (!entry) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      deps.withProject((project) => {
        const entries =
          project.machineConfig?.ini.sections[sectionIndex]?.entries;
        if (!entries || !entries[entryIndex]) return;
        entries.splice(entryIndex, 1);
      });
      deps.setStatusT("store.status.removedIniField");
    },

    updateMachineIniKey(
      sectionIndex: number,
      entryIndex: number,
      key: string,
    ): void {
      const existing =
        deps.state.project.machineConfig?.ini.sections[sectionIndex]?.entries[
          entryIndex
        ];
      if (!existing) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      if (existing.key === key) return;
      deps.withProject((project) => {
        const entry =
          project.machineConfig?.ini.sections[sectionIndex]?.entries[
            entryIndex
          ];
        if (entry) entry.key = key;
      });
      deps.setStatusT("store.status.updatedIniKey");
    },

    updateMachineIniValue(
      sectionIndex: number,
      entryIndex: number,
      value: string,
    ): void {
      const existing =
        deps.state.project.machineConfig?.ini.sections[sectionIndex]?.entries[
          entryIndex
        ];
      if (!existing) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      if (existing.value === value) return;
      deps.withProject((project) => {
        const entry =
          project.machineConfig?.ini.sections[sectionIndex]?.entries[
            entryIndex
          ];
        if (entry) entry.value = value;
      });
      deps.setStatusT("store.status.updatedIniValue");
    },

    addHalThread(): void {
      deps.withProject((project) => {
        let threads = project.halThreads;
        if (!threads) {
          threads = [];
          project.halThreads = threads;
        }
        const nextName = nextUniqueThreadName(
          "servo-thread",
          threads.map((thread) => thread.name),
        );
        const next: HalThreadDefinition = {
          id: createId("thread"),
          name: nextName,
          periodNs: 1_000_000,
        };
        threads.push(next);
      });
      deps.setStatusT("store.status.addedHalThread");
    },

    removeHalThread(threadId: string): void {
      const currentThreads = deps.state.project.halThreads ?? [];
      if (currentThreads.length <= 1) {
        deps.setStatusT("store.status.cannotRemoveLastHalThread");
        return;
      }
      const existing = currentThreads.find((thread) => thread.id === threadId);
      if (!existing) return;

      deps.withProject((project) => {
        const threads = project.halThreads;
        if (!threads) return;
        const index = threads.findIndex((thread) => thread.id === threadId);
        if (index < 0) return;
        if (threads.length <= 1) return;
        threads.splice(index, 1);
      });
      deps.setStatusT("store.status.removedHalThread", { name: existing.name });
    },

    updateHalThreadName(threadId: string, name: string): void {
      const trimmed = name.trim();
      const threads = deps.state.project.halThreads ?? [];
      const existing = threads.find((thread) => thread.id === threadId);
      if (!existing) return;
      if (!trimmed || trimmed === existing.name) return;
      const duplicate = threads.some(
        (thread) => thread.id !== threadId && thread.name === trimmed,
      );
      if (duplicate) {
        deps.setStatusT("store.status.duplicateHalThreadName", {
          name: trimmed,
        });
        return;
      }

      deps.withProject((project) => {
        const target = project.halThreads?.find(
          (thread) => thread.id === threadId,
        );
        if (target) target.name = trimmed;
      });
      deps.setStatusT("store.status.updatedHalThreadName", { name: trimmed });
    },

    updateHalThreadPeriodNs(threadId: string, periodNs: number): void {
      if (!Number.isFinite(periodNs)) return;
      const normalized = Math.max(1, Math.round(periodNs));
      const existing = (deps.state.project.halThreads ?? []).find(
        (thread) => thread.id === threadId,
      );
      if (!existing) return;
      if (existing.periodNs === normalized) return;

      deps.withProject((project) => {
        const target = project.halThreads?.find(
          (thread) => thread.id === threadId,
        );
        if (target) target.periodNs = normalized;
      });
      deps.setStatusT("store.status.updatedHalThreadPeriod", {
        name: existing.name,
      });
    },
  };
}
