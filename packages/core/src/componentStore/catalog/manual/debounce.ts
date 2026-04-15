import type { LinuxCncVersion } from "../../../linuxcncVersion";
import type { ImportedComponentDefinition } from "../../../types";

function makeDebounceBase(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  return {
    id: `linuxcnc:${version}:manual:debounce`,
    name: "debounce",
    halComponentName: "debounce",
    source: "manual",
    sourcePath: `git:${refName}:src/hal/components/debounce.c`,
    docs: {
      component: "input debouncer/filter for HAL bit signals",
      description:
        "Realtime grouped debounce filter. loadrt cfg=... defines how many channels each canonical debounce.N instance exports.",
      seeAlso: "debounce(9)",
      notes:
        "Exports canonical instances debounce.0..debounce.7, one function per group, delay param per group, and channel pins as debounce.G.C.in/out.",
    },
    pins: [],
    params: [
      {
        key: "delay",
        name: "delay",
        direction: "rw",
        type: "s32",
        defaultValue: "5",
        doc: "Delay in samples for this debounce group.",
      },
    ],
    functions: [
      {
        key: "default",
        declaredName: "_",
        halSuffix: "",
        floatMode: "nofp",
        doc: "Run one debounce update for this group.",
      },
    ],
    runtime: {
      kind: "rt",
      loadrt: {
        strategy: "cfg",
      },
      instanceNaming: {
        strategy: "canonical_indexed",
        lockToCanonical: true,
        maxInstances: 8,
      },
      instanceConfig: {
        fields: [
          {
            key: "channels",
            type: "integer",
            doc: "Number of debounce channels in this group (cfg entry).",
            defaultValue: 1,
            min: 1,
            max: 50,
          },
        ],
        pinExpansionRules: [
          {
            kind: "indexed_by_count",
            countConfigKey: "channels",
            indexStart: 0,
            templates: [
              {
                keyTemplate: "ch_{index}_in",
                nameTemplate: "{index}.in",
                direction: "in",
                type: "bit",
              },
              {
                keyTemplate: "ch_{index}_out",
                nameTemplate: "{index}.out",
                direction: "out",
                type: "bit",
              },
            ],
          },
        ],
      },
      options: {
        max_groups: 8,
        max_group_size: 50,
      },
    },
    constraints: {
      exportNamespace: "global",
    },
    parseMeta: {
      parser: "nohal-comp-v1",
      warnings: [
        "Manual component definition from non-.comp LinuxCNC source file.",
      ],
    },
  };
}

export function debounce(
  version: LinuxCncVersion,
  refName: string,
): ImportedComponentDefinition {
  if (version === "2.7") return makeDebounceBase("2.7", refName);
  if (version === "2.8") return makeDebounceBase("2.8", refName);
  if (version === "2.9") return makeDebounceBase("2.9", refName);
  return makeDebounceBase("2.10", refName);
}
