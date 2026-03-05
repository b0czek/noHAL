import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "sum2",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:sum2:sum2",
        name: "sum2",
        halComponentName: "sum2",
        source: "comp",
        sourcePath: "src/hal/components/sum2.comp",
        docs: {
          component: "Sum of two inputs (each with a gain) and an offset",
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
            doc: "out = in0 * gain0 + in1 * gain1 + offset",
            direction: "out",
          },
        ],
        params: [
          {
            key: "gain0",
            name: "gain0",
            type: "float",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "gain1",
            name: "gain1",
            type: "float",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "offset",
            name: "offset",
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
            'component sum2 "Sum of two inputs (each with a gain) and an offset";\npin in float in0;\npin in float in1;\nparam rw float gain0 = 1.0;\nparam rw float gain1 = 1.0;\nparam rw float offset;\npin out float out "out = in0 * gain0 + in1 * gain1 + offset";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:sum2:sum2",
        name: "sum2",
        halComponentName: "sum2",
        source: "comp",
        sourcePath: "src/hal/components/sum2.comp",
        docs: {
          component: "Sum of two inputs (each with a gain) and an offset",
          seeAlso: "scaled_s32_sums(9), weighted_sum(9)",
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
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in0 * gain0 + in1 * gain1 + offset",
            direction: "out",
          },
        ],
        params: [
          {
            key: "gain0",
            name: "gain0",
            type: "float",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "gain1",
            name: "gain1",
            type: "float",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "offset",
            name: "offset",
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
            'component sum2 "Sum of two inputs (each with a gain) and an offset";\nsee_also "scaled_s32_sums(9), weighted_sum(9)";\npin in float in0;\npin in float in1;\nparam rw float gain0 = 1.0;\nparam rw float gain1 = 1.0;\nparam rw float offset;\npin out float out "out = in0 * gain0 + in1 * gain1 + offset";\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:sum2:sum2",
        name: "sum2",
        halComponentName: "sum2",
        source: "comp",
        sourcePath: "src/hal/components/sum2.comp",
        docs: {
          component: "Sum of two inputs (each with a gain) and an offset",
          seeAlso: "scaled_s32_sums(9), weighted_sum(9)",
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
            key: "out",
            name: "out",
            type: "float",
            doc: "out = in0 * gain0 + in1 * gain1 + offset",
            direction: "out",
          },
        ],
        params: [
          {
            key: "gain0",
            name: "gain0",
            type: "float",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "gain1",
            name: "gain1",
            type: "float",
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "offset",
            name: "offset",
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
          options: {
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component sum2 "Sum of two inputs (each with a gain) and an offset";\nsee_also "scaled_s32_sums(9), weighted_sum(9)";\npin in float in0;\npin in float in1;\nparam rw float gain0 = 1.0;\nparam rw float gain1 = 1.0;\nparam rw float offset;\npin out float out "out = in0 * gain0 + in1 * gain1 + offset";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
