import type {
  LoadrtContext,
  LoadrtImportContext,
  LoadrtImportResult,
  LoadrtResult,
  LoadrtStrategy,
} from "./types";

export function emitNamesLoadrtLines(
  componentName: string,
  instancePaths: string[],
  extraArgs: string[],
): string[] {
  const args = [`names=${instancePaths.join(",")}`, ...extraArgs];
  return [`loadrt ${componentName} ${args.join(" ")}`.trim()];
}

export function isCanonicalIndexedInstanceNames(
  componentName: string,
  sortedNames: string[],
): boolean {
  for (const [index, instanceName] of sortedNames.entries()) {
    if (instanceName !== `${componentName}.${index}`) return false;
  }
  return true;
}

function parseCountLike(
  componentName: string,
  args: Record<string, string>,
): string[] {
  const countArg = Number.parseInt(args.count ?? "", 10);
  const numChanArg = Number.parseInt(args.num_chan ?? "", 10);
  let countLike: number | undefined;
  if (Number.isFinite(countArg) && countArg > 0) {
    countLike = countArg;
  } else if (Number.isFinite(numChanArg) && numChanArg > 0) {
    countLike = numChanArg;
  }
  if (countLike === undefined) return [`${componentName}.0`];
  return Array.from(
    { length: countLike },
    (_, idx) => `${componentName}.${idx}`,
  );
}

function parseNames(
  context: LoadrtImportContext,
): LoadrtImportResult | undefined {
  const namesArg = context.args.names?.trim();
  if (!namesArg) return undefined;
  return {
    instancePaths: namesArg
      .split(",")
      .map((rawName) => rawName.trim())
      .filter(Boolean),
  };
}

function exportNamesOrCount(context: LoadrtContext): LoadrtResult {
  if (
    isCanonicalIndexedInstanceNames(
      context.componentName,
      context.instancePaths,
    )
  ) {
    const args = [
      `count=${context.instancePaths.length}`,
      ...context.extraArgs,
    ];
    return {
      lines: [`loadrt ${context.componentName} ${args.join(" ")}`.trim()],
    };
  }

  return {
    lines: emitNamesLoadrtLines(
      context.componentName,
      context.instancePaths,
      context.extraArgs,
    ),
  };
}

function importNamesOrCount(context: LoadrtImportContext): LoadrtImportResult {
  const namesResult = parseNames(context);
  if (namesResult) return namesResult;
  return {
    instancePaths: parseCountLike(context.componentName, context.args),
  };
}

export const namesOrCountLoadrtStrategy: LoadrtStrategy = {
  export: exportNamesOrCount,
  import: importNamesOrCount,
};
