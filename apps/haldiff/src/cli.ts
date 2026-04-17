import process from "node:process";
import {
  buildMachineConfigImportDraft,
  type CoreIo,
  compareHalNetworks,
  type HalDiffConnectionSummary,
  type HalNetworkComparison,
  type HalSignalComparison,
  type MachineConfigHalFileSelection,
  parseMachineConfigImportSetupDraft,
} from "@nohal/core";

const EXIT_SUCCESS = 0;
const EXIT_DIFFERENT = 1;
const EXIT_USAGE_ERROR = 2;

interface ParsedArgs {
  leftIniPath: string;
  rightIniPath: string;
  debug: boolean;
  failOnDiff: boolean;
}

interface CliRunOptions {
  io: CoreIo;
  stdout?: (text: string) => void;
  stderr?: (text: string) => void;
}

function usageText(): string {
  return [
    "Usage: haldiff <left.ini> <right.ini> [--fail-on-diff] [--debug]",
    "",
    "Loads HAL files from each INI using the same file-selection behavior as noHAL import,",
    "builds structural HAL graphs, and reports missing or additional network structure.",
    "",
    "By default, structural diffs exit with code 0. Use --fail-on-diff to return exit code 1",
    "when the compared HAL networks are not equivalent.",
    "Use --debug to include internal structural invariant diagnostics in the report.",
    "",
    "Named aliases are also supported: --before/--after or --left/--right.",
  ].join("\n");
}

function parseArgs(
  argv: string[],
): ParsedArgs | { help: true } | { error: string } {
  let leftIniPath: string | undefined;
  let rightIniPath: string | undefined;
  let debug = false;
  let failOnDiff = false;
  const positionalPaths: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--") continue;
    if (token === "--help" || token === "-h") return { help: true };
    if (token === "--debug") {
      debug = true;
      continue;
    }
    if (token === "--fail-on-diff") {
      failOnDiff = true;
      continue;
    }
    if (token === "--before" || token === "--left") {
      leftIniPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--after" || token === "--right") {
      rightIniPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (!token.startsWith("-")) {
      positionalPaths.push(token);
      continue;
    }
    return { error: `Unknown argument: ${token}` };
  }

  if (positionalPaths.length > 2) {
    return {
      error: `Expected 2 positional INI paths, received ${positionalPaths.length}`,
    };
  }
  if (!leftIniPath) {
    leftIniPath = positionalPaths[0];
  }
  if (!rightIniPath) {
    rightIniPath = positionalPaths[1];
  }

  if (!leftIniPath) {
    return { error: "Missing required left INI path" };
  }
  if (!rightIniPath) {
    return { error: "Missing required right INI path" };
  }

  return { leftIniPath, rightIniPath, debug, failOnDiff };
}

function buildAutoSelections(
  filePaths: string[],
): MachineConfigHalFileSelection[] {
  return filePaths.map((filePath) => ({
    filePath,
    resolveIniSubstitutions: true,
  }));
}

async function loadDraftFromIni(io: CoreIo, iniPath: string) {
  const setup = await parseMachineConfigImportSetupDraft(io)(iniPath);
  const selections = buildAutoSelections(setup.suggestedHalFilePaths);
  const draft = await buildMachineConfigImportDraft(io)(iniPath, selections);
  return { setup, draft };
}

function formatConnection(connection: HalDiffConnectionSummary): string {
  const componentType = connection.componentType
    ? ` (${connection.componentType})`
    : "";
  const mappedSuffix =
    connection.mappedComponentInstanceName &&
    connection.mappedComponentInstanceName !== connection.componentInstanceName
      ? ` [matched to ${connection.mappedComponentInstanceName}]`
      : "";
  return `${connection.componentInstanceName}.${connection.pinName}${componentType}${mappedSuffix}`;
}

function appendSection(
  lines: string[],
  title: string,
  entries: string[],
): void {
  if (entries.length === 0) return;
  lines.push("");
  lines.push(`${title}:`);
  for (const entry of entries) {
    lines.push(`- ${entry}`);
  }
}

