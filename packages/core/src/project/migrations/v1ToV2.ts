import {
  createEmptyLinuxCncIniDocument,
  normalizeProjectMachineConfig,
} from "../../machineConfig/shared";
import type { ProjectMigration } from "./types";

export const projectMigrationV1ToV2: ProjectMigration = {
  from: 1,
  to: 2,
  migrate(input: unknown): unknown {
    const project = structuredClone(input) as Record<string, unknown>;
    project.version = 2;
    project.machineConfig = normalizeProjectMachineConfig(
      project.machineConfig,
    ) ?? {
      source: "imported-linuxcnc-config",
      userIni: createEmptyLinuxCncIniDocument(),
      halSources: [],
    };
    return project;
  },
};
