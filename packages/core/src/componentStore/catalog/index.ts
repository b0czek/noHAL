import type { LinuxCncVersion } from "../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../types";

export interface LinuxCncVersionCatalogData {
  version: LinuxCncVersion;
  refName: string;
  revision: string;
  generatedAt: string;
  components: ImportedComponentDefinition[];
}

interface LinuxCncCatalogStoresModule {
  LINUXCNC_VERSION_CATALOG: Record<LinuxCncVersion, LinuxCncVersionCatalogData>;
}

let catalogModulePromise: Promise<LinuxCncCatalogStoresModule> | null = null;

async function loadCatalogStoresModule(): Promise<LinuxCncCatalogStoresModule> {
  if (!catalogModulePromise) {
    catalogModulePromise = import("./stores");
  }
  return catalogModulePromise;
}

export async function loadLinuxCncVersionCatalog(
  version: LinuxCncVersion,
): Promise<LinuxCncVersionCatalogData> {
  const module = await loadCatalogStoresModule();
  return module.LINUXCNC_VERSION_CATALOG[version];
}

export async function loadAllLinuxCncVersionCatalogs(): Promise<
  Record<LinuxCncVersion, LinuxCncVersionCatalogData>
> {
  const module = await loadCatalogStoresModule();
  return module.LINUXCNC_VERSION_CATALOG;
}
