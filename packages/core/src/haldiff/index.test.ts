import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseHalImportDraft } from "../halImport";
import { buildMachineConfigImportDraft } from "../machineConfigImport";
import { createMemoryIo } from "../testUtils/memoryIo";
import { buildHalNetworkGraph, compareHalNetworks } from "./index";
import {
  buildComponentCandidates,
  refineComparableGraphColors,
  shouldAttemptExactSearch,
} from "./refinement";

const EXPECTED_SHARED_ATTACHMENT_COUNT = 3;

describe("HAL diff graph building", () => {
  it("merges repeated net lines into one signal node", () => {
    const draft = parseHalImportDraft(`
      loadrt and2 names=logic
      net shared logic.out => motion.enable
      net shared => joint.0.home-sw-in
    `);

    const graph = buildHalNetworkGraph(draft);
    const sharedSignal = graph.signals.get("shared");

    expect(graph.signals.size).toBe(1);
    expect(sharedSignal?.attachments).toHaveLength(
      EXPECTED_SHARED_ATTACHMENT_COUNT,
    );
    expect(sharedSignal?.attachments).toEqual(
      expect.arrayContaining([
        { componentId: "joint.0", pinName: "home-sw-in" },
        { componentId: "logic", pinName: "out" },
        { componentId: "motion", pinName: "enable" },
      ]),
    );
  });
});

