import type {
  ComponentDefinition,
  HalImportBuildOptions,
  HalImportPlacementHeuristic,
  NoHALProject,
  SheetDefinition,
} from "../../types";
import type { buildMesaImportPlan } from "../mesa";
import { buildImportedSheetLayoutPlan } from "./layout";
import { applyPreparedNets, resolveNetEndpointsForImport } from "./nets";
import {
  addImportedComponentNodes,
  addMesaImportedNodes,
  applyImportedSetps,
} from "./nodes";
import { applyImportedAddfQueue } from "./queue";
import { createImportedNodeRegistry } from "./registry";

type MesaImportPlan = ReturnType<typeof buildMesaImportPlan>;

export function populateImportedProjectRootSheet(options: {
  project: NoHALProject;
  draft: HalImportBuildOptions["draft"];
  rootSheet: SheetDefinition;
  mesaImportPlan: MesaImportPlan | null;
  placementHeuristic: HalImportPlacementHeuristic;
  resolvedComponentByGroupId: Map<string, ComponentDefinition>;
  resolvedComponentIdByGroupId: Map<string, string>;
  warnings: string[];
}): void {
  const registry = createImportedNodeRegistry();

  addMesaImportedNodes({
    rootSheet: options.rootSheet,
    registry,
    mesaImportPlan: options.mesaImportPlan,
  });
  addImportedComponentNodes({
    draft: options.draft,
    rootSheet: options.rootSheet,
    registry,
    resolvedComponentByGroupId: options.resolvedComponentByGroupId,
    resolvedComponentIdByGroupId: options.resolvedComponentIdByGroupId,
    mesaImportPlan: options.mesaImportPlan,
    warnings: options.warnings,
  });
  applyImportedSetps({
    draft: options.draft,
    registry,
    mesaImportPlan: options.mesaImportPlan,
    warnings: options.warnings,
  });

  const preparedNets = resolveNetEndpointsForImport({
    draft: options.draft,
    registry,
    mesaImportPlan: options.mesaImportPlan,
    warnings: options.warnings,
  });
  const resolveLabelPosition = buildImportedSheetLayoutPlan({
    rootSheet: options.rootSheet,
    resolvedPinsByNodeId: registry.resolvedPinsByNodeId,
    preparedNets,
    nodeInstanceNameById: registry.nodeInstanceNameById,
    placementHeuristic: options.placementHeuristic,
  });
  applyPreparedNets({
    rootSheet: options.rootSheet,
    preparedNets,
    resolveLabelPosition,
  });
  applyImportedAddfQueue({
    project: options.project,
    rootSheet: options.rootSheet,
    draft: options.draft,
    registry,
    warnings: options.warnings,
  });
}
