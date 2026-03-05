import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "limit1",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:limit1:limit1",
        name: "limit1",
        halComponentName: "limit1",
        source: "comp",
        sourcePath: "src/hal/components/limit1.comp",
        docs: {
          component: "Limit the output signal to fall between min and max",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
            direction: "rw",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            defaultValue: "1e20",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
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
            'component limit1 "Limit the output signal to fall between min and max";\npin in float in;\npin out float out;\nparam rw float min_=-1e20;\nparam rw float max_=1e20;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:limit1:limit1",
        name: "limit1",
        halComponentName: "limit1",
        source: "comp",
        sourcePath: "src/hal/components/limit1.comp",
        docs: {
          component: "Limit the output signal to fall between min and max",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            defaultValue: "1e20",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
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
            'component limit1 "Limit the output signal to fall between min and max";\npin in float in;\npin out float out;\npin in float min_=-1e20;\npin in float max_=1e20;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:limit1:limit1",
        name: "limit1",
        halComponentName: "limit1",
        source: "comp",
        sourcePath: "src/hal/components/limit1.comp",
        docs: {
          component: "Limit the output signal to fall between min and max",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            defaultValue: "1e20",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
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
            'component limit1 "Limit the output signal to fall between min and max";\npin in float in;\npin out float out;\npin in float min_=-1e20;\npin in float max_=1e20;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:limit1:limit1",
        name: "limit1",
        halComponentName: "limit1",
        source: "comp",
        sourcePath: "src/hal/components/limit1.comp",
        docs: {
          component: "Limit the output signal to fall between min and max",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            defaultValue: "1e20",
            direction: "in",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
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
            'component limit1 "Limit the output signal to fall between min and max";\npin in float in;\npin out float out;\npin in float min_=-1e20;\npin in float max_=1e20;\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
