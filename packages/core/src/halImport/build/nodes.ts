import type {
  ComponentDefinition,
  HalImportBuildOptions,
  SheetDefinition,
} from "../../types";
import type { buildMesaImportPlan } from "../mesa";
import { resolveMesaImportTarget, shouldIgnoreMesaImportSetp } from "../mesa";
import {
  findMatchingComponentParam,
  findMatchingComponentPin,
} from "./matching";
import { type ImportedNodeRegistry, registerImportedNode } from "./registry";

type MesaImportPlan = ReturnType<typeof buildMesaImportPlan>;

export function addMesaImportedNodes(options: {
  rootSheet: SheetDefinition;
  registry: ImportedNodeRegistry;
  mesaImportPlan: MesaImportPlan | null;
}): void {
  if (!options.mesaImportPlan) return;
  for (const binding of options.mesaImportPlan.nodeBindings) {
    registerImportedNode({
      rootSheet: options.rootSheet,
      registry: options.registry,
      componentId: binding.componentId,
      component: binding.component,
      instanceName: binding.instanceName,
    });
  }
}

export function addImportedComponentNodes(options: {
  draft: HalImportBuildOptions["draft"];
  rootSheet: SheetDefinition;
  registry: ImportedNodeRegistry;
  resolvedComponentByGroupId: Map<string, ComponentDefinition>;
  resolvedComponentIdByGroupId: Map<string, string>;
  mesaImportPlan: MesaImportPlan | null;
  warnings: string[];
}): void {
  const postguiOnlyInstanceNames = new Set(
    options.draft.postguiOnlyInstances ?? [],
  );
  const allInstances = options.draft.componentGroups
    .flatMap((group) =>
      group.instances.map((instance) => ({ group, instance })),
    )
    .sort((a, b) =>
      a.instance.instanceName.localeCompare(b.instance.instanceName),
    );

  for (const { group, instance } of allInstances) {
    const existingNodeId = options.registry.nodeIdByInstanceName.get(
      instance.instanceName,
    );
    if (existingNodeId) {
      if (
        instance.instanceConfigValues &&
        Object.keys(instance.instanceConfigValues).length > 0
      ) {
        options.warnings.push(
          `Ignoring imported instance config for managed Mesa node '${instance.instanceName}'`,
        );
      }
      continue;
    }

    const componentId = options.resolvedComponentIdByGroupId.get(group.id);
    const component = options.resolvedComponentByGroupId.get(group.id);
    if (!componentId || !component) {
      if (!options.mesaImportPlan?.handledGroupIds.has(group.id)) {
        options.warnings.push(
          `Missing resolved component for instance '${instance.instanceName}'`,
        );
      }
      continue;
    }

    registerImportedNode({
      rootSheet: options.rootSheet,
      registry: options.registry,
      componentId,
      component,
      instanceName: instance.instanceName,
      instanceConfigValues: instance.instanceConfigValues,
      exportStage: postguiOnlyInstanceNames.has(instance.instanceName)
        ? "postgui"
        : undefined,
    });
  }
}

export function applyImportedSetps(options: {
  draft: HalImportBuildOptions["draft"];
  registry: ImportedNodeRegistry;
  mesaImportPlan: MesaImportPlan | null;
  warnings: string[];
}): void {
  for (const setp of options.draft.setps) {
    if (
      shouldIgnoreMesaImportSetp(
        options.mesaImportPlan,
        setp.instanceName,
        setp.fieldName,
      )
    ) {
      continue;
    }

    const mesaTarget = resolveMesaImportTarget(
      options.mesaImportPlan,
      setp.instanceName,
      setp.fieldName,
    );
    const targetInstanceName = mesaTarget?.instanceName ?? setp.instanceName;
    const targetFieldName = mesaTarget?.fieldName ?? setp.fieldName;
    const nodeId =
      options.registry.nodeIdByInstanceName.get(targetInstanceName);
    if (!nodeId) {
      options.warnings.push(
        `Ignoring setp '${setp.rawPath}' because instance '${targetInstanceName}' was not imported`,
      );
      continue;
    }

    const node = options.registry.nodeRefById.get(nodeId);
    const component = options.registry.componentByNodeId.get(nodeId);
    if (!node || !component) continue;

    const param = findMatchingComponentParam(component, targetFieldName);
    if (param) {
      node.paramValues[param.key] = setp.value;
      continue;
    }

    const pin = findMatchingComponentPin(
      component,
      targetFieldName,
      options.registry.nodeInstanceConfigById.get(nodeId),
    );
    if (pin) {
      node.pinInitialValues = {
        ...(node.pinInitialValues ?? {}),
        [pin.key]: setp.value,
      };
      continue;
    }

    options.warnings.push(
      `Ignoring setp '${setp.rawPath}' because '${component.halComponentName}' has no matching param or pin '${targetFieldName}'`,
    );
  }
}
