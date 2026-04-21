import { resolveComponentPinsForInstance } from "../../component/instance";
import type {
  ComponentDefinition,
  ComponentPinDefinition,
  HalImportComponentGroup,
  PinDirection,
} from "../../types";

export interface HalImportInstanceIndex {
  groupByInstance: Map<string, HalImportComponentGroup>;
  instanceByName: Map<string, HalImportComponentGroup["instances"][number]>;
}

export function importPinDirectionToSide(
  direction: PinDirection | undefined,
): "left" | "right" | "bottom" {
  if (direction === "out") return "right";
  if (direction === "in") return "left";
  return "bottom";
}

export function directionsCompatibleForDirectImport(
  a: PinDirection | undefined,
  b: PinDirection | undefined,
): boolean {
  if (!a || !b) return false;
  if (a === "in" && b === "in") return false;
  if (a === "out" && b === "out") return false;
  return true;
}

function observedNameCandidates(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const segments = trimmed.split(".").filter(Boolean);
  const out = new Set<string>([trimmed]);
  for (let index = 1; index < segments.length; index += 1) {
    out.add(segments.slice(index).join("."));
  }
  return [...out];
}

export function createGroupInstanceIndex(
  componentGroups: HalImportComponentGroup[],
): HalImportInstanceIndex {
  const groupByInstance = new Map<string, HalImportComponentGroup>();
  const instanceByName = new Map<
    string,
    HalImportComponentGroup["instances"][number]
  >();

  for (const group of componentGroups) {
    for (const instance of group.instances) {
      groupByInstance.set(instance.instanceName, group);
      instanceByName.set(instance.instanceName, instance);
    }
  }

  return { groupByInstance, instanceByName };
}

export function findMatchingComponentPin(
  component: ComponentDefinition | undefined,
  observedName: string,
  instanceConfigValues?: Record<string, string>,
): ComponentPinDefinition | undefined {
  if (!component) return undefined;
  const resolvedPins = resolveComponentPinsForInstance(
    component,
    instanceConfigValues,
  );
  for (const candidate of observedNameCandidates(observedName)) {
    const pin = resolvedPins.find((item) => item.name === candidate);
    if (pin) return pin;
  }
  return undefined;
}

export function findMatchingComponentParam(
  component: ComponentDefinition | undefined,
  observedName: string,
) {
  if (!component) return undefined;
  for (const candidate of observedNameCandidates(observedName)) {
    const param = component.params.find((item) => item.name === candidate);
    if (param) return param;
  }
  return undefined;
}
