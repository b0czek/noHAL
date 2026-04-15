import { unique } from "remeda";
import { validateDuplicateExportedInstancePaths } from "../component/naming";
import { reconcileProject } from "../project";
import { validateForcedSheetSingletons } from "../sheet/singleton";
import type { NoHALProject } from "../types";
import type { ExportResult } from "./context";
import { createExportContext, pushFatal } from "./context";
import { collectNetLines } from "./nets";
import { collectParamLines } from "./params";
import { renderHalOutput, renderShutdownHalOutput } from "./render";
import { buildRuntimeSections } from "./runtime";
import { traverseSheetInstance } from "./traversal";

export function exportProjectToHal(project: NoHALProject): ExportResult {
  reconcileProject(project);
  const shutdownText = renderShutdownHalOutput(project);
  const ctx = createExportContext();
  validateForcedSheetSingletons(project, (message) => pushFatal(ctx, message));
  validateDuplicateExportedInstancePaths(project, (message) =>
    pushFatal(ctx, message),
  );
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
      warnings: unique(ctx.warnings),
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
    warnings: unique(ctx.warnings),
  };
}
