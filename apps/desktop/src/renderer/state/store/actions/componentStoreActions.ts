import {
  customComponentDefinitionEdits,
  findHalComponentNameConflict,
  nextHalComponentName,
} from "@nohal/core/customComponent";
import type {
  ComponentStore,
  ComponentStoreEntry,
  HalValueType,
  ImportedComponentDefinition,
} from "@nohal/core/types";
import { unwrap } from "solid-js/store";
import type { TranslationKey } from "../../../i18n";
import {
  applyComponentStoreEntryToProject,
  cloneComponentStore,
  getComponentSourceDisplayLabel,
  pruneMissingStoredComponentsFromProject,
  toErrorMessage,
} from "../helpers";
import type { EditorStoreActionContext } from "./types";

interface ImportError {
  filePath: string;
  error: string;
}

interface ComponentSourceMutationResult {
  entries: readonly unknown[];
  removedComponentIds: readonly string[];
  errors: readonly ImportError[];
}

function reportComponentSourceMutation(
  deps: EditorStoreActionContext,
  statusKey: TranslationKey,
  componentStore: ComponentStore,
  sourceId: string,
  result: ComponentSourceMutationResult,
): void {
  deps.setStatusT(statusKey, {
    path: getComponentSourceDisplayLabel(componentStore, sourceId),
    components: result.entries.length,
    removed: result.removedComponentIds.length,
    errors: result.errors.length,
  });
  deps.setImportErrorWarnings(result.errors);
}

function defaultStoreCustomStatusParams(
  component: ImportedComponentDefinition,
) {
  return {
    componentName: component.halComponentName,
  };
}

