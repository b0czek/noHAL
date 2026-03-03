import type { LoadrtContext, LoadrtResult, LoadrtStrategy } from "./types";

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

export const namesOrCountLoadrtStrategy: LoadrtStrategy = (
  context: LoadrtContext,
): LoadrtResult => {
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
};
