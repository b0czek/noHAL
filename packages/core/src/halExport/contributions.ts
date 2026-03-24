import {
  buildMesaParamContribution,
  buildMesaRuntimeContribution,
} from "../mesa/export";
import type { NoHALProject } from "../types";
import type { ExportContext } from "./context";

export interface HalExportRuntimeContribution {
  loadrtLines?: string[];
  loadusrLines?: string[];
}

export interface HalExportParamContribution {
  mainSetpLines?: string[];
  postguiSetpLines?: string[];
}

interface HalExportContributor {
  buildRuntimeContribution?: (
    project: NoHALProject,
    ctx: ExportContext,
  ) => HalExportRuntimeContribution;
  buildParamContribution?: (
    project: NoHALProject,
    ctx: ExportContext,
  ) => HalExportParamContribution;
}

const HAL_EXPORT_CONTRIBUTORS: readonly HalExportContributor[] = [
  {
    buildRuntimeContribution: buildMesaRuntimeContribution,
    buildParamContribution: buildMesaParamContribution,
  },
];

export function collectGeneratedRuntimeContributions(
  project: NoHALProject,
  ctx: ExportContext,
): Required<HalExportRuntimeContribution> {
  const out: Required<HalExportRuntimeContribution> = {
    loadrtLines: [],
    loadusrLines: [],
  };
  for (const contributor of HAL_EXPORT_CONTRIBUTORS) {
    const contribution = contributor.buildRuntimeContribution?.(project, ctx);
    if (!contribution) continue;
    if (contribution.loadrtLines?.length) {
      out.loadrtLines.push(...contribution.loadrtLines);
    }
    if (contribution.loadusrLines?.length) {
      out.loadusrLines.push(...contribution.loadusrLines);
    }
  }
  return out;
}

export function collectGeneratedParamContributions(
  project: NoHALProject,
  ctx: ExportContext,
): Required<HalExportParamContribution> {
  const out: Required<HalExportParamContribution> = {
    mainSetpLines: [],
    postguiSetpLines: [],
  };
  for (const contributor of HAL_EXPORT_CONTRIBUTORS) {
    const contribution = contributor.buildParamContribution?.(project, ctx);
    if (!contribution) continue;
    if (contribution.mainSetpLines?.length) {
      out.mainSetpLines.push(...contribution.mainSetpLines);
    }
    if (contribution.postguiSetpLines?.length) {
      out.postguiSetpLines.push(...contribution.postguiSetpLines);
    }
  }
  return out;
}
