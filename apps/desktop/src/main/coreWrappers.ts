import { createMachineConfigImportApi } from "@nohal/core/src/machineConfigImport";
import { createProjectBuildApi } from "@nohal/core/src/projectBuild";
import { createProjectDirectoryApi } from "@nohal/core/src/projectDirectory";
import { nodeIo } from "./coreNodeIo";

export const projectDirectory = createProjectDirectoryApi(nodeIo);
export const projectBuild = createProjectBuildApi(nodeIo);
export const machineConfigImport = createMachineConfigImportApi(nodeIo);

export const coreWrappers = {
  projectDirectory,
  projectBuild,
  machineConfigImport,
};
