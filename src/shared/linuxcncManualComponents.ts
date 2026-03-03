import { encoder } from "./linuxcncManualComponents/encoder";
import { pid } from "./linuxcncManualComponents/pid";
import type { LinuxCncVersion } from "./linuxcncVersion";
import type { ImportedComponentDefinition } from "./types";

function manualLinuxCncComponents(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition[] {
  return [encoder(version, refName), pid(version, refName)];
}

export function mergeManualLinuxCncComponents(
  version: LinuxCncVersion,
  refName: string,
  components: ImportedComponentDefinition[],
): ImportedComponentDefinition[] {
  const byName = new Map(
    components.map((component) => [component.halComponentName, component]),
  );
  for (const manual of manualLinuxCncComponents(version, refName)) {
    byName.set(manual.halComponentName, manual);
  }
  return [...byName.values()].sort((a, b) =>
    a.halComponentName.localeCompare(b.halComponentName),
  );
}
