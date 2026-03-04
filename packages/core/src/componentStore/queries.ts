import type { LinuxCncVersion } from "../linuxcncVersion";
import type { ComponentStore, ComponentStoreEntry } from "../types";

export function isStoreEntryCompatibleWithLinuxCncVersion(
  componentStore: ComponentStore,
  entry: ComponentStoreEntry,
  linuxcncVersion: LinuxCncVersion,
): boolean {
  if (entry.sourceRef.kind !== "linuxcnc-builtin") return true;
  const source = componentStore.sources[entry.sourceRef.sourceId];
  if (!source || source.kind !== "linuxcnc-builtin") return true;
  return source.linuxcncVersion === linuxcncVersion;
}

export function listStoreEntriesForLinuxCncVersion(
  componentStore: ComponentStore,
  linuxcncVersion: LinuxCncVersion,
): ComponentStoreEntry[] {
  return Object.values(componentStore.components).filter((entry) =>
    isStoreEntryCompatibleWithLinuxCncVersion(
      componentStore,
      entry,
      linuxcncVersion,
    ),
  );
}

export function listStoreSourcesForLinuxCncVersion(
  componentStore: ComponentStore,
  linuxcncVersion: LinuxCncVersion,
): Array<ComponentStore["sources"][string]> {
  return Object.values(componentStore.sources).filter((source) => {
    if (source.kind !== "linuxcnc-builtin") return true;
    return source.linuxcncVersion === linuxcncVersion;
  });
}
