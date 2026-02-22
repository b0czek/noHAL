import { createBuiltinLibrary } from "./library";
import { createId, slugify } from "./id";
import type {
  ComponentDefinition,
  NochalProject,
  SheetDefinition,
  SheetPort
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
    labelAnchors: []
  };
}

export function createEmptyProject(name: string): NochalProject {
  const top = createDefaultTopSheet();
  return {
    format: "nochal-project",
    version: 1,
    name,
    target: {
      linuxcncVersion: "2.10",
      platform: "linux"
    },
    rootSheetId: top.id,
    sheets: {
      [top.id]: top
    },
    library: {
      components: createBuiltinLibrary()
    },
    ui: {
      activeSheetId: top.id
    }
  };
}

function assertProjectShape(input: unknown): asserts input is NochalProject {
  if (!input || typeof input !== "object") throw new Error("Project file is not an object");
  const project = input as Partial<NochalProject>;
  if (project.format !== "nochal-project") throw new Error("Unsupported project format");
  if (project.version !== 1) throw new Error(`Unsupported project version: ${String(project.version)}`);
  if (!project.sheets || typeof project.sheets !== "object") throw new Error("Project has no sheets");
  if (!project.rootSheetId || !(project.rootSheetId in project.sheets)) {
    throw new Error("Project rootSheetId is missing or invalid");
  }
}

export function parseNochalProject(content: string): NochalProject {
  const parsed = JSON.parse(content) as unknown;
  assertProjectShape(parsed);
  return parsed;
}

export function stringifyNochalProject(project: NochalProject): string {
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function createSheet(name: string, parentSheetId: string | null): SheetDefinition {
  return {
    id: createId("sheet"),
    name,
    parentSheetId,
    nodes: [],
    ports: [],
    labels: [],
    directConnections: [],
    labelAnchors: []
  };
}

export function createSheetPortDraft(
  name: string,
  direction: SheetPort["direction"],
  type: SheetPort["type"],
  side?: SheetPort["side"]
): SheetPort {
  return {
    id: createId("port"),
    name: slugify(name).replace(/-/g, "_"),
    direction,
    type,
    side:
      side ??
      (direction === "in" ? "left" : direction === "out" ? "right" : "bottom"),
    position: { x: 0, y: 0 }
  };
}

export function upsertComponentDefinition(
  project: NochalProject,
  component: ComponentDefinition
): NochalProject {
  return {
    ...project,
    library: {
      ...project.library,
      components: {
        ...project.library.components,
        [component.id]: component
      }
    }
  };
}
