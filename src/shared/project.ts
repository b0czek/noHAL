import { createId, slugify } from "./id";
import { createBuiltinLibrary } from "./library";
import type {
  ComponentDefinition,
  NoHALProject,
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
    directConnections: [],
    labelAnchors: [],
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
  return parsed;
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
