import { encoder } from "./encoder";
import { encoderRatio } from "./encoder_ratio";
import { pid } from "./pid";
import { siggen } from "./siggen";
import { simEncoder } from "./sim_encoder";
import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../../types";

function manualLinuxCncComponents(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition[] {
  return [
    encoder(version, refName),
    encoderRatio(version, refName),
    pid(version, refName),
    simEncoder(version, refName),
    siggen(version, refName),
  ];
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
