import type {
  HalValueType,
  NoHALProject,
  ProjectWireLayerPosition,
  ProjectWireStyle,
} from "@nohal/core";
import { matchFailure } from "@nohal/core";
import {
  customComponentEdits,
  findHalComponentNameConflict,
  nextHalComponentName,
} from "@nohal/core/customComponent";
import { CUSTOM_COMPONENT_STORE_SOURCE_ID } from "@nohal/core/customComponentStore";
import {
  addHalThread,
  removeHalThread,
  updateHalThreadFloatMode,
  updateHalThreadName,
  updateHalThreadPeriodNs,
} from "@nohal/core/halThread";
import type { LinuxCncVersion } from "@nohal/core/linuxcncVersion";
import {
  syncMotmodManagedProjection,
  updateMotmodNumericConfig,
} from "@nohal/core/motmod";
import { type ProjectReadResult, projectEdits } from "@nohal/core/project";
import { unwrap } from "solid-js/store";
import type { TranslationKey } from "../../../i18n";
import {
  applyComponentStoreEntryToProject,
  repointComponentDefinitionId,
  toErrorMessage,
} from "../helpers";
import type { EditorStoreActionContext } from "./types";

interface ProjectTransition {
  project: NoHALProject;
  projectPath: string | null;
  status: string;
  warnings?: string[];
}

function openedProjectPathStatus(
  deps: EditorStoreActionContext,
  projectPath: string,
): string {
  return deps.t("store.status.openedProjectPath", { projectPath });
}

