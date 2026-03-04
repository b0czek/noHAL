import { mergeManualLinuxCncComponents } from "./manual";
import store27 from "./generated/2.7/store.json";
import store28 from "./generated/2.8/store.json";
import store29 from "./generated/2.9/store.json";
import store210 from "./generated/2.10/store.json";
import type { LinuxCncVersion } from "../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../types";

export interface LinuxCncVersionCatalogData {
  version: LinuxCncVersion;
  refName: string;
  revision: string;
  generatedAt: string;
  components: ImportedComponentDefinition[];
}

export const LINUXCNC_VERSION_CATALOG: Record<
  LinuxCncVersion,
  LinuxCncVersionCatalogData
> = {
  "2.7": {
    ...(store27 as unknown as LinuxCncVersionCatalogData),
    components: mergeManualLinuxCncComponents(
      "2.7",
      (store27 as unknown as LinuxCncVersionCatalogData).refName,
      (store27 as unknown as LinuxCncVersionCatalogData).components,
    ),
  },
  "2.8": {
    ...(store28 as unknown as LinuxCncVersionCatalogData),
    components: mergeManualLinuxCncComponents(
      "2.8",
      (store28 as unknown as LinuxCncVersionCatalogData).refName,
      (store28 as unknown as LinuxCncVersionCatalogData).components,
    ),
  },
  "2.9": {
    ...(store29 as unknown as LinuxCncVersionCatalogData),
    components: mergeManualLinuxCncComponents(
      "2.9",
      (store29 as unknown as LinuxCncVersionCatalogData).refName,
      (store29 as unknown as LinuxCncVersionCatalogData).components,
    ),
  },
  "2.10": {
    ...(store210 as unknown as LinuxCncVersionCatalogData),
    components: mergeManualLinuxCncComponents(
      "2.10",
      (store210 as unknown as LinuxCncVersionCatalogData).refName,
      (store210 as unknown as LinuxCncVersionCatalogData).components,
    ),
  },
};
