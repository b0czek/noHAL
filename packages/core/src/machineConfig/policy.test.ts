import { describe, expect, it } from "vitest";
import { createEmptyProject } from "../project";
import type { LinuxCncIniDocument } from "../types";
import {
  buildEffectiveMachineConfigIni,
  buildManagedMachineConfigIniSections,
  getMachineConfigIniEntryLockMode,
  isManagedMachineConfigIniEntry,
  stripManagedEntriesFromIni,
} from "./policy";

function createIni(
  sections: LinuxCncIniDocument["sections"],
): LinuxCncIniDocument {
  return {
    parser: "nohal-ini-v1",
    lineCount: 20,
    warnings: [],
    sections,
  };
}

describe("machine config ini policy", () => {
  it("defines HAL managed keys as entry-locked only", () => {
    expect(getMachineConfigIniEntryLockMode("HAL", "HALFILE")).toBe("entry");
    expect(getMachineConfigIniEntryLockMode("HAL", "TWOPASS")).toBe("none");
    expect(getMachineConfigIniEntryLockMode("EMC", "MACHINE")).toBe("none");
  });

  it("uses the policy to strip managed INI keys", () => {
    const ini = createIni([
      {
        name: "HAL",
        line: 1,
        entries: [
          { key: "HALFILE", value: "legacy.hal", line: 2 },
          { key: "TWOPASS", value: "on", line: 3 },
          { key: "SHUTDOWN", value: "cleanup.hal", line: 4 },
        ],
      },
    ]);

    expect(isManagedMachineConfigIniEntry("HAL", "HALFILE")).toBe(true);
    expect(isManagedMachineConfigIniEntry("HAL", "TWOPASS")).toBe(false);
    expect(stripManagedEntriesFromIni(ini).sections).toEqual([
      {
        name: "HAL",
        line: 1,
        entries: [{ key: "TWOPASS", value: "on", line: 3 }],
      },
    ]);
  });

  it("uses the policy to build effective machine INI output", () => {
    const project = createEmptyProject("Policy Test");
    project.machineConfig = {
      source: "imported-linuxcnc-config",
      userIni: createIni([
        {
          name: "EMC",
          line: 1,
          entries: [{ key: "MACHINE", value: "Policy Test", line: 2 }],
        },
        {
          name: "HAL",
          line: 4,
          entries: [
            { key: "HALFILE", value: "legacy.hal", line: 5 },
            { key: "TWOPASS", value: "on", line: 6 },
          ],
        },
      ]),
      halSources: [],
    };

    const managedSections = buildManagedMachineConfigIniSections(project);
    expect(managedSections).toEqual([
      {
        name: "HAL",
        line: 0,
        entries: [{ key: "HALFILE", value: "policy-test.hal", line: 0 }],
      },
    ]);

    expect(buildEffectiveMachineConfigIni(project)?.sections).toEqual([
      {
        name: "EMC",
        line: 1,
        entries: [{ key: "MACHINE", value: "Policy Test", line: 2 }],
      },
      {
        name: "HAL",
        line: 4,
        entries: [
          { key: "HALFILE", value: "policy-test.hal", line: 0 },
          { key: "TWOPASS", value: "on", line: 6 },
        ],
      },
    ]);
  });
});
