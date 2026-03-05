import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type {
  ComponentDefinition,
  ComponentPinDefinition,
  ProjectMotmodConfig,
} from "../../../types";

const AXIS_LETTERS = ["x", "y", "z", "a", "b", "c", "u", "v", "w"] as const;

const INI_27_MAX_JOINTS = 9;
const INI_28_MAX_JOINTS = 9;
const INI_29_PLUS_MAX_JOINTS = 16;
const DEFAULT_INI_JOINT_COUNT = 3;

export const INI_SYSTEM_COMPONENT_ID = "system:ini:ini";
export const INI_SYSTEM_MANAGER = "ini" as const;
export const INI_SYSTEM_FAMILY = "ini" as const;

function clampInt(
  n: unknown,
  fallback: number,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n as number)));
}

export function iniJointMaxForVersion(version: LinuxCncVersion): number {
  if (version === "2.7") return INI_27_MAX_JOINTS;
  if (version === "2.8") return INI_28_MAX_JOINTS;
  return INI_29_PLUS_MAX_JOINTS;
}

export function iniJointCountForVersion(
  version: LinuxCncVersion,
  motmod: Partial<ProjectMotmodConfig> | undefined,
): number {
  const max = iniJointMaxForVersion(version);
  const fallback =
    version === "2.7" ? INI_27_MAX_JOINTS : DEFAULT_INI_JOINT_COUNT;
  return clampInt(motmod?.numJoints, fallback, 1, max);
}

export function iniManagedInstanceConfigValues(
  version: LinuxCncVersion,
  motmod: Partial<ProjectMotmodConfig> | undefined,
): Record<string, string> | undefined {
  if (version === "2.7") return undefined;
  return {
    num_joints: `${iniJointCountForVersion(version, motmod)}`,
  };
}

function iniGlobalPins(): ComponentPinDefinition[] {
  return [
    {
      key: "traj_default_velocity",
      name: "traj_default_velocity",
      direction: "in",
      type: "float",
    },
    {
      key: "traj_max_velocity",
      name: "traj_max_velocity",
      direction: "in",
      type: "float",
    },
    {
      key: "traj_default_acceleration",
      name: "traj_default_acceleration",
      direction: "in",
      type: "float",
    },
    {
      key: "traj_max_acceleration",
      name: "traj_max_acceleration",
      direction: "in",
      type: "float",
    },
    {
      key: "traj_arc_blend_enable",
      name: "traj_arc_blend_enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "traj_arc_blend_fallback_enable",
      name: "traj_arc_blend_fallback_enable",
      direction: "in",
      type: "bit",
    },
    {
      key: "traj_arc_blend_optimization_depth",
      name: "traj_arc_blend_optimization_depth",
      direction: "in",
      type: "s32",
    },
    {
      key: "traj_arc_blend_gap_cycles",
      name: "traj_arc_blend_gap_cycles",
      direction: "in",
      type: "float",
    },
    {
      key: "traj_arc_blend_ramp_freq",
      name: "traj_arc_blend_ramp_freq",
      direction: "in",
      type: "float",
    },
    {
      key: "traj_arc_blend_tangent_kink_ratio",
      name: "traj_arc_blend_tangent_kink_ratio",
      direction: "in",
      type: "float",
    },
  ];
}

function iniPins27(): ComponentPinDefinition[] {
  const pins: ComponentPinDefinition[] = [];
  const fields = [
    "backlash",
    "min_limit",
    "max_limit",
    "max_velocity",
    "max_acceleration",
    "ferror",
    "min_ferror",
  ] as const;
  for (let idx = 0; idx < INI_27_MAX_JOINTS; idx += 1) {
    for (const field of fields) {
      pins.push({
        key: `joint_${idx}_${field}`,
        name: `${idx}.${field}`,
        direction: "in",
        type: "float",
      });
    }
  }
  pins.push(...iniGlobalPins());
  return pins;
}

function iniPins28Plus(): ComponentPinDefinition[] {
  const pins: ComponentPinDefinition[] = [];
  for (const letter of AXIS_LETTERS) {
    pins.push(
      {
        key: `${letter}_min_limit`,
        name: `${letter}.min_limit`,
        direction: "in",
        type: "float",
      },
      {
        key: `${letter}_max_limit`,
        name: `${letter}.max_limit`,
        direction: "in",
        type: "float",
      },
      {
        key: `${letter}_max_velocity`,
        name: `${letter}.max_velocity`,
        direction: "in",
        type: "float",
      },
      {
        key: `${letter}_max_acceleration`,
        name: `${letter}.max_acceleration`,
        direction: "in",
        type: "float",
      },
    );
  }
  pins.push(...iniGlobalPins());
  return pins;
}

export function iniPinsForVersion(
  version: LinuxCncVersion,
): ComponentPinDefinition[] {
  if (version === "2.7") return iniPins27();
  return iniPins28Plus();
}

function iniRuntimeForVersion(
  version: LinuxCncVersion,
): ComponentDefinition["runtime"] {
  if (version === "2.7") return { kind: "unknown" };

  const fields: NonNullable<
    NonNullable<ComponentDefinition["runtime"]>["instanceConfig"]
  >["fields"] = [
    {
      key: "num_joints",
      type: "integer",
      doc: "Number of ini.N.* joint pins exported by inihal.",
      defaultValue: DEFAULT_INI_JOINT_COUNT,
      min: 1,
      max: iniJointMaxForVersion(version),
    },
  ];

  const pinExpansionRules: NonNullable<
    NonNullable<ComponentDefinition["runtime"]>["instanceConfig"]
  >["pinExpansionRules"] = [
    {
      kind: "indexed_by_count",
      countConfigKey: "num_joints",
      indexStart: 0,
      templates: [
        {
          keyTemplate: "joint_{index}_backlash",
          nameTemplate: "{index}.backlash",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_ferror",
          nameTemplate: "{index}.ferror",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_min_ferror",
          nameTemplate: "{index}.min_ferror",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_min_limit",
          nameTemplate: "{index}.min_limit",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_max_limit",
          nameTemplate: "{index}.max_limit",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_max_velocity",
          nameTemplate: "{index}.max_velocity",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_max_acceleration",
          nameTemplate: "{index}.max_acceleration",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_home",
          nameTemplate: "{index}.home",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_home_offset",
          nameTemplate: "{index}.home_offset",
          direction: "in",
          type: "float",
        },
        {
          keyTemplate: "joint_{index}_home_sequence",
          nameTemplate: "{index}.home_sequence",
          direction: "in",
          type: "s32",
        },
      ],
    },
  ];

  return {
    kind: "unknown",
    instanceConfig: {
      fields,
      pinExpansionRules,
    },
  };
}

export function createIniSystemComponentDefinition(
  version: LinuxCncVersion,
): ComponentDefinition {
  return {
    id: INI_SYSTEM_COMPONENT_ID,
    name: "ini",
    halComponentName: "ini",
    source: "manual",
    system: {
      manager: INI_SYSTEM_MANAGER,
      family: INI_SYSTEM_FAMILY,
    },
    visibility: {
      placeable: false,
      searchable: false,
      showInCustomComponents: false,
    },
    constraints: {
      fixedInstanceName: "ini",
      fixedExportStage: "postgui",
    },
    runtime: iniRuntimeForVersion(version),
    pins: iniPinsForVersion(version),
    params: [],
    docs: {
      description:
        "System-managed HAL namespace exported by LinuxCNC milltask/inihal. Available after startup; treated as postgui-only.",
    },
  };
}

export function defaultPositionForIni(): { x: number; y: number } {
  return { x: 120, y: 940 };
}
