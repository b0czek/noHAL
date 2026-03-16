import { NOHAL_PROJECT_FORMAT, NOHAL_PROJECT_VERSION } from "../formats";
import type { ProjectMigration } from "./types";
import { projectMigrationV1ToV2 } from "./v1ToV2";

const PROJECT_MIGRATIONS: readonly ProjectMigration[] = [
  projectMigrationV1ToV2,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readProjectImportVersion(value: unknown): number {
  if (!isRecord(value)) throw new Error("Project file is not an object");
  if (value.format !== NOHAL_PROJECT_FORMAT) {
    throw new Error("Unsupported project format");
  }
  if (typeof value.version !== "number" || !Number.isInteger(value.version)) {
    throw new Error(`Unsupported project version: ${String(value.version)}`);
  }
  return value.version;
}

export function migrateProjectDocumentToCurrentVersion(
  input: unknown,
): unknown {
  let current = structuredClone(input);
  let version = readProjectImportVersion(current);

  while (version !== NOHAL_PROJECT_VERSION) {
    const migration = PROJECT_MIGRATIONS.find(
      (candidate) => candidate.from === version,
    );
    if (!migration) {
      throw new Error(`Unsupported project version: ${String(version)}`);
    }
    current = migration.migrate(current);
    version = readProjectImportVersion(current);
    if (version !== migration.to) {
      throw new Error(
        `Project migration ${migration.from}->${migration.to} produced version ${String(version)}`,
      );
    }
  }

  return current;
}

export type { ProjectMigration } from "./types";
