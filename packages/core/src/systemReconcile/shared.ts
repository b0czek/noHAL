import { filter, fromEntries, map, pipe, sortBy } from "remeda";
import { resolveComponentPinsForInstance } from "../component/instance";
import type { ComponentDefinition } from "../types";

export function samePinSchema(
  a: ComponentDefinition["pins"],
  b: ComponentDefinition["pins"],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) return false;
    if (
      left.key !== right.key ||
      left.name !== right.name ||
      left.direction !== right.direction ||
      left.type !== right.type
    ) {
      return false;
    }
  }
  return true;
}

export function sameParamSchema(
  a: ComponentDefinition["params"],
  b: ComponentDefinition["params"],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) return false;
    if (
      left.key !== right.key ||
      left.name !== right.name ||
      left.direction !== right.direction ||
      left.type !== right.type ||
      left.defaultValue !== right.defaultValue
    ) {
      return false;
    }
  }
  return true;
}

export function sameFunctionSchema(
  a: ComponentDefinition["functions"] | undefined,
  b: ComponentDefinition["functions"] | undefined,
): boolean {
  const left = a ?? [];
  const right = b ?? [];
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    const leftFn = left[i];
    const rightFn = right[i];
    if (!leftFn || !rightFn) return false;
    if (
      leftFn.key !== rightFn.key ||
      leftFn.declaredName !== rightFn.declaredName ||
      leftFn.halSuffix !== rightFn.halSuffix ||
      leftFn.floatMode !== rightFn.floatMode ||
      leftFn.addfTargetTemplate !== rightFn.addfTargetTemplate
    ) {
      return false;
    }
  }
  return true;
}

export function normalizeInstanceConfigValues(
  value: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!value) return undefined;
  const entries = pipe(
    Object.entries(value),
    map(([key, item]) => [key.trim(), `${item}`.trim()] as const),
    filter(([key, item]) => key.length > 0 && item.length > 0),
    sortBy(([key]) => key),
  );
  if (entries.length === 0) return undefined;
  return fromEntries(entries);
}

export function sameInstanceConfigValues(
  a: Record<string, string> | undefined,
  b: Record<string, string> | undefined,
): boolean {
  const left = normalizeInstanceConfigValues(a);
  const right = normalizeInstanceConfigValues(b);
  if (!left && !right) return true;
  if (!left || !right) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (!(key in right)) return false;
    if (left[key] !== right[key]) return false;
  }
  return true;
}

export function sameSystemComponentDefinition(
  existing: ComponentDefinition | undefined,
  expected: ComponentDefinition,
): boolean {
  if (!existing) return false;
  if (existing.halComponentName !== expected.halComponentName) return false;
  if (existing.source !== expected.source) return false;
  if (
    (existing.runtime?.kind ?? "unknown") !==
    (expected.runtime?.kind ?? "unknown")
  ) {
    return false;
  }
  if (
    JSON.stringify(existing.runtime?.instanceConfig ?? null) !==
    JSON.stringify(expected.runtime?.instanceConfig ?? null)
  ) {
    return false;
  }
  if (
    existing.system?.manager !== expected.system?.manager ||
    existing.system?.family !== expected.system?.family
  ) {
    return false;
  }
  if (
    JSON.stringify(existing.constraints ?? null) !==
    JSON.stringify(expected.constraints ?? null)
  ) {
    return false;
  }
  return samePinSchema(existing.pins, expected.pins);
}

export function sameComponentDefinition(
  existing: ComponentDefinition | undefined,
  expected: ComponentDefinition,
): boolean {
  if (!existing) return false;
  if (existing.id !== expected.id) return false;
  if (existing.name !== expected.name) return false;
  if (existing.halComponentName !== expected.halComponentName) return false;
  if (existing.source !== expected.source) return false;
  if (existing.loadCommand !== expected.loadCommand) return false;
  if (existing.sourcePath !== expected.sourcePath) return false;
  if (
    JSON.stringify(existing.runtime ?? null) !==
    JSON.stringify(expected.runtime ?? null)
  ) {
    return false;
  }
  if (
    JSON.stringify(existing.system ?? null) !==
    JSON.stringify(expected.system ?? null)
  ) {
    return false;
  }
  if (
    JSON.stringify(existing.constraints ?? null) !==
    JSON.stringify(expected.constraints ?? null)
  ) {
    return false;
  }
  if (
    JSON.stringify(existing.visibility ?? null) !==
    JSON.stringify(expected.visibility ?? null)
  ) {
    return false;
  }
  if (!samePinSchema(existing.pins, expected.pins)) return false;
  if (!sameParamSchema(existing.params, expected.params)) return false;
  if (!sameFunctionSchema(existing.functions, expected.functions)) {
    return false;
  }
  return true;
}

