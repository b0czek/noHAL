import {
  type LinuxCncVersion,
  SUPPORTED_LINUXCNC_VERSIONS,
} from "../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../types";
import {
  GENERATED_CATALOG_COMPONENT_HISTORIES,
  GENERATED_CATALOG_VERSION_METADATA,
} from "./generated";
import type {
  GeneratedCatalogComponentVariant,
  GeneratedCatalogVersionlessComponentDefinition,
} from "./generatedTypes";
import type { LinuxCncVersionCatalogData } from "./index";
import { mergeManualLinuxCncComponents } from "./manual";

const VERSION_ORDER = new Map(
  SUPPORTED_LINUXCNC_VERSIONS.map(
    (version, index) => [version, index] as const,
  ),
);

function resolveVariantForVersion(
  variants: GeneratedCatalogComponentVariant[],
  version: LinuxCncVersion,
): GeneratedCatalogVersionlessComponentDefinition | null {
  const targetOrder = VERSION_ORDER.get(version);
  if (targetOrder == null) return null;

  let selected: GeneratedCatalogComponentVariant | null = null;
  for (const variant of variants) {
    const variantOrder = VERSION_ORDER.get(variant.fromVersion);
    if (variantOrder == null) continue;
    if (variantOrder > targetOrder) continue;
    if (!selected) {
      selected = variant;
      continue;
    }
    const selectedOrder = VERSION_ORDER.get(selected.fromVersion);
    if (selectedOrder == null || variantOrder >= selectedOrder) {
      selected = variant;
    }
  }
  return selected?.component ?? null;
}

function materializeComponent(
  version: LinuxCncVersion,
  refName: string,
  component: GeneratedCatalogVersionlessComponentDefinition,
): ImportedComponentDefinition {
  const idPrefix = `linuxcnc:${version}:`;
  const sourcePrefix = `git:${refName}:`;
  let sourcePath = component.sourcePath;
  if (
    sourcePath != null &&
    sourcePath !== "" &&
    !sourcePath.startsWith("git:")
  ) {
    sourcePath = `${sourcePrefix}${sourcePath}`;
  }

  return {
    ...component,
    id: component.id.startsWith(idPrefix)
      ? component.id
      : `${idPrefix}${component.id}`,
    sourcePath,
  };
}

function buildGeneratedComponentsForVersion(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition[] {
  const components: ImportedComponentDefinition[] = [];
  for (const history of GENERATED_CATALOG_COMPONENT_HISTORIES) {
    const component = resolveVariantForVersion(history.variants, version);
    if (!component) continue;
    components.push(materializeComponent(version, refName, component));
  }
  components.sort((a, b) =>
    a.halComponentName.localeCompare(b.halComponentName),
  );
  return components;
}

const catalogEntries = SUPPORTED_LINUXCNC_VERSIONS.map((version) => {
  const generated = GENERATED_CATALOG_VERSION_METADATA[version];
  const generatedComponents = buildGeneratedComponentsForVersion(
    version,
    generated.refName,
  );
  return [
    version,
    {
      version,
      refName: generated.refName,
      revision: generated.revision,
      generatedAt: generated.generatedAt,
      components: mergeManualLinuxCncComponents(
        version,
        generated.refName,
        generatedComponents,
      ),
    },
  ] as const;
});

export const LINUXCNC_VERSION_CATALOG: Record<
  LinuxCncVersion,
  LinuxCncVersionCatalogData
> = Object.fromEntries(catalogEntries) as Record<
  LinuxCncVersion,
  LinuxCncVersionCatalogData
>;
