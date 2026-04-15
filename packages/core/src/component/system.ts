import type { ComponentDefinition } from "../types";

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

export function fixedInstanceNameForComponent(
  component: ComponentDefinition | undefined,
): string | undefined {
  return component?.constraints?.fixedInstanceName;
}

export function fixedExportStageForComponent(
  component: ComponentDefinition | undefined,
): "main" | "postgui" | undefined {
  return component?.constraints?.fixedExportStage;
}

export function isPostguiOnlyComponent(
  component: ComponentDefinition | undefined,
): boolean {
  return fixedExportStageForComponent(component) === "postgui";
}

export function resolveNodeExportStage(
  component: ComponentDefinition | undefined,
  requestedStage: "main" | "postgui" | undefined,
): "main" | "postgui" {
  return (
    fixedExportStageForComponent(component) ??
    (requestedStage === "postgui" ? "postgui" : "main")
  );
}
