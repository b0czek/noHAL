import { getSheet, getSheetReferenceLocations } from "@nohal/core/graph";
import type {
  MoveSheetItemsFailureReason,
  SheetItemIds,
} from "@nohal/core/sheet";
import { sheetModelEdits } from "@nohal/core/sheet";
import type { SheetAddfQueueStoredEntry, XY } from "@nohal/core/types";
import { cloneProject, findNode, syncProjectUi } from "../helpers";
import { selectionIdBuckets } from "../selection";
import type { EditorSelection, EditorStoreActionContext } from "./types";

export function createSheetActions(deps: EditorStoreActionContext) {
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

  const setSelectionMoveFailureStatus = (
    reason: MoveSheetItemsFailureReason,
  ): void => {
    if (reason === "no-movable-items") {
      deps.setStatusT("store.status.cannotSubsheetEmptySelection");
    } else if (reason === "only-ports") {
      deps.setStatusT("store.status.cannotSubsheetOnlyPortsSelection");
    } else if (reason === "protected-system-node") {
      deps.setStatusT("store.status.cannotSubsheetSystemManagedComponent");
    } else if (reason === "target-in-items") {
      deps.setStatusT("store.status.cannotMoveSelectionIntoSameSubsheet");
    }
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

  const commitSelectionMove = (
    next: EditorStoreActionContext["state"]["project"],
    activeSheetId: string,
    selectedSubsheetNodeId: string,
  ): void => {
    commitProjectEdit(next, activeSheetId);
    deps.setState("selection", { kind: "node", id: selectedSubsheetNodeId });
    deps.clearPendingConnectionUi();
  };

  const detachSheetReferenceAt = (
    parentSheetId: string,
    nodeId: string,
  ): string | null => {
    const next = cloneProject(deps.state.project);
    const result = sheetModelEdits.reference.detach(
      next,
      parentSheetId,
      nodeId,
    );
    if (!result.ok) {
      if (result.reason === "protected-system-sheet") {
        deps.setStatusT("store.status.cannotDeleteSystemSheet");
      }
      return null;
    }
    commitProjectEdit(next);
    deps.setStatusT("store.status.detachedSheetReference", {
      name: result.detachedSheet.name,
    });
    return result.detachedSheet.id;
  };

  return {
    renameSheetDefinition(sheetId: string, name: string): void {
      const trimmed = name.trim();
      const result = deps.withProject((project) =>
        sheetModelEdits.definition.rename(project, sheetId, trimmed),
      );
      if (!result.ok && result.reason === "empty-name") {
        deps.setStatusT("store.status.sheetDefinitionNameRequired");
        return;
      }
      if (!result.ok && result.reason === "duplicate-name") {
        deps.setStatusT("store.status.duplicateSheetDefinitionName", {
          name: trimmed,
        });
        return;
      }
      if (!result.ok || !result.changed) return;
      deps.setStatusT("store.status.updatedSheetDefinitionName", {
        name: result.sheet.name,
      });
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
      const trimmed = name.trim();
      if (!trimmed) return;
      const result = deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        return sheetModelEdits.threadOutput.name.update(
          sheet,
          outputId,
          trimmed,
        );
      });
      if (!result.ok) return;
      deps.setStatusT("store.status.updatedSheetThreadOutputName");
    },

    updateSheetThreadOutputHalBinding(
      sheetId: string,
      outputId: string,
      halThreadId: string | null,
    ): void {
      const result = deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        return sheetModelEdits.threadOutput.halBinding.update(
          sheet,
          outputId,
          halThreadId,
        );
      });
      if (!result.ok) return;
      deps.setStatusT("store.status.updatedSheetThreadOutputHalBinding");
    },

    removeSheetThreadOutput(sheetId: string, outputId: string): void {
      const result = deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        return sheetModelEdits.threadOutput.remove(sheet, outputId);
      });
      if (!result.ok) return;
      deps.setStatusT("store.status.removedSheetThreadOutput");
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

    putSelectionIntoSubsheet(): void {
      const next = cloneProject(deps.state.project);
      const moveResult = sheetModelEdits.items.moveIntoNewSubsheet(
        next,
        deps.state.activeSheetId,
        resolveSheetMoveSelection(deps.state.selection),
      );
      if (!moveResult.ok) {
        setSelectionMoveFailureStatus(moveResult.reason);
        return;
      }

      commitSelectionMove(next, deps.state.activeSheetId, moveResult.node.id);
      deps.setStatusT("store.status.putSelectionIntoSubsheet", {
        name: moveResult.name,
        ports: moveResult.createdPortCount,
      });
    },

    moveSelectionIntoSubsheetNode(subsheetNodeId: string): void {
      const next = cloneProject(deps.state.project);
      const moveResult = sheetModelEdits.items.moveIntoExistingSubsheet(
        next,
        deps.state.activeSheetId,
        subsheetNodeId,
        resolveSheetMoveSelection(deps.state.selection),
      );
      if (!moveResult.ok) {
        setSelectionMoveFailureStatus(moveResult.reason);
        return;
      }

      commitSelectionMove(next, deps.state.activeSheetId, moveResult.node.id);
      deps.setStatusT("store.status.movedSelectionIntoSubsheet", {
        name: moveResult.name,
        ports: moveResult.createdPortCount,
      });
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
      if (!result.ok) {
        if (result.reason === "root-sheet") {
          deps.setStatusT("store.status.cannotDeleteRootSheet");
        } else if (result.reason === "protected-system-sheet") {
          deps.setStatusT("store.status.cannotDeleteSystemSheet");
        }
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

      const nextActiveSheetId = result.nextActiveSheetId;
      syncProjectUi(next, nextActiveSheetId);

      deps.pushUndoSnapshot();
      deps.setState("project", next);
      deps.markProjectChanged();
      deps.setState("activeSheetId", nextActiveSheetId);
      deps.clearSelectionAndPendingUi();
      deps.setStatusT("store.status.deletedSheet", {
        name: result.deletedSheetName,
        count: result.deletedSheetIds.length,
      });
    },

    deleteSheetReference(nodeId: string): void {
      const currentSheetId = deps.state.activeSheetId;
      const next = cloneProject(deps.state.project);
      const removed = sheetModelEdits.reference.remove(
        next,
        currentSheetId,
        nodeId,
      );
      if (!removed.ok) {
        if (removed.reason === "protected-system-sheet") {
          deps.setStatusT("store.status.cannotDeleteSystemSheet");
        }
        return;
      }
      commitProjectEdit(next);
      deps.clearSelectionAndPendingUi();
      deps.setStatusT("store.status.removedSelection");
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