describe("compareHalNetworks", () => {
  it("treats renamed instances and signals as equivalent when structure matches", () => {
    const before = parseHalImportDraft(`
      loadrt and2 names=logic
      loadrt or2 names=gate
      net shared logic.out => gate.in0
      net shared => motion.enable
      net result gate.out => joint.0.home-sw-in
    `);
    const after = parseHalImportDraft(`
      loadrt and2 names=alpha
      loadrt or2 names=beta
      net signal_a alpha.out => beta.in0
      net signal_a => motion.enable
      net signal_b beta.out => joint.0.home-sw-in
    `);

    const comparison = compareHalNetworks(before, after);

    expect(comparison.equivalent).toBe(true);
    expect(comparison.matchedComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          beforeInstanceName: "logic",
          afterInstanceName: "alpha",
        }),
        expect.objectContaining({
          beforeInstanceName: "gate",
          afterInstanceName: "beta",
        }),
      ]),
    );
    expect(comparison.differingSignals).toEqual([]);
    expect(comparison.unmatchedBeforeSignals).toEqual([]);
    expect(comparison.unmatchedAfterSignals).toEqual([]);
  });

  it("reports missing structural connections when one signal loses an endpoint", () => {
    const before = parseHalImportDraft(`
      loadrt and2 names=logic
      loadrt or2 names=gate
      net shared logic.out => gate.in0
      net shared => motion.enable
    `);
    const after = parseHalImportDraft(`
      loadrt and2 names=alpha
      loadrt or2 names=beta
      net signal_a alpha.out => beta.in0
    `);

    const comparison = compareHalNetworks(before, after);

    expect(comparison.equivalent).toBe(false);
    expect(comparison.differingSignals).toEqual([
      expect.objectContaining({
        beforeSignalName: "shared",
        afterSignalName: "signal_a",
        missingConnections: [
          expect.objectContaining({
            componentInstanceName: "motion",
            pinName: "enable",
          }),
        ],
      }),
    ]);
  });

  it("matches structurally equivalent components even when the component type changes", () => {
    const before = parseHalImportDraft(`
      loadusr io_latch -n auto-latch
      net usrkb-btn-auto auto-latch.trigger => motion.enable
    `);
    const after = parseHalImportDraft(`
      loadusr kb -n kb.auto-latch
      net kb.usrkb-btn-auto kb.auto-latch.trigger => motion.enable
    `);

    const comparison = compareHalNetworks(before, after);

    expect(comparison.equivalent).toBe(true);
    expect(comparison.matchedComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          beforeInstanceName: "auto-latch",
          afterInstanceName: "kb.auto-latch",
        }),
      ]),
    );
    expect(comparison.unmatchedBeforeComponents).toEqual([]);
    expect(comparison.unmatchedAfterComponents).toEqual([]);
  });

  it("skips exact search for highly ambiguous non-isomorphic graphs", () => {
    const before = parseHalImportDraft(`
      loadrt not names=c0,c1,c2,c3,c4,c5,c6,c7
      net s0 c0.out => c1.in
      net s1 c1.out => c2.in
      net s2 c2.out => c3.in
      net s3 c3.out => c4.in
      net s4 c4.out => c5.in
      net s5 c5.out => c6.in
      net s6 c6.out => c7.in
      net s7 c7.out => c0.in
    `);
    const after = parseHalImportDraft(`
      loadrt not names=d0,d1,d2,d3,d4,d5,d6,d7
      net t0 d0.out => d1.in
      net t1 d1.out => d2.in
      net t2 d2.out => d3.in
      net t3 d3.out => d0.in
      net t4 d4.out => d5.in
      net t5 d5.out => d6.in
      net t6 d6.out => d7.in
      net t7 d7.out => d4.in
    `);

    const comparison = compareHalNetworks(before, after);

    expect(comparison.equivalent).toBe(false);
    expect(comparison.warnings).toContain(
      "Skipping exact structural search because the candidate graph is too ambiguous; falling back to heuristic mapping",
    );
  });

  it("skips exact search for the maho fixture with split b-axis limit nets", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../..");
    const fixturePaths = [
      "compare/before/maho_800c.ini",
      "compare/before/maho_800c.hal",
      "compare/before/maho_800c_postgui.hal",
      "compare/before/linuxcnc_usbio.hal",
      "compare/after/maho_800c.ini",
      "compare/after/maho-800c.hal",
      "compare/after/maho-800c-postgui.hal",
    ];
    const { io } = createMemoryIo();

    for (const relativePath of fixturePaths) {
      const absolutePath = path.join(repoRoot, relativePath);
      const targetPath = `/${relativePath}`;
      await io.fs.makeDir(path.posix.dirname(targetPath), { recursive: true });
      await io.fs.writeTextFile(targetPath, readFileSync(absolutePath, "utf8"));
    }

    const buildDraft = buildMachineConfigImportDraft(io);
    const before = await buildDraft("/compare/before/maho_800c.ini", [
      {
        filePath: "/compare/before/linuxcnc_usbio.hal",
        resolveIniSubstitutions: true,
      },
      {
        filePath: "/compare/before/maho_800c.hal",
        resolveIniSubstitutions: true,
      },
      {
        filePath: "/compare/before/maho_800c_postgui.hal",
        resolveIniSubstitutions: true,
      },
    ]);
    const after = await buildDraft("/compare/after/maho_800c.ini", [
      {
        filePath: "/compare/after/maho-800c.hal",
        resolveIniSubstitutions: true,
      },
      {
        filePath: "/compare/after/maho-800c-postgui.hal",
        resolveIniSubstitutions: true,
      },
    ]);

    const beforeGraph = buildHalNetworkGraph(before.halImport);
    const afterGraph = buildHalNetworkGraph(after.halImport);
    const comparableColors = refineComparableGraphColors({
      beforeGraph,
      afterGraph,
    });
    const exactCandidates = buildComponentCandidates(
      beforeGraph,
      afterGraph,
      comparableColors.before.componentColors,
      comparableColors.after.componentColors,
    );
    const comparison = compareHalNetworks(before.halImport, after.halImport);

    expect(shouldAttemptExactSearch(exactCandidates).allowed).toBe(false);
    expect(comparison.matchedComponents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          beforeInstanceName: "ini.4",
          afterInstanceName: "ini.4",
        }),
        expect.objectContaining({
          beforeInstanceName: "mahokins.0",
          afterInstanceName: "system.mahokins",
        }),
      ]),
    );
    expect(comparison.unmatchedAfterComponents).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ instanceName: "system" }),
      ]),
    );
  });
});
