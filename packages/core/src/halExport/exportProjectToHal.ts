import { reconcileProject } from "../project";
import type { NoHALProject } from "../types";
import type { ExportResult } from "./context";
import { createExportContext } from "./context";
import { collectNetLines } from "./nets";
import { collectParamLines } from "./params";
import { renderHalOutput, renderShutdownHalOutput } from "./render";
import { buildRuntimeSections } from "./runtime";
import { traverseSheetInstance } from "./traversal";

export function exportProjectToHal(project: NoHALProject): ExportResult {
  reconcileProject(project);
  const shutdownText = renderShutdownHalOutput(project);
  const ctx = createExportContext();
  traverseSheetInstance(ctx, project, project.rootSheetId, [], []);

  for (const members of ctx.globalLabelMembers.values()) {
    for (let i = 1; i < members.length; i += 1)
      ctx.union.union(members[0], members[i]);
  }

  const { mainNetLines, postguiNetLines } = collectNetLines(ctx);
  const { mainSetpLines, postguiSetpLines } = collectParamLines(project, ctx);
  const runtimeSections = buildRuntimeSections(project, ctx);

  if (ctx.fatalErrors.length > 0) {
    ctx.warnings.push(
      `Export aborted due to ${ctx.fatalErrors.length} validation error${ctx.fatalErrors.length === 1 ? "" : "s"}; no HAL output generated.`,
    );
    return {
      text: "",
      ...(shutdownText ? { shutdownText } : {}),
      warnings: Array.from(new Set(ctx.warnings)),
    };
  }

  const output = renderHalOutput({
    project,
    runtimeSections,
    mainSetpLines,
    mainNetLines,
    postguiSetpLines,
    postguiNetLines,
  });

  return {
    ...output,
    ...(shutdownText ? { shutdownText } : {}),
    warnings: Array.from(new Set(ctx.warnings)),
  };
}
