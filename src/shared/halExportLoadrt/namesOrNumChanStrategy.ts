import {
  emitNamesLoadrtLines,
  isCanonicalIndexedInstanceNames,
} from "./namesOrCountStrategy";
import type { LoadrtResult, LoadrtStrategy } from "./types";

export const namesOrNumChanLoadrtStrategy: LoadrtStrategy = (
  context,
): LoadrtResult => {
  const warnings: string[] = [];
  if (
    isCanonicalIndexedInstanceNames(
      context.componentName,
      context.instancePaths,
    )
  ) {
    const args = [
      `num_chan=${context.instancePaths.length}`,
      ...context.extraArgs,
    ];
    return {
      lines: [`loadrt ${context.componentName} ${args.join(" ")}`.trim()],
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  }

  warnings.push(
    `Component '${context.componentName}' expected canonical instance names '${context.componentName}.N' for num_chan=...; falling back to names=...`,
  );
  return {
    lines: emitNamesLoadrtLines(
      context.componentName,
      context.instancePaths,
      context.extraArgs,
    ),
    warnings,
  };
};
