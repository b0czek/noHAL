import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "minmax",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:minmax:minmax",
        name: "minmax",
        halComponentName: "minmax",
        source: "comp",
        sourcePath: "src/hal/components/minmax.comp",
        docs: {
          component:
            "Track the minimum and maximum values of the input to the outputs",
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
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "When reset is asserted, 'in' is copied to the outputs",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            direction: "out",
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
            'component minmax "Track the minimum and maximum values of the input to the outputs";\npin in float in;\npin in bit reset "When reset is asserted, \'in\' is copied to the outputs";\npin out float max_;\npin out float min_;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:minmax:minmax",
        name: "minmax",
        halComponentName: "minmax",
        source: "comp",
        sourcePath: "src/hal/components/minmax.comp",
        docs: {
          component:
            "Track the minimum and maximum values of the input to the outputs",
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
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "When reset is asserted, 'in' is copied to the outputs",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            direction: "out",
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
            'component minmax "Track the minimum and maximum values of the input to the outputs";\npin in float in;\npin in bit reset "When reset is asserted, \'in\' is copied to the outputs";\npin out float max_;\npin out float min_;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:minmax:minmax",
        name: "minmax",
        halComponentName: "minmax",
        source: "comp",
        sourcePath: "src/hal/components/minmax.comp",
        docs: {
          component:
            "Track the minimum and maximum values of the input to the outputs",
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
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "When reset is asserted, 'in' is copied to the outputs",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            direction: "out",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            direction: "out",
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
            'component minmax "Track the minimum and maximum values of the input to the outputs";\npin in float in;\npin in bit reset "When reset is asserted, \'in\' is copied to the outputs";\npin out float max_;\npin out float min_;\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
