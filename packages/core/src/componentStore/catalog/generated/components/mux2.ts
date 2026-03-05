import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "mux2",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:mux2:mux2",
        name: "mux2",
        halComponentName: "mux2",
        source: "comp",
        sourcePath: "src/hal/components/mux2.comp",
        docs: {
          component: "Select from one of two input values",
          license: "GPL",
        },
        pins: [
          {
            key: "sel",
            name: "sel",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Follows the value of in0 if sel is FALSE, or in1 if sel is TRUE",
            direction: "out",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "in0",
            name: "in0",
            type: "float",
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
            'component mux2 "Select from one of two input values";\npin in bit sel;\npin out float out "Follows the value of in0 if sel is FALSE, or in1 if sel is TRUE";\npin in float in1;\npin in float in0;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:mux2:mux2",
        name: "mux2",
        halComponentName: "mux2",
        source: "comp",
        sourcePath: "src/hal/components/mux2.comp",
        docs: {
          component: "Select from one of two input values",
          license: "GPL",
          author: "Jeff Epler",
          seeAlso: "mux4(9), mux8(9), mux16(9), mux_generic(9).",
        },
        pins: [
          {
            key: "sel",
            name: "sel",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Follows the value of in0 if sel is FALSE, or in1 if sel is TRUE",
            direction: "out",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "in0",
            name: "in0",
            type: "float",
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
            'component mux2 "Select from one of two input values";\npin in bit sel;\npin out float out "Follows the value of in0 if sel is FALSE, or in1 if sel is TRUE";\npin in float in1;\npin in float in0;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\nsee_also "mux4(9), mux8(9), mux16(9), mux_generic(9).";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:mux2:mux2",
        name: "mux2",
        halComponentName: "mux2",
        source: "comp",
        sourcePath: "src/hal/components/mux2.comp",
        docs: {
          component: "Select from one of two input values",
          license: "GPL",
          author: "Jeff Epler",
          seeAlso: "mux4(9), mux8(9), mux16(9), mux_generic(9).",
        },
        pins: [
          {
            key: "sel",
            name: "sel",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Follows the value of *in0* if *sel* is FALSE, or *in1* if *sel* is TRUE",
            direction: "out",
          },
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "in0",
            name: "in0",
            type: "float",
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
            'component mux2 "Select from one of two input values";\npin in bit sel;\npin out float out "Follows the value of *in0* if *sel* is FALSE, or *in1* if *sel* is TRUE";\npin in float in1;\npin in float in0;\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\nsee_also "mux4(9), mux8(9), mux16(9), mux_generic(9).";\n',
        },
      },
    },
  ],
};

export default history;
