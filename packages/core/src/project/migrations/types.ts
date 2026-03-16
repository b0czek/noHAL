export interface ProjectMigration {
  from: number;
  to: number;
  migrate(input: unknown): unknown;
}
