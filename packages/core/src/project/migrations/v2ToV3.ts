import type { ProjectMigration } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deleteRole(sheet: Record<string, unknown>): void {
  delete sheet.role;
}

function findLegacySystemSheetId(
  sheets: Record<string, unknown>,
  rootSheetId: string | null,
): string | null {
  const rootSheet = rootSheetId ? sheets[rootSheetId] : undefined;
  if (!isRecord(rootSheet) || !Array.isArray(rootSheet.nodes)) return null;

  let fallbackSystemSheetId: string | null = null;
  for (const node of rootSheet.nodes) {
    if (!isRecord(node) || node.kind !== "sheet") continue;
    if (typeof node.sheetId !== "string") continue;
    const childSheet = sheets[node.sheetId];
    if (!isRecord(childSheet)) continue;
    if (childSheet.role === "system") return node.sheetId;
    if (!fallbackSystemSheetId && childSheet.name === "System") {
      fallbackSystemSheetId = node.sheetId;
    }
  }

  return fallbackSystemSheetId;
}

export const projectMigrationV2ToV3: ProjectMigration = {
  from: 2,
  to: 3,
  migrate(input: unknown): unknown {
    const project = structuredClone(input) as Record<string, unknown>;
    project.version = projectMigrationV2ToV3.to;

    if (!isRecord(project.sheets)) return project;
    const sheets = project.sheets;
    const rootSheetId =
      typeof project.rootSheetId === "string" ? project.rootSheetId : null;
    const systemSheetId = findLegacySystemSheetId(sheets, rootSheetId);

    for (const [sheetId, rawSheet] of Object.entries(sheets)) {
      if (!isRecord(rawSheet)) continue;
      if (sheetId === systemSheetId) {
        rawSheet.role = "system";
        continue;
      }
      deleteRole(rawSheet);
    }

    return project;
  },
};
