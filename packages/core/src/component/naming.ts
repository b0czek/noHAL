import { slugify } from "../id";
import {
  collectReachableSheetInstancePaths,
  walkReachableSheetInstances,
} from "../sheet/instances";
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

function collectReachableComponentInstancePaths(args: {
  project: NoHALProject;
  excludeNodeId?: string;
}): Set<string> {
  const paths = new Set<string>();
  walkReachableSheetInstances(args.project, ({ sheet, pathParts }) => {
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      if (args.excludeNodeId && node.id === args.excludeNodeId) continue;
      const component = args.project.library.components[node.componentId];
      paths.add(
        resolveComponentInstancePath(pathParts, node.instanceName, component),
      );
    }
  });
  return paths;
}

function collectTargetComponentInstancePaths(args: {
  project: NoHALProject;
  sheetId: string;
  component: ComponentDefinition | undefined;
  instanceName: string;
}): string[] {
  const targetPaths = collectReachableSheetInstancePaths(
    args.project,
    args.sheetId,
  ).map((pathParts) =>
    resolveComponentInstancePath(pathParts, args.instanceName, args.component),
  );

  if (
    targetPaths.length === 0 &&
    componentExportsToGlobalNamespace(args.component)
  ) {
    targetPaths.push(
      resolveComponentInstancePath([], args.instanceName, args.component),
    );
  }

  return targetPaths;
}

export function collectDuplicateExportedInstancePaths(
  project: NoHALProject,
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  walkReachableSheetInstances(project, ({ sheet, pathParts }) => {
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      const component = project.library.components[node.componentId];
      const path = resolveComponentInstancePath(
        pathParts,
        node.instanceName,
        component,
      );
      if (seen.has(path)) duplicates.add(path);
      else seen.add(path);
    }
  });
  return [...duplicates].sort((left, right) => left.localeCompare(right));
}

export function validateDuplicateExportedInstancePaths(
  project: NoHALProject,
  report: (message: string) => void,
): void {
  for (const path of collectDuplicateExportedInstancePaths(project)) {
    report(
      `Duplicate exported instance path '${path}' detected; component instances must be unique across the project export namespace`,
    );
  }
}

function collectAllComponentInstancePaths(args: {
  project: NoHALProject;
  excludeNodeId?: string;
}): Set<string> {
  const paths = collectReachableComponentInstancePaths(args);
  for (const sheet of Object.values(args.project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      if (args.excludeNodeId && node.id === args.excludeNodeId) continue;
      const component = args.project.library.components[node.componentId];
      if (!componentExportsToGlobalNamespace(component)) continue;
      paths.add(resolveComponentInstancePath([], node.instanceName, component));
    }
  }
  return paths;
}

function targetPathsConflictWithExisting(args: {
  project: NoHALProject;
  targetPaths: ReadonlySet<string>;
  excludeNodeId?: string;
}): boolean {
  const existingPaths = collectAllComponentInstancePaths({
    project: args.project,
    excludeNodeId: args.excludeNodeId,
  });
  for (const path of args.targetPaths) {
    if (existingPaths.has(path)) return true;
  }
  return false;
}

function targetPathsHaveSelfConflict(paths: string[]): boolean {
  return new Set(paths).size !== paths.length;
}

function targetSheetHasLocalNodeNameConflict(args: {
  project: NoHALProject;
  sheetId: string;
  instanceName: string;
  excludeNodeId?: string;
}): boolean {
  const sheet = args.project.sheets[args.sheetId];
  if (!sheet) return false;
  return sheet.nodes.some(
    (node) =>
      node.instanceName === args.instanceName && node.id !== args.excludeNodeId,
  );
}

export function hasComponentExportPathConflict(args: {
  project: NoHALProject;
  sheetId: string;
  component: ComponentDefinition | undefined;
  instanceName: string;
  excludeNodeId?: string;
}): boolean {
  const targetPaths = collectTargetComponentInstancePaths(args);
  if (targetPathsHaveSelfConflict(targetPaths)) return true;
  if (targetSheetHasLocalNodeNameConflict(args)) return true;
  if (targetPaths.length === 0) return false;
  return targetPathsConflictWithExisting({
    project: args.project,
    targetPaths: new Set(targetPaths),
    excludeNodeId: args.excludeNodeId,
  });
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
