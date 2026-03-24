import type { ExportContext } from "../halExport/context";
import type { NoHALProject } from "../types";
import { getMesaHostCatalogEntry } from "./catalog";
import { deriveMesaTopology } from "./derive";
import { normalizeProjectMesaConfig } from "./shared";
import { MESA_RAW_GPIO_CARD_KIND } from "./types";

export interface MesaRuntimeContribution {
  loadrtLines: string[];
}

export interface MesaParamContribution {
  mainSetpLines: string[];
}

function formatMesaGpioIndex(index: number): string {
  return `${index}`.padStart(3, "0");
}

function buildMesaRawGpioSetpLines(
  mesa: ReturnType<typeof normalizeProjectMesaConfig>,
  topology: ReturnType<typeof deriveMesaTopology>,
): string[] {
  const hostRuntimeById = new Map(
    topology.hostRuntimes.map((runtime) => [runtime.hostId, runtime] as const),
  );
  const lines: string[] = [];
  for (const host of mesa.hosts) {
    const runtime = hostRuntimeById.get(host.id);
    const catalogHost = getMesaHostCatalogEntry(host.kind);
    if (!runtime || !catalogHost) continue;
    for (const assignment of host.connectors ?? []) {
      if (assignment.cardKind !== MESA_RAW_GPIO_CARD_KIND) continue;
      const connector = catalogHost.connectorSlots.find(
        (item) => item.key === assignment.connectorKey,
      );
      const rawGpio = connector?.rawGpio;
      if (!rawGpio) continue;
      for (const pinIndex of assignment.rawGpio?.outputPins ?? []) {
        lines.push(
          `setp ${runtime.instanceName}.gpio.${formatMesaGpioIndex(rawGpio.firstIndex + pinIndex)}.is_output 1`,
        );
      }
    }
  }
  return lines;
}

export function buildMesaParamContribution(
  project: NoHALProject,
): MesaParamContribution {
  const mesa = normalizeProjectMesaConfig(project.mesa);
  const topology = deriveMesaTopology(mesa);
  return {
    mainSetpLines: buildMesaRawGpioSetpLines(mesa, topology),
  };
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
