import { resolveComponentPinsForInstance } from "../component/instance";
import { resolveNodeExportStage } from "../component/system";
import { getSheet } from "../graph";
import { getHalNameLengthWarning, isValidHalName } from "../halNames";
import type { ComponentNode, NoHALProject } from "../types";
import type { ExportContext } from "./context";
import { pushFatal } from "./context";
import { collectGeneratedParamContributions } from "./contributions";
import { resolveExportedInstancePath } from "./naming";

export interface ParamLines {
  mainSetpLines: string[];
  postguiSetpLines: string[];
}

interface ResolvedValueTarget {
  instanceName: string;
  instancePath: string;
  halNameLen: number;
  targetLines: string[];
  warnings: string[];
}

function emitResolvedValueLines(
  entries: Record<string, string>,
  defsByKey: ReadonlyMap<string, string>,
  warningLabel: "pin" | "param",
  target: ResolvedValueTarget,
): void {
  for (const [key, value] of Object.entries(entries)) {
    const name = defsByKey.get(key);
    if (!name) {
      target.warnings.push(
        `Unknown ${warningLabel} '${key}' on node '${target.instanceName}'`,
      );
      continue;
    }
    if (!value.trim()) continue;
    const halName = `${target.instancePath}.${name}`;
    const warning = getHalNameLengthWarning(
      "HAL name",
      halName,
      target.halNameLen,
    );
    if (warning) target.warnings.push(warning);
    target.targetLines.push(`setp ${halName} ${value}`);
  }
}

export function collectParamLines(
  project: NoHALProject,
  ctx: ExportContext,
): ParamLines {
  const generated = collectGeneratedParamContributions(project, ctx);
  const mainSetpLines = [...generated.mainSetpLines];
  const postguiSetpLines = [...generated.postguiSetpLines];
  const seenSheets = new Set<string>();

  const emitComponentParams = (
    pathParts: string[],
    node: ComponentNode,
  ): void => {
    const component = project.library.components[node.componentId];
    if (!component) return;
    const instancePath = resolveExportedInstancePath(
      pathParts,
      node.instanceName,
      component,
    );
    if (!isValidHalName(instancePath)) {
      pushFatal(
        ctx,
        `Skipping setp export for invalid instance path '${instancePath}'`,
      );
      return;
    }
    const exportStage = resolveNodeExportStage(component, node.exportStage);
    const setpTargetLines =
      exportStage === "postgui" ? postguiSetpLines : mainSetpLines;
    const resolvedValueTarget: ResolvedValueTarget = {
      instanceName: node.instanceName,
      instancePath,
      halNameLen: ctx.halNameLen,
      targetLines: setpTargetLines,
      warnings: ctx.warnings,
    };
    const resolvedPins = resolveComponentPinsForInstance(
      component,
      node.instanceConfigValues,
    );
    emitResolvedValueLines(
      node.pinInitialValues ?? {},
      new Map(resolvedPins.map((pin) => [pin.key, pin.name])),
      "pin",
      resolvedValueTarget,
    );
    emitResolvedValueLines(
      node.paramValues,
      new Map(component.params.map((param) => [param.key, param.name])),
      "param",
      resolvedValueTarget,
    );
  };

  function emitParams(sheetId: string, pathParts: string[]): void {
    const cycleKey = `${sheetId}|${pathParts.join(".")}`;
    if (seenSheets.has(cycleKey)) return;
    seenSheets.add(cycleKey);

    const sheet = getSheet(project, sheetId);
    for (const node of sheet.nodes) {
      if (node.kind === "component") {
        emitComponentParams(pathParts, node);
        continue;
      }
      emitParams(node.sheetId, [...pathParts, node.instanceName]);
    }
  }

  emitParams(project.rootSheetId, []);
  return { mainSetpLines, postguiSetpLines };
}
