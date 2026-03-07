import type { ComponentFunctionDefinition } from "./types";

export function resolveAddfFunctionTarget(
  instancePath: string,
  fn: ComponentFunctionDefinition,
): string {
  const template = fn.addfTargetTemplate?.trim();
  if (template) return template.replaceAll("{instance}", instancePath);
  return fn.halSuffix ? `${instancePath}.${fn.halSuffix}` : instancePath;
}
