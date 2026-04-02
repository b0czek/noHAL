import {
  addfQueueEntryNodeId,
  normalizeAddfQueueEntries,
} from "@nohal/core/addfQueue";
import {
  componentPrefersCanonicalInstanceNames,
  componentUsesLockedCanonicalInstanceNames,
  ensureInstanceName,
  nextComponentInstanceName,
} from "@nohal/core/componentNaming";
import {
  createEmptyComponentStore,
  isStoreEntryCompatibleWithLinuxCncVersion,
  listStoreEntriesForLinuxCncVersion,
} from "@nohal/core/componentStore";
import { reconcileComponentNodesForDefinition } from "@nohal/core/customComponent";
import { endpointKey } from "@nohal/core/graph";
import {
  defaultCommentPositionForIndex,
  defaultLabelPositionForIndex,
  defaultNodePositionForIndex,
  defaultPortPositionForIndex,
  normalizeRotationDegrees,
} from "@nohal/core/sheet";
import type {
  ComponentStore,
  NoHALProject,
  SheetDefinition,
  SheetEndpointRef,
  SheetNodeInstance,
  XY,
} from "@nohal/core/types";
import { unwrap } from "solid-js/store";

export { createEmptyComponentStore };
export {
  ensureInstanceName,
  nextComponentInstanceName,
  componentPrefersCanonicalInstanceNames,
  componentUsesLockedCanonicalInstanceNames,
};
export { normalizeRotationDegrees };

export function cloneProject(project: NoHALProject): NoHALProject {
  return structuredClone(unwrap(project));
}

export function cloneComponentStore(store: ComponentStore): ComponentStore {
  return structuredClone(unwrap(store));
}

export function snapshotProjectForIpc(project: NoHALProject): NoHALProject {
  return structuredClone(unwrap(project));
}

export function applyComponentStoreToProject(
  project: NoHALProject,
  componentStore: ComponentStore,
): void {
  for (const entry of listStoreEntriesForLinuxCncVersion(
    componentStore,
    project.target.linuxcncVersion,
  )) {
    project.library.components[entry.componentId] = entry.parsed;
    reconcileComponentNodesForDefinition(
      project,
      entry.componentId,
      entry.parsed,
    );
  }
}

function projectUsesComponentDefinition(
  project: NoHALProject,
  componentId: string,
): boolean {
  return Object.values(project.sheets).some((sheet) =>
    sheet.nodes.some(
      (node) => node.kind === "component" && node.componentId === componentId,
    ),
  );
}

export function pruneMissingStoredComponentsFromProject(
  project: NoHALProject,
  componentStore: ComponentStore,
): void {
  for (const [componentId, component] of Object.entries(
    project.library.components,
  )) {
    if (component.source !== "comp") continue;
    const entry = componentStore.components[componentId];
    if (
      entry &&
      isStoreEntryCompatibleWithLinuxCncVersion(
        componentStore,
        entry,
        project.target.linuxcncVersion,
      )
    ) {
      continue;
    }
    if (projectUsesComponentDefinition(project, componentId)) continue;
    delete project.library.components[componentId];
  }
}

export function getComponentSourceDisplayPath(
  componentStore: ComponentStore,
  sourceId: string,
): string {
  const source = componentStore.sources[sourceId];
  if (!source) return sourceId;
  if (source.kind === "comp-dir") return source.dirPath;
  if (source.kind === "comp-file") return source.filePath;
  return `LinuxCNC ${source.linuxcncVersion} built-ins (${source.refName})`;
}

