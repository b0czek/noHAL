import type { ComponentDefinition } from "./types";

export function isComponentPlaceable(component: ComponentDefinition): boolean {
  return component.visibility?.placeable !== false;
}

export function isComponentSearchable(component: ComponentDefinition): boolean {
  return component.visibility?.searchable !== false;
}

export function isComponentShownInCustomComponents(
  component: ComponentDefinition,
): boolean {
  return component.visibility?.showInCustomComponents !== false;
}
