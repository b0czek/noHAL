import {
  endpointKey,
  getSheet,
  resolveEndpointInSheet,
} from "../../../../shared/graph";
import { createId } from "../../../../shared/id";
import { createSheet, createSheetPortDraft } from "../../../../shared/project";
import type {
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
    if (!deps.getProject().sheets[sheetId]) return;
    deps.setActiveSheetId(sheetId);
    deps.setProjectUiActiveSheetId(sheetId);
    deps.clearSelectionAndPendingUi();
  };

  return {
    setSheetAddfQueue(sheetId: string, nodeOrder: string[]): void {
      const normalized = Array.from(
        new Set(nodeOrder.map((v) => v.trim()).filter(Boolean)),
      );
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
      const current = deps.getCurrentSheet();
      const allNames = new Set(
        Object.values(deps.getProject().sheets).map((s) => s.name),
      );
      const name = nextName("Sheet", allNames);
      const child = createSheet(name, current.id);
      const activeSheetId = deps.getActiveSheetId();

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
      const selection = deps.getSelection();
      if (!selection || selection.kind !== "multi") return;

      const activeSheetId = deps.getActiveSheetId();
      const currentProject = deps.getProject();
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
        const childQueue = originalParentQueue.filter((id) =>
          movedNodeIdSet.has(id),
        );
        const firstMovedIndex = originalParentQueue.findIndex((id) =>
          movedNodeIdSet.has(id),
        );
        const parentQueue = originalParentQueue.filter(
          (id) => !movedNodeIdSet.has(id),
        );
        if (childQueue.length > 0) {
          const insertAt =
            firstMovedIndex < 0
              ? parentQueue.length
              : originalParentQueue
                  .slice(0, firstMovedIndex)
                  .filter((id) => !movedNodeIdSet.has(id)).length;
          parentQueue.splice(insertAt, 0, subsheetNodeId);
          if (!parentSheet.hal) parentSheet.hal = {};
          parentSheet.hal.addfQueue = parentQueue;
          child.hal = { ...(child.hal ?? {}), addfQueue: childQueue };
        } else if (parentSheet.hal?.addfQueue) {
          parentSheet.hal.addfQueue = parentQueue;
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
      deps.setProject(next);
      deps.markProjectChanged();
      deps.setSelection({ kind: "node", id: subsheetNodeId });
      deps.clearPendingConnectionUi();
      deps.setStatusT("store.status.putSelectionIntoSubsheet", {
        name: childName,
        ports: child.ports.length,
      });
    },

    placeExistingSheetNode(sheetIdToPlace: string): void {
      const project = deps.getProject();
      const activeSheetId = deps.getActiveSheetId();
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
      const project = deps.getProject();
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

      let nextActiveSheetId = deps.getActiveSheetId();
      if (!next.sheets[nextActiveSheetId]) {
        nextActiveSheetId =
          target.parentSheetId && next.sheets[target.parentSheetId]
            ? target.parentSheetId
            : next.rootSheetId;
      }
      syncProjectUi(next, nextActiveSheetId);

      deps.pushUndoSnapshot();
      deps.setProject(next);
      deps.markProjectChanged();
      deps.setActiveSheetId(nextActiveSheetId);
      deps.clearSelectionAndPendingUi();
      deps.setStatusT("store.status.deletedSheet", {
        name: target.name,
        count: deletedSheetIds.size,
      });
    },

    enterSelectedSheet(): void {
      const selection = deps.getSelection();
      if (!selection || selection.kind !== "node") return;
      const sheet = deps.getCurrentSheet();
      const node = findNode(sheet, selection.id);
      if (!node || node.kind !== "sheet") return;
      setActiveSheet(node.sheetId);
    },

    goToParentSheet(): void {
      const current = deps.getCurrentSheet();
      if (!current.parentSheetId) return;
      setActiveSheet(current.parentSheetId);
    },
  };
}
