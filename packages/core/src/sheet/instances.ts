import type { NoHALProject, SheetDefinition } from "../types";

export interface ReachableSheetInstance {
  sheetId: string;
  sheet: SheetDefinition;
  pathParts: string[];
}

export function walkReachableSheetInstances(
  project: NoHALProject,
  visit: (instance: ReachableSheetInstance) => void,
): void {
  const walk = (
    sheetId: string,
    pathParts: string[],
    sheetStack: string[],
  ): void => {
    if (sheetStack.includes(sheetId)) return;
    const sheet = project.sheets[sheetId];
    if (!sheet) return;

    visit({ sheetId, sheet, pathParts });
    const nextStack = [...sheetStack, sheetId];

    for (const node of sheet.nodes) {
      if (node.kind !== "sheet") continue;
      walk(node.sheetId, [...pathParts, node.instanceName], nextStack);
    }
  };

  walk(project.rootSheetId, [], []);
}

export function collectReachableSheetInstancePaths(
  project: NoHALProject,
  targetSheetId: string,
): string[][] {
  const paths: string[][] = [];
  walkReachableSheetInstances(project, ({ sheetId, pathParts }) => {
    if (sheetId === targetSheetId) paths.push([...pathParts]);
  });
  return paths;
}

export function countReachableSheetInstances(
  project: NoHALProject,
  targetSheetId: string,
  limit = Number.POSITIVE_INFINITY,
): number {
  let count = 0;
  walkReachableSheetInstances(project, ({ sheetId }) => {
    if (count >= limit) return;
    if (sheetId === targetSheetId) count += 1;
  });
  return count;
}
