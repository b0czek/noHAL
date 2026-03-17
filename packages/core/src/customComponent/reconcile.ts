import { resolveComponentPinsForInstance } from "../componentInstance";
import type { ComponentDefinition, NoHALProject } from "../types";

export function reconcileComponentNodesForDefinition(
  project: NoHALProject,
  componentId: string,
  component: ComponentDefinition,
): void {
  const validParamKeys = new Set(component.params.map((param) => param.key));
  const validInstanceConfigKeys = new Set(
    (component.runtime?.instanceConfig?.fields ?? []).map((field) => field.key),
  );
  const defaultInstanceConfigValues = Object.fromEntries(
    (component.runtime?.instanceConfig?.fields ?? [])
      .filter((field) => field.defaultValue !== undefined)
      .map((field) => [field.key, `${field.defaultValue ?? ""}`]),
  );
  const defaultParams = Object.fromEntries(
    component.params
      .filter((param) => param.defaultValue !== undefined)
      .map((param) => [param.key, param.defaultValue ?? ""]),
  );

  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component" || node.componentId !== componentId) {
        continue;
      }

      const nextValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(node.paramValues)) {
        if (validParamKeys.has(key)) nextValues[key] = value;
      }
      for (const [key, value] of Object.entries(defaultParams)) {
        if (!(key in nextValues)) nextValues[key] = value;
      }
      node.paramValues = nextValues;

      const nextInstanceConfigValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        node.instanceConfigValues ?? {},
      )) {
        if (validInstanceConfigKeys.has(key)) {
          nextInstanceConfigValues[key] = value;
        }
      }
      for (const [key, value] of Object.entries(defaultInstanceConfigValues)) {
        if (!(key in nextInstanceConfigValues)) {
          nextInstanceConfigValues[key] = value;
        }
      }
      if (Object.keys(nextInstanceConfigValues).length > 0) {
        node.instanceConfigValues = nextInstanceConfigValues;
      } else {
        delete node.instanceConfigValues;
      }

      const validPinKeys = new Set(
        resolveComponentPinsForInstance(
          component,
          node.instanceConfigValues,
        ).map((pin) => pin.key),
      );
      const currentPinInitialValues = node.pinInitialValues ?? {};
      const nextPinInitialValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(currentPinInitialValues)) {
        if (!validPinKeys.has(key) || !value.trim()) continue;
        nextPinInitialValues[key] = value;
      }
      if (Object.keys(nextPinInitialValues).length > 0) {
        node.pinInitialValues = nextPinInitialValues;
      } else {
        delete node.pinInitialValues;
      }

      const nextHiddenPinKeys = (node.hiddenPinKeys ?? []).filter((key) =>
        validPinKeys.has(key),
      );
      if (nextHiddenPinKeys.length > 0) {
        node.hiddenPinKeys = [...new Set(nextHiddenPinKeys)];
      } else {
        delete node.hiddenPinKeys;
      }
    }
  }
}
