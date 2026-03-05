import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "threadtest",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:threadtest:threadtest",
        name: "threadtest",
        halComponentName: "threadtest",
        source: "comp",
        sourcePath: "src/hal/components/threadtest.comp",
        docs: {
          component: "LinuxCNC HAL component for testing thread behavior",
          license: "GPL",
        },
        pins: [
          {
            key: "count",
            name: "count",
            type: "u32",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "increment",
            declaredName: "increment",
            halSuffix: "increment",
            floatMode: "nofp",
          },
          {
            key: "reset",
            declaredName: "reset",
            halSuffix: "reset",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component threadtest "LinuxCNC HAL component for testing thread behavior";\npin out unsigned count;\nfunction increment nofp;\nfunction reset nofp;\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:threadtest:threadtest",
        name: "threadtest",
        halComponentName: "threadtest",
        source: "comp",
        sourcePath: "src/hal/components/threadtest.comp",
        docs: {
          component: "LinuxCNC HAL component for testing thread behavior",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "count",
            name: "count",
            type: "u32",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "increment",
            declaredName: "increment",
            halSuffix: "increment",
            floatMode: "nofp",
          },
          {
            key: "reset",
            declaredName: "reset",
            halSuffix: "reset",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component threadtest "LinuxCNC HAL component for testing thread behavior";\npin out unsigned count;\nfunction increment nofp;\nfunction reset nofp;\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:threadtest:threadtest",
        name: "threadtest",
        halComponentName: "threadtest",
        source: "comp",
        sourcePath: "src/hal/components/threadtest.comp",
        docs: {
          component: "LinuxCNC HAL component for testing thread behavior",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "count",
            name: "count",
            type: "u32",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "increment",
            declaredName: "increment",
            halSuffix: "increment",
            floatMode: "nofp",
          },
          {
            key: "reset",
            declaredName: "reset",
            halSuffix: "reset",
            floatMode: "nofp",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component threadtest "LinuxCNC HAL component for testing thread behavior";\npin out unsigned count;\noption period no;\nfunction increment nofp;\nfunction reset nofp;\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
