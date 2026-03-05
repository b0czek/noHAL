import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "constant",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:constant:constant",
        name: "constant",
        halComponentName: "constant",
        source: "comp",
        sourcePath: "src/hal/components/constant.comp",
        docs: {
          component: "Use a parameter to set the value of a pin",
          license: "GPL",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "value",
            name: "value",
            type: "float",
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
            'component constant "Use a parameter to set the value of a pin";\npin out float out;\nparam rw float value;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:constant:constant",
        name: "constant",
        halComponentName: "constant",
        source: "comp",
        sourcePath: "src/hal/components/constant.comp",
        docs: {
          component: "Use a parameter to set the value of a pin",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
        ],
        params: [
          {
            key: "value",
            name: "value",
            type: "float",
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
            'component constant "Use a parameter to set the value of a pin";\npin out float out;\nparam rw float value;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: null,
    },
  ],
};

export default history;
