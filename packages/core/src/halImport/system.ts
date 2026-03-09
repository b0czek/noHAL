import { resolveComponentPinsForInstance } from "../componentInstance";
import {
  createIniSystemComponentDefinition,
  iniManagedInstanceConfigValues,
} from "../componentStore/catalog/system/ini";
import { createIocontrolSystemComponentDefinition } from "../componentStore/catalog/system/iocontrol";
import {
  createMotmodSystemComponentDefinition,
  type MotmodManagedFamily,
  managedInstanceConfigValuesForFamily,
} from "../componentStore/catalog/system/motmod";
import type {
  ComponentDefinition,
  HalImportComponentGroup,
  LinuxCncVersion,
  ProjectMotmodConfig,
} from "../types";

const SYSTEM_HAL_COMPONENT_NAMES = new Set([
  "axis",
  "ini",
  "iocontrol",
  "joint",
  "motion",
  "spindle",
]);

export function isSystemHalImportComponentName(name: string): boolean {
  return SYSTEM_HAL_COMPONENT_NAMES.has(name.trim().toLowerCase());
}

export function isSystemHalImportComponentGroup(
  group: Pick<HalImportComponentGroup, "inferredHalComponentName">,
): boolean {
  return isSystemHalImportComponentName(group.inferredHalComponentName);
}

const DEFAULT_MOTMOD_CONFIG: ProjectMotmodConfig = {
  numJoints: 3,
  numDio: 4,
  numAio: 4,
  numSpindles: 1,
  numMiscError: 0,
  trajPeriodNs: 0,
};

export interface SystemHalImportOverrideAnalysis {
  extraPins: string[];
  extraParams: string[];
  extraFunctions: string[];
}

function normalizeMotmodConfig(
  value: Partial<ProjectMotmodConfig> | undefined,
): ProjectMotmodConfig {
  return {
    ...DEFAULT_MOTMOD_CONFIG,
    ...value,
  };
}

function pinIdentity(
  pin: Pick<ComponentDefinition["pins"][number], "name">,
): string {
  return pin.name;
}

function paramIdentity(
  param: Pick<ComponentDefinition["params"][number], "name">,
): string {
  return param.name;
}

function functionIdentity(
  fn: Pick<
    NonNullable<ComponentDefinition["functions"]>[number],
    "halSuffix" | "declaredName" | "key"
  >,
): string {
  return fn.halSuffix || fn.declaredName || fn.key;
}

function systemDefinitionForImportGroup(
  group: Pick<HalImportComponentGroup, "inferredHalComponentName">,
  linuxcncVersion: LinuxCncVersion,
  motmod: ProjectMotmodConfig,
): {
  component: ComponentDefinition;
  instanceConfigValues?: Record<string, string>;
} | null {
  const halName = group.inferredHalComponentName.trim().toLowerCase();
  if (
    halName === "motion" ||
    halName === "axis" ||
    halName === "joint" ||
    halName === "spindle"
  ) {
    const family = halName as MotmodManagedFamily;
    return {
      component: createMotmodSystemComponentDefinition(family, linuxcncVersion),
      instanceConfigValues: managedInstanceConfigValuesForFamily(
        family,
        linuxcncVersion,
        motmod,
      ),
    };
  }
  if (halName === "ini") {
    return {
      component: createIniSystemComponentDefinition(linuxcncVersion),
      instanceConfigValues: iniManagedInstanceConfigValues(
        linuxcncVersion,
        motmod,
      ),
    };
  }
  if (halName === "iocontrol") {
    return {
      component: createIocontrolSystemComponentDefinition(),
    };
  }
  return null;
}

export function analyzeSystemHalImportOverride(
  group: Pick<HalImportComponentGroup, "inferredHalComponentName">,
  component: Pick<ComponentDefinition, "pins" | "params" | "functions">,
  options?: {
    linuxcncVersion?: LinuxCncVersion;
    motmod?: Partial<ProjectMotmodConfig>;
  },
): SystemHalImportOverrideAnalysis | null {
  if (!isSystemHalImportComponentGroup(group)) return null;

  const linuxcncVersion = options?.linuxcncVersion ?? "2.10";
  const motmod = normalizeMotmodConfig(options?.motmod);
  const systemDefinition = systemDefinitionForImportGroup(
    group,
    linuxcncVersion,
    motmod,
  );
  if (!systemDefinition) return null;

  const expectedPins = new Set(
    resolveComponentPinsForInstance(
      systemDefinition.component,
      systemDefinition.instanceConfigValues,
    ).map(pinIdentity),
  );
  const extraPins = component.pins
    .filter((pin) => !expectedPins.has(pinIdentity(pin)))
    .map((pin) => pin.name)
    .sort((a, b) => a.localeCompare(b));

  const expectedParams = new Set(
    systemDefinition.component.params.map(paramIdentity),
  );
  const extraParams = component.params
    .filter((param) => !expectedParams.has(paramIdentity(param)))
    .map((param) => param.name)
    .sort((a, b) => a.localeCompare(b));

  const expectedFunctions = new Set(
    (systemDefinition.component.functions ?? []).map(functionIdentity),
  );
  const extraFunctions = (component.functions ?? [])
    .filter((fn) => !expectedFunctions.has(functionIdentity(fn)))
    .map((fn) => fn.halSuffix || fn.declaredName || fn.key)
    .sort((a, b) => a.localeCompare(b));

  if (
    extraPins.length === 0 &&
    extraParams.length === 0 &&
    extraFunctions.length === 0
  ) {
    return null;
  }

  return {
    extraPins,
    extraParams,
    extraFunctions,
  };
}
