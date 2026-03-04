#!/usr/bin/env ts-node
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { parseCompComponentDefinition } from "../../../packages/core/src/compParser.ts";
import { mergeManualLinuxCncComponents } from "../../../packages/core/src/linuxcncManualComponents.ts";
import type { ImportedComponentDefinition } from "../../../packages/core/src/types/index.ts";

const SUPPORTED_VERSIONS = ["2.7", "2.8", "2.9", "2.10"] as const;
const REPO_ARG_PREFIX = "--repo=";

type SupportedVersion = (typeof SUPPORTED_VERSIONS)[number];

interface VersionStoreData {
  version: SupportedVersion;
  refName: string;
  revision: string;
  generatedAt: string;
  components: ImportedComponentDefinition[];
}

function slugify(value: string): string {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "component"
  );
}

function runGit(repoPath: string, args: string[]): string {
  const result = spawnSync("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status === 0) return result.stdout ?? "";
  const stderr = result.stderr || result.error?.message || "unknown git error";
  throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
}

function findRepoPath(): string {
  const arg = process.argv.find((item) => item.startsWith(REPO_ARG_PREFIX));
  if (arg) return path.resolve(arg.slice(REPO_ARG_PREFIX.length));
  return path.resolve(process.cwd(), "..", "linuxcnc");
}

function listTags(repoPath: string, pattern: string): string[] {
  const output = runGit(repoPath, [
    "tag",
    "--list",
    pattern,
    "--sort=-v:refname",
  ]);
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function resolveRefForVersion(
  repoPath: string,
  version: SupportedVersion,
): string {
  const tags = listTags(repoPath, `v${version}*`);
  const stable = tags.filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
  if (version === "2.10") {
    if (stable.length > 0) return stable[0];
    return "HEAD";
  }
  if (stable.length > 0) return stable[0];
  if (tags.length > 0) return tags[0];
  return "HEAD";
}

function listTreeFiles(
  repoPath: string,
  ref: string,
  treePath: string,
): string[] {
  try {
    const output = runGit(repoPath, [
      "ls-tree",
      "-r",
      "--name-only",
      ref,
      "--",
      treePath,
    ]);
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readGitFile(repoPath: string, ref: string, filePath: string): string {
  return runGit(repoPath, ["show", `${ref}:${filePath}`]);
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
  store: VersionStoreData;
  stats: { compFiles: number; compComponents: number };
} {
  const refName = resolveRefForVersion(repoPath, version);
  const revision = runGit(repoPath, ["rev-parse", refName]).trim();

  const compComponents: ImportedComponentDefinition[] = [];

  const compFiles = listTreeFiles(
    repoPath,
    refName,
    "src/hal/components",
  ).filter((filePath) => filePath.endsWith(".comp"));

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

  const nowIso = new Date().toISOString();
  return {
    store: {
      version,
      refName,
      revision,
      generatedAt: nowIso,
      components: mergeManualLinuxCncComponents(
        version,
        refName,
        dedupeByName(compComponents),
      ),
    },
    stats: {
      compFiles: compFiles.length,
      compComponents: compComponents.length,
    },
  };
}

function main(): void {
  const repoPath = findRepoPath();
  const outputDir = path.resolve(process.cwd(), "src/main/linuxcncStores");
  mkdirSync(outputDir, { recursive: true });

  for (const version of SUPPORTED_VERSIONS) {
    const { store, stats } = buildVersionStore(repoPath, version);
    const versionDir = path.join(outputDir, version);
    mkdirSync(versionDir, { recursive: true });
    const storePath = path.join(versionDir, "store.json");
    const legacyCompPath = path.join(
      versionDir,
      "components.autogen-comp.json",
    );
    rmSync(legacyCompPath, { force: true });
    writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    process.stdout.write(
      `[linuxcnc-store] ${version} (${store.refName}, ${store.revision.slice(0, 12)}): ${store.components.length} components (.comp files=${stats.compFiles}, parsed components=${stats.compComponents}) -> ${storePath}\n`,
    );
  }
}

main();
