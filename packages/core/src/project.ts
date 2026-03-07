import { fixedExportStageForComponent } from "./componentSystem";
import { NOHAL_PROJECT_FORMAT, NOHAL_PROJECT_VERSION } from "./fileFormats";
import { createId, slugify } from "./id";
import { reconcileIniManagedNodes } from "./ini";
import { reconcileIocontrolManagedNodes } from "./iocontrol";
import { normalizeLinuxCncVersion } from "./linuxcncVersion";
import { reconcileMotmodManagedNodes } from "./motmod";
import {
  createDefaultSheetThreadOutputs,
  normalizeSheetThreadOutputs,
} from "./sheetThreads";
import type {
  ComponentDefinition,
  HalThreadDefinition,
  NoHALProject,
  ProjectMachineConfig,
  ProjectMotmodConfig,
  SheetDefinition,
  SheetPort,
} from "./types";

export const REQUIRED_HAL_THREAD_NAME = "servo-thread";

export function isRequiredHalThreadName(name: string): boolean {
  return name.trim() === REQUIRED_HAL_THREAD_NAME;
}

function createDefaultTopSheet(): SheetDefinition {
  return {
    id: createId("sheet"),
    name: "Top",
    parentSheetId: null,
    nodes: [],
    ports: [],
    labels: [],
    comments: [],
    directConnections: [],
    labelAnchors: [],
    hal: {
      threadOutputs: createDefaultSheetThreadOutputs(),
    },
  };
}

export function createDefaultHalThreads(): HalThreadDefinition[] {
  return [
    {
      id: createId("thread"),
      name: REQUIRED_HAL_THREAD_NAME,
      periodNs: 1_000_000,
      floatMode: "fp",
    },
  ];
}

function normalizeHalThreads(value: unknown): HalThreadDefinition[] {
  const rawList = Array.isArray(value) ? value : [];
  const out: HalThreadDefinition[] = [];
  const usedNames = new Set<string>();

  for (const raw of rawList) {
    if (!raw || typeof raw !== "object") continue;
    const candidate = raw as Partial<HalThreadDefinition>;
    const name = (candidate.name ?? "").trim();
    if (!name || usedNames.has(name)) continue;
    const periodNs = Number.isFinite(candidate.periodNs)
      ? Math.max(1, Math.round(candidate.periodNs as number))
      : 1_000_000;
    out.push({
      id:
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id
          : createId("thread"),
      name,
      periodNs,
      floatMode:
        isRequiredHalThreadName(name) || candidate.floatMode !== "nofp"
          ? "fp"
          : "nofp",
    });
    usedNames.add(name);
  }

  if (!usedNames.has(REQUIRED_HAL_THREAD_NAME)) {
    out.unshift({
      id: createId("thread"),
      name: REQUIRED_HAL_THREAD_NAME,
      periodNs: 1_000_000,
      floatMode: "fp",
    });
  }

  if (out.length > 0) return out;
  return createDefaultHalThreads();
}

export function createEmptyMachineConfig(): ProjectMachineConfig {
  return {
    source: "imported-linuxcnc-config",
    ini: {
      parser: "nohal-ini-v1",
      lineCount: 0,
      sections: [],
      warnings: [],
    },
    halSources: [],
  };
}

export function createDefaultMotmodConfig(): ProjectMotmodConfig {
  return {
    numJoints: 3,
    numDio: 4,
    numAio: 4,
    numSpindles: 1,
    numMiscError: 0,
    trajPeriodNs: 0,
  };
}

export function reconcileProject(project: NoHALProject): NoHALProject {
  reconcileMotmodManagedNodes(project);
  reconcileIniManagedNodes(project);
  reconcileIocontrolManagedNodes(project);
  for (const sheet of Object.values(project.sheets)) {
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      const component = project.library.components[node.componentId];
      const fixedExportStage = fixedExportStageForComponent(component);
      if (!fixedExportStage) continue;
      node.exportStage = fixedExportStage;
    }
  }
  return project;
}

function normalizeMotmodConfig(value: unknown): ProjectMotmodConfig {
  const raw = value && typeof value === "object" ? value : {};
  const candidate = raw as Partial<ProjectMotmodConfig>;
  const defaults = createDefaultMotmodConfig();
  const clampInt = (n: unknown, fallback: number, min = 0, max = 9999) => {
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n as number)));
  };
  return {
    numJoints: clampInt(candidate.numJoints, defaults.numJoints, 1, 64),
    numDio: clampInt(candidate.numDio, defaults.numDio, 0, 256),
    numAio: clampInt(candidate.numAio, defaults.numAio, 0, 256),
    numSpindles: clampInt(candidate.numSpindles, defaults.numSpindles, 1, 16),
    numMiscError: clampInt(
      candidate.numMiscError,
      defaults.numMiscError,
      0,
      256,
    ),
    trajPeriodNs: clampInt(
      candidate.trajPeriodNs,
      defaults.trajPeriodNs,
      0,
      100_000_000,
    ),
  };
}

