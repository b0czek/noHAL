import { createId, slugify } from "./id";
import { createBuiltinLibrary } from "./library";
import type {
  ComponentDefinition,
  HalThreadDefinition,
  NoHALProject,
  ProjectMachineConfig,
  SheetDefinition,
  SheetPort,
} from "./types";

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
  };
}

export function createDefaultHalThreads(): HalThreadDefinition[] {
  return [
    {
      id: createId("thread"),
      name: "servo-thread",
      periodNs: 1_000_000,
    },
  ];
}

function normalizeHalThreads(
  value: unknown,
): HalThreadDefinition[] {
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
    });
    usedNames.add(name);
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

export function createEmptyProject(name: string): NoHALProject {
  const top = createDefaultTopSheet();
  return {
    format: "nohal-project",
    version: 1,
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
      components: createBuiltinLibrary(),
    },
    halThreads: createDefaultHalThreads(),
    machineConfig: createEmptyMachineConfig(),
    ui: {
      activeSheetId: top.id,
    },
  };
}

function assertProjectShape(input: unknown): asserts input is NoHALProject {
  if (!input || typeof input !== "object")
    throw new Error("Project file is not an object");
  const project = input as Partial<NoHALProject>;
  if (project.format !== "nohal-project")
    throw new Error("Unsupported project format");
  if (project.version !== 1)
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
  for (const sheet of Object.values(project.sheets)) {
    if (!Array.isArray((sheet as Partial<SheetDefinition>).comments)) {
      (sheet as SheetDefinition).comments = [];
    }
  }
  project.halThreads = normalizeHalThreads(project.halThreads);
  return project;
}

export function stringifyNoHALProject(project: NoHALProject): string {
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
