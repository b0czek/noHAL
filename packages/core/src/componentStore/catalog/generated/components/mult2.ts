import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "mult2",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:mult2:mult2",
        name: "mult2",
        halComponentName: "mult2",
        source: "comp",
        sourcePath: "src/hal/components/mult2.comp",
        docs: {
          component: "Product of two inputs",
          license: "GPL",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in0 * in1",
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
            'component mult2 "Product of two inputs";\npin in float in0;\npin in float in1;\npin out float out "out = in0 * in1";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:mult2:mult2",
        name: "mult2",
        halComponentName: "mult2",
        source: "comp",
        sourcePath: "src/hal/components/mult2.comp",
        docs: {
          component: "Product of two inputs",
          license: "GPL",
          author: "John Kasunich",
          seeAlso: " invert(9), div2(9) ",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in0 * in1",
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
            'component mult2 "Product of two inputs";\npin in float in0;\npin in float in1;\npin out float out "out = in0 * in1";\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\nsee_also " invert(9), div2(9) ";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:mult2:mult2",
        name: "mult2",
        halComponentName: "mult2",
        source: "comp",
        sourcePath: "src/hal/components/mult2.comp",
        docs: {
          component: "Product of two inputs",
          license: "GPL",
          author: "John Kasunich",
          seeAlso: " invert(9), div2(9) ",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "float",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in0 * in1",
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
            'component mult2 "Product of two inputs";\npin in float in0;\npin in float in1;\npin out float out "out = in0 * in1";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\nsee_also " invert(9), div2(9) ";\n\n',
        },
      },
    },
  ],
};

export default history;