export function createEmptyProject(name: string): NoHALProject {
  const top = createDefaultTopSheet();
  const halThreads = createDefaultHalThreads();
  const requiredHalThreadId = halThreads.find((thread) =>
    isRequiredHalThreadName(thread.name),
  )?.id;
  const defaultTopOutput = top.hal?.threadOutputs?.[0];
  if (requiredHalThreadId && defaultTopOutput) {
    defaultTopOutput.halThreadId = requiredHalThreadId;
  }

  const project: NoHALProject = {
    format: NOHAL_PROJECT_FORMAT,
    version: NOHAL_PROJECT_VERSION,
    name,
    target: {
      linuxcncVersion: "2.10",
      platform: "linux",
    },
    rootSheetId: top.id,
    sheets: {
      [top.id]: top,
    },
    library: {
      components: {},
    },
    halThreads,
    machineConfig: createEmptyMachineConfig(),
    motmod: createDefaultMotmodConfig(),
    ui: {
      activeSheetId: top.id,
    },
  };

  return reconcileProject(project);
}

function normalizeProjectTarget(value: unknown): NoHALProject["target"] {
  const raw = value && typeof value === "object" ? value : {};
  const candidate = raw as Partial<NoHALProject["target"]>;
  return {
    linuxcncVersion: normalizeLinuxCncVersion(candidate.linuxcncVersion),
    platform: "linux",
  };
}

function assertProjectShape(input: unknown): asserts input is NoHALProject {
  if (!input || typeof input !== "object")
    throw new Error("Project file is not an object");
  const project = input as Partial<NoHALProject>;
  if (project.format !== NOHAL_PROJECT_FORMAT)
    throw new Error("Unsupported project format");
  if (project.version !== NOHAL_PROJECT_VERSION)
    throw new Error(`Unsupported project version: ${String(project.version)}`);
  if (!project.sheets || typeof project.sheets !== "object")
    throw new Error("Project has no sheets");
  if (!project.rootSheetId || !(project.rootSheetId in project.sheets)) {
    throw new Error("Project rootSheetId is missing or invalid");
  }
}

export function parseNoHALProject(content: string): NoHALProject {
  const parsed = JSON.parse(content) as unknown;
  assertProjectShape(parsed);
  const project = parsed as NoHALProject;
  project.target = normalizeProjectTarget(project.target);
  project.halThreads = normalizeHalThreads(project.halThreads);
  project.motmod = normalizeMotmodConfig(project.motmod);
  for (const sheet of Object.values(project.sheets)) {
    if (!Array.isArray((sheet as Partial<SheetDefinition>).comments)) {
      (sheet as SheetDefinition).comments = [];
    }
    for (const node of sheet.nodes) {
      if (node.kind !== "component") continue;
      if (node.exportStage === "main" || node.exportStage === "postgui") {
        continue;
      }
      delete node.exportStage;
    }
    if (!sheet.hal) sheet.hal = {};
    sheet.hal.threadOutputs = normalizeSheetThreadOutputs(
      sheet.hal.threadOutputs,
    );
  }
  const rootSheet = project.sheets[project.rootSheetId];
  const halThreadIdByName = new Map(
    project.halThreads.map((thread) => [thread.name, thread.id]),
  );
  for (const output of rootSheet.hal?.threadOutputs ?? []) {
    if (output.halThreadId) continue;
    const inferred = halThreadIdByName.get(output.name);
    if (inferred) output.halThreadId = inferred;
  }
  return reconcileProject(project);
}

export function stringifyNoHALProject(project: NoHALProject): string {
  reconcileProject(project);
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function createSheet(
  name: string,
  parentSheetId: string | null,
): SheetDefinition {
  return {
    id: createId("sheet"),
    name,
    parentSheetId,
    nodes: [],
    ports: [],
    labels: [],
    comments: [],
    directConnections: [],
    labelAnchors: [],
    hal: {
      threadOutputs: createDefaultSheetThreadOutputs(),
    },
  };
}

export function createSheetPortDraft(
  name: string,
  direction: SheetPort["direction"],
  type: SheetPort["type"],
  side?: SheetPort["side"],
): SheetPort {
  return {
    id: createId("port"),
    name: slugify(name).replace(/-/g, "_"),
    direction,
    type,
    side:
      side ??
      (direction === "in" ? "right" : direction === "out" ? "left" : "top"),
    position: { x: 0, y: 0 },
    rotation: 0,
  };
}

export function upsertComponentDefinition(
  project: NoHALProject,
  component: ComponentDefinition,
): NoHALProject {
  return {
    ...project,
    library: {
      ...project.library,
      components: {
        ...project.library.components,
        [component.id]: component,
      },
    },
  };
}
