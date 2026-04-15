import { pickBy, pullObject, unique } from "remeda";
import { resolveComponentPinsForInstance } from "../component/instance";
import { normalizeComponentPinOrder } from "../pinOrder";
import type { ComponentDefinition, NoHALProject } from "../types";

function mergeKnownValuesWithDefaults(
  currentValues: Record<string, string>,
  validKeys: ReadonlySet<string>,
  defaultValues: Record<string, string>,
): Record<string, string> {
  const nextValues = pickBy(currentValues, (_value, key) => validKeys.has(key));
  for (const [key, value] of Object.entries(defaultValues)) {
    if (!(key in nextValues)) nextValues[key] = value;
  }
  return nextValues;
}

function prunePinInitialValues(
  currentValues: Record<string, string> | undefined,
  validPinKeys: ReadonlySet<string>,
): Record<string, string> | undefined {
  const nextValues = pickBy(
    currentValues ?? {},
    (value, key) => validPinKeys.has(key) && value.trim().length > 0,
  );
  return Object.keys(nextValues).length > 0 ? nextValues : undefined;
}

function pruneHiddenPinKeys(
  currentValues: string[] | undefined,
  validPinKeys: ReadonlySet<string>,
): string[] | undefined {
  const nextValues = unique(
    (currentValues ?? []).filter((key) => validPinKeys.has(key)),
  );
  return nextValues.length > 0 ? nextValues : undefined;
}

export function reconcileComponentNodesForDefinition(
  project: NoHALProject,
  componentId: string,
  component: ComponentDefinition,
): void {
  const validParamKeys = new Set(component.params.map((param) => param.key));
  const validInstanceConfigKeys = new Set(
    (component.runtime?.instanceConfig?.fields ?? []).map((field) => field.key),
  );
  const defaultInstanceConfigValues = pullObject(
    (component.runtime?.instanceConfig?.fields ?? []).filter(
      (field) => field.defaultValue !== undefined,
    ),
    (field) => field.key,
    (field) => `${field.defaultValue ?? ""}`,
  );
  const defaultParams = pullObject(
    component.params.filter((param) => param.defaultValue !== undefined),
    (param) => param.key,
    (param) => param.defaultValue ?? "",
  );

  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId) {
        continue;
      }

      node.paramValues = mergeKnownValuesWithDefaults(
        node.paramValues,
        validParamKeys,
        defaultParams,
      );

      const nextInstanceConfigValues = mergeKnownValuesWithDefaults(
        node.instanceConfigValues ?? {},
        validInstanceConfigKeys,
        defaultInstanceConfigValues,
      );
      if (Object.keys(nextInstanceConfigValues).length === 0) {
        delete node.instanceConfigValues;
      } else {
        node.instanceConfigValues = nextInstanceConfigValues;
      }

      const validPinKeys = new Set(
        resolveComponentPinsForInstance(
          component,
          node.instanceConfigValues,
        ).map((pin) => pin.key),
      );
      const nextPinInitialValues = prunePinInitialValues(
        node.pinInitialValues,
        validPinKeys,
      );
      if (!nextPinInitialValues) {
        delete node.pinInitialValues;
      } else {
        node.pinInitialValues = nextPinInitialValues;
      }

      const nextHiddenPinKeys = pruneHiddenPinKeys(
        node.hiddenPinKeys,
        validPinKeys,
      );
      if (!nextHiddenPinKeys) {
        delete node.hiddenPinKeys;
      } else {
        node.hiddenPinKeys = nextHiddenPinKeys;
      }

      const nextPinOrder = normalizeComponentPinOrder(node.pinOrder, [
        ...validPinKeys,
      ]);
      if (!nextPinOrder) {
        delete node.pinOrder;
      } else {
        node.pinOrder = nextPinOrder;
      }
    }
  }
}
