import { createMachineConfigImportApi } from "@nohal/core/src/machineConfigImport";
import { createProjectBuildApi } from "@nohal/core/src/project/build";
import { createProjectDirectoryApi } from "@nohal/core/src/project/directory";
import { nodeIo } from "./coreNodeIo";

export const projectDirectory = createProjectDirectoryApi(nodeIo);
export const projectBuild = createProjectBuildApi(nodeIo);
export const machineConfigImport = createMachineConfigImportApi(nodeIo);

export const coreWrappers = {
  projectDirectory,
  projectBuild,
  machineConfigImport,
};
