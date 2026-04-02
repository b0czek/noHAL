export type CustomLoadCommandInterpolationToken =
  | "component"
  | "instances"
  | "first_instance"
  | "count";

export interface InterpolateCustomLoadCommandContext {
  componentName: string;
  instancePaths: string[];
  loadCommand: string;
}

export interface InterpolateCustomLoadCommandResult {
  line: string;
}

export const customLoadCommandInterpolationTokens = [
  "%{component}",
  "%{instances}",
  "%{first_instance}",
  "%{count}",
] as const;

export const customLoadCommandInterpolationAliases = [
  "%c",
  "%n",
  "%1",
  "%i",
] as const;

const SHORT_TOKEN_PATTERN =
  /%([1cin])(?=[^A-Za-z0-9_]|$)|%\{(component|instances|first_instance|count)\}/g;

function tokenNameForAlias(alias: string | undefined): string | undefined {
  if (!alias) return undefined;
  if (alias === "c") return "component";
  if (alias === "n") return "instances";
  if (alias === "1") return "first_instance";
  if (alias === "i") return "count";
  return undefined;
}

export function interpolateCustomLoadCommand(
  context: InterpolateCustomLoadCommandContext,
): InterpolateCustomLoadCommandResult {
  const replacements: Record<string, string> = {
    component: context.componentName,
    instances: context.instancePaths.join(","),
    first_instance: context.instancePaths[0] ?? "",
    count: `${context.instancePaths.length}`,
  };

  const line = context.loadCommand.replace(
    SHORT_TOKEN_PATTERN,
    (match, shortToken: string | undefined, longToken: string | undefined) => {
      const token = longToken ?? tokenNameForAlias(shortToken);
      if (!token) return match;
      return replacements[token];
    },
  );

  return { line };
}
