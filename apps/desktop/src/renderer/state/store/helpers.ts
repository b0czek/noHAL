import {
  componentHasFixedExportNamespace,
  componentPrefersCanonicalInstanceNames,
  componentUsesLockedCanonicalInstanceNames,
  ensureInstanceName,
  hasComponentExportPathConflict,
  nextComponentInstanceName,
} from "@nohal/core/componentNaming";
import {
  createEmptyComponentStore,
  isStoreEntryCompatibleWithLinuxCncVersion,
  listStoreEntriesForLinuxCncVersion,
} from "@nohal/core/componentStore";
import { applyComponentDefinitionToProject } from "@nohal/core/customComponent";
import { STORE_CUSTOM_COMPONENT_ID_PREFIX } from "@nohal/core/customComponentStore";
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

export {
  componentHasFixedExportNamespace,
  componentPrefersCanonicalInstanceNames,
  componentUsesLockedCanonicalInstanceNames,
  createEmptyComponentStore,
  ensureInstanceName,
  hasComponentExportPathConflict,
  nextComponentInstanceName,
  normalizeRotationDegrees,
};

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
    applyComponentDefinitionToProject(project, entry.componentId, entry.parsed);
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
    const entry = componentStore.components[componentId];
    const isStoreBackedComponent =
      !!entry ||
      component.source === "comp" ||
      componentId.startsWith(STORE_CUSTOM_COMPONENT_ID_PREFIX);
    if (!isStoreBackedComponent) continue;
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

export function getComponentSourceDisplayLabel(
  componentStore: ComponentStore,
  sourceId: string,
): string {
  const source = componentStore.sources[sourceId];
  if (!source) return sourceId;
  if (source.kind === "manual") return "Custom Components";
  if (source.kind === "comp-dir") return source.dirPath;
  if (source.kind === "comp-file") return source.filePath;
  return `LinuxCNC ${source.linuxcncVersion} built-ins (${source.refName})`;
}

export function repointComponentDefinitionId(
  project: NoHALProject,
  fromComponentId: string,
  toComponentId: string,
): number {
  let repointedCount = 0;
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== fromComponentId) {
        continue;
      }
      node.componentId = toComponentId;
      repointedCount += 1;
    }
  }
  return repointedCount;
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
