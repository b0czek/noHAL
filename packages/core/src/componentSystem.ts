import type { ComponentDefinition } from "./types";

export function isSystemComponent(
  component: ComponentDefinition | undefined,
): boolean {
  return !!component?.system;
}

export function isManagedBySystemManager(
  component: ComponentDefinition | undefined,
  manager: string,
): boolean {
  return component?.system?.manager === manager;
}
