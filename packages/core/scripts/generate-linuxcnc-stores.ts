#!/usr/bin/env ts-node
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { parseCompComponentDefinition } from "../src/compParser.ts";
import type { ImportedComponentDefinition } from "../src/types/index.ts";
import {
  type GeneratedCatalogComponentHistoryFileData,
  type GeneratedCatalogVersionMetadata,
  renderComponentHistoryModule,
  renderGeneratedIndex,
  renderMetaModule,
} from "./lib/generatedCatalogWriters.ts";
import {
  listTreeFiles,
  readGitFile,
  resolveLinuxCncRefForVersion,
  runGit,
} from "./lib/gitRepo.ts";
import {
  COMPONENTS_SUBMAKEFILE_PATH,
  CONV_TEMPLATE_PATH,
  listSyntheticConvCompFiles,
  parseConvCompTypesFromPath,
  synthesizeConvCompContent,
} from "./lib/syntheticConvComponents.ts";

const SUPPORTED_VERSIONS = ["2.7", "2.8", "2.9", "2.10"] as const;
const REPO_ARG_PREFIX = "--repo=";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(SCRIPT_DIR, "../../..");

type SupportedVersion = (typeof SUPPORTED_VERSIONS)[number];

type VersionMetadata = GeneratedCatalogVersionMetadata;

interface VersionSnapshot {
  version: SupportedVersion;
  meta: VersionMetadata;
  components: ImportedComponentDefinition[];
}

interface ComponentHistoryVariant {
  fromVersion: SupportedVersion;
  component: VersionlessImportedComponentDefinition | null;
}

type ComponentHistoryFileData = GeneratedCatalogComponentHistoryFileData & {
  variants: ComponentHistoryVariant[];
};

type VersionlessImportedComponentDefinition = Omit<
  ImportedComponentDefinition,
  "id" | "sourcePath"
> & {
  id: string;
  sourcePath?: string;
};

function slugify(value: string): string {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "component"
  );
}

function findRepoPath(): string {
  const arg = process.argv.find((item) => item.startsWith(REPO_ARG_PREFIX));
  if (arg) return path.resolve(arg.slice(REPO_ARG_PREFIX.length));
  return path.resolve(WORKSPACE_ROOT, "..", "linuxcnc");
}

function resolveRefForVersion(
  repoPath: string,
  version: SupportedVersion,
): string {
  return resolveLinuxCncRefForVersion(repoPath, version);
}

function dedupeByName(
  items: ImportedComponentDefinition[],
): ImportedComponentDefinition[] {
  const byName = new Map<string, ImportedComponentDefinition>();
  for (const item of items) {
    const key = item.halComponentName;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, item);
      continue;
    }
    if (
      item.parseMeta?.parser === "nohal-comp-v1" &&
      existing.parseMeta?.parser !== "nohal-comp-v1"
    ) {
      byName.set(key, item);
    }
  }
  return [...byName.values()].sort((a, b) =>
    a.halComponentName.localeCompare(b.halComponentName),
  );
}

function parseCompForStore(
  version: SupportedVersion,
  refName: string,
  filePath: string,
  content: string,
): ImportedComponentDefinition {
  const parsed = parseCompComponentDefinition(content, filePath);
  return {
    ...parsed,
    id: `linuxcnc:${version}:${parsed.id}`,
    sourcePath: `git:${refName}:${filePath}`,
  };
}

function parseCompFallback(
  version: SupportedVersion,
  refName: string,
  filePath: string,
  message: string,
): ImportedComponentDefinition {
  return {
    id: `linuxcnc:${version}:comp:${slugify(path.basename(filePath))}`,
    name: path.basename(filePath).replace(/\.comp$/i, ""),
    halComponentName: path.basename(filePath).replace(/\.comp$/i, ""),
    source: "comp",
    sourcePath: `git:${refName}:${filePath}`,
    pins: [],
    params: [],
    runtime: { kind: "unknown" },
    parseMeta: {
      parser: "nohal-comp-v1",
      warnings: [`Failed to parse component header: ${message}`],
    },
  };
}

