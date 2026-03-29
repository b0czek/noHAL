import { createMachineConfigImportApi } from "@nohal/core/machineConfigImport";
import {
  createProjectBuildApi,
  createProjectDirectoryApi,
} from "@nohal/core/project";
import { nodeIo } from "./coreNodeIo";

export const projectDirectory = createProjectDirectoryApi(nodeIo);
export const projectBuild = createProjectBuildApi(nodeIo);
export const machineConfigImport = createMachineConfigImportApi(nodeIo);

export const coreWrappers = {
  projectDirectory,
  projectBuild,
  machineConfigImport,
};
