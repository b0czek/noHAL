import { slugify } from "./id";
import type { ComponentDefinition, SheetDefinition } from "./types";

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

export function ensureInstanceName(
  sheet: SheetDefinition,
  preferred: string,
): string {
  const used = new Set(sheet.nodes.map((node) => node.instanceName));
  return nextUniqueName(slugify(preferred).replace(/-/g, "_"), used);
}

export function nextComponentInstanceName(
  sheet: SheetDefinition,
  component: ComponentDefinition,
): string | undefined {
  if (!componentPrefersCanonicalInstanceNames(component)) {
    return ensureInstanceName(sheet, component.halComponentName);
  }

  const used = new Set(sheet.nodes.map((node) => node.instanceName));
  const base = component.halComponentName;
  const maxConfigured = component.runtime?.instanceNaming?.maxInstances;
  const maxInstances =
    Number.isFinite(maxConfigured) && (maxConfigured ?? 0) > 0
      ? Math.max(1, Math.trunc(maxConfigured ?? 1))
      : 10_000;
  for (let index = 0; index < maxInstances; index += 1) {
    const candidate = `${base}.${index}`;
    if (!used.has(candidate)) return candidate;
  }
  return undefined;
}