export function pinIdentity(
  pin: Pick<ComponentDefinition["pins"][number], "name">,
): string {
  return pin.name;
}

export function paramIdentity(
  param: Pick<ComponentDefinition["params"][number], "name">,
): string {
  return param.name;
}

export function functionIdentity(
  fn: Pick<
    NonNullable<ComponentDefinition["functions"]>[number],
    "halSuffix" | "declaredName" | "key"
  >,
): string {
  return fn.halSuffix || fn.declaredName || fn.key;
}

function mergeSystemFunctions(
  component: ComponentDefinition,
  expected: ComponentDefinition,
): NonNullable<ComponentDefinition["functions"]> | undefined {
  const expectedFunctions = expected.functions ?? [];
  const currentFunctions = component.functions ?? [];
  const currentByIdentity = new Map(
    currentFunctions.map((fn) => [functionIdentity(fn), fn]),
  );
  const expectedIdentities = new Set(
    expectedFunctions.map((fn) => functionIdentity(fn)),
  );

  const merged = expectedFunctions.map((fn) => {
    const current = currentByIdentity.get(functionIdentity(fn));
    if (!current) return fn;
    const addfTargetTemplate =
      current.addfTargetTemplate ?? fn.addfTargetTemplate;
    return {
      ...fn,
      key: current.key,
      declaredName: current.declaredName,
      halSuffix: current.halSuffix,
      ...(current.doc ? { doc: current.doc } : {}),
      ...(addfTargetTemplate ? { addfTargetTemplate } : {}),
    };
  });

  for (const fn of currentFunctions) {
    if (expectedIdentities.has(functionIdentity(fn))) continue;
    merged.push(fn);
  }

  return merged.length > 0 ? merged : undefined;
}

export function buildSystemOverrideDefinition(
  component: ComponentDefinition | undefined,
  expected: ComponentDefinition,
  customOverrideManager: string,
  customOverrideFamily: string,
  expectedInstanceConfigValues?: Record<string, string>,
): ComponentDefinition | null {
  if (!component) return null;

  const expectedPins = new Set(
    resolveComponentPinsForInstance(expected, expectedInstanceConfigValues).map(
      pinIdentity,
    ),
  );
  const extraPins = resolveComponentPinsForInstance(
    component,
    expectedInstanceConfigValues,
  ).filter((pin) => !expectedPins.has(pinIdentity(pin)));
  const expectedParams = new Set(expected.params.map(paramIdentity));
  const extraParams = component.params.filter(
    (param) => !expectedParams.has(paramIdentity(param)),
  );
  const expectedFunctions = new Set(
    (expected.functions ?? []).map(functionIdentity),
  );
  const extraFunctions = (component.functions ?? []).filter(
    (fn) => !expectedFunctions.has(functionIdentity(fn)),
  );

  if (
    extraPins.length === 0 &&
    extraParams.length === 0 &&
    extraFunctions.length === 0
  ) {
    return null;
  }

  const mergedFunctions = mergeSystemFunctions(component, expected);

  return {
    ...component,
    name: component.name || expected.name,
    halComponentName: expected.halComponentName,
    pins: [...expected.pins, ...extraPins],
    params: [...expected.params, ...extraParams],
    ...(mergedFunctions ? { functions: mergedFunctions } : {}),
    runtime: expected.runtime,
    system: {
      manager: customOverrideManager,
      family: customOverrideFamily,
    },
    constraints: expected.constraints,
    visibility: {
      placeable: false,
      searchable: false,
      showInCustomComponents: true,
    },
    docs: component.docs ?? expected.docs,
  };
}