function buildVersionStore(
  repoPath: string,
  version: SupportedVersion,
): {
  snapshot: VersionSnapshot;
  stats: {
    compFiles: number;
    syntheticCompFiles: number;
    compComponents: number;
  };
} {
  const refName = resolveRefForVersion(repoPath, version);
  const revision = runGit(repoPath, ["rev-parse", refName]).trim();

  const compComponents: ImportedComponentDefinition[] = [];

  const compFiles = listTreeFiles(
    repoPath,
    refName,
    "src/hal/components",
  ).filter((filePath) => filePath.endsWith(".comp"));
  const compFileSet = new Set(compFiles);
  let syntheticConvFiles: string[] = [];
  try {
    const submakefile = readGitFile(
      repoPath,
      refName,
      COMPONENTS_SUBMAKEFILE_PATH,
    );
    syntheticConvFiles = listSyntheticConvCompFiles(submakefile).filter(
      (filePath) => !compFileSet.has(filePath),
    );
  } catch {
    syntheticConvFiles = [];
  }

  for (const filePath of compFiles) {
    try {
      const content = readGitFile(repoPath, refName, filePath);
      compComponents.push(
        parseCompForStore(version, refName, filePath, content),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      compComponents.push(
        parseCompFallback(version, refName, filePath, message),
      );
    }
  }

  if (syntheticConvFiles.length > 0) {
    try {
      const convTemplate = readGitFile(repoPath, refName, CONV_TEMPLATE_PATH);
      for (const filePath of syntheticConvFiles) {
        const convTypes = parseConvCompTypesFromPath(filePath);
        if (!convTypes) {
          compComponents.push(
            parseCompFallback(
              version,
              refName,
              filePath,
              "Unsupported conv component filename pattern",
            ),
          );
          continue;
        }
        try {
          const content = synthesizeConvCompContent(
            convTemplate,
            convTypes.fromType,
            convTypes.toType,
          );
          const parsed = parseCompForStore(version, refName, filePath, content);
          compComponents.push({
            ...parsed,
            parseMeta: {
              ...parsed.parseMeta,
              warnings: [
                ...parsed.parseMeta.warnings,
                "Synthesized from conv.comp.in + Submakefile target list.",
              ],
            },
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          compComponents.push(
            parseCompFallback(version, refName, filePath, message),
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      for (const filePath of syntheticConvFiles) {
        compComponents.push(
          parseCompFallback(version, refName, filePath, message),
        );
      }
    }
  }

  const nowIso = new Date().toISOString();
  return {
    snapshot: {
      version,
      meta: {
        refName,
        revision,
        generatedAt: nowIso,
      },
      components: dedupeByName(compComponents),
    },
    stats: {
      compFiles: compFiles.length,
      syntheticCompFiles: syntheticConvFiles.length,
      compComponents: compComponents.length,
    },
  };
}

function toVersionlessComponent(
  component: ImportedComponentDefinition,
  version: SupportedVersion,
  refName: string,
): VersionlessImportedComponentDefinition {
  const idPrefix = `linuxcnc:${version}:`;
  const sourcePrefix = `git:${refName}:`;
  const id = component.id.startsWith(idPrefix)
    ? component.id.slice(idPrefix.length)
    : component.id;
  const sourcePath = component.sourcePath?.startsWith(sourcePrefix)
    ? component.sourcePath.slice(sourcePrefix.length)
    : component.sourcePath;
  return {
    ...component,
    id,
    sourcePath,
  };
}

function serializeVariant(
  component: VersionlessImportedComponentDefinition | null,
): string {
  return JSON.stringify(component);
}

function buildComponentHistories(
  snapshots: Record<SupportedVersion, VersionSnapshot>,
): ComponentHistoryFileData[] {
  const byVersion = new Map<
    SupportedVersion,
    Map<string, ImportedComponentDefinition>
  >();
  const allNames = new Set<string>();

  for (const version of SUPPORTED_VERSIONS) {
    const versionComponents = new Map<string, ImportedComponentDefinition>();
    for (const component of snapshots[version].components) {
      versionComponents.set(component.halComponentName, component);
      allNames.add(component.halComponentName);
    }
    byVersion.set(version, versionComponents);
  }

  const sortedNames = [...allNames.values()].sort((a, b) => a.localeCompare(b));
  const histories: ComponentHistoryFileData[] = [];

  for (const halComponentName of sortedNames) {
    const variants: ComponentHistoryVariant[] = [];
    let previousSerialized: string | null = null;

    for (const version of SUPPORTED_VERSIONS) {
      const component = byVersion.get(version)?.get(halComponentName);
      const normalized = component
        ? toVersionlessComponent(
            component,
            version,
            snapshots[version].meta.refName,
          )
        : null;
      const serialized = serializeVariant(normalized);
      if (previousSerialized === serialized) continue;
      variants.push({
        fromVersion: version,
        component: normalized,
      });
      previousSerialized = serialized;
    }

    histories.push({
      halComponentName,
      variants,
    });
  }

  return histories;
}

const STORE_REVISION_PREVIEW_LENGTH = 12;

function main(): void {
  const repoPath = findRepoPath();
  const outputDir = path.resolve(
    WORKSPACE_ROOT,
    "packages/core/src/componentStore/catalog/generated",
  );
  const componentsOutputDir = path.join(outputDir, "components");
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(componentsOutputDir, { recursive: true });

  const snapshots = {} as Record<SupportedVersion, VersionSnapshot>;
  const metadata = {} as Record<SupportedVersion, VersionMetadata>;

  for (const version of SUPPORTED_VERSIONS) {
    const { snapshot, stats } = buildVersionStore(repoPath, version);
    snapshots[version] = snapshot;
    metadata[version] = snapshot.meta;
    process.stdout.write(
      `[linuxcnc-store] ${version} (${snapshot.meta.refName}, ${snapshot.meta.revision.slice(0, STORE_REVISION_PREVIEW_LENGTH)}): ${snapshot.components.length} components (.comp files=${stats.compFiles}, synthetic conv files=${stats.syntheticCompFiles}, parsed components=${stats.compComponents})\n`,
    );
  }

  const histories = buildComponentHistories(snapshots);
  const slugCount = new Map<string, number>();
  const indexEntries: Array<{ importName: string; relativePath: string }> = [];

  histories.forEach((history, idx) => {
    const baseSlug = slugify(history.halComponentName);
    const count = (slugCount.get(baseSlug) ?? 0) + 1;
    slugCount.set(baseSlug, count);
    const slug = count === 1 ? baseSlug : `${baseSlug}-${count}`;
    const fileName = `${slug}.ts`;
    const filePath = path.join(componentsOutputDir, fileName);
    writeFileSync(filePath, renderComponentHistoryModule(history), "utf8");
    indexEntries.push({
      importName: `component_${idx}`,
      relativePath: `./components/${slug}.ts`,
    });
  });

  writeFileSync(
    path.join(outputDir, "meta.ts"),
    renderMetaModule(metadata),
    "utf8",
  );
  writeFileSync(
    path.join(outputDir, "index.ts"),
    renderGeneratedIndex(indexEntries),
    "utf8",
  );
  process.stdout.write(
    `[linuxcnc-store] wrote ${histories.length} component history files + metadata -> ${outputDir}\n`,
  );
}

main();
