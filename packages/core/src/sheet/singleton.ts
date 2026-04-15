import { componentExportsToGlobalNamespace } from "../component/naming";
import type { NoHALProject, SheetNode } from "../types";
import { countReachableSheetInstances } from "./instances";

const INSTANCE_COUNT_LIMIT = 2;

export type SheetSingletonStatus = "not_possible" | "possible" | "forced";

export type SheetSingletonReason =
  | { kind: "root" }
  | { kind: "system-sheet" }
  | {
      kind: "component";
      nodeId: string;
      componentId: string;
      componentName: string;
    }
  | {
      kind: "subsheet";
      nodeId: string;
      sheetId: string;
      sheetName: string;
    };

export interface SheetSingletonInfo {
  sheetId: string;
  status: SheetSingletonStatus;
  canBeSingleton: boolean;
  isForcedSingleton: boolean;
  reachableInstanceCount: number;
  reasons: SheetSingletonReason[];
}

function componentForcesSheetSingleton(
  project: NoHALProject,
  componentId: string,
): boolean {
  return componentExportsToGlobalNamespace(
    project.library.components[componentId],
  );
}

function resolveSheetSingletonStatus(
  isForcedSingleton: boolean,
  canBeSingleton: boolean,
): SheetSingletonStatus {
  if (isForcedSingleton) return "forced";
  if (canBeSingleton) return "possible";
  return "not_possible";
}

function addSingletonReason(
  reasons: Map<string, SheetSingletonReason[]>,
  sheetId: string,
  reason: SheetSingletonReason,
): void {
  const list = reasons.get(sheetId);
  if (list) {
    list.push(reason);
  } else {
    reasons.set(sheetId, [reason]);
  }
}

function collectDirectSingletonReasons(
  project: NoHALProject,
): Map<string, SheetSingletonReason[]> {
  const reasons = new Map<string, SheetSingletonReason[]>();
  addSingletonReason(reasons, project.rootSheetId, { kind: "root" });

  for (const sheet of Object.values(project.sheets)) {
    if (sheet.role === "system") {
      addSingletonReason(reasons, sheet.id, { kind: "system-sheet" });
    }
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      if (!componentForcesSheetSingleton(project, node.componentId)) continue;
      const component = project.library.components[node.componentId];
      addSingletonReason(reasons, sheet.id, {
        kind: "component",
        nodeId: node.id,
        componentId: node.componentId,
        componentName: component?.halComponentName ?? node.componentId,
      });
    }
  }

  return reasons;
}

function propagateSingletonReasons(
  project: NoHALProject,
  reasons: Map<string, SheetSingletonReason[]>,
): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const sheet of Object.values(project.sheets)) {
      for (const node of sheet.nodes) {
        if (node.kind !== "sheet") continue;
        if (!reasons.has(node.sheetId) || reasons.has(sheet.id)) continue;
        const childSheet = project.sheets[node.sheetId];
        addSingletonReason(reasons, sheet.id, {
          kind: "subsheet",
          nodeId: node.id,
          sheetId: node.sheetId,
          sheetName: childSheet?.name ?? node.sheetId,
        });
        changed = true;
      }
    }
  }
}

export function analyzeSheetSingletons(
  project: NoHALProject,
): Map<string, SheetSingletonInfo> {
  const reasons = collectDirectSingletonReasons(project);
  propagateSingletonReasons(project, reasons);

  return new Map(
    Object.values(project.sheets).map((sheet) => {
      const sheetReasons = reasons.get(sheet.id) ?? [];
      const reachableInstanceCount = countReachableSheetInstances(
        project,
        sheet.id,
        INSTANCE_COUNT_LIMIT,
      );
      const canBeSingleton = reachableInstanceCount <= 1;
      const isForcedSingleton = sheetReasons.length > 0;
      const status = resolveSheetSingletonStatus(
        isForcedSingleton,
        canBeSingleton,
      );
      return [
        sheet.id,
        {
          sheetId: sheet.id,
          status,
          canBeSingleton,
          isForcedSingleton,
          reachableInstanceCount,
          reasons: sheetReasons,
        },
      ];
    }),
  );
}

export function getSheetSingletonInfo(
  project: NoHALProject,
  sheetId: string,
): SheetSingletonInfo | undefined {
  return analyzeSheetSingletons(project).get(sheetId);
}

export function findInvalidForcedSheetSingletons(
  project: NoHALProject,
): SheetSingletonInfo[] {
  return [...analyzeSheetSingletons(project).values()].filter(
    (info) => info.isForcedSingleton && !info.canBeSingleton,
  );
}

export function isSingletonReferenceBlocked(
  project: NoHALProject,
  parentSheetId: string,
  targetSheetId: string,
): boolean {
  const parentSheet = project.sheets[parentSheetId];
  const targetSheet = project.sheets[targetSheetId];
  if (!parentSheet || !targetSheet) return true;

  const node: SheetNode = {
    id: "__singleton_probe__",
    kind: "sheet",
    sheetId: targetSheetId,
    instanceName: "__singleton_probe__",
    position: { x: 0, y: 0 },
  };
  parentSheet.nodes.push(node);
  const invalid = findInvalidForcedSheetSingletons(project).length > 0;
  parentSheet.nodes.pop();
  return invalid;
}

export function validateForcedSheetSingletons(
  project: NoHALProject,
  report: (message: string) => void,
): void {
  for (const info of findInvalidForcedSheetSingletons(project)) {
    const sheet = project.sheets[info.sheetId];
    report(
      `Sheet '${sheet?.name ?? info.sheetId}' contains singleton-only nodes but is expanded more than once in the project`,
    );
  }
}
