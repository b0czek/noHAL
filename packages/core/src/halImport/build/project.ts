import { normalizeLinuxCncVersion } from "../../linuxcncVersion";
import {
  createDefaultMotmodConfig,
  createEmptyProject,
  reconcileProject,
} from "../../project";
import {
  findSystemSheet,
  moveRootSystemComponentsToSystemSheet,
} from "../../sheet";
import type { HalImportBuildOptions, HalImportBuildResult } from "../../types";
import { buildMesaImportPlan } from "../mesa";
import {
  buildGeneratedLocalComponentsFromHalImport,
  resolveImportedComponentsForProject,
} from "./components";
import { populateImportedProjectRootSheet } from "./rootSheet";

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function initializeImportedProject(
  options: HalImportBuildOptions,
  mesaImportPlan: ReturnType<typeof buildMesaImportPlan> | null,
) {
  const fileBase =
    options.projectName?.trim() ||
    (options.draft.sourceFileName
      ? stripExtension(options.draft.sourceFileName)
      : "Imported HAL");
  const project = createEmptyProject(fileBase || "Imported HAL");
  project.name = fileBase || "Imported HAL";

  if (options.linuxcncVersion) {
    project.target.linuxcncVersion = normalizeLinuxCncVersion(
      options.linuxcncVersion,
    );
  }
  if (options.draft.motmod) {
    project.motmod = {
      ...createDefaultMotmodConfig(),
      ...options.draft.motmod,
    };
  }
  if (mesaImportPlan) {
    project.mesa = structuredClone(mesaImportPlan.mesa);
    for (const binding of mesaImportPlan.nodeBindings) {
      project.library.components[binding.componentId] = structuredClone(
        binding.component,
      );
    }
  }

  const rootSheet = project.sheets[project.rootSheetId];
  const systemSheet = findSystemSheet(project);
  rootSheet.name = "Top";
  rootSheet.nodes = [];
  rootSheet.labels = [];
  rootSheet.labelAnchors = [];
  rootSheet.directConnections = [];
  rootSheet.ports = [];
  delete rootSheet.hal;

  if (systemSheet) {
    systemSheet.nodes = [];
    systemSheet.ports = [];
    systemSheet.labels = [];
    systemSheet.labelAnchors = [];
    systemSheet.directConnections = [];
    if (systemSheet.hal?.addfQueue) delete systemSheet.hal.addfQueue;
  }

  return { project, rootSheet };
}

export { buildGeneratedLocalComponentsFromHalImport };

export function buildProjectFromHalImport(
  options: HalImportBuildOptions,
): HalImportBuildResult {
  const warnings = [...options.draft.warnings];
  const mesaImportPlan = options.mesa
    ? buildMesaImportPlan(options.draft, options.mesa)
    : null;
  const { project, rootSheet } = initializeImportedProject(
    options,
    mesaImportPlan,
  );
  const { resolvedComponentByGroupId, resolvedComponentIdByGroupId } =
    resolveImportedComponentsForProject({
      draft: options.draft,
      componentStore: options.componentStore,
      linkSelections: options.linkSelections,
      projectComponents: project.library.components,
      warnings,
      handledGroupIds: mesaImportPlan?.handledGroupIds,
      projectLocalComponentOverrides: options.projectLocalComponentOverrides,
    });

  populateImportedProjectRootSheet({
    project,
    draft: options.draft,
    rootSheet,
    mesaImportPlan,
    placementHeuristic: options.placementHeuristic ?? "alphabetical",
    resolvedComponentByGroupId,
    resolvedComponentIdByGroupId,
    warnings,
  });

  moveRootSystemComponentsToSystemSheet(project);
  reconcileProject(project);
  return { project, warnings };
}
