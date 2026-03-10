import { normalizeAddfQueueEntries } from "@nohal/core/src/addfQueue";
import { isSystemComponent } from "@nohal/core/src/componentSystem";
import { getSheet } from "@nohal/core/src/graph";
import { createId } from "@nohal/core/src/id";
import { createSheet } from "@nohal/core/src/project";
import { normalizeSheetThreadOutputs } from "@nohal/core/src/sheetThreads";
import { moveSelectionIntoSubsheet } from "@nohal/core/src/subsheetMove";
import { findSystemSheet } from "@nohal/core/src/systemSheet";
import type {
  SheetAddfQueueStoredEntry,
  SheetNode,
} from "@nohal/core/src/types";
import {
  cloneProject,
  collectSheetSubtreeIds,
  defaultNodePosition,
  ensureInstanceName,
  findNode,
  nextName,
  removeSheetNodeReferencesForDeletedSheets,
  selectionBoundsForNodesAndLabels,
  syncProjectUi,
} from "../helpers";
import type { EditorStoreActionContext } from "./types";

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

  return {
    addSheetThreadOutput(sheetId: string): void {
      deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        if (!sheet.hal) sheet.hal = {};
        const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
        const usedNames = new Set(current.map((item) => item.name));
        let name = "thread";
        let idx = 2;
        while (usedNames.has(name)) {
          name = `thread-${idx}`;
          idx += 1;
        }
        current.push({ id: createId("sheetthread"), name });
        sheet.hal.threadOutputs = current;
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
      deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        if (!sheet.hal) sheet.hal = {};
        const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
        const target = current.find((item) => item.id === outputId);
        if (!target) return;
        if (target.name === trimmed) return;
        if (
          current.some((item) => item.id !== outputId && item.name === trimmed)
        ) {
          return;
        }
        target.name = trimmed;
        sheet.hal.threadOutputs = current;
      });
      deps.setStatusT("store.status.updatedSheetThreadOutputName");
    },

    updateSheetThreadOutputHalBinding(
      sheetId: string,
      outputId: string,
      halThreadId: string | null,
    ): void {
      deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        if (!sheet.hal) sheet.hal = {};
        const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
        const target = current.find((item) => item.id === outputId);
        if (!target) return;
        const normalizedHalThreadId = halThreadId?.trim() || undefined;
        if (target.halThreadId === normalizedHalThreadId) return;
        if (normalizedHalThreadId) target.halThreadId = normalizedHalThreadId;
        else delete target.halThreadId;
        sheet.hal.threadOutputs = current;
      });
      deps.setStatusT("store.status.updatedSheetThreadOutputHalBinding");
    },

    removeSheetThreadOutput(sheetId: string, outputId: string): void {
      deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        if (!sheet.hal) sheet.hal = {};
        const current = normalizeSheetThreadOutputs(sheet.hal.threadOutputs);
        if (current.length <= 1) return;
        const next = current.filter((item) => item.id !== outputId);
        if (next.length === current.length || next.length === 0) return;
        const fallbackId = next[0]?.id;
        sheet.hal.threadOutputs = next;

        if (sheet.hal.addfQueue && fallbackId) {
          sheet.hal.addfQueue = normalizeAddfQueueEntries(
            sheet.hal.addfQueue.map((entry) => {
              if (typeof entry === "string") return entry;
              if (entry.sheetThreadOutputId !== outputId) return entry;
              return { ...entry, sheetThreadOutputId: fallbackId };
            }),
          );
        }

        for (const node of sheet.nodes) {
          if (node.kind !== "sheet" || !node.hal?.threadMap) continue;
          for (const [childOutputId, parentOutputId] of Object.entries(
            node.hal.threadMap,
          )) {
            if (parentOutputId === outputId) {
              delete node.hal.threadMap[childOutputId];
            }
          }
          if (Object.keys(node.hal.threadMap).length === 0) {
            delete node.hal.threadMap;
          }
          if (node.hal && Object.keys(node.hal).length === 0) delete node.hal;
        }
      });
      deps.setStatusT("store.status.removedSheetThreadOutput");
    },

    setSheetAddfQueue(
      sheetId: string,
      nodeOrder: SheetAddfQueueStoredEntry[],
    ): void {
      const normalized = normalizeAddfQueueEntries(nodeOrder);
      deps.withProject((project) => {
        const sheet = getSheet(project, sheetId);
        if (!sheet.hal) sheet.hal = {};
        if (normalized.length > 0) sheet.hal.addfQueue = normalized;
        else delete sheet.hal?.addfQueue;
        if (sheet.hal && Object.keys(sheet.hal).length === 0) delete sheet.hal;
      });
      deps.setStatusT("store.status.updatedSheetAddfQueue", {
        count: normalized.length,
      });
    },

    setActiveSheet,

    addSheetDefinition(): void {
      const current = getSheet(deps.state.project, deps.state.activeSheetId);
      const allNames = new Set(
        Object.values(deps.state.project.sheets).map((s) => s.name),
      );
      const name = nextName("Sheet", allNames);
      const child = createSheet(name, current.id);
      const activeSheetId = deps.state.activeSheetId;

      deps.withProject((project) => {
        project.sheets[child.id] = child;
        const sheet = getSheet(project, activeSheetId);
        const node: SheetNode = {
          id: createId("node"),
          kind: "sheet",
          sheetId: child.id,
          instanceName: ensureInstanceName(sheet, name),
          position: defaultNodePosition(sheet),
        };
        sheet.nodes.push(node);
      });

      deps.setStatusT("store.status.createdSubsheet", { name });
    },

    putSelectionIntoSubsheet(): void {
      const selection = deps.state.selection;
      if (!selection || selection.kind !== "multi") return;

      const activeSheetId = deps.state.activeSheetId;
      const currentProject = deps.state.project;
      const selectedNodeIds = new Set(selection.nodeIds);
      const selectedLabelIds = new Set(selection.labelIds);
      const selectedPortIds = new Set(selection.portIds);
      if (
        selectedNodeIds.size === 0 &&
        selectedLabelIds.size === 0 &&
        selectedPortIds.size > 0
      ) {
        deps.setStatusT("store.status.cannotSubsheetOnlyPortsSelection");
        return;
      }

      const next = cloneProject(currentProject);
      const parentSheet = next.sheets[activeSheetId];
      if (!parentSheet) return;

      const movedNodes = parentSheet.nodes.filter((n) =>
        selectedNodeIds.has(n.id),
      );
      const movedLabels = parentSheet.labels.filter((l) =>
        selectedLabelIds.has(l.id),
      );
      if (
        movedNodes.some((node) =>
          isSystemManagedProtectedNode(currentProject, node),
        )
      ) {
        deps.setStatusT("store.status.cannotSubsheetSystemManagedComponent");
        return;
      }
      if (movedNodes.length === 0 && movedLabels.length === 0) {
        deps.setStatusT("store.status.cannotSubsheetEmptySelection");
        return;
      }

      const movedNodeIdSet = new Set(movedNodes.map((n) => n.id));

      const allNames = new Set(Object.values(next.sheets).map((s) => s.name));
      const childName = nextName("Sheet", allNames);
      const child = createSheet(childName, parentSheet.id);

      const childNodePosition = selectionBoundsForNodesAndLabels(
        movedNodes,
        movedLabels,
      );
      const subsheetNodeId = createId("node");
      const subsheetNode: SheetNode = {
        id: subsheetNodeId,
        kind: "sheet",
        sheetId: child.id,
        instanceName: ensureInstanceName(parentSheet, childName),
        position: { x: childNodePosition.x, y: childNodePosition.y },
      };
      next.sheets[child.id] = child;
      const moveResult = moveSelectionIntoSubsheet(next, {
        parentSheetId: activeSheetId,
        childSheetId: child.id,
        subsheetNode,
        movedNodeIds: [...movedNodeIdSet],
        movedLabelIds: movedLabels.map((label) => label.id),
      });

      syncProjectUi(next, activeSheetId);
      deps.pushUndoSnapshot();
      deps.setState("project", next);
      deps.markProjectChanged();
      deps.setState("selection", { kind: "node", id: subsheetNodeId });
      deps.clearPendingConnectionUi();
      deps.setStatusT("store.status.putSelectionIntoSubsheet", {
        name: childName,
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

      const deletedSheetIds = collectSheetSubtreeIds(project, sheetId);
      if (deletedSheetIds.size === 0) return;

      const next = cloneProject(project);
      removeSheetNodeReferencesForDeletedSheets(next, deletedSheetIds);
      for (const deletedSheetId of deletedSheetIds) {
        delete next.sheets[deletedSheetId];
      }

      let nextActiveSheetId = deps.state.activeSheetId;
      if (!next.sheets[nextActiveSheetId]) {
        nextActiveSheetId =
          target.parentSheetId && next.sheets[target.parentSheetId]
            ? target.parentSheetId
            : next.rootSheetId;
      }
      syncProjectUi(next, nextActiveSheetId);

      deps.pushUndoSnapshot();
      deps.setState("project", next);
      deps.markProjectChanged();
      deps.setState("activeSheetId", nextActiveSheetId);
      deps.clearSelectionAndPendingUi();
      deps.setStatusT("store.status.deletedSheet", {
        name: target.name,
        count: deletedSheetIds.size,
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