function signalTitle(signal: HalSignalComparison): string {
  if (signal.beforeSignalName && signal.afterSignalName) {
    return `${signal.beforeSignalName} <> ${signal.afterSignalName}`;
  }
  if (signal.beforeSignalName) return signal.beforeSignalName;
  return signal.afterSignalName ?? "(unknown signal)";
}

function formatSignalDifference(signal: HalSignalComparison): string[] {
  const lines = [signalTitle(signal)];
  if (signal.missingConnections.length > 0) {
    lines.push(
      `  missing in after: ${signal.missingConnections.map(formatConnection).join(", ")}`,
    );
  }
  if (signal.extraConnections.length > 0) {
    lines.push(
      `  extra in after: ${signal.extraConnections.map(formatConnection).join(", ")}`,
    );
  }
  return lines;
}

function formatComparisonReport(
  comparison: HalNetworkComparison,
  options?: { debug?: boolean },
): string {
  const lines = [
    `Equivalent: ${comparison.equivalent ? "yes" : "no"}`,
    `Before: ${comparison.beforeSummary.componentCount} components, ${comparison.beforeSummary.signalCount} signals`,
    `After: ${comparison.afterSummary.componentCount} components, ${comparison.afterSummary.signalCount} signals`,
  ];

  appendSection(
    lines,
    "Matched components",
    comparison.matchedComponents.map((match) => {
      const componentType = match.componentType
        ? ` (${match.componentType})`
        : "";
      const confidence =
        match.confidence === "unique" ? "" : ` [${match.confidence}]`;
      return `${match.beforeInstanceName} -> ${match.afterInstanceName}${componentType}${confidence}`;
    }),
  );

  appendSection(
    lines,
    "Unmatched before components",
    comparison.unmatchedBeforeComponents.map((component) => {
      const componentType = component.componentType
        ? ` (${component.componentType})`
        : "";
      return `${component.instanceName}${componentType}`;
    }),
  );

  appendSection(
    lines,
    "Unmatched after components",
    comparison.unmatchedAfterComponents.map((component) => {
      const componentType = component.componentType
        ? ` (${component.componentType})`
        : "";
      return `${component.instanceName}${componentType}`;
    }),
  );

  if (options?.debug) {
    appendSection(
      lines,
      "Structural invariant differences",
      comparison.invariants,
    );
  }

  appendSection(
    lines,
    "Differing signal groups",
    comparison.differingSignals.flatMap(formatSignalDifference),
  );

  appendSection(
    lines,
    "Unmatched before signal groups",
    comparison.unmatchedBeforeSignals.flatMap(formatSignalDifference),
  );

  appendSection(
    lines,
    "Unmatched after signal groups",
    comparison.unmatchedAfterSignals.flatMap(formatSignalDifference),
  );

  appendSection(
    lines,
    "Warnings",
    [...new Set(comparison.warnings)].sort((left, right) =>
      left.localeCompare(right),
    ),
  );

  return `${lines.join("\n")}\n`;
}

export async function runHaldiffCli(
  argv: string[],
  options: CliRunOptions,
): Promise<number> {
  const stdout =
    options.stdout ?? ((text: string) => process.stdout.write(text));
  const stderr =
    options.stderr ?? ((text: string) => process.stderr.write(text));
  const parsed = parseArgs(argv);

  if ("help" in parsed) {
    stdout(`${usageText()}\n`);
    return EXIT_SUCCESS;
  }
  if ("error" in parsed) {
    stderr(`${parsed.error}\n\n${usageText()}\n`);
    return EXIT_USAGE_ERROR;
  }

  try {
    const beforeLoaded = await loadDraftFromIni(options.io, parsed.leftIniPath);
    const afterLoaded = await loadDraftFromIni(options.io, parsed.rightIniPath);
    const comparison = compareHalNetworks(
      beforeLoaded.draft.halImport,
      afterLoaded.draft.halImport,
    );
    stdout(formatComparisonReport(comparison, { debug: parsed.debug }));
    if (!comparison.equivalent && parsed.failOnDiff) return EXIT_DIFFERENT;
    return EXIT_SUCCESS;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`${message}\n`);
    return EXIT_USAGE_ERROR;
  }
}
