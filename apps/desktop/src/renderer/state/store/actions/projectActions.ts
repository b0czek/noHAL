import { customComponentEdits } from "@nohal/core/src/customComponent";
import {
  addHalThread,
  removeHalThread,
  updateHalThreadFloatMode,
  updateHalThreadName,
  updateHalThreadPeriodNs,
} from "@nohal/core/src/halThread";
import {
  syncMotmodManagedProjection,
  updateMotmodNumericConfig,
} from "@nohal/core/src/motmod";
import { projectEdits } from "@nohal/core/src/project";
import type {
  HalValueType,
  LinuxCncVersion,
  NoHALProject,
  ProjectWireLayerPosition,
  ProjectWireStyle,
} from "@nohal/core/src/types";
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

function wireVisibilityLabel(
  deps: EditorStoreActionContext,
  position: ProjectWireLayerPosition,
): string {
  return deps.t(
    position === "above-components"
      ? "projectSettings.generalWireLayerAbove"
      : "projectSettings.generalWireLayerUnder",
  );
}

function wireStyleLabel(
  deps: EditorStoreActionContext,
  style: ProjectWireStyle,
): string {
  if (style === "straight") {
    return deps.t("projectSettings.generalWireStyleStraight");
  }
  if (style === "curved") {
    return deps.t("projectSettings.generalWireStyleCurved");
  }
  return deps.t("projectSettings.generalWireStyleRightAngle");
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
    clearExportWarnings(): void {
      deps.setState("exportWarnings", []);
    },

    async newProject(linuxcncVersion?: LinuxCncVersion): Promise<boolean> {
      return runProjectTransition(
        deps,
        async () => {
          const result = await window.nohal.newProject(linuxcncVersion);
          if (!result) return null;
          return {
            project: result.project,
            projectPath: null,
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

    updateProjectName(name: string): void {
      const normalized = name.trim();
      if (!normalized || normalized === deps.state.project.name) return;
      deps.withProject((project) => {
        if (!projectEdits.project.name.update(project, normalized)) return;
      });
      deps.setStatusT("store.status.updatedProjectName", {
        name: normalized,
      });
    },

    updateProjectShutdown(shutdown: string): void {
      if (shutdown === deps.state.project.shutdown) return;
      deps.withProject((project) => {
        projectEdits.project.shutdown.update(project, shutdown);
      });
      deps.setStatusT("store.status.updatedProjectShutdown");
    },

    updateProjectWireLayerPosition(position: ProjectWireLayerPosition): void {
      if (deps.state.project.ui.wireLayerPosition === position) return;
      deps.withProject((project) => {
        projectEdits.project.wire.visibility.update(project, position);
      });
      deps.setStatusT("store.status.updatedProjectWireLayerPosition", {
        position: wireVisibilityLabel(deps, position),
      });
    },

    updateProjectWireStyle(style: ProjectWireStyle): void {
      if (deps.state.project.ui.wireStyle === style) return;
      deps.withProject((project) => {
        projectEdits.project.wire.style.update(project, style);
      });
      deps.setStatusT("store.status.updatedProjectWireStyle", {
        style: wireStyleLabel(deps, style),
      });
    },

    ensureMachineConfig(): void {
      if (deps.state.project.machineConfig) return;
      deps.withProject((project) => {
        projectEdits.machineConfig.ensure(project);
      });
      deps.setStatusT("store.status.createdEmptyMachineConfig");
    },

    addMachineIniSection(): void {
      deps.withProject((project) => {
        projectEdits.machineConfig.ini.section.add(project);
      });
      deps.setStatusT("store.status.addedIniSection");
    },

    removeMachineIniSection(sectionIndex: number): void {
      if (!deps.state.project.machineConfig?.userIni.sections[sectionIndex]) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      deps.withProject((project) => {
        projectEdits.machineConfig.ini.section.remove(project, sectionIndex);
      });
      deps.setStatusT("store.status.removedIniSection");
    },

    updateMachineIniSectionName(sectionIndex: number, name: string): void {
      const existing =
        deps.state.project.machineConfig?.userIni.sections[sectionIndex];
      if (!existing) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      if (existing.name === name) return;
      deps.withProject((project) => {
        projectEdits.machineConfig.ini.section.name.update(
          project,
          sectionIndex,
          name,
        );
      });
      deps.setStatusT("store.status.updatedIniSectionName");
    },

    addMachineIniField(sectionIndex: number): void {
      if (!deps.state.project.machineConfig?.userIni.sections[sectionIndex]) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      deps.withProject((project) => {
        projectEdits.machineConfig.ini.field.add(project, sectionIndex);
      });
      deps.setStatusT("store.status.addedIniField");
    },

    removeMachineIniField(sectionIndex: number, entryIndex: number): void {
      if (
        !deps.state.project.machineConfig?.userIni.sections[sectionIndex]
          ?.entries[entryIndex]
      ) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      deps.withProject((project) => {
        projectEdits.machineConfig.ini.field.remove(
          project,
          sectionIndex,
          entryIndex,
        );
      });
      deps.setStatusT("store.status.removedIniField");
    },

    updateMachineIniKey(
      sectionIndex: number,
      entryIndex: number,
      key: string,
    ): void {
      const existing =
        deps.state.project.machineConfig?.userIni.sections[sectionIndex]
          ?.entries[entryIndex];
      if (!existing) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      if (existing.key === key) return;
      deps.withProject((project) => {
        projectEdits.machineConfig.ini.field.key.update(
          project,
          sectionIndex,
          entryIndex,
          key,
        );
      });
      deps.setStatusT("store.status.updatedIniKey");
    },

    updateMachineIniValue(
      sectionIndex: number,
      entryIndex: number,
      value: string,
    ): void {
      const existing =
        deps.state.project.machineConfig?.userIni.sections[sectionIndex]
          ?.entries[entryIndex];
      if (!existing) {
        deps.setStatusT("store.status.noMachineConfigLoaded");
        return;
      }
      if (existing.value === value) return;
      deps.withProject((project) => {
        projectEdits.machineConfig.ini.field.value.update(
          project,
          sectionIndex,
          entryIndex,
          value,
        );
      });
      deps.setStatusT("store.status.updatedIniValue");
    },

    addCustomComponent(): string {
      let createdId = "";
      let componentName = "";
      deps.withProject((project) => {
        const component = customComponentEdits.add(project);
        createdId = component.id;
        componentName = component.halComponentName;
      });
      deps.setStatusT("store.status.addedCustomComponent", {
        componentName,
      });
      return createdId;
    },

    removeCustomComponent(componentId: string): void {
      const finalResult = deps.withProject((project) =>
        customComponentEdits.remove(project, componentId),
      );
      if (!finalResult.ok && finalResult.reason === "not-custom") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      if (!finalResult.ok && finalResult.reason === "in-use") {
        deps.setStatusT("store.status.cannotRemoveCustomComponentInUse", {
          componentName: finalResult.componentName,
          count: finalResult.usageCount,
        });
        return;
      }
      if (finalResult.ok) {
        deps.setStatusT("store.status.removedCustomComponent", {
          componentName: finalResult.componentName,
        });
      }
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
        customComponentEdits.halComponentName.update(
          project,
          componentId,
          normalized,
        );
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
      let componentName = "";
      deps.withProject((project) => {
        const updated = customComponentEdits.runtimeKind.update(
          project,
          componentId,
          runtimeKind,
        );
        if (!updated) return;
        componentName = updated.halComponentName;
      });
      deps.setStatusT("store.status.updatedCustomComponent", {
        componentName,
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
      if ((component.loadCommand ?? "").trim() === loadCommand.trim()) return;
      let componentName = "";
      deps.withProject((project) => {
        const updated = customComponentEdits.loadCommand.update(
          project,
          componentId,
          loadCommand,
        );
        if (!updated) return;
        componentName = updated.halComponentName;
      });
      deps.setStatusT("store.status.updatedCustomComponentLoad", {
        componentName,
      });
    },

    addCustomComponentPin(componentId: string): void {
      let componentName = "";
      let added = false;
      deps.withProject((project) => {
        const result = customComponentEdits.pin.add(project, componentId);
        if (!result) return;
        componentName = result.component.halComponentName;
        added = true;
      });
      if (!added) {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      deps.setStatusT("store.status.addedCustomComponentPin", {
        componentName,
      });
    },

    removeCustomComponentPin(componentId: string, pinKey: string): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      if (!component.pins.some((candidate) => candidate.key === pinKey)) return;
      const finalResult = deps.withProject((project) =>
        customComponentEdits.pin.remove(project, componentId, pinKey),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.removedCustomComponentPin", {
        componentName: finalResult.component.halComponentName,
        pinName: finalResult.pinName,
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
      const finalResult = deps.withProject((project) =>
        customComponentEdits.pin.name.update(
          project,
          componentId,
          pinKey,
          normalized,
        ),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.updatedCustomComponentPin", {
        componentName: finalResult.component.halComponentName,
        pinName: finalResult.pinName,
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
      if (!pin || pin.type === pinType) return;
      const finalResult = deps.withProject((project) =>
        customComponentEdits.pin.type.update(
          project,
          componentId,
          pinKey,
          pinType,
        ),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.updatedCustomComponentPin", {
        componentName: finalResult.component.halComponentName,
        pinName: finalResult.pinName,
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
      if (!pin || pin.direction === direction) return;
      const finalResult = deps.withProject((project) =>
        customComponentEdits.pin.direction.update(
          project,
          componentId,
          pinKey,
          direction,
        ),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.updatedCustomComponentPinDirection", {
        componentName: finalResult.component.halComponentName,
        pinName: finalResult.pinName,
        direction,
      });
    },

    addCustomComponentParam(componentId: string): void {
      let componentName = "";
      let added = false;
      deps.withProject((project) => {
        const result = customComponentEdits.param.add(project, componentId);
        if (!result) return;
        componentName = result.component.halComponentName;
        added = true;
      });
      if (!added) {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      deps.setStatusT("store.status.addedCustomComponentParam", {
        componentName,
      });
    },

    removeCustomComponentParam(componentId: string, paramKey: string): void {
      const component = deps.state.project.library.components[componentId];
      if (!component || component.source === "comp") {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return;
      }
      if (!component.params.some((candidate) => candidate.key === paramKey))
        return;
      const finalResult = deps.withProject((project) =>
        customComponentEdits.param.remove(project, componentId, paramKey),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.removedCustomComponentParam", {
        componentName: finalResult.component.halComponentName,
        paramName: finalResult.paramName,
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
      const finalResult = deps.withProject((project) =>
        customComponentEdits.param.name.update(
          project,
          componentId,
          paramKey,
          normalized,
        ),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: finalResult.component.halComponentName,
        paramName: finalResult.paramName,
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
      if (!param || param.type === paramType) return;
      const finalResult = deps.withProject((project) =>
        customComponentEdits.param.type.update(
          project,
          componentId,
          paramKey,
          paramType,
        ),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: finalResult.component.halComponentName,
        paramName: finalResult.paramName,
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
      if (!param || param.direction === paramDirection) return;
      const finalResult = deps.withProject((project) =>
        customComponentEdits.param.direction.update(
          project,
          componentId,
          paramKey,
          paramDirection,
        ),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: finalResult.component.halComponentName,
        paramName: finalResult.paramName,
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
      if (!param || (param.defaultValue ?? "") === defaultValue) return;
      const finalResult = deps.withProject((project) =>
        customComponentEdits.param.defaultValue.update(
          project,
          componentId,
          paramKey,
          defaultValue,
        ),
      );
      if (finalResult === null) return;
      deps.setStatusT("store.status.updatedCustomComponentParam", {
        componentName: finalResult.component.halComponentName,
        paramName: finalResult.paramName,
      });
    },

    addHalThread(): void {
      deps.withProject((project) => {
        addHalThread(project);
      });
      deps.setStatusT("store.status.addedHalThread");
    },

    removeHalThread(threadId: string): void {
      const finalResult = deps.withProject((project) =>
        removeHalThread(project, threadId),
      );
      if (!finalResult.ok && finalResult.reason === "last-thread") {
        deps.setStatusT("store.status.cannotRemoveLastHalThread");
        return;
      }
      if (!finalResult.ok && finalResult.reason === "required-thread") {
        deps.setStatusT("store.status.cannotRemoveRequiredHalThread", {
          name: finalResult.thread.name,
        });
        return;
      }
      if (finalResult.ok) {
        deps.setStatusT("store.status.removedHalThread", {
          name: finalResult.thread.name,
        });
      }
    },

    updateHalThreadName(threadId: string, name: string): void {
      const trimmed = name.trim();
      if (!trimmed) return;
      const finalResult = deps.withProject((project) =>
        updateHalThreadName(project, threadId, trimmed),
      );
      if (
        !finalResult.ok &&
        finalResult.reason === "required-thread" &&
        finalResult.thread
      ) {
        deps.setStatusT("store.status.cannotRenameRequiredHalThread", {
          name: finalResult.thread.name,
        });
        return;
      }
      if (!finalResult.ok && finalResult.reason === "duplicate-name") {
        deps.setStatusT("store.status.duplicateHalThreadName", {
          name: trimmed,
        });
        return;
      }
      if (finalResult.ok && finalResult.changed) {
        deps.setStatusT("store.status.updatedHalThreadName", { name: trimmed });
      }
    },

    updateHalThreadPeriodNs(threadId: string, periodNs: number): void {
      const result = deps.withProject((project) =>
        updateHalThreadPeriodNs(project, threadId, periodNs),
      );
      if (result === null || !result.changed) return;
      deps.setStatusT("store.status.updatedHalThreadPeriod", {
        name: result.thread.name,
      });
    },

    updateHalThreadFloatMode(threadId: string, floatMode: "fp" | "nofp"): void {
      const finalResult = deps.withProject((project) =>
        updateHalThreadFloatMode(project, threadId, floatMode),
      );
      if (
        !finalResult.ok &&
        finalResult.reason === "required-thread-forced-fp"
      ) {
        deps.setStatusT("store.status.requiredHalThreadForcedFp", {
          name: finalResult.thread.name,
        });
        return;
      }
      if (finalResult.ok && finalResult.changed) {
        deps.setStatusT("store.status.updatedHalThreadFloatMode", {
          name: finalResult.thread.name,
          mode: floatMode,
        });
      }
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
      deps.withProject((project) => {
        updateMotmodNumericConfig(project, key, value);
      });
      deps.setStatusT("store.status.updatedMotmodConfig");
    },

    syncMotmodManagedProjection(): void {
      const finalResult = deps.withProject((project) =>
        syncMotmodManagedProjection(project),
      );
      if (!finalResult.changed) {
        deps.setStatusT("store.status.motmodProjectionAlreadyInSync");
        return;
      }
      deps.setStatusT("store.status.syncedMotmodProjection", {
        added: finalResult.plan.addNodes.length,
        removed: finalResult.plan.removeNodes.length,
        adopted: finalResult.plan.adoptNodes.length,
        ensured: finalResult.plan.ensureComponents.length,
        updated: finalResult.plan.updateNodeConfigs.length,
      });
    },
  };
}