function projectTransitionFromOpenedResult(
  deps: EditorStoreActionContext,
  result: ProjectReadResult,
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
  const halThreadName = (threadId: string): string | null =>
    deps.state.project.halThreads?.find((thread) => thread.id === threadId)
      ?.name ?? null;

  const setSelectedComponentNotCustomStatus = (): void => {
    deps.setStatusT("store.status.selectedComponentNotCustom");
  };

  const ensureHalComponentNameAvailable = (
    halComponentName: string,
    excludeComponentIds?: readonly string[],
  ): boolean => {
    const conflict = findHalComponentNameConflict({
      halComponentName,
      project: deps.state.project,
      componentStore: deps.state.componentStore,
      excludeComponentIds,
    });
    if (!conflict) return true;
    deps.setStatusT("store.status.duplicateHalComponentName", {
      componentName: halComponentName,
    });
    return false;
  };

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
      deps
        .withProjectResult((project) =>
          projectEdits.project.name.update(project, name),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedProjectName", {
              name: data,
            });
          },
          () => {},
        );
    },

    updateProjectShutdown(shutdown: string): void {
      deps
        .withProjectResult((project) =>
          projectEdits.project.shutdown.update(project, shutdown),
        )
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedProjectShutdown");
          },
          () => {},
        );
    },

    updateProjectWireLayerPosition(position: ProjectWireLayerPosition): void {
      deps
        .withProjectResult((project) =>
          projectEdits.project.wire.visibility.update(project, position),
        )
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedProjectWireLayerPosition", {
              position: wireVisibilityLabel(deps, position),
            });
          },
          () => {},
        );
    },

    updateProjectWireStyle(style: ProjectWireStyle): void {
      deps
        .withProjectResult((project) =>
          projectEdits.project.wire.style.update(project, style),
        )
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedProjectWireStyle", {
              style: wireStyleLabel(deps, style),
            });
          },
          () => {},
        );
    },

    updateProjectHalNameLen(halNameLen: number): void {
      deps
        .withProjectResult((project) =>
          projectEdits.project.halNameLen.update(project, halNameLen),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedProjectHalNameLen", {
              value: data,
            });
          },
          () => {},
        );
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
      const halComponentName = nextHalComponentName({
        project: deps.state.project,
        componentStore: deps.state.componentStore,
      });
      deps.withProject((project) => {
        const component = customComponentEdits.add(project, {
          halComponentName,
        });
        createdId = component.id;
        componentName = component.halComponentName;
      });
      deps.setStatusT("store.status.addedCustomComponent", {
        componentName,
      });
      return createdId;
    },

    removeCustomComponent(componentId: string): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.remove(project, componentId),
        )
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.removedCustomComponent", {
              componentName: data.componentName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  deps.setStatusT("store.status.selectedComponentNotCustom");
                },
              },
              "in-use": {
                "placed-component": (failure) => {
                  deps.setStatusT(
                    "store.status.cannotRemoveCustomComponentInUse",
                    {
                      componentName: failure.componentName,
                      count: failure.usageCount,
                    },
                  );
                },
              },
            });
          },
        );
    },

    updateCustomComponentHalComponentName(
      componentId: string,
      halComponentName: string,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.halComponentName.update(
            project,
            componentId,
            halComponentName,
            { componentStore: deps.state.componentStore },
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponent", {
              componentName: data.halComponentName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
              conflict: {
                "duplicate-name": () => {
                  deps.setStatusT("store.status.duplicateHalComponentName", {
                    componentName: halComponentName.trim(),
                  });
                },
              },
            });
          },
        );
    },

    updateCustomComponentRuntimeKind(
      componentId: string,
      runtimeKind: "rt" | "userspace" | "unknown",
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.runtimeKind.update(
            project,
            componentId,
            runtimeKind,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponent", {
              componentName: data.halComponentName,
            });
          },
          () => {
            setSelectedComponentNotCustomStatus();
          },
        );
    },

    updateCustomComponentLoadCommand(
      componentId: string,
      loadCommand: string,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.loadCommand.update(
            project,
            componentId,
            loadCommand,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentLoad", {
              componentName: data.halComponentName,
            });
          },
          () => {
            setSelectedComponentNotCustomStatus();
          },
        );
    },

    updateCustomComponentMaxInstances(
      componentId: string,
      maxInstances: number | undefined,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.maxInstances.update(
            project,
            componentId,
            maxInstances,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponent", {
              componentName: data.halComponentName,
            });
          },
          () => {
            setSelectedComponentNotCustomStatus();
          },
        );
    },

    addCustomComponentPin(componentId: string): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.pin.add(project, componentId),
        )
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.addedCustomComponentPin", {
              componentName: data.component.halComponentName,
            });
          },
          () => {
            setSelectedComponentNotCustomStatus();
          },
        );
    },

    removeCustomComponentPin(componentId: string, pinKey: string): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.pin.remove(project, componentId, pinKey),
        )
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.removedCustomComponentPin", {
              componentName: data.component.halComponentName,
              pinName: data.pinName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentPinName(
      componentId: string,
      pinKey: string,
      pinName: string,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.pin.name.update(
            project,
            componentId,
            pinKey,
            pinName,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentPin", {
              componentName: data.component.halComponentName,
              pinName: data.pinName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentPinType(
      componentId: string,
      pinKey: string,
      pinType: HalValueType,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.pin.type.update(
            project,
            componentId,
            pinKey,
            pinType,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentPin", {
              componentName: data.component.halComponentName,
              pinName: data.pinName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentPinDirection(
      componentId: string,
      pinKey: string,
      direction: "in" | "out" | "io",
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.pin.direction.update(
            project,
            componentId,
            pinKey,
            direction,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentPinDirection", {
              componentName: data.component.halComponentName,
              pinName: data.pinName,
              direction,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    addCustomComponentParam(componentId: string): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.param.add(project, componentId),
        )
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.addedCustomComponentParam", {
              componentName: data.component.halComponentName,
            });
          },
          () => {
            setSelectedComponentNotCustomStatus();
          },
        );
    },

    removeCustomComponentParam(componentId: string, paramKey: string): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.param.remove(project, componentId, paramKey),
        )
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.removedCustomComponentParam", {
              componentName: data.component.halComponentName,
              paramName: data.paramName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentParamName(
      componentId: string,
      paramKey: string,
      paramName: string,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.param.name.update(
            project,
            componentId,
            paramKey,
            paramName,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentParam", {
              componentName: data.component.halComponentName,
              paramName: data.paramName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentParamType(
      componentId: string,
      paramKey: string,
      paramType: HalValueType,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.param.type.update(
            project,
            componentId,
            paramKey,
            paramType,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentParam", {
              componentName: data.component.halComponentName,
              paramName: data.paramName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentParamDirection(
      componentId: string,
      paramKey: string,
      paramDirection: "r" | "rw",
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.param.direction.update(
            project,
            componentId,
            paramKey,
            paramDirection,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentParam", {
              componentName: data.component.halComponentName,
              paramName: data.paramName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentParamDefaultValue(
      componentId: string,
      paramKey: string,
      defaultValue: string,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.param.defaultValue.update(
            project,
            componentId,
            paramKey,
            defaultValue,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentParam", {
              componentName: data.component.halComponentName,
              paramName: data.paramName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    addCustomComponentFunction(componentId: string): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.function.add(project, componentId),
        )
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.addedCustomComponentFunction", {
              componentName: data.component.halComponentName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    removeCustomComponentFunction(
      componentId: string,
      functionKey: string,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.function.remove(
            project,
            componentId,
            functionKey,
          ),
        )
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.removedCustomComponentFunction", {
              componentName: data.component.halComponentName,
              functionName: data.functionName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentFunctionName(
      componentId: string,
      functionKey: string,
      functionName: string,
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.function.name.update(
            project,
            componentId,
            functionKey,
            functionName,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentFunction", {
              componentName: data.component.halComponentName,
              functionName: data.functionName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    updateCustomComponentFunctionFloatMode(
      componentId: string,
      functionKey: string,
      floatMode: "fp" | "nofp" | "unknown",
    ): void {
      deps
        .withProjectResult((project) =>
          customComponentEdits.function.floatMode.update(
            project,
            componentId,
            functionKey,
            floatMode,
          ),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedCustomComponentFunction", {
              componentName: data.component.halComponentName,
              functionName: data.functionName,
            });
          },
          (error) => {
            matchFailure(error, {
              "not-found": {
                "custom-component": () => {
                  setSelectedComponentNotCustomStatus();
                },
              },
            });
          },
        );
    },

    async promoteCustomComponentToStore(
      componentId: string,
    ): Promise<string | null> {
      const component = deps.state.project.library.components[componentId];
      if (
        !component ||
        component.source === "comp" ||
        deps.state.componentStore.components[componentId]
      ) {
        deps.setStatusT("store.status.selectedComponentNotCustom");
        return null;
      }

      if (
        !ensureHalComponentNameAvailable(component.halComponentName, [
          componentId,
        ])
      ) {
        return null;
      }

      try {
        const entry = await window.nohal.promoteProjectCustomComponentToStore(
          structuredClone(unwrap(component)),
        );
        let repointed = 0;

        deps.clearHistory();
        deps.withComponentStore((componentStore) => {
          componentStore.sources[CUSTOM_COMPONENT_STORE_SOURCE_ID] ??= {
            id: CUSTOM_COMPONENT_STORE_SOURCE_ID,
            kind: "manual",
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
          };
          componentStore.components[entry.componentId] = entry;
        });
        deps.withProject(
          (project) => {
            repointed = repointComponentDefinitionId(
              project,
              componentId,
              entry.componentId,
            );
            applyComponentStoreEntryToProject(project, entry);
            delete project.library.components[componentId];
          },
          { recordHistory: false, markDirty: true },
        );
        deps.setStatusT("store.status.promotedCustomComponentToStore", {
          componentName: entry.parsed.halComponentName,
          count: repointed,
        });
        return entry.componentId;
      } catch (error) {
        deps.setStatusT("store.status.storeComponentMutationFailed", {
          error: toErrorMessage(error),
        });
        return null;
      }
    },

    addHalThread(): void {
      deps.withProject((project) => {
        addHalThread(project);
      });
      deps.setStatusT("store.status.addedHalThread");
    },

    removeHalThread(threadId: string): void {
      deps
        .withProjectResult((project) => removeHalThread(project, threadId))
        .match(
          ({ data }) => {
            deps.setStatusT("store.status.removedHalThread", {
              name: data.name,
            });
          },
          (error) => {
            matchFailure(error, {
              forbidden: {
                "last-thread": () => {
                  deps.setStatusT("store.status.cannotRemoveLastHalThread");
                },
                "required-thread": () => {
                  deps.setStatusT(
                    "store.status.cannotRemoveRequiredHalThread",
                    {
                      name: halThreadName(threadId) ?? threadId,
                    },
                  );
                },
              },
            });
          },
        );
    },

    updateHalThreadName(threadId: string, name: string): void {
      deps
        .withProjectResult((project) =>
          updateHalThreadName(project, threadId, name),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedHalThreadName", {
              name: data.name,
            });
          },
          (error) => {
            matchFailure(error, {
              forbidden: {
                "required-thread": () => {
                  deps.setStatusT(
                    "store.status.cannotRenameRequiredHalThread",
                    {
                      name: halThreadName(threadId) ?? threadId,
                    },
                  );
                },
              },
              conflict: {
                "duplicate-name": () => {
                  deps.setStatusT("store.status.duplicateHalThreadName", {
                    name: name.trim(),
                  });
                },
              },
            });
          },
        );
    },

    updateHalThreadPeriodNs(threadId: string, periodNs: number): void {
      deps
        .withProjectResult((project) =>
          updateHalThreadPeriodNs(project, threadId, periodNs),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedHalThreadPeriod", {
              name: data.name,
            });
          },
          () => {},
        );
    },

    updateHalThreadFloatMode(threadId: string, floatMode: "fp" | "nofp"): void {
      deps
        .withProjectResult((project) =>
          updateHalThreadFloatMode(project, threadId, floatMode),
        )
        .match(
          ({ data, changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedHalThreadFloatMode", {
              name: data.name,
              mode: floatMode,
            });
          },
          (error) => {
            matchFailure(error, {
              forbidden: {
                "forced-fp": () => {
                  deps.setStatusT("store.status.requiredHalThreadForcedFp", {
                    name: halThreadName(threadId) ?? threadId,
                  });
                },
              },
            });
          },
        );
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
      deps
        .withProjectResult((project) =>
          updateMotmodNumericConfig(project, key, value),
        )
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedMotmodConfig");
          },
          () => {},
        );
    },

    syncMotmodManagedProjection(): void {
      deps
        .withProjectResult((project) => syncMotmodManagedProjection(project))
        .match(
          ({ data, changed }) => {
            if (!changed) {
              deps.setStatusT("store.status.motmodProjectionAlreadyInSync");
              return;
            }
            deps.setStatusT("store.status.syncedMotmodProjection", {
              added: data.addNodes.length,
              removed: data.removeNodes.length,
              adopted: data.adoptNodes.length,
              ensured: data.ensureComponents.length,
              updated: data.updateNodeConfigs.length,
            });
          },
          () => {
            deps.setStatusT("store.status.motmodProjectionAlreadyInSync");
          },
        );
    },
  };
}
