import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runHaldiffCli } from "./cli";
import { createNodeIo } from "./nodeIo";

const TEMP_PREFIX = "nohal-haldiff-";

const tempDirs: string[] = [];

async function createConfigFiles(args: {
  beforeHal: string;
  afterHal: string;
}): Promise<{
  rootDir: string;
  beforeIniPath: string;
  afterIniPath: string;
  beforeIniRelativePath: string;
  afterIniRelativePath: string;
}> {
  const rootDir = await mkdtemp(path.join(tmpdir(), TEMP_PREFIX));
  tempDirs.push(rootDir);

  const beforeDir = path.join(rootDir, "before");
  const afterDir = path.join(rootDir, "after");
  await mkdir(beforeDir, { recursive: true });
  await mkdir(afterDir, { recursive: true });

  const beforeIniPath = path.join(beforeDir, "machine.ini");
  const afterIniPath = path.join(afterDir, "machine.ini");
  const beforeHalPath = path.join(beforeDir, "main.hal");
  const afterHalPath = path.join(afterDir, "main.hal");

  const iniText = `
    [HAL]
    HALFILE = main.hal
  `.trim();

  await writeFile(beforeIniPath, iniText, "utf8");
  await writeFile(afterIniPath, iniText, "utf8");
  await writeFile(beforeHalPath, args.beforeHal.trim(), "utf8");
  await writeFile(afterHalPath, args.afterHal.trim(), "utf8");

  return {
    rootDir,
    beforeIniPath,
    afterIniPath,
    beforeIniRelativePath: path.relative(rootDir, beforeIniPath),
    afterIniRelativePath: path.relative(rootDir, afterIniPath),
  };
}

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dirPath) => rm(dirPath, { recursive: true, force: true })),
  );
});

describe("runHaldiffCli", () => {
  it("accepts positional ini paths and returns success for equivalent configs", async () => {
    const paths = await createConfigFiles({
      beforeHal: `
        loadrt and2 names=logic
        net shared logic.out => motion.enable
      `,
      afterHal: `
        loadrt and2 names=renamed_logic
        net changed renamed_logic.out => motion.enable
      `,
    });

    const stdout: string[] = [];
    const stderr: string[] = [];
    const exitCode = await runHaldiffCli(
      [paths.beforeIniPath, paths.afterIniPath],
      {
        io: createNodeIo(),
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Equivalent: yes");
    expect(stderr).toEqual([]);
  });

  it("returns success by default for differing configs and reports missing connections", async () => {
    const paths = await createConfigFiles({
      beforeHal: `
        loadrt and2 names=logic
        loadrt or2 names=gate
        net shared logic.out => gate.in0
        net shared => motion.enable
      `,
      afterHal: `
        loadrt and2 names=alpha
        loadrt or2 names=beta
        net changed alpha.out => beta.in0
      `,
    });

    const stdout: string[] = [];
    const exitCode = await runHaldiffCli(
      [paths.beforeIniPath, paths.afterIniPath],
      {
        io: createNodeIo(),
        stdout: (text) => stdout.push(text),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Equivalent: no");
    expect(stdout.join("")).toContain("motion.enable");
    expect(stdout.join("")).toContain("Unmatched before components:");
    expect(stdout.join("")).not.toContain("Structural invariant differences:");
  });

  it("includes internal invariant diagnostics only when --debug is enabled", async () => {
    const paths = await createConfigFiles({
      beforeHal: `
        loadrt and2 names=logic
        loadrt or2 names=gate
        net shared logic.out => gate.in0
        net shared => motion.enable
      `,
      afterHal: `
        loadrt and2 names=alpha
        loadrt or2 names=beta
        net changed alpha.out => beta.in0
      `,
    });

    const stdout: string[] = [];
    const exitCode = await runHaldiffCli(
      [paths.beforeIniPath, paths.afterIniPath, "--debug"],
      {
        io: createNodeIo(),
        stdout: (text) => stdout.push(text),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Structural invariant differences:");
    expect(stdout.join("")).toContain("component signature count differs:");
  });

  it("returns exit code 1 for diffs when --fail-on-diff is enabled", async () => {
    const paths = await createConfigFiles({
      beforeHal: `
        loadrt and2 names=logic
        loadrt or2 names=gate
        net shared logic.out => gate.in0
        net shared => motion.enable
      `,
      afterHal: `
        loadrt and2 names=alpha
        loadrt or2 names=beta
        net changed alpha.out => beta.in0
      `,
    });

    const stdout: string[] = [];
    const exitCode = await runHaldiffCli(
      [paths.beforeIniPath, paths.afterIniPath, "--fail-on-diff"],
      {
        io: createNodeIo(),
        stdout: (text) => stdout.push(text),
      },
    );

    expect(exitCode).toBe(1);
    expect(stdout.join("")).toContain("Equivalent: no");
  });

  it("still supports pnpm-style separators and named aliases", async () => {
    const paths = await createConfigFiles({
      beforeHal: `
        loadrt and2 names=logic
        net shared logic.out => motion.enable
      `,
      afterHal: `
        loadrt and2 names=renamed_logic
        net changed renamed_logic.out => motion.enable
      `,
    });

    const stdout: string[] = [];
    const stderr: string[] = [];
    const exitCode = await runHaldiffCli(
      [
        "--",
        "--left",
        paths.beforeIniRelativePath,
        "--right",
        paths.afterIniRelativePath,
      ],
      {
        io: createNodeIo(paths.rootDir),
        stdout: (text) => stdout.push(text),
        stderr: (text) => stderr.push(text),
      },
    );

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("Equivalent: yes");
    expect(stderr).toEqual([]);
  });
});
