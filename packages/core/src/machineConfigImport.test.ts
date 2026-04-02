import { describe, expect, it } from "vitest";

import { buildMachineConfigImportDraft } from "./machineConfigImport";
import { createMemoryIo } from "./testUtils/memoryIo";

describe("buildMachineConfigImportDraft", () => {
  it("loads HAL content for files referenced by the INI", async () => {
    const { io } = createMemoryIo();
    const buildDraft = buildMachineConfigImportDraft(io);
    const configDir = "/configs/demo";
    const iniPath = `${configDir}/demo.ini`;
    const coreHalPath = `${configDir}/core.hal`;
    const ioHalPath = `${configDir}/io.hal`;

    await io.fs.makeDir(configDir, { recursive: true });
    await io.fs.writeTextFile(
      iniPath,
      `
      [HAL]
      HALFILE = core.hal
      HALFILE = io.hal
    `.trim(),
    );
    await io.fs.writeTextFile(
      coreHalPath,
      `
      loadrt and2 names=logic
      net enable logic.out => motion.enable
    `.trim(),
    );
    await io.fs.writeTextFile(
      ioHalPath,
      `
      setp logic.in0 1
      addf logic servo-thread
    `.trim(),
    );

    const draft = await buildDraft(iniPath, [
      { filePath: coreHalPath, resolveIniSubstitutions: true },
      { filePath: ioHalPath, resolveIniSubstitutions: true },
    ]);

    expect(draft.machineConfig.halSources).toEqual([
      expect.objectContaining({
        kind: "HALFILE",
        requestedPath: "core.hal",
        resolvedPath: coreHalPath,
        status: "loaded",
      }),
      expect.objectContaining({
        kind: "HALFILE",
        requestedPath: "io.hal",
        resolvedPath: ioHalPath,
        status: "loaded",
      }),
    ]);
    expect(
      draft.halImport.componentGroups.map(
        (group) => group.inferredHalComponentName,
      ),
    ).toContain("and2");
    expect(draft.halImport.nets).toEqual([
      expect.objectContaining({ name: "enable" }),
    ]);
    expect(draft.halImport.setps).toEqual([
      expect.objectContaining({
        rawPath: "logic.in0",
        instanceName: "logic",
        fieldName: "in0",
        value: "1",
      }),
    ]);
    expect(draft.halImport.addfs).toEqual([
      expect.objectContaining({
        functionName: "logic",
        instanceName: "logic",
        isDefaultFunction: true,
        thread: "servo-thread",
      }),
    ]);
  });
});
