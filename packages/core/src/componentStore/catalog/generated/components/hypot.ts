import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "hypot",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:hypot:hypot",
        name: "hypot",
        halComponentName: "hypot",
        source: "comp",
        sourcePath: "src/hal/components/hypot.comp",
        docs: {
          component: "Three-input hypotenuse (Euclidean distance) calculator",
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
            key: "in2",
            name: "in2",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = sqrt(in0^2 + in1^2 + in2^2)",
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
            'component hypot "Three-input hypotenuse (Euclidean distance) calculator";\npin in float in0;\npin in float in1;\npin in float in2;\npin out float out "out = sqrt(in0^2 + in1^2 + in2^2)";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:hypot:hypot",
        name: "hypot",
        halComponentName: "hypot",
        source: "comp",
        sourcePath: "src/hal/components/hypot.comp",
        docs: {
          component: "Three-input hypotenuse (Euclidean distance) calculator",
          license: "GPL",
          author: "Jeff Epler",
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
            key: "in2",
            name: "in2",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = sqrt(in0^2 + in1^2 + in2^2)",
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
            'component hypot "Three-input hypotenuse (Euclidean distance) calculator";\npin in float in0;\npin in float in1;\npin in float in2;\npin out float out "out = sqrt(in0^2 + in1^2 + in2^2)";\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:hypot:hypot",
        name: "hypot",
        halComponentName: "hypot",
        source: "comp",
        sourcePath: "src/hal/components/hypot.comp",
        docs: {
          component: "Three-input hypotenuse (Euclidean distance) calculator",
          license: "GPL",
          author: "Jeff Epler",
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
            key: "in2",
            name: "in2",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "out = sqrt(*in0*^2^ + *in1*^2^ + *in2*^2^)",
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
            'component hypot "Three-input hypotenuse (Euclidean distance) calculator";\npin in float in0;\npin in float in1;\npin in float in2;\npin out float out "out = sqrt(*in0*^2^ + *in1*^2^ + *in2*^2^)";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
