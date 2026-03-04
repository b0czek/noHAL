import { mergeManualLinuxCncComponents } from "./linuxcncManualComponents";
import store27 from "./linuxcncStores/2.7/store.json";
import store28 from "./linuxcncStores/2.8/store.json";
import store29 from "./linuxcncStores/2.9/store.json";
import store210 from "./linuxcncStores/2.10/store.json";
import type { LinuxCncVersion } from "./linuxcncVersion";
import type { ImportedComponentDefinition } from "./types";

interface LinuxCncVersionStoreData {
  version: LinuxCncVersion;
  refName: string;
  revision: string;
  generatedAt: string;
  components: ImportedComponentDefinition[];
}

export const LINUXCNC_VERSION_STORES: Record<
  LinuxCncVersion,
  LinuxCncVersionStoreData
> = {
  "2.7": {
    ...(store27 as unknown as LinuxCncVersionStoreData),
    components: mergeManualLinuxCncComponents(
      "2.7",
      (store27 as unknown as LinuxCncVersionStoreData).refName,
      (store27 as unknown as LinuxCncVersionStoreData).components,
    ),
  },
  "2.8": {
    ...(store28 as unknown as LinuxCncVersionStoreData),
    components: mergeManualLinuxCncComponents(
      "2.8",
      (store28 as unknown as LinuxCncVersionStoreData).refName,
      (store28 as unknown as LinuxCncVersionStoreData).components,
    ),
  },
  "2.9": {
    ...(store29 as unknown as LinuxCncVersionStoreData),
    components: mergeManualLinuxCncComponents(
      "2.9",
      (store29 as unknown as LinuxCncVersionStoreData).refName,
      (store29 as unknown as LinuxCncVersionStoreData).components,
    ),
  },
  "2.10": {
    ...(store210 as unknown as LinuxCncVersionStoreData),
    components: mergeManualLinuxCncComponents(
      "2.10",
      (store210 as unknown as LinuxCncVersionStoreData).refName,
      (store210 as unknown as LinuxCncVersionStoreData).components,
    ),
  },
};
