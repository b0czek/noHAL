import type { FailureMatcher } from "@nohal/core";
import { getSheet, getSheetReferenceLocations } from "@nohal/core/graph";
import type { SheetItemIds } from "@nohal/core/sheet";
import { sheetModelEdits } from "@nohal/core/sheet";
import type { SheetAddfQueueStoredEntry, XY } from "@nohal/core/types";
import { cloneProject, findNode, syncProjectUi } from "../helpers";
import { selectionIdBuckets } from "../selection";
import {
  type ActionStatusUpdate,
  createFailureReporter,
  type ExtractActionFailuresDeep,
} from "./actionFailureTypes";
import type { EditorSelection, EditorStoreActionContext } from "./types";

export function createSheetActions(deps: EditorStoreActionContext) {
  type SheetActionFailure = ExtractActionFailuresDeep<typeof sheetModelEdits>;

  const sheetActionFailureMatcher: FailureMatcher<
    SheetActionFailure,
    ActionStatusUpdate
  > = {
    "not-found": {
      sheet: {
        _: "store.status.componentNodeEditTargetMissing",
      },
      label: {
        _: "store.status.componentNodeEditTargetMissing",
      },
    },
    "invalid-input": {
      label: {
        "not-convertible": "store.status.cannotConvertLabelToSheetPort",
      },
      selection: {
        "no-movable-items": "store.status.cannotSubsheetEmptySelection",
        "only-ports": "store.status.cannotSubsheetOnlyPortsSelection",
        "target-in-items": "store.status.cannotMoveSelectionIntoSameSubsheet",
      },
      "sheet-definition-name": {
        "empty-name": "store.status.sheetDefinitionNameRequired",
      },
    },
    conflict: {
      "sheet-definition-name": {
        "duplicate-name": (failure) => [
          "store.status.duplicateSheetDefinitionName",
          { name: failure.meta.name },
        ],
      },
    },
    forbidden: {
      selection: {
        "protected-system-node":
          "store.status.cannotSubsheetSystemManagedComponent",
      },
      "sheet-reference": {
        "protected-system-sheet": "store.status.cannotDeleteSystemSheet",
      },
      "sheet-definition": {
        "root-sheet": "store.status.cannotDeleteRootSheet",
        "protected-system-sheet": "store.status.cannotDeleteSystemSheet",
      },
    },
  };
  const reportSheetActionFailure = createFailureReporter(
    deps,
    sheetActionFailureMatcher,
  );

  const setActiveSheet = (sheetId: string): void => {
    if (!deps.state.project.sheets[sheetId]) return;
    deps.setState("activeSheetId", sheetId);
    deps.setProjectUiActiveSheetId(sheetId);
    deps.clearSelectionAndPendingUi();
  };

  const resolveSheetMoveSelection = (
    selection: EditorSelection,
  ): SheetItemIds => {
    const resolved = selectionIdBuckets(selection);
    return (
      resolved ?? {
        nodeIds: new Set<string>(),
        labelIds: new Set<string>(),
        portIds: new Set<string>(),
      }
    );
  };

  const commitProjectEdit = (
    next: EditorStoreActionContext["state"]["project"],
    activeSheetId = deps.state.activeSheetId,
  ): void => {
    syncProjectUi(next, activeSheetId);
    deps.pushUndoSnapshot();
    deps.setState("project", next);
    deps.markProjectChanged();
  };

  const detachSheetReferenceAt = (
    parentSheetId: string,
    nodeId: string,
  ): string | null => {
    let detachedSheetId: string | null = null;

    deps
      .withProjectResult((project) =>
        sheetModelEdits.reference.detach(project, parentSheetId, nodeId),
      )
      .match(({ data }) => {
        detachedSheetId = data.detachedSheet.id;
        deps.setStatusT("store.status.detachedSheetReference", {
          name: data.detachedSheet.name,
        });
      }, reportSheetActionFailure);

    return detachedSheetId;
  };

  return {
    renameSheetDefinition(sheetId: string, name: string): void {
      deps
        .withProjectResult((project) =>
          sheetModelEdits.definition.rename(project, sheetId, name),
        )
        .match(({ data, changed }) => {
          if (!changed) return;
          deps.setStatusT("store.status.updatedSheetDefinitionName", {
            name: data.name,
          });
        }, reportSheetActionFailure);
    },

    addSheetThreadOutput(sheetId: string): void {
      deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        sheetModelEdits.threadOutput.add(sheet);
      });
      deps.setStatusT("store.status.addedSheetThreadOutput");
    },

    updateSheetThreadOutputName(
      sheetId: string,
      outputId: string,
      name: string,
    ): void {
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, sheetId);
          return sheetModelEdits.threadOutput.name.update(
            sheet,
            outputId,
            name,
          );
        })
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedSheetThreadOutputName");
          },
          () => {},
        );
    },

    updateSheetThreadOutputHalBinding(
      sheetId: string,
      outputId: string,
      halThreadId: string | null,
    ): void {
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, sheetId);
          return sheetModelEdits.threadOutput.halBinding.update(
            sheet,
            outputId,
            halThreadId,
          );
        })
        .match(
          ({ changed }) => {
            if (!changed) return;
            deps.setStatusT("store.status.updatedSheetThreadOutputHalBinding");
          },
          () => {},
        );
    },

    removeSheetThreadOutput(sheetId: string, outputId: string): void {
      deps
        .withProjectResult((project) => {
          const sheet = getSheet(project, sheetId);
          return sheetModelEdits.threadOutput.remove(sheet, outputId);
        })
        .match(
          () => {
            deps.setStatusT("store.status.removedSheetThreadOutput");
          },
          () => {},
        );
    },

    setSheetAddfQueue(
      sheetId: string,
      nodeOrder: SheetAddfQueueStoredEntry[],
    ): void {
      const normalized = deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        return sheetModelEdits.addfQueue.set(sheet, nodeOrder);
      });
      deps.setStatusT("store.status.updatedSheetAddfQueue", {
        count: normalized.length,
      });
    },

    setActiveSheet,

    addSheetDefinition(position?: XY): void {
      const next = cloneProject(deps.state.project);
      const result = sheetModelEdits.definition.add(
        next,
        deps.state.activeSheetId,
      );
      if (!result) return;
      if (position) result.node.position = { ...position };
      commitProjectEdit(next);
      deps.setStatusT("store.status.createdSubsheet", { name: result.name });
    },

    addSheetReference(sheetId: string, position?: XY): void {
      const next = cloneProject(deps.state.project);
      const result = sheetModelEdits.reference.add(
        next,
        deps.state.activeSheetId,
        sheetId,
      );
      if (!result) return;
      if (position) result.node.position = { ...position };
      commitProjectEdit(next);
      deps.setStatusT("store.status.createdSubsheet", {
        name: result.sheet.name,
      });
    },

    convertLabelToSheetPort(labelId: string): void {
      deps
        .withProjectResult((project) =>
          sheetModelEdits.label.convertToPort(
            project,
            deps.state.activeSheetId,
            labelId,
          ),
        )
        .match(({ data }) => {
          deps.setState("selection", {
            kind: "sheet-port",
            id: data.port.id,
          });
          deps.setStatusT("store.status.convertedLabelToSheetPort", {
            name: data.port.name,
          });
        }, reportSheetActionFailure);
    },

    putSelectionIntoSubsheet(): void {
      deps
        .withProjectResult((project) =>
          sheetModelEdits.items.moveIntoNewSubsheet(
            project,
            deps.state.activeSheetId,
            resolveSheetMoveSelection(deps.state.selection),
          ),
        )
        .match(({ data }) => {
          deps.setState("selection", { kind: "node", id: data.node.id });
          deps.clearPendingConnectionUi();
          deps.setStatusT("store.status.putSelectionIntoSubsheet", {
            name: data.name,
            ports: data.createdPortCount,
          });
        }, reportSheetActionFailure);
    },

    moveSelectionIntoSubsheetNode(subsheetNodeId: string): void {
      deps
        .withProjectResult((project) =>
          sheetModelEdits.items.moveIntoExistingSubsheet(
            project,
            deps.state.activeSheetId,
            subsheetNodeId,
            resolveSheetMoveSelection(deps.state.selection),
          ),
        )
        .match(({ data }) => {
          deps.setState("selection", { kind: "node", id: data.node.id });
          deps.clearPendingConnectionUi();
          deps.setStatusT("store.status.movedSelectionIntoSubsheet", {
            name: data.name,
            ports: data.createdPortCount,
          });
        }, reportSheetActionFailure);
    },

    deleteSheetDefinition(sheetId: string): void {
      const project = deps.state.project;
      const target = project.sheets[sheetId];
      if (!target) return;

      const next = cloneProject(project);
      const result = sheetModelEdits.definition.remove(
        next,
        sheetId,
        deps.state.activeSheetId,
      );
      if (result.isErr()) {
        reportSheetActionFailure(result.error);
        return;
      }

      const referenceCount = getSheetReferenceLocations(
        project,
        sheetId,
      ).length;
      if (
        typeof window !== "undefined" &&
        !window.confirm(
          deps.t("sidebar.confirmDeleteSheet", {
            name: target.name,
            count: referenceCount,
          }),
        )
      ) {
        return;
      }

      const { deletedSheetIds, deletedSheetName, nextActiveSheetId } =
        result.value.data;
      syncProjectUi(next, nextActiveSheetId);

      deps.pushUndoSnapshot();
      deps.setState("project", next);
      deps.markProjectChanged();
      deps.setState("activeSheetId", nextActiveSheetId);
      deps.clearSelectionAndPendingUi();
      deps.setStatusT("store.status.deletedSheet", {
        name: deletedSheetName,
        count: deletedSheetIds.length,
      });
    },

    deleteSheetReference(nodeId: string): void {
      deps
        .withProjectResult((project) =>
          sheetModelEdits.reference.remove(
            project,
            deps.state.activeSheetId,
            nodeId,
          ),
        )
        .match(() => {
          deps.clearSelectionAndPendingUi();
          deps.setStatusT("store.status.removedSelection");
        }, reportSheetActionFailure);
    },

    detachSheetReferenceAt,

    detachSheetReference(nodeId: string): string | null {
      return detachSheetReferenceAt(deps.state.activeSheetId, nodeId);
    },

    enterSelectedSheet(): void {
      const selection = deps.state.selection;
      if (!selection || selection.kind !== "node") return;
      const sheet = getSheet(deps.state.project, deps.state.activeSheetId);
      const node = findNode(sheet, selection.id);
      if (!node || node.kind !== "sheet") return;
      setActiveSheet(node.sheetId);
    },

    goToParentSheet(): void {
      const [reference] = getSheetReferenceLocations(
        deps.state.project,
        deps.state.activeSheetId,
      );
      if (!reference) return;
      setActiveSheet(reference.parentSheetId);
    },
  };
}
