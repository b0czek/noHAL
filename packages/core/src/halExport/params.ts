import { resolveComponentPinsForInstance } from "../componentInstance";
import { resolveNodeExportStage } from "../componentSystem";
import { getSheet } from "../graph";
import { isValidHalName } from "../halNames";
import type { NoHALProject } from "../types";
import type { ExportContext } from "./context";
import { pushFatal } from "./context";

export interface ParamLines {
  mainSetpLines: string[];
  postguiSetpLines: string[];
}

export function collectParamLines(
  project: NoHALProject,
  ctx: ExportContext,
): ParamLines {
  const mainSetpLines: string[] = [];
  const postguiSetpLines: string[] = [];
  const seenSheets = new Set<string>();

  function emitParams(sheetId: string, pathParts: string[]): void {
    const cycleKey = `${sheetId}|${pathParts.join(".")}`;
    if (seenSheets.has(cycleKey)) return;
    seenSheets.add(cycleKey);

    const sheet = getSheet(project, sheetId);
    for (const node of sheet.nodes) {
      if (node.kind === "component") {
        const component = project.library.components[node.componentId];
        if (!component) continue;
        const instancePath = [...pathParts, node.instanceName].join(".");
        if (!isValidHalName(instancePath)) {
          pushFatal(
            ctx,
            `Skipping setp export for invalid instance path '${instancePath}'`,
          );
          continue;
        }
        const exportStage = resolveNodeExportStage(component, node.exportStage);
        const setpTargetLines =
          exportStage === "postgui" ? postguiSetpLines : mainSetpLines;
        const resolvedPins = resolveComponentPinsForInstance(
          component,
          node.instanceConfigValues,
        );
        for (const [pinKey, value] of Object.entries(
          node.pinInitialValues ?? {},
        )) {
          const pinDef = resolvedPins.find((p) => p.key === pinKey);
          if (!pinDef) {
            ctx.warnings.push(
              `Unknown pin '${pinKey}' on node '${node.instanceName}'`,
            );
            continue;
          }
          if (!value.trim()) continue;
          setpTargetLines.push(`setp ${instancePath}.${pinDef.name} ${value}`);
        }
        for (const [paramKey, value] of Object.entries(node.paramValues)) {
          const paramDef = component.params.find((p) => p.key === paramKey);
          if (!paramDef) {
            ctx.warnings.push(
              `Unknown param '${paramKey}' on node '${node.instanceName}'`,
            );
            continue;
          }
          if (!value.trim()) continue;
          setpTargetLines.push(
            `setp ${instancePath}.${paramDef.name} ${value}`,
          );
        }
      } else {
        emitParams(node.sheetId, [...pathParts, node.instanceName]);
      }
    }
  }

  emitParams(project.rootSheetId, []);
  return { mainSetpLines, postguiSetpLines };
}
