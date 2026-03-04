import { createId, safeKey } from "@nohal/core/src/id";
import {
  createDefaultMotmodConfig,
  createEmptyMachineConfig,
  isRequiredHalThreadName,
} from "@nohal/core/src/project";
import type {
  HalThreadDefinition,
  HalValueType,
  LinuxCncIniEntry,
  LinuxCncIniSection,
  LinuxCncVersion,
  NoHALProject,
} from "@nohal/core/src/types";
import type { TranslationKey } from "../../../i18n";
import {
  reconcileComponentNodesForDefinition,
  toErrorMessage,
} from "../helpers";
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

function nextUniqueIdentifier(
  base: string,
  existing: ReadonlyArray<string>,
  separator = "_",
): string {
  const normalized = base.trim() || "item";
  if (!existing.includes(normalized)) return normalized;
  let index = 2;
  while (existing.includes(`${normalized}${separator}${index}`)) index += 1;
  return `${normalized}${separator}${index}`;
}

function nextUniqueMemberKey(
  preferredName: string,
  existingKeys: ReadonlyArray<string>,
  fallback: string,
): string {
  const baseKey = safeKey(preferredName) || fallback;
  const used = new Set(existingKeys);
  if (!used.has(baseKey)) return baseKey;
  let index = 2;
  let candidate = `${baseKey}_${index}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${baseKey}_${index}`;
  }
  return candidate;
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
  const customComponentUsageCount = (
    project: NoHALProject,
    componentId: string,
  ): number => {
    let count = 0;
    for (const sheet of Object.values(project.sheets)) {
      for (const node of sheet.nodes) {
        if (node.kind !== "component" || node.componentId !== componentId)
          continue;
        count += 1;
      }
    }
    return count;
  };

  return {
    async newProject(linuxcncVersion?: LinuxCncVersion): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => {
          const result = await window.nohal.newProject(linuxcncVersion);
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

    addCustomComponent(): string {
      const existingNames = Object.values(deps.state.project.library.components)
        .map((component) => component.halComponentName)
        .filter((name) => name.trim().length > 0);
      const nextHalComponentName = nextUniqueIdentifier(
        "custom_component",
        existingNames,
      );
      const nextId = `manual:${createId("component")}`;

      deps.withProject((project) => {
        project.library.components[nextId] = {
          id: nextId,
          name: nextHalComponentName,
          halComponentName: nextHalComponentName,
          source: "manual",
          runtime: { kind: "unknown" },
          pins: [],
          params: [],
        };
      });
      deps.setStatusT("store.status.addedCustomComponent", {
        componentName: nextHalComponentName,
      });
      return nextId;
    },

    removeCustomComponent(componentId: string): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const usageCount = customComponentUsageCount(
        deps.state.project,
        componentId,
      );
      if (usageCount > 0) {
        deps.setStatusT("store.status.cannotRemoveCustomComponentInUse", {
          componentName: component.halComponentName,
          count: usageCount,
        });
        return;
      }

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        delete project.library.components[componentId];
      });
      deps.setStatusT("store.status.removedCustomComponent", {
        componentName: component.halComponentName,
      });
    },

    updateCustomComponentHalComponentName(
      componentId: string,
      halComponentName: string,
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const normalized = halComponentName.trim();
      if (!normalized || normalized === component.halComponentName) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        target.halComponentName = normalized;
        target.name = normalized;
      });
      deps.setStatusT("store.status.updatedCustomComponent", {
        componentName: normalized,
      });
    },

    updateCustomComponentRuntimeKind(
      componentId: string,
      runtimeKind: "rt" | "userspace" | "unknown",
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      if ((component.runtime?.kind ?? "unknown") === runtimeKind) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        if (!target.runtime) target.runtime = { kind: runtimeKind };
        else target.runtime.kind = runtimeKind;
      });
      deps.setStatusT("store.status.updatedCustomComponent", {
        componentName: component.halComponentName,
      });
    },

    updateCustomComponentLoadCommand(
      componentId: string,
      loadCommand: string,
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const normalized = loadCommand.trim();
      if ((component.loadCommand ?? "").trim() === normalized) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        if (normalized) target.loadCommand = normalized;
        else delete target.loadCommand;
      });
      deps.setStatusT("store.status.updatedCustomComponentLoad", {
        componentName: component.halComponentName,
      });
    },

    addCustomComponentPin(componentId: string): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const nextName = nextUniqueIdentifier(
          "pin",
          target.pins.map((pin) => pin.name),
        );
        const nextKey = nextUniqueMemberKey(
          nextName,
          target.pins.map((pin) => pin.key),
          "pin",
        );
        target.pins.push({
          key: nextKey,
          name: nextName,
          direction: "in",
          type: "bit",
        });
        reconcileComponentNodesForDefinition(project, componentId, target);
      });
      deps.setStatusT("store.status.addedCustomComponentPin", {
        componentName: component.halComponentName,
      });
    },

    removeCustomComponentPin(componentId: string, pinKey: string): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const pin = component.pins.find((candidate) => candidate.key === pinKey);
      if (!pin) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        target.pins = target.pins.filter(
          (candidate) => candidate.key !== pinKey,
        );
        for (const sheet of Object.values(project.sheets)) {
          for (const node of sheet.nodes) {
            if (node.kind !== "component" || node.componentId !== componentId)
              continue;
            if (!node.pinInitialValues) continue;
            delete node.pinInitialValues[pinKey];
            if (Object.keys(node.pinInitialValues).length === 0) {
              delete node.pinInitialValues;
            }
          }
        }
        reconcileComponentNodesForDefinition(project, componentId, target);
      });
      deps.setStatusT("store.status.removedCustomComponentPin", {
        componentName: component.halComponentName,
        pinName: pin.name,
      });
    },

    updateCustomComponentPinName(
      componentId: string,
      pinKey: string,
      pinName: string,
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const pin = component.pins.find((candidate) => candidate.key === pinKey);
      if (!pin) return;
      const normalized = pinName.trim();
      if (!normalized || normalized === pin.name) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const targetPin = target.pins.find(
          (candidate) => candidate.key === pinKey,
        );
        if (!targetPin) return;
        targetPin.name = normalized;
      });
      deps.setStatusT("store.status.updatedCustomComponentPin", {
        componentName: component.halComponentName,
        pinName: normalized,
      });
    },

    updateCustomComponentPinType(
      componentId: string,
      pinKey: string,
      pinType: HalValueType,
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const pin = component.pins.find((candidate) => candidate.key === pinKey);
      if (!pin) return;
      if (pin.type === pinType) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const targetPin = target.pins.find(
          (candidate) => candidate.key === pinKey,
        );
        if (!targetPin) return;
        targetPin.type = pinType;
      });
      deps.setStatusT("store.status.updatedCustomComponentPin", {
        componentName: component.halComponentName,
        pinName: pin.name,
      });
    },

    updateCustomComponentPinDirection(
      componentId: string,
      pinKey: string,
      direction: "in" | "out" | "io",
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const pin = component.pins.find((candidate) => candidate.key === pinKey);
      if (!pin) return;
      if (pin.direction === direction) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const targetPin = target.pins.find(
          (candidate) => candidate.key === pinKey,
        );
        if (!targetPin) return;
        targetPin.direction = direction;
      });
      deps.setStatusT("store.status.updatedCustomComponentPinDirection", {
        componentName: component.halComponentName,
        pinName: pin.name,
        direction,
      });
    },

    addCustomComponentParam(componentId: string): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const nextName = nextUniqueIdentifier(
          "param",
          target.params.map((param) => param.name),
        );
        const nextKey = nextUniqueMemberKey(
          nextName,
          target.params.map((param) => param.key),
          "param",
        );
        target.params.push({
          key: nextKey,
          name: nextName,
          direction: "rw",
          type: "float",
        });
        reconcileComponentNodesForDefinition(project, componentId, target);
      });
      deps.setStatusT("store.status.addedCustomComponentParam", {
        componentName: component.halComponentName,
      });
    },

    removeCustomComponentParam(componentId: string, paramKey: string): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const param = component.params.find(
        (candidate) => candidate.key === paramKey,
      );
      if (!param) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        target.params = target.params.filter(
          (candidate) => candidate.key !== paramKey,
        );
        for (const sheet of Object.values(project.sheets)) {
          for (const node of sheet.nodes) {
            if (node.kind !== "component" || node.componentId !== componentId)
              continue;
            delete node.paramValues[paramKey];
          }
        }
        reconcileComponentNodesForDefinition(project, componentId, target);
      });
      deps.setStatusT("store.status.removedCustomComponentParam", {
        componentName: component.halComponentName,
        paramName: param.name,
      });
    },

    updateCustomComponentParamName(
      componentId: string,
      paramKey: string,
      paramName: string,
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const param = component.params.find(
        (candidate) => candidate.key === paramKey,
      );
      if (!param) return;
      const normalized = paramName.trim();
      if (!normalized || normalized === param.name) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const targetParam = target.params.find(
          (candidate) => candidate.key === paramKey,
        );
        if (!targetParam) return;
        targetParam.name = normalized;
      });
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: component.halComponentName,
        paramName: normalized,
      });
    },

    updateCustomComponentParamType(
      componentId: string,
      paramKey: string,
      paramType: HalValueType,
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const param = component.params.find(
        (candidate) => candidate.key === paramKey,
      );
      if (!param) return;
      if (param.type === paramType) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const targetParam = target.params.find(
          (candidate) => candidate.key === paramKey,
        );
        if (!targetParam) return;
        targetParam.type = paramType;
      });
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: component.halComponentName,
        paramName: param.name,
      });
    },

    updateCustomComponentParamDirection(
      componentId: string,
      paramKey: string,
      paramDirection: "r" | "rw",
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const param = component.params.find(
        (candidate) => candidate.key === paramKey,
      );
      if (!param) return;
      if (param.direction === paramDirection) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const targetParam = target.params.find(
          (candidate) => candidate.key === paramKey,
        );
        if (!targetParam) return;
        targetParam.direction = paramDirection;
      });
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: component.halComponentName,
        paramName: param.name,
      });
    },

    updateCustomComponentParamDefaultValue(
      componentId: string,
      paramKey: string,
      defaultValue: string,
    ): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      const param = component.params.find(
        (candidate) => candidate.key === paramKey,
      );
      if (!param) return;
      if ((param.defaultValue ?? "") === defaultValue) return;

      deps.withProject((project) => {
        const target = project.library.components[componentId];
        if (!target || target.source === "comp") return;
        const targetParam = target.params.find(
          (candidate) => candidate.key === paramKey,
        );
        if (!targetParam) return;
        if (defaultValue.trim()) targetParam.defaultValue = defaultValue;
        else delete targetParam.defaultValue;
        reconcileComponentNodesForDefinition(project, componentId, target);
      });
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: component.halComponentName,
        paramName: param.name,
      });
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
          floatMode: "fp",
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
      if (isRequiredHalThreadName(existing.name)) {
        deps.setStatusT("store.status.cannotRemoveRequiredHalThread", {
          name: existing.name,
        });
        return;
      }

      deps.withProject((project) => {
        const threads = project.halThreads;
        if (!threads) return;
        const index = threads.findIndex((thread) => thread.id === threadId);
        if (index < 0) return;
        if (threads.length <= 1) return;
        threads.splice(index, 1);
        for (const sheet of Object.values(project.sheets)) {
          const outputs = sheet.hal?.threadOutputs;
          if (!outputs) continue;
          for (const output of outputs) {
            if (output.halThreadId === threadId) delete output.halThreadId;
          }
        }
      });
      deps.setStatusT("store.status.removedHalThread", { name: existing.name });
    },

    updateHalThreadName(threadId: string, name: string): void {
      const trimmed = name.trim();
      const threads = deps.state.project.halThreads ?? [];
      const existing = threads.find((thread) => thread.id === threadId);
      if (!existing) return;
      if (isRequiredHalThreadName(existing.name) && trimmed !== existing.name) {
        deps.setStatusT("store.status.cannotRenameRequiredHalThread", {
          name: existing.name,
        });
        return;
      }
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

    updateHalThreadFloatMode(threadId: string, floatMode: "fp" | "nofp"): void {
      const existing = (deps.state.project.halThreads ?? []).find(
        (thread) => thread.id === threadId,
      );
      if (!existing) return;
      if (isRequiredHalThreadName(existing.name) && floatMode === "nofp") {
        deps.withProject((project) => {
          const target = project.halThreads?.find(
            (thread) => thread.id === threadId,
          );
          if (target) target.floatMode = "fp";
        });
        deps.setStatusT("store.status.requiredHalThreadForcedFp", {
          name: existing.name,
        });
        return;
      }
      if ((existing.floatMode ?? "fp") === floatMode) return;

      deps.withProject((project) => {
        const target = project.halThreads?.find(
          (thread) => thread.id === threadId,
        );
        if (target) target.floatMode = floatMode;
      });
      deps.setStatusT("store.status.updatedHalThreadFloatMode", {
        name: existing.name,
        mode: floatMode,
      });
    },

    updateMotmodNumericConfig(
      key:
        | "numJoints"
        | "numDio"
        | "numAio"
        | "numSpindles"
        | "numMiscError"
        | "trajPeriodNs",
      value: number,
    ): void {
      if (!Number.isFinite(value)) return;
      const rounded = Math.round(value);
      const normalized =
        key === "numJoints"
          ? Math.max(1, rounded)
          : key === "numSpindles"
            ? Math.max(1, rounded)
            : Math.max(0, rounded);
      deps.withProject((project) => {
        const motmod = project.motmod ?? createDefaultMotmodConfig();
        project.motmod = motmod;
        if (motmod[key] === normalized) return;
        motmod[key] = normalized;
      });
      deps.setStatusT("store.status.updatedMotmodConfig");
    },
  };
}
