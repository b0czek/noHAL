import type { ComponentStore, NoHALProject } from "../types";
import { nextUniqueIdentifier } from "./shared";

function isProjectCustomComponent(
  project: NoHALProject,
  componentStore: ComponentStore | undefined,
  componentId: string,
): boolean {
  if (componentStore?.components[componentId]) return false;
  const component = project.library.components[componentId];
  return !!component && component.source !== "comp";
}

export interface HalComponentNameConflict {
  componentId: string;
  halComponentName: string;
  scope: "project-custom" | "store-manual" | "store-comp" | "store-builtin";
}

function findProjectCustomHalComponentNameConflict(options: {
  halComponentName: string;
  project: NoHALProject;
  componentStore?: ComponentStore;
  excludedComponentIds: ReadonlySet<string>;
}): HalComponentNameConflict | null {
  for (const componentId of Object.keys(options.project.library.components)) {
    if (options.excludedComponentIds.has(componentId)) continue;
    if (
      !isProjectCustomComponent(
        options.project,
        options.componentStore,
        componentId,
      )
    ) {
      continue;
    }
    const component = options.project.library.components[componentId];
    if (component.halComponentName !== options.halComponentName) continue;
    return {
      componentId,
      halComponentName: options.halComponentName,
      scope: "project-custom",
    };
  }

  return null;
}

function storeConflictScope(
  entry: ComponentStore["components"][string],
): HalComponentNameConflict["scope"] {
  if (entry.sourceRef.kind === "manual") return "store-manual";
  if (entry.sourceRef.kind === "linuxcnc-builtin") return "store-builtin";
  return "store-comp";
}

function findStoreHalComponentNameConflict(options: {
  halComponentName: string;
  componentStore: ComponentStore;
  excludedComponentIds: ReadonlySet<string>;
}): HalComponentNameConflict | null {
  for (const [componentId, entry] of Object.entries(
    options.componentStore.components,
  )) {
    if (options.excludedComponentIds.has(componentId)) continue;
    if (entry.parsed.halComponentName !== options.halComponentName) continue;
    return {
      componentId,
      halComponentName: options.halComponentName,
      scope: storeConflictScope(entry),
    };
  }

  return null;
}

export function findHalComponentNameConflict(options: {
  halComponentName: string;
  project?: NoHALProject;
  componentStore?: ComponentStore;
  excludeComponentIds?: readonly string[];
}): HalComponentNameConflict | null {
  const normalized = options.halComponentName.trim();
  if (!normalized) return null;

  const excluded = new Set(options.excludeComponentIds ?? []);
  if (options.project) {
    const conflict = findProjectCustomHalComponentNameConflict({
      halComponentName: normalized,
      project: options.project,
      componentStore: options.componentStore,
      excludedComponentIds: excluded,
    });
    if (conflict) return conflict;
  }

  if (options.componentStore) {
    return findStoreHalComponentNameConflict({
      halComponentName: normalized,
      componentStore: options.componentStore,
      excludedComponentIds: excluded,
    });
  }

  return null;
}

export function nextHalComponentName(options: {
  baseHalComponentName?: string;
  project?: NoHALProject;
  componentStore?: ComponentStore;
  excludeComponentIds?: readonly string[];
}): string {
  const excluded = new Set(options.excludeComponentIds ?? []);
  const existing: string[] = [];

  if (options.project) {
    for (const componentId of Object.keys(options.project.library.components)) {
      if (excluded.has(componentId)) continue;
      if (
        !isProjectCustomComponent(
          options.project,
          options.componentStore,
          componentId,
        )
      ) {
        continue;
      }
      existing.push(
        options.project.library.components[componentId].halComponentName,
      );
    }
  }

  if (options.componentStore) {
    for (const [componentId, entry] of Object.entries(
      options.componentStore.components,
    )) {
      if (excluded.has(componentId)) continue;
      existing.push(entry.parsed.halComponentName);
    }
  }

  return nextUniqueIdentifier(
    options.baseHalComponentName ?? "custom_component",
    existing,
  );
}
