import { filter, pipe, unique } from "remeda";
import { fixedExportStageForComponent } from "../componentSystem";
import { reconcileHaluiManagedNodes } from "../halui";
import { createId, slugify } from "../id";
import { reconcileIniManagedNodes } from "../ini";
import { reconcileIocontrolManagedNodes } from "../iocontrol";
import { normalizeLinuxCncVersion } from "../linuxcncVersion";
import {
  createEmptyLinuxCncIniDocument,
  normalizeProjectMachineConfig,
} from "../machineConfig/shared";
import {
  createDefaultMesaConfig,
  normalizeProjectMesaConfig,
  reconcileMesaManagedNodes,
} from "../mesa";
import { reconcileMotmodManagedNodes } from "../motmod";
import {
  DEFAULT_MOTMOD_CONFIG,
  normalizeProjectMotmodConfigValue,
} from "../motmod/config";
import {
  createDefaultSheetThreadOutputs,
  moveRootSystemComponentsToSystemSheet,
  normalizeSheetThreadOutputs,
} from "../sheet";
import type {
  ComponentDefinition,
  ComponentNode,
  HalThreadDefinition,
  NoHALProject,
  ProjectMachineConfig,
  ProjectMotmodConfig,
  ProjectUiConfig,
  ProjectWireStyle,
  SheetDefinition,
  SheetPort,
} from "../types";
import { NOHAL_PROJECT_FORMAT, NOHAL_PROJECT_VERSION } from "./formats";
import { migrateProjectDocumentToCurrentVersion } from "./migrations";

export const REQUIRED_HAL_THREAD_NAME = "servo-thread";
const DEFAULT_HAL_THREAD_PERIOD_NS = 1_000_000;

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
      periodNs: DEFAULT_HAL_THREAD_PERIOD_NS,
      floatMode: "fp",
    },
  ];
}

function defaultSheetPortSide(
  direction: SheetPort["direction"],
): SheetPort["side"] {
  if (direction === "in") return "right";
  if (direction === "out") return "left";
  return "top";
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
      : DEFAULT_HAL_THREAD_PERIOD_NS;
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
      periodNs: DEFAULT_HAL_THREAD_PERIOD_NS,
      floatMode: "fp",
    });
  }

  if (out.length > 0) return out;
  return createDefaultHalThreads();
}

export function createEmptyMachineConfig(): ProjectMachineConfig {
  return {
    source: "imported-linuxcnc-config",
    userIni: createEmptyLinuxCncIniDocument(),
    halSources: [],
  };
}

export function createDefaultMotmodConfig(): ProjectMotmodConfig {
  return { ...DEFAULT_MOTMOD_CONFIG };
}

export function createDefaultProjectUi(activeSheetId: string): ProjectUiConfig {
  return {
    activeSheetId,
    wireLayerPosition: "under-components",
    wireStyle: "curved",
  };
}

function normalizeProjectShutdown(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function reconcileProject(project: NoHALProject): NoHALProject {
  reconcileMotmodManagedNodes(project);
  reconcileMesaManagedNodes(project);
  reconcileIniManagedNodes(project);
  reconcileIocontrolManagedNodes(project);
  reconcileHaluiManagedNodes(project);
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
  return normalizeProjectMotmodConfigValue(raw as Partial<ProjectMotmodConfig>);
}

function normalizeProjectUi(
  value: unknown,
  rootSheetId: string,
  sheets: Readonly<Record<string, SheetDefinition>>,
): ProjectUiConfig {
  const raw = value && typeof value === "object" ? value : {};
  const candidate = raw as Partial<ProjectUiConfig>;
  const activeSheetId =
    typeof candidate.activeSheetId === "string" &&
    candidate.activeSheetId in sheets
      ? candidate.activeSheetId
      : rootSheetId;
  const wireStyle: ProjectWireStyle =
    candidate.wireStyle === "straight" || candidate.wireStyle === "curved"
      ? candidate.wireStyle
      : "curved";
  return {
    activeSheetId,
    wireLayerPosition:
      candidate.wireLayerPosition === "above-components"
        ? "above-components"
        : "under-components",
    wireStyle,
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
    shutdown: "",
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
    mesa: createDefaultMesaConfig(),
    ui: createDefaultProjectUi(top.id),
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
  const project = input as Record<string, unknown>;
  if (project.format !== NOHAL_PROJECT_FORMAT)
    throw new Error("Unsupported project format");
  if (project.version !== NOHAL_PROJECT_VERSION)
    throw new Error(`Unsupported project version: ${String(project.version)}`);
  if (!project.sheets || typeof project.sheets !== "object")
    throw new Error("Project has no sheets");
  if (
    typeof project.rootSheetId !== "string" ||
    !(project.rootSheetId in project.sheets)
  ) {
    throw new Error("Project rootSheetId is missing or invalid");
  }
}

function normalizeParsedComponentNode(node: ComponentNode): void {
  if (Array.isArray(node.hiddenPinKeys)) {
    const hiddenPinKeys = pipe(
      node.hiddenPinKeys,
      filter(
        (key): key is string =>
          typeof key === "string" && key.trim().length > 0,
      ),
      unique(),
    );
    if (hiddenPinKeys.length > 0) {
      node.hiddenPinKeys = hiddenPinKeys;
    } else {
      delete node.hiddenPinKeys;
    }
  } else {
    delete node.hiddenPinKeys;
  }

  if (node.exportStage === "main" || node.exportStage === "postgui") return;
  delete node.exportStage;
}

function normalizeParsedSheet(sheet: SheetDefinition): void {
  if (!Array.isArray((sheet as Partial<SheetDefinition>).comments)) {
    sheet.comments = [];
  }
  for (const node of sheet.nodes) {
    if (node.kind !== "component") continue;
    normalizeParsedComponentNode(node);
  }
  if (!sheet.hal) sheet.hal = {};
  sheet.hal.threadOutputs = normalizeSheetThreadOutputs(
    sheet.hal.threadOutputs,
  );
}

function inferRootSheetThreadOutputIds(project: NoHALProject): void {
  const rootSheet = project.sheets[project.rootSheetId];
  const halThreads = project.halThreads ?? [];
  const halThreadIdByName = new Map(
    halThreads.map((thread) => [thread.name, thread.id]),
  );
  for (const output of rootSheet.hal?.threadOutputs ?? []) {
    if (output.halThreadId) continue;
    const inferred = halThreadIdByName.get(output.name);
    if (inferred) output.halThreadId = inferred;
  }
}

export function parseNoHALProject(content: string): NoHALProject {
  const parsed = JSON.parse(content) as unknown;
  const migrated = migrateProjectDocumentToCurrentVersion(parsed);
  assertProjectShape(migrated);
  const project = migrated;
  project.target = normalizeProjectTarget(project.target);
  project.shutdown = normalizeProjectShutdown(project.shutdown);
  project.halThreads = normalizeHalThreads(project.halThreads);
  project.machineConfig = normalizeProjectMachineConfig(project.machineConfig);
  project.motmod = normalizeMotmodConfig(project.motmod);
  project.mesa = normalizeProjectMesaConfig(project.mesa);
  project.ui = normalizeProjectUi(
    project.ui,
    project.rootSheetId,
    project.sheets,
  );
  for (const sheet of Object.values(project.sheets))
    normalizeParsedSheet(sheet);
  inferRootSheetThreadOutputIds(project);
  moveRootSystemComponentsToSystemSheet(project);
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
    side: side ?? defaultSheetPortSide(direction),
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