export function nextName(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}${i}`)) i += 1;
  return `${base}${i}`;
}

export function defaultNodePosition(sheet: SheetDefinition): XY {
  return defaultNodePositionForIndex(sheet.nodes.length);
}

export function defaultLabelPosition(sheet: SheetDefinition): XY {
  return defaultLabelPositionForIndex(sheet.labels.length);
}

export function defaultCommentPosition(sheet: SheetDefinition): XY {
  return defaultCommentPositionForIndex(sheet.comments.length);
}

export function defaultPortPosition(
  sheet: SheetDefinition,
  side: "left" | "right" | "top" | "bottom",
): XY {
  const count = sheet.ports.filter((p) => p.side === side).length;
  return defaultPortPositionForIndex(count, side);
}

export function forcedPortSideForDirection(
  direction: "in" | "out" | "io",
): "left" | "right" | "top" {
  if (direction === "in") return "right";
  if (direction === "out") return "left";
  return "top";
}

export function findNode(
  sheet: SheetDefinition,
  nodeId: string,
): SheetNodeInstance | undefined {
  return sheet.nodes.find((n) => n.id === nodeId);
}

export function sheetContainsSheet(
  project: NoHALProject,
  rootSheetId: string,
  searchSheetId: string,
  seen = new Set<string>(),
): boolean {
  if (rootSheetId === searchSheetId) return true;
  if (seen.has(rootSheetId)) return false;
  seen.add(rootSheetId);
  const sheet = project.sheets[rootSheetId];
  if (!sheet) return false;
  for (const node of sheet.nodes) {
    if (node.kind !== "sheet") continue;
    if (sheetContainsSheet(project, node.sheetId, searchSheetId, seen))
      return true;
  }
  return false;
}

export function isSheetPlacedInProject(
  project: NoHALProject,
  sheetId: string,
): boolean {
  return Object.values(project.sheets).some((sheet) =>
    sheet.nodes.some(
      (node) => node.kind === "sheet" && node.sheetId === sheetId,
    ),
  );
}

export function pruneSheetNodeReferences(
  sheet: SheetDefinition,
  removedNodeIds: ReadonlySet<string>,
): void {
  if (removedNodeIds.size === 0) return;

  sheet.directConnections = sheet.directConnections.filter(
    (c) =>
      !(c.a.kind === "node-pin" && removedNodeIds.has(c.a.nodeId)) &&
      !(c.b.kind === "node-pin" && removedNodeIds.has(c.b.nodeId)),
  );

  sheet.labelAnchors = sheet.labelAnchors.filter(
    (a) =>
      !(
        a.endpoint.kind === "node-pin" && removedNodeIds.has(a.endpoint.nodeId)
      ),
  );

  if (!sheet.hal?.addfQueue) return;
  sheet.hal.addfQueue = normalizeAddfQueueEntries(
    sheet.hal.addfQueue.filter((entry) => {
      const nodeId = addfQueueEntryNodeId(entry);
      return !(nodeId && removedNodeIds.has(nodeId));
    }),
  );
  if (sheet.hal.addfQueue.length === 0) delete sheet.hal.addfQueue;
  if (Object.keys(sheet.hal).length === 0) delete sheet.hal;
}

export function pruneSheetPortReferences(
  sheet: SheetDefinition,
  removedPortIds: ReadonlySet<string>,
): void {
  if (removedPortIds.size === 0) return;

  sheet.directConnections = sheet.directConnections.filter(
    (c) =>
      !(c.a.kind === "sheet-port" && removedPortIds.has(c.a.portId)) &&
      !(c.b.kind === "sheet-port" && removedPortIds.has(c.b.portId)),
  );

  sheet.labelAnchors = sheet.labelAnchors.filter(
    (a) =>
      !(
        a.endpoint.kind === "sheet-port" &&
        removedPortIds.has(a.endpoint.portId)
      ),
  );
}

export function removeSheetSelectionItems(
  sheet: SheetDefinition,
  selection: {
    nodeIds: ReadonlySet<string>;
    labelIds: ReadonlySet<string>;
    commentIds: ReadonlySet<string>;
    portIds: ReadonlySet<string>;
  },
): void {
  if (selection.nodeIds.size > 0) {
    const removedNodeIds = new Set<string>();
    sheet.nodes = sheet.nodes.filter((node) => {
      if (!selection.nodeIds.has(node.id)) return true;
      removedNodeIds.add(node.id);
      return false;
    });
    pruneSheetNodeReferences(sheet, removedNodeIds);
  }

  if (selection.labelIds.size > 0) {
    sheet.labels = sheet.labels.filter(
      (label) => !selection.labelIds.has(label.id),
    );
    sheet.labelAnchors = sheet.labelAnchors.filter(
      (anchor) => !selection.labelIds.has(anchor.labelId),
    );
  }

  if (selection.commentIds.size > 0) {
    sheet.comments = sheet.comments.filter(
      (comment) => !selection.commentIds.has(comment.id),
    );
  }

  if (selection.portIds.size > 0) {
    sheet.ports = sheet.ports.filter((port) => !selection.portIds.has(port.id));
    pruneSheetPortReferences(sheet, selection.portIds);
  }
}

export function collectSheetSubtreeIds(
  project: NoHALProject,
  rootSheetId: string,
): Set<string> {
  const deleted = new Set<string>();
  const queue = [rootSheetId];
  while (queue.length > 0) {
    const sheetId = queue.shift();
    if (!sheetId || deleted.has(sheetId) || !project.sheets[sheetId]) continue;
    deleted.add(sheetId);
    for (const sheet of Object.values(project.sheets)) {
      if (sheet.parentSheetId === sheetId) queue.push(sheet.id);
    }
  }
  return deleted;
}

export function removeSheetNodeReferencesForDeletedSheets(
  project: NoHALProject,
  deletedSheetIds: ReadonlySet<string>,
): void {
  for (const sheet of Object.values(project.sheets)) {
    const removedNodeIds = new Set<string>();
    sheet.nodes = sheet.nodes.filter((node) => {
      if (node.kind !== "sheet") return true;
      if (!deletedSheetIds.has(node.sheetId)) return true;
      removedNodeIds.add(node.id);
      return false;
    });
    pruneSheetNodeReferences(sheet, removedNodeIds);
  }
}

export function syncProjectUi(
  project: NoHALProject,
  activeSheetId: string,
): void {
  project.ui.activeSheetId = activeSheetId;
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isNodeEndpointInSet(
  endpoint: SheetEndpointRef,
  nodeIds: ReadonlySet<string>,
): boolean {
  return endpoint.kind === "node-pin" && nodeIds.has(endpoint.nodeId);
}

export function directConnectionPairKey(
  a: SheetEndpointRef,
  b: SheetEndpointRef,
): string {
  const aKey = endpointKey(a);
  const bKey = endpointKey(b);
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

export function cloneEndpoint(endpoint: SheetEndpointRef): SheetEndpointRef {
  return endpoint.kind === "node-pin"
    ? { kind: "node-pin", nodeId: endpoint.nodeId, pinKey: endpoint.pinKey }
    : { kind: "sheet-port", portId: endpoint.portId };
}

export function selectionBoundsForNodesAndLabels(
  nodes: SheetNodeInstance[],
  labels: { position: XY }[],
): XY {
  const points = [
    ...nodes.map((node) => node.position),
    ...labels.map((label) => label.position),
  ];
  if (points.length === 0) return { x: 120, y: 100 };
  let minX = points[0].x;
  let minY = points[0].y;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
  }
  return { x: minX, y: minY };
}
