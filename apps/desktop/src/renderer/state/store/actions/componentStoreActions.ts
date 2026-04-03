import type { ComponentStore } from "@nohal/core/types";
import type { TranslationKey } from "../../../i18n";
import { getComponentSourceDisplayPath, toErrorMessage } from "../helpers";
import type { EditorStoreActionContext } from "./types";

interface ImportError {
  filePath: string;
  error: string;
}

interface ComponentSourceMutationResult {
  entries: ReadonlyArray<unknown>;
  removedComponentIds: ReadonlyArray<string>;
  errors: ReadonlyArray<ImportError>;
}

function reportComponentSourceMutation(
  deps: EditorStoreActionContext,
  statusKey: TranslationKey,
  componentStore: ComponentStore,
  sourceId: string,
  result: ComponentSourceMutationResult,
): void {
  deps.setStatusT(statusKey, {
    path: getComponentSourceDisplayPath(componentStore, sourceId),
    components: result.entries.length,
    removed: result.removedComponentIds.length,
    errors: result.errors.length,
  });
  deps.setImportErrorWarnings(result.errors);
}

export function createComponentStoreActions(deps: EditorStoreActionContext) {
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
        const previousPath = getComponentSourceDisplayPath(
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
