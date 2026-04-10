import { safeKey } from "../id";
import type {
  ComponentDefinition,
  ComponentFunctionDefinition,
  ComponentParamDefinition,
  ComponentPinDefinition,
  ImportedComponentDefinition,
  NoHALProject,
} from "../types";

export function nextUniqueIdentifier(
  base: string,
  existing: readonly string[],
  separator = "_",
): string {
  const normalized = base.trim() || "item";
  if (!existing.includes(normalized)) return normalized;
  let index = 2;
  while (existing.includes(`${normalized}${separator}${index}`)) index += 1;
  return `${normalized}${separator}${index}`;
}

export function nextUniqueMemberKey(
  preferredName: string,
  existingKeys: readonly string[],
  fallback: string,
): string {
  const baseKey = safeKey(preferredName) || fallback;
  const used = new Set(existingKeys);
  if (!used.has(baseKey)) return baseKey;
  let index = 2;
  let candidate = `${baseKey}_${index}`;
  while (used.has(candidate)) {
    index += 1;
    candidate = `${baseKey}_${index}`;
  }
  return candidate;
}

export function createCustomComponentPin(
  component: ComponentDefinition,
): ComponentPinDefinition {
  const name = nextUniqueIdentifier(
    "pin",
    component.pins.map((pin) => pin.name),
  );
  return {
    key: nextUniqueMemberKey(
      name,
      component.pins.map((pin) => pin.key),
      "pin",
    ),
    name,
    direction: "in",
    type: "bit",
  };
}

export function createCustomComponentParam(
  component: ComponentDefinition,
): ComponentParamDefinition {
  const name = nextUniqueIdentifier(
    "param",
    component.params.map((param) => param.name),
  );
  return {
    key: nextUniqueMemberKey(
      name,
      component.params.map((param) => param.key),
      "param",
    ),
    name,
    direction: "rw",
    type: "float",
  };
}

export function createCustomComponentFunction(
  component: ComponentDefinition,
): ComponentFunctionDefinition {
  const existingNames = (component.functions ?? []).map(
    (fn) => fn.declaredName,
  );
  const declaredName = nextUniqueIdentifier("function", existingNames);
  const halSuffix = declaredName;
  return {
    key: nextUniqueMemberKey(
      declaredName,
      (component.functions ?? []).map((fn) => fn.key),
      "function",
    ),
    declaredName,
    halSuffix,
    floatMode: "fp",
  };
}

export function createCustomComponentDefinition(options: {
  componentId: string;
  existingHalComponentNames: readonly string[];
  baseHalComponentName?: string;
}): ComponentDefinition {
  const halComponentName = nextUniqueIdentifier(
    options.baseHalComponentName ?? "custom_component",
    options.existingHalComponentNames,
  );

  return {
    id: options.componentId,
    name: halComponentName,
    halComponentName,
    source: "manual",
    runtime: { kind: "unknown" },
    pins: [],
    params: [],
  };
}

export function toImportedCustomComponentDefinition(
  component: ComponentDefinition,
): ImportedComponentDefinition {
  return {
    ...component,
    source: "manual",
    parseMeta: {
      parser: "nohal-manual-v1",
      warnings: [],
    },
  };
}

export function findManualComponent(
  project: NoHALProject,
  componentId: string,
): ComponentDefinition | null {
  const component = project.library.components[componentId];
  if (!component || component.source === "comp") return null;
  return component;
}

export function projectUsesComponentDefinition(
  project: NoHALProject,
  componentId: string,
): number {
  let count = 0;
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind === "component" && node.componentId === componentId) {
        count += 1;
      }
    }
  }
  return count;
}
