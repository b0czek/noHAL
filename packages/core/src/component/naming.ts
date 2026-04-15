import { slugify } from "../id";
import type {
  ComponentDefinition,
  ComponentExportNamespace,
  NoHALProject,
  SheetDefinition,
} from "../types";

const DEFAULT_CANONICAL_INSTANCE_LIMIT = 10_000;
const DEFAULT_FREE_INSTANCE_LIMIT = 10_000;

function nextUniqueName(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let index = 2;
  while (used.has(`${base}${index}`)) index += 1;
  return `${base}${index}`;
}

export function componentUsesLockedCanonicalInstanceNames(
  component: ComponentDefinition | undefined,
): boolean {
  if (!component) return false;
  const naming = component.runtime?.instanceNaming;
  return (
    naming?.strategy === "canonical_indexed" && naming.lockToCanonical === true
  );
}

export function componentPrefersCanonicalInstanceNames(
  component: ComponentDefinition | undefined,
): boolean {
  return component?.runtime?.instanceNaming?.strategy === "canonical_indexed";
}

export function resolveComponentExportNamespace(
  component: ComponentDefinition | undefined,
): ComponentExportNamespace {
  const explicitNamespace = component?.constraints?.exportNamespace;
  if (explicitNamespace) return explicitNamespace;
  if (component?.system) return "global";
  if (componentUsesLockedCanonicalInstanceNames(component)) return "global";
  return "sheet_scoped";
}

export function componentExportsToGlobalNamespace(
  component: ComponentDefinition | undefined,
): boolean {
  return resolveComponentExportNamespace(component) === "global";
}

function joinInstancePath(parts: string[]): string {
  return parts.join(".");
}

export function resolveComponentInstancePath(
  pathParts: string[],
  instanceName: string,
  component: ComponentDefinition | undefined,
): string {
  if (componentExportsToGlobalNamespace(component)) return instanceName;
  return joinInstancePath([...pathParts, instanceName]);
}

function walkSheetInstances(
  project: NoHALProject,
  sheetId: string,
  pathParts: string[],
  seen: Set<string>,
  visit: (sheetId: string, pathParts: string[]) => void,
): void {
  const visitKey = `${sheetId}|${joinInstancePath(pathParts)}`;
  if (seen.has(visitKey)) return;
  seen.add(visitKey);

  const sheet = project.sheets[sheetId];
  if (!sheet) return;
  visit(sheetId, pathParts);

  for (const node of sheet.nodes) {
    if (node.kind !== "sheet") continue;
    walkSheetInstances(
      project,
      node.sheetId,
      [...pathParts, node.instanceName],
      seen,
      visit,
    );
  }
}

function collectSheetInstancePaths(
  project: NoHALProject,
  targetSheetId: string,
): string[][] {
  const paths: string[][] = [];
  walkSheetInstances(
    project,
    project.rootSheetId,
    [],
    new Set<string>(),
    (currentSheetId, pathParts) => {
      if (currentSheetId === targetSheetId) paths.push([...pathParts]);
    },
  );
  return paths;
}

export function hasComponentExportPathConflict(args: {
  project: NoHALProject;
  sheetId: string;
  component: ComponentDefinition | undefined;
  instanceName: string;
  excludeNodeId?: string;
}): boolean {
  const targetPaths = collectSheetInstancePaths(args.project, args.sheetId).map(
    (pathParts) =>
      resolveComponentInstancePath(
        pathParts,
        args.instanceName,
        args.component,
      ),
  );
  if (targetPaths.length === 0) return false;

  const uniqueTargetPaths = new Set(targetPaths);
  if (uniqueTargetPaths.size !== targetPaths.length) return true;

  let conflictFound = false;
  walkSheetInstances(
    args.project,
    args.project.rootSheetId,
    [],
    new Set(),
    (currentSheetId, pathParts) => {
      if (conflictFound) return;
      const sheet = args.project.sheets[currentSheetId];
      if (!sheet) return;
      for (const node of sheet.nodes) {
        if (node.kind !== "component") continue;
        if (args.excludeNodeId && node.id === args.excludeNodeId) continue;
        const component = args.project.library.components[node.componentId];
        const instancePath = resolveComponentInstancePath(
          pathParts,
          node.instanceName,
          component,
        );
        if (uniqueTargetPaths.has(instancePath)) {
          conflictFound = true;
          return;
        }
      }
    },
  );

  return conflictFound;
}

export function ensureInstanceName(
  sheet: SheetDefinition,
  preferred: string,
): string {
  const used = new Set(sheet.nodes.map((node) => node.instanceName));
  return nextUniqueName(slugify(preferred).replace(/-/g, "_"), used);
}

export function nextComponentInstanceName(
  project: NoHALProject,
  sheet: SheetDefinition,
  component: ComponentDefinition,
): string | undefined {
  if (!componentPrefersCanonicalInstanceNames(component)) {
    const base = slugify(component.halComponentName).replace(/-/g, "_");
    const used = new Set(sheet.nodes.map((node) => node.instanceName));
    for (let index = 0; index < DEFAULT_FREE_INSTANCE_LIMIT; index += 1) {
      const candidate = nextUniqueName(base, used);
      used.add(candidate);
      if (
        !hasComponentExportPathConflict({
          project,
          sheetId: sheet.id,
          component,
          instanceName: candidate,
        })
      ) {
        return candidate;
      }
    }
    return undefined;
  }

  const base = component.halComponentName;
  const maxConfigured = component.runtime?.instanceNaming?.maxInstances;
  const maxInstances =
    Number.isFinite(maxConfigured) && (maxConfigured ?? 0) > 0
      ? Math.max(1, Math.trunc(maxConfigured ?? 1))
      : DEFAULT_CANONICAL_INSTANCE_LIMIT;
  for (let index = 0; index < maxInstances; index += 1) {
    const candidate = `${base}.${index}`;
    if (
      !hasComponentExportPathConflict({
        project,
        sheetId: sheet.id,
        component,
        instanceName: candidate,
      })
    ) {
      return candidate;
    }
  }
  return undefined;
}