export function createComponentStoreActions(deps: EditorStoreActionContext) {
  const findManualStoreEntry = (
    componentId: string,
  ): ComponentStoreEntry | null => {
    const entry = deps.state.componentStore.components[componentId];
    if (!entry || entry.sourceRef.kind !== "manual") return null;
    return entry;
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

  const syncStoreEntryLocally = (entry: ComponentStoreEntry): void => {
    deps.clearHistory();
    deps.withComponentStore((componentStore) => {
      componentStore.components[entry.componentId] = entry;
    });
    deps.withProject(
      (project) => {
        applyComponentStoreEntryToProject(project, entry);
      },
      { recordHistory: false },
    );
  };

  const removeStoreEntryLocally = (componentId: string): void => {
    const nextComponentStore = cloneComponentStore(deps.state.componentStore);
    delete nextComponentStore.components[componentId];

    deps.clearHistory();
    deps.withComponentStore((componentStore) => {
      delete componentStore.components[componentId];
    });
    deps.withProject(
      (project) => {
        pruneMissingStoredComponentsFromProject(project, nextComponentStore);
      },
      { recordHistory: false },
    );
  };

  const persistUpdatedManualComponent = async (
    componentId: string,
    component: ImportedComponentDefinition,
    statusKey: TranslationKey,
    params: Record<string, string | number | boolean | null | undefined>,
  ): Promise<boolean> => {
    try {
      const entry = await window.nohal.updateManualComponentInStore(
        componentId,
        component,
      );
      syncStoreEntryLocally(entry);
      deps.setStatusT(statusKey, params);
      return true;
    } catch (error) {
      deps.setStatusT("store.status.storeComponentMutationFailed", {
        error: toErrorMessage(error),
      });
      return false;
    }
  };

  const mutateManualStoreComponent = async (
    componentId: string,
    mutate: (component: ImportedComponentDefinition) => boolean,
    statusKey: TranslationKey,
    params: (
      component: ImportedComponentDefinition,
    ) => Record<string, string | number | boolean | null | undefined>,
  ): Promise<boolean> => {
    const entry = findManualStoreEntry(componentId);
    if (!entry) {
      deps.setStatusT("store.status.selectedComponentNotStoredCustom");
      return false;
    }

    const nextComponent = structuredClone(unwrap(entry.parsed));
    if (!mutate(nextComponent)) return false;
    return persistUpdatedManualComponent(
      componentId,
      nextComponent,
      statusKey,
      params(nextComponent),
    );
  };

  return {
    async loadComponentStore(): Promise<void> {
      await deps.reloadComponentStoreState();
    },

    async importCompFile(): Promise<void> {
      const entry = await window.nohal.importCompFileToStore();
      if (!entry) return;
      await deps.reloadComponentStoreState();
      deps.setStatusT("store.status.importedCompToStore", {
        componentName: entry.parsed.halComponentName,
      });
    },

    async addStoreCustomComponent(): Promise<string | null> {
      try {
        const halComponentName = nextHalComponentName({
          project: deps.state.project,
          componentStore: deps.state.componentStore,
        });
        const entry =
          await window.nohal.addManualComponentToStore(halComponentName);
        syncStoreEntryLocally(entry);
        deps.setStatusT("store.status.addedCustomComponent", {
          componentName: entry.parsed.halComponentName,
        });
        return entry.componentId;
      } catch (error) {
        deps.setStatusT("store.status.storeComponentMutationFailed", {
          error: toErrorMessage(error),
        });
        return null;
      }
    },

    async removeStoreCustomComponent(componentId: string): Promise<void> {
      const entry = findManualStoreEntry(componentId);
      if (!entry) {
        deps.setStatusT("store.status.selectedComponentNotStoredCustom");
        return;
      }

      try {
        await window.nohal.removeManualComponentFromStore(componentId);
        removeStoreEntryLocally(componentId);
        deps.setStatusT("store.status.removedCustomComponent", {
          componentName: entry.parsed.halComponentName,
        });
      } catch (error) {
        deps.setStatusT("store.status.storeComponentMutationFailed", {
          error: toErrorMessage(error),
        });
      }
    },

    async updateStoreCustomComponentHalComponentName(
      componentId: string,
      halComponentName: string,
    ): Promise<void> {
      const normalized = halComponentName.trim();
      if (!normalized) return;
      if (!ensureHalComponentNameAvailable(normalized, [componentId])) return;

      await mutateManualStoreComponent(
        componentId,
        (component) =>
          customComponentDefinitionEdits.halComponentName.update(
            component,
            normalized,
          ),
        "store.status.updatedCustomComponent",
        (component) => ({
          componentName: component.halComponentName,
        }),
      );
    },

    async updateStoreCustomComponentRuntimeKind(
      componentId: string,
      runtimeKind: "rt" | "userspace" | "unknown",
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          customComponentDefinitionEdits.runtimeKind.update(
            component,
            runtimeKind,
          ),
        "store.status.updatedCustomComponent",
        defaultStoreCustomStatusParams,
      );
    },

    async updateStoreCustomComponentLoadCommand(
      componentId: string,
      loadCommand: string,
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          customComponentDefinitionEdits.loadCommand.update(
            component,
            loadCommand,
          ),
        "store.status.updatedCustomComponentLoad",
        defaultStoreCustomStatusParams,
      );
    },

    async updateStoreCustomComponentMaxInstances(
      componentId: string,
      maxInstances: number | undefined,
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          customComponentDefinitionEdits.maxInstances.update(
            component,
            maxInstances,
          ),
        "store.status.updatedCustomComponent",
        defaultStoreCustomStatusParams,
      );
    },

    async addStoreCustomComponentPin(componentId: string): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) => {
          customComponentDefinitionEdits.pin.add(component);
          return true;
        },
        "store.status.addedCustomComponentPin",
        defaultStoreCustomStatusParams,
      );
    },

    async removeStoreCustomComponentPin(
      componentId: string,
      pinKey: string,
    ): Promise<void> {
      const currentName =
        findManualStoreEntry(componentId)?.parsed.pins.find(
          (pin) => pin.key === pinKey,
        )?.name ?? pinKey;
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.pin.remove(component, pinKey),
        "store.status.removedCustomComponentPin",
        (component) => ({
          componentName: component.halComponentName,
          pinName: currentName,
        }),
      );
    },

    async updateStoreCustomComponentPinName(
      componentId: string,
      pinKey: string,
      pinName: string,
    ): Promise<void> {
      const normalized = pinName.trim();
      if (!normalized) return;

      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.pin.name.update(
            component,
            pinKey,
            normalized,
          ),
        "store.status.updatedCustomComponentPin",
        (component) => ({
          componentName: component.halComponentName,
          pinName:
            component.pins.find((pin) => pin.key === pinKey)?.name ??
            normalized,
        }),
      );
    },

    async updateStoreCustomComponentPinType(
      componentId: string,
      pinKey: string,
      pinType: HalValueType,
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.pin.type.update(
            component,
            pinKey,
            pinType,
          ),
        "store.status.updatedCustomComponentPin",
        (component) => ({
          componentName: component.halComponentName,
          pinName:
            component.pins.find((pin) => pin.key === pinKey)?.name ?? pinKey,
        }),
      );
    },

    async updateStoreCustomComponentPinDirection(
      componentId: string,
      pinKey: string,
      direction: "in" | "out" | "io",
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.pin.direction.update(
            component,
            pinKey,
            direction,
          ),
        "store.status.updatedCustomComponentPinDirection",
        (component) => ({
          componentName: component.halComponentName,
          pinName:
            component.pins.find((pin) => pin.key === pinKey)?.name ?? pinKey,
          direction,
        }),
      );
    },

    async addStoreCustomComponentParam(componentId: string): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) => {
          customComponentDefinitionEdits.param.add(component);
          return true;
        },
        "store.status.addedCustomComponentParam",
        defaultStoreCustomStatusParams,
      );
    },

    async removeStoreCustomComponentParam(
      componentId: string,
      paramKey: string,
    ): Promise<void> {
      const currentName =
        findManualStoreEntry(componentId)?.parsed.params.find(
          (param) => param.key === paramKey,
        )?.name ?? paramKey;
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.param.remove(component, paramKey),
        "store.status.removedCustomComponentParam",
        (component) => ({
          componentName: component.halComponentName,
          paramName: currentName,
        }),
      );
    },

    async updateStoreCustomComponentParamName(
      componentId: string,
      paramKey: string,
      paramName: string,
    ): Promise<void> {
      const normalized = paramName.trim();
      if (!normalized) return;

      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.param.name.update(
            component,
            paramKey,
            normalized,
          ),
        "store.status.updatedCustomComponentParam",
        (component) => ({
          componentName: component.halComponentName,
          paramName:
            component.params.find((param) => param.key === paramKey)?.name ??
            normalized,
        }),
      );
    },

    async updateStoreCustomComponentParamType(
      componentId: string,
      paramKey: string,
      paramType: HalValueType,
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.param.type.update(
            component,
            paramKey,
            paramType,
          ),
        "store.status.updatedCustomComponentParam",
        (component) => ({
          componentName: component.halComponentName,
          paramName:
            component.params.find((param) => param.key === paramKey)?.name ??
            paramKey,
        }),
      );
    },

    async updateStoreCustomComponentParamDirection(
      componentId: string,
      paramKey: string,
      paramDirection: "r" | "rw",
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.param.direction.update(
            component,
            paramKey,
            paramDirection,
          ),
        "store.status.updatedCustomComponentParam",
        (component) => ({
          componentName: component.halComponentName,
          paramName:
            component.params.find((param) => param.key === paramKey)?.name ??
            paramKey,
        }),
      );
    },

    async updateStoreCustomComponentParamDefaultValue(
      componentId: string,
      paramKey: string,
      defaultValue: string,
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.param.defaultValue.update(
            component,
            paramKey,
            defaultValue,
          ),
        "store.status.updatedCustomComponentParam",
        (component) => ({
          componentName: component.halComponentName,
          paramName:
            component.params.find((param) => param.key === paramKey)?.name ??
            paramKey,
        }),
      );
    },

    async addStoreCustomComponentFunction(componentId: string): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) => !!customComponentDefinitionEdits.function.add(component),
        "store.status.addedCustomComponentFunction",
        defaultStoreCustomStatusParams,
      );
    },

    async removeStoreCustomComponentFunction(
      componentId: string,
      functionKey: string,
    ): Promise<void> {
      const currentName =
        findManualStoreEntry(componentId)?.parsed.functions?.find(
          (fn) => fn.key === functionKey,
        )?.declaredName ?? functionKey;
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.function.remove(
            component,
            functionKey,
          ),
        "store.status.removedCustomComponentFunction",
        (component) => ({
          componentName: component.halComponentName,
          functionName: currentName,
        }),
      );
    },

    async updateStoreCustomComponentFunctionName(
      componentId: string,
      functionKey: string,
      functionName: string,
    ): Promise<void> {
      const normalized = functionName.trim();
      if (!normalized) return;

      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.function.name.update(
            component,
            functionKey,
            normalized,
          ),
        "store.status.updatedCustomComponentFunction",
        (component) => ({
          componentName: component.halComponentName,
          functionName:
            component.functions?.find((fn) => fn.key === functionKey)
              ?.declaredName ?? normalized,
        }),
      );
    },

    async updateStoreCustomComponentFunctionFloatMode(
      componentId: string,
      functionKey: string,
      floatMode: "fp" | "nofp" | "unknown",
    ): Promise<void> {
      await mutateManualStoreComponent(
        componentId,
        (component) =>
          !!customComponentDefinitionEdits.function.floatMode.update(
            component,
            functionKey,
            floatMode,
          ),
        "store.status.updatedCustomComponentFunction",
        (component) => ({
          componentName: component.halComponentName,
          functionName:
            component.functions?.find((fn) => fn.key === functionKey)
              ?.declaredName ?? functionKey,
        }),
      );
    },

    async addComponentDirSource(): Promise<void> {
      const result = await window.nohal.addCompDirSourceToStore();
      if (!result) return;
      const componentStore = await deps.reloadComponentStoreState();
      reportComponentSourceMutation(
        deps,
        "store.status.addedDirSource",
        componentStore,
        result.sourceId,
        result,
      );
    },

    async refreshComponentSource(sourceId: string): Promise<void> {
      try {
        const result =
          await window.nohal.refreshComponentSourceInStore(sourceId);
        const componentStore = await deps.reloadComponentStoreState();
        reportComponentSourceMutation(
          deps,
          "store.status.refreshedSource",
          componentStore,
          sourceId,
          result,
        );
      } catch (error) {
        deps.setStatusT("store.status.sourceRefreshFailed", {
          error: toErrorMessage(error),
        });
      }
    },

    async deleteComponentSource(sourceId: string): Promise<void> {
      try {
        const previousPath = getComponentSourceDisplayLabel(
          deps.state.componentStore,
          sourceId,
        );
        const result =
          await window.nohal.deleteComponentSourceFromStore(sourceId);
        await deps.reloadComponentStoreState();
        deps.setStatusT("store.status.deletedSource", {
          path: previousPath,
          removed: result.removedComponentIds.length,
        });
      } catch (error) {
        deps.setStatusT("store.status.deleteSourceFailed", {
          error: toErrorMessage(error),
        });
      }
    },
  };
}
