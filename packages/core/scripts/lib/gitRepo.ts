import { spawnSync } from "node:child_process";

export function runGit(repoPath: string, args: string[]): string {
  const result = spawnSync("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.status === 0) return result.stdout ?? "";
  const stderr = result.stderr || result.error?.message || "unknown git error";
  throw new Error(`git ${args.join(" ")} failed: ${stderr}`);
}

export function listTags(repoPath: string, pattern: string): string[] {
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

export function resolveLinuxCncRefForVersion(
  repoPath: string,
  version: string,
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

export function listTreeFiles(
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

export function readGitFile(
  repoPath: string,
  ref: string,
  filePath: string,
): string {
  return runGit(repoPath, ["show", `${ref}:${filePath}`]);
}
