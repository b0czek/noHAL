import {
  addfQueueEntryNodeId,
  makeAddfQueueNodeEntry,
  normalizeAddfQueueEntries,
} from "../../../../shared/addfQueue";
import {
  endpointKey,
  getSheet,
  resolveEndpointInSheet,
} from "../../../../shared/graph";
import { createId } from "../../../../shared/id";
import { createSheet, createSheetPortDraft } from "../../../../shared/project";
import { normalizeSheetThreadOutputs } from "../../../../shared/sheetThreads";
import type {
  SheetAddfQueueStoredEntry,
  SheetDefinition,
  SheetEndpointRef,
  SheetNode,
} from "../../../../shared/types";
import {
  cloneEndpoint,
  cloneProject,
  collectSheetSubtreeIds,
  defaultNodePosition,
  defaultPortPosition,
  directConnectionPairKey,
  ensureInstanceName,
  findNode,
  isNodeEndpointInSet,
  isSheetPlacedInProject,
  nextName,
  removeSheetNodeReferencesForDeletedSheets,
  selectionBoundsForNodesAndLabels,
  sheetContainsSheet,
  syncProjectUi,
} from "../helpers";
import type { EditorStoreActionContext } from "./types";

export function createSheetActions(deps: EditorStoreActionContext) {
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
      if (movedNodes.length === 0 && movedLabels.length === 0) {
        deps.setStatusT("store.status.cannotSubsheetEmptySelection");
        return;
      }

      const movedNodeIdSet = new Set(movedNodes.map((n) => n.id));
      const movedLabelIdSet = new Set(movedLabels.map((l) => l.id));

      const allNames = new Set(Object.values(next.sheets).map((s) => s.name));
      const childName = nextName("Sheet", allNames);
      const child = createSheet(childName, parentSheet.id);
      const childPortNames = new Set<string>();
      const childPortsByEndpointKey = new Map<string, { id: string }>();

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

      const ensureBoundaryPortForEndpoint = (endpoint: SheetEndpointRef) => {
        const key = endpointKey(endpoint);
        const existing = childPortsByEndpointKey.get(key);
        if (existing) return existing;

        const resolved = resolveEndpointInSheet(
          currentProject,
          activeSheetId,
          endpoint,
        );
        const port = createSheetPortDraft(
          resolved.name || "sig",
          resolved.direction,
          resolved.type,
        );
        if (childPortNames.has(port.name)) {
          port.name = nextName(port.name, childPortNames);
        }
        childPortNames.add(port.name);
        port.position = defaultPortPosition(child, port.side);
        child.ports.push(port);
        const result = { id: port.id };
        childPortsByEndpointKey.set(key, result);
        return result;
      };

      const subsheetEndpointForPort = (portId: string): SheetEndpointRef => ({
        kind: "node-pin",
        nodeId: subsheetNodeId,
        pinKey: portId,
      });

      const isMovedEndpoint = (endpoint: SheetEndpointRef) =>
        isNodeEndpointInSet(endpoint, movedNodeIdSet);

      const parentConnectionsNext = [] as SheetDefinition["directConnections"];
      const childConnectionsNext = [] as SheetDefinition["directConnections"];
      const parentConnectionPairs = new Set<string>();

      for (const conn of parentSheet.directConnections) {
        const aMoved = isMovedEndpoint(conn.a);
        const bMoved = isMovedEndpoint(conn.b);
        if (aMoved && bMoved) {
          childConnectionsNext.push({
            id: conn.id,
            a: cloneEndpoint(conn.a),
            b: cloneEndpoint(conn.b),
            ...(conn.signalName ? { signalName: conn.signalName } : {}),
            ...(conn.waypoints
              ? { waypoints: conn.waypoints.map((p) => ({ x: p.x, y: p.y })) }
              : {}),
          });
          continue;
        }
        if (!aMoved && !bMoved) {
          parentConnectionsNext.push({
            id: conn.id,
            a: cloneEndpoint(conn.a),
            b: cloneEndpoint(conn.b),
            ...(conn.signalName ? { signalName: conn.signalName } : {}),
            ...(conn.waypoints
              ? { waypoints: conn.waypoints.map((p) => ({ x: p.x, y: p.y })) }
              : {}),
          });
          parentConnectionPairs.add(directConnectionPairKey(conn.a, conn.b));
          continue;
        }

        const selectedEndpoint = aMoved ? conn.a : conn.b;
        const port = ensureBoundaryPortForEndpoint(selectedEndpoint);
        const subsheetEndpoint = subsheetEndpointForPort(port.id);

        const parentConn = {
          id: conn.id,
          a: aMoved ? subsheetEndpoint : cloneEndpoint(conn.a),
          b: bMoved ? subsheetEndpoint : cloneEndpoint(conn.b),
          ...(conn.signalName ? { signalName: conn.signalName } : {}),
        };
        parentConnectionsNext.push(parentConn);
        parentConnectionPairs.add(
          directConnectionPairKey(parentConn.a, parentConn.b),
        );

        childConnectionsNext.push({
          id: createId("conn"),
          a: aMoved
            ? cloneEndpoint(conn.a)
            : ({ kind: "sheet-port", portId: port.id } as const),
          b: bMoved
            ? cloneEndpoint(conn.b)
            : ({ kind: "sheet-port", portId: port.id } as const),
          ...(conn.signalName ? { signalName: conn.signalName } : {}),
        });
      }

      const ensureParentBoundaryConnection = (
        externalEndpoint: SheetEndpointRef,
        portId: string,
      ) => {
        const subsheetEndpoint = subsheetEndpointForPort(portId);
        const pairKey = directConnectionPairKey(
          externalEndpoint,
          subsheetEndpoint,
        );
        if (parentConnectionPairs.has(pairKey)) return;
        parentConnectionPairs.add(pairKey);
        parentConnectionsNext.push({
          id: createId("conn"),
          a: cloneEndpoint(externalEndpoint),
          b: subsheetEndpoint,
        });
      };

      const parentAnchorsNext = [] as SheetDefinition["labelAnchors"];
      const childAnchorsNext = [] as SheetDefinition["labelAnchors"];
      for (const anchor of parentSheet.labelAnchors) {
        const labelMoved = movedLabelIdSet.has(anchor.labelId);
        const endpointMoved = isMovedEndpoint(anchor.endpoint);

        if (labelMoved && endpointMoved) {
          childAnchorsNext.push({
            id: anchor.id,
            labelId: anchor.labelId,
            endpoint: cloneEndpoint(anchor.endpoint),
          });
          continue;
        }

        if (labelMoved && !endpointMoved) {
          const port = ensureBoundaryPortForEndpoint(anchor.endpoint);
          childAnchorsNext.push({
            id: anchor.id,
            labelId: anchor.labelId,
            endpoint: { kind: "sheet-port", portId: port.id },
          });
          ensureParentBoundaryConnection(anchor.endpoint, port.id);
          continue;
        }

        if (!labelMoved && endpointMoved) {
          const port = ensureBoundaryPortForEndpoint(anchor.endpoint);
          parentAnchorsNext.push({
            id: anchor.id,
            labelId: anchor.labelId,
            endpoint: subsheetEndpointForPort(port.id),
          });
          continue;
        }

        parentAnchorsNext.push({
          id: anchor.id,
          labelId: anchor.labelId,
          endpoint: cloneEndpoint(anchor.endpoint),
        });
      }

      const originalParentQueue = parentSheet.hal?.addfQueue
        ? [...parentSheet.hal.addfQueue]
        : null;

      parentSheet.nodes = parentSheet.nodes.filter(
        (n) => !movedNodeIdSet.has(n.id),
      );
      parentSheet.nodes.push(subsheetNode);
      parentSheet.labels = parentSheet.labels.filter(
        (l) => !movedLabelIdSet.has(l.id),
      );
      parentSheet.directConnections = parentConnectionsNext;
      parentSheet.labelAnchors = parentAnchorsNext;

      if (originalParentQueue) {
        const childQueue = originalParentQueue.filter((entry) => {
          const nodeId = addfQueueEntryNodeId(entry);
          return Boolean(nodeId && movedNodeIdSet.has(nodeId));
        });
        const firstMovedIndex = originalParentQueue.findIndex((entry) => {
          const nodeId = addfQueueEntryNodeId(entry);
          return Boolean(nodeId && movedNodeIdSet.has(nodeId));
        });
        const parentQueue = originalParentQueue.filter((entry) => {
          const nodeId = addfQueueEntryNodeId(entry);
          return !(nodeId && movedNodeIdSet.has(nodeId));
        });
        if (childQueue.length > 0) {
          const insertAt =
            firstMovedIndex < 0
              ? parentQueue.length
              : originalParentQueue
                  .slice(0, firstMovedIndex)
                  .filter((entry) => {
                    const nodeId = addfQueueEntryNodeId(entry);
                    return !(nodeId && movedNodeIdSet.has(nodeId));
                  }).length;
          parentQueue.splice(
            insertAt,
            0,
            makeAddfQueueNodeEntry(subsheetNodeId),
          );
          if (!parentSheet.hal) parentSheet.hal = {};
          parentSheet.hal.addfQueue = normalizeAddfQueueEntries(parentQueue);
          child.hal = {
            ...(child.hal ?? {}),
            addfQueue: normalizeAddfQueueEntries(childQueue),
          };
        } else if (parentSheet.hal?.addfQueue) {
          parentSheet.hal.addfQueue = normalizeAddfQueueEntries(parentQueue);
          if (parentSheet.hal.addfQueue.length === 0)
            delete parentSheet.hal.addfQueue;
          if (parentSheet.hal && Object.keys(parentSheet.hal).length === 0) {
            delete parentSheet.hal;
          }
        }
      }

      child.nodes = movedNodes;
      child.labels = movedLabels;
      child.directConnections = childConnectionsNext;
      child.labelAnchors = childAnchorsNext;
      next.sheets[child.id] = child;

      syncProjectUi(next, activeSheetId);
      deps.pushUndoSnapshot();
      deps.setState("project", next);
      deps.markProjectChanged();
      deps.setState("selection", { kind: "node", id: subsheetNodeId });
      deps.clearPendingConnectionUi();
      deps.setStatusT("store.status.putSelectionIntoSubsheet", {
        name: childName,
        ports: child.ports.length,
      });
    },

    placeExistingSheetNode(sheetIdToPlace: string): void {
      const project = deps.state.project;
      const activeSheetId = deps.state.activeSheetId;
      if (sheetIdToPlace === activeSheetId) {
        deps.setStatusT("store.status.cannotPlaceSheetInsideItself");
        return;
      }
      if (isSheetPlacedInProject(project, sheetIdToPlace)) {
        deps.setStatusT("store.status.sheetAlreadyPlaced");
        return;
      }
      if (sheetContainsSheet(project, sheetIdToPlace, activeSheetId)) {
        deps.setStatusT("store.status.cannotCreateRecursiveSheetHierarchy");
        return;
      }
      const target = project.sheets[sheetIdToPlace];
      if (!target) return;

      deps.withProject((nextProject) => {
        const sheet = getSheet(nextProject, activeSheetId);
        const node: SheetNode = {
          id: createId("node"),
          kind: "sheet",
          sheetId: sheetIdToPlace,
          instanceName: ensureInstanceName(sheet, target.name),
          position: defaultNodePosition(sheet),
        };
        sheet.nodes.push(node);
      });
      deps.setStatusT("store.status.placedSubsheet", { name: target.name });
    },

    deleteSheetDefinition(sheetId: string): void {
      const project = deps.state.project;
      const target = project.sheets[sheetId];
      if (!target) return;
      if (sheetId === project.rootSheetId) {
        deps.setStatusT("store.status.cannotDeleteRootSheet");
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
