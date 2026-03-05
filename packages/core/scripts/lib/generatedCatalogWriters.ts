export interface GeneratedCatalogVersionMetadata {
  refName: string;
  revision: string;
  generatedAt: string;
}

export interface GeneratedCatalogComponentHistoryFileData {
  halComponentName: string;
  variants: Array<{
    fromVersion: string;
    component: unknown | null;
  }>;
}

function quoteLiteral(value: string): string {
  return JSON.stringify(value);
}

export function renderMetaModule(
  metadata: Record<string, GeneratedCatalogVersionMetadata>,
): string {
  return [
    'import type { GeneratedCatalogVersionMetadataMap } from "../generatedTypes.ts";',
    "",
    `const metadata: GeneratedCatalogVersionMetadataMap = ${JSON.stringify(
      metadata,
      null,
      2,
    )};`,
    "",
    "export default metadata;",
    "",
  ].join("\n");
}

export function renderComponentHistoryModule(
  history: GeneratedCatalogComponentHistoryFileData,
): string {
  return [
    'import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";',
    "",
    `const history: GeneratedCatalogComponentHistory = ${JSON.stringify(
      history,
      null,
      2,
    )};`,
    "",
    "export default history;",
    "",
  ].join("\n");
}

export function renderGeneratedIndex(
  entries: Array<{ importName: string; relativePath: string }>,
): string {
  const imports = entries
    .map(
      (entry) =>
        `import ${entry.importName} from ${quoteLiteral(entry.relativePath)};`,
    )
    .join("\n");
  const list = entries.map((entry) => `  ${entry.importName},`).join("\n");

  return [
    'import meta from "./meta.ts";',
    "import type {",
    "  GeneratedCatalogComponentHistory,",
    '} from "../generatedTypes.ts";',
    imports,
    "",
    "export const GENERATED_CATALOG_VERSION_METADATA =",
    "  meta;",
    "",
    "export const GENERATED_CATALOG_COMPONENT_HISTORIES: GeneratedCatalogComponentHistory[] = [",
    list,
    "];",
    "",
  ].join("\n");
}
