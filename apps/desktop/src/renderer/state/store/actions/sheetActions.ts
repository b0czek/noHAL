import { isSystemComponent } from "@nohal/core/src/componentSystem";
import { getSheet } from "@nohal/core/src/graph";
import { createId } from "@nohal/core/src/id";
import { createSheet } from "@nohal/core/src/project";
import {
  findSystemSheet,
  moveSelectionIntoSubsheet,
  sheetModelEdits,
} from "@nohal/core/src/sheet";
import type {
  SheetAddfQueueStoredEntry,
  SheetNode,
} from "@nohal/core/src/types";
import {
  cloneProject,
  ensureInstanceName,
  findNode,
  nextName,
  selectionBoundsForNodesAndLabels,
  syncProjectUi,
} from "../helpers";
import type { EditorSelection, EditorStoreActionContext } from "./types";

export function createSheetActions(deps: EditorStoreActionContext) {
  const isSystemManagedProtectedNode = (
    project: EditorStoreActionContext["state"]["project"],
    node: { kind: string; componentId?: string },
  ): boolean =>
    node.kind === "component" &&
    !!(
      node.componentId &&
      isSystemComponent(project.library.components[node.componentId])
    );
  const isProtectedSystemSheet = (
    project: EditorStoreActionContext["state"]["project"],
    sheetId: string,
  ): boolean => findSystemSheet(project)?.id === sheetId;

  const setActiveSheet = (sheetId: string): void => {
    if (!deps.state.project.sheets[sheetId]) return;
    deps.setState("activeSheetId", sheetId);
    deps.setProjectUiActiveSheetId(sheetId);
    deps.clearSelectionAndPendingUi();
  };

  const resolveSheetMoveSelection = (
    selection: EditorSelection,
  ): {
    nodeIds: Set<string>;
    labelIds: Set<string>;
    portIds: Set<string>;
  } | null => {
    if (!selection) return null;
    if (selection.kind === "node") {
      return {
        nodeIds: new Set([selection.id]),
        labelIds: new Set(),
        portIds: new Set(),
      };
    }
    if (selection.kind === "label") {
      return {
        nodeIds: new Set(),
        labelIds: new Set([selection.id]),
        portIds: new Set(),
      };
    }
    if (selection.kind === "sheet-port") {
      return {
        nodeIds: new Set(),
        labelIds: new Set(),
        portIds: new Set([selection.id]),
      };
    }
    if (selection.kind !== "multi") return null;
    return {
      nodeIds: new Set(selection.nodeIds),
      labelIds: new Set(selection.labelIds),
      portIds: new Set(selection.portIds),
    };
  };

  const prepareSelectionMove = (selection: EditorSelection) => {
    const resolved = resolveSheetMoveSelection(selection);
    if (!resolved) {
      deps.setStatusT("store.status.cannotSubsheetEmptySelection");
      return null;
    }

    const { nodeIds, labelIds, portIds } = resolved;
    if (nodeIds.size === 0 && labelIds.size === 0 && portIds.size > 0) {
      deps.setStatusT("store.status.cannotSubsheetOnlyPortsSelection");
      return null;
    }

    const activeSheetId = deps.state.activeSheetId;
    const currentProject = deps.state.project;
    const next = cloneProject(currentProject);
    const parentSheet = next.sheets[activeSheetId];
    if (!parentSheet) return null;

    const movedNodes = parentSheet.nodes.filter((node) => nodeIds.has(node.id));
    const movedLabels = parentSheet.labels.filter((label) =>
      labelIds.has(label.id),
    );
    if (
      movedNodes.some((node) =>
        isSystemManagedProtectedNode(currentProject, node),
      )
    ) {
      deps.setStatusT("store.status.cannotSubsheetSystemManagedComponent");
      return null;
    }
    if (movedNodes.length === 0 && movedLabels.length === 0) {
      deps.setStatusT("store.status.cannotSubsheetEmptySelection");
      return null;
    }

    return {
      activeSheetId,
      next,
      parentSheet,
      movedNodes,
      movedLabels,
      movedNodeIds: movedNodes.map((node) => node.id),
      movedLabelIds: movedLabels.map((label) => label.id),
      selectedNodeIds: nodeIds,
    };
  };

  const commitSelectionMove = (
    next: EditorStoreActionContext["state"]["project"],
    activeSheetId: string,
    selectedSubsheetNodeId: string,
  ): void => {
    syncProjectUi(next, activeSheetId);
    deps.pushUndoSnapshot();
    deps.setState("project", next);
    deps.markProjectChanged();
    deps.setState("selection", { kind: "node", id: selectedSubsheetNodeId });
    deps.clearPendingConnectionUi();
  };

  return {
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

    addSheetDefinition(): void {
      const result = deps.withProject((project) =>
        sheetModelEdits.definition.add(project, deps.state.activeSheetId),
      );
      if (!result) return;
      deps.setStatusT("store.status.createdSubsheet", { name: result.name });
    },

    putSelectionIntoSubsheet(): void {
      const prepared = prepareSelectionMove(deps.state.selection);
      if (!prepared) return;

      const allNames = new Set(
        Object.values(prepared.next.sheets).map((sheet) => sheet.name),
      );
      const childName = nextName("Sheet", allNames);
      const child = createSheet(childName, prepared.parentSheet.id);

      const childNodePosition = selectionBoundsForNodesAndLabels(
        prepared.movedNodes,
        prepared.movedLabels,
      );
      const subsheetNodeId = createId("node");
      const subsheetNode: SheetNode = {
        id: subsheetNodeId,
        kind: "sheet",
        sheetId: child.id,
        instanceName: ensureInstanceName(prepared.parentSheet, childName),
        position: { x: childNodePosition.x, y: childNodePosition.y },
      };
      prepared.next.sheets[child.id] = child;
      const moveResult = moveSelectionIntoSubsheet(prepared.next, {
        parentSheetId: prepared.activeSheetId,
        childSheetId: child.id,
        subsheetNode,
        movedNodeIds: prepared.movedNodeIds,
        movedLabelIds: prepared.movedLabelIds,
      });

      commitSelectionMove(
        prepared.next,
        prepared.activeSheetId,
        subsheetNodeId,
      );
      deps.setStatusT("store.status.putSelectionIntoSubsheet", {
        name: childName,
        ports: moveResult.createdPortCount,
      });
    },

    moveSelectionIntoSubsheetNode(subsheetNodeId: string): void {
      const prepared = prepareSelectionMove(deps.state.selection);
      if (!prepared) return;
      if (prepared.selectedNodeIds.has(subsheetNodeId)) {
        deps.setStatusT("store.status.cannotMoveSelectionIntoSameSubsheet");
        return;
      }

      const subsheetNode = prepared.parentSheet.nodes.find(
        (node): node is SheetNode =>
          node.kind === "sheet" && node.id === subsheetNodeId,
      );
      if (!subsheetNode) return;
      const child = prepared.next.sheets[subsheetNode.sheetId];
      if (!child) return;

      const moveResult = moveSelectionIntoSubsheet(prepared.next, {
        parentSheetId: prepared.activeSheetId,
        childSheetId: child.id,
        subsheetNode,
        movedNodeIds: prepared.movedNodeIds,
        movedLabelIds: prepared.movedLabelIds,
      });

      commitSelectionMove(
        prepared.next,
        prepared.activeSheetId,
        subsheetNodeId,
      );
      deps.setStatusT("store.status.movedSelectionIntoSubsheet", {
        name: child.name,
        ports: moveResult.createdPortCount,
      });
    },

    deleteSheetDefinition(sheetId: string): void {
      const project = deps.state.project;
      const target = project.sheets[sheetId];
      if (!target) return;
      if (sheetId === project.rootSheetId) {
        deps.setStatusT("store.status.cannotDeleteRootSheet");
        return;
      }
      if (isProtectedSystemSheet(project, sheetId)) {
        deps.setStatusT("store.status.cannotDeleteSystemSheet");
        return;
      }

      const next = cloneProject(project);
      const result = sheetModelEdits.definition.remove(
        next,
        sheetId,
        deps.state.activeSheetId,
      );
      if (!result.ok) return;

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

    enterSelectedSheet(): void {
      const selection = deps.state.selection;
      if (!selection || selection.kind !== "node") return;
      const sheet = getSheet(deps.state.project, deps.state.activeSheetId);
      const node = findNode(sheet, selection.id);
      if (!node || node.kind !== "sheet") return;
      setActiveSheet(node.sheetId);
    },

    goToParentSheet(): void {
      const current = getSheet(deps.state.project, deps.state.activeSheetId);
      if (!current.parentSheetId) return;
      setActiveSheet(current.parentSheetId);
    },
  };
}
