import type { ExportContext } from "../halExport/context";
import type { NoHALProject } from "../types";
import { deriveMesaTopology } from "./derive";
import { normalizeProjectMesaConfig } from "./shared";

export interface MesaRuntimeContribution {
  loadrtLines: string[];
}

export function buildMesaRuntimeContribution(
  project: NoHALProject,
  ctx: ExportContext,
): MesaRuntimeContribution {
  const mesa = normalizeProjectMesaConfig(project.mesa);
  const topology = deriveMesaTopology(mesa);
  if (topology.hostRuntimes.length === 0) {
    return { loadrtLines: [] };
  }

  for (const issue of topology.issues) {
    if (issue.severity === "fatal") ctx.fatalErrors.push(issue.message);
    ctx.warnings.push(issue.message);
  }

  const boardIps = topology.hostRuntimes.map((item) => item.ip.trim());
  if (boardIps.some((ip) => ip.length === 0)) {
    return { loadrtLines: [] };
  }

  const configs = topology.hostRuntimes.map((item) => `"${item.configString}"`);
  return {
    loadrtLines: [
      "loadrt hostmot2",
      `loadrt hm2_eth board_ip=${boardIps.join(",")} config=${configs.join(",")}`,
    ],
  };
}
