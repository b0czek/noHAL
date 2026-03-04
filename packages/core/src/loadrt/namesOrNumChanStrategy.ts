import {
  emitNamesLoadrtLines,
  isCanonicalIndexedInstanceNames,
} from "./namesOrCountStrategy";
import type {
  LoadrtContext,
  LoadrtImportContext,
  LoadrtImportResult,
  LoadrtResult,
  LoadrtStrategy,
} from "./types";

function exportNamesOrNumChan(context: LoadrtContext): LoadrtResult {
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
}

function importNamesOrNumChan(
  context: LoadrtImportContext,
): LoadrtImportResult {
  const namesArg = context.args.names?.trim();
  if (namesArg) {
    return {
      instancePaths: namesArg
        .split(",")
        .map((rawName) => rawName.trim())
        .filter(Boolean),
    };
  }
  const numChanArg = Number.parseInt(context.args.num_chan ?? "", 10);
  if (Number.isFinite(numChanArg) && numChanArg > 0) {
    return {
      instancePaths: Array.from(
        { length: numChanArg },
        (_, idx) => `${context.componentName}.${idx}`,
      ),
    };
  }
  const countArg = Number.parseInt(context.args.count ?? "", 10);
  if (Number.isFinite(countArg) && countArg > 0) {
    return {
      instancePaths: Array.from(
        { length: countArg },
        (_, idx) => `${context.componentName}.${idx}`,
      ),
      warnings: [
        `Component '${context.componentName}' uses count=... while routed to names_or_num_chan import strategy`,
      ],
    };
  }
  return { instancePaths: [`${context.componentName}.0`] };
}

export const namesOrNumChanLoadrtStrategy: LoadrtStrategy = {
  export: exportNamesOrNumChan,
  import: importNamesOrNumChan,
};
