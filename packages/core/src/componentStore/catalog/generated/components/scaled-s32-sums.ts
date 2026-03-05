import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "scaled_s32_sums",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:scaled-s32-sums:scaled-s32-sums",
        name: "scaled_s32_sums",
        halComponentName: "scaled_s32_sums",
        source: "comp",
        sourcePath: "src/hal/components/scaled_s32_sums.comp",
        docs: {
          component: "Sum of four inputs (each with a scale)",
          seeAlso: "sum2(9), weighted_sum(9)",
          license: "GPL",
          author: "Chris S Morley",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "s32",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "s32",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "s32",
            direction: "in",
          },
          {
            key: "in3",
            name: "in3",
            type: "s32",
            direction: "in",
          },
          {
            key: "scale0",
            name: "scale0",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "scale1",
            name: "scale1",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "scale2",
            name: "scale2",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "scale3",
            name: "scale3",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "out_s",
            name: "out-s",
            type: "s32",
            direction: "out",
          },
          {
            key: "out_f",
            name: "out-f",
            type: "float",
            doc: "out-s = out-f = (in0 * scale0) + (in1 * scale1) + (in2 * scale2) + (in3 * scale3)",
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
            'component scaled_s32_sums "Sum of four inputs (each with a scale)";\nsee_also "sum2(9), weighted_sum(9)";\npin in s32 in0;\npin in s32 in1;\npin in s32 in2;\npin in s32 in3;\npin in float scale0 = 1.0;\npin in float scale1 = 1.0;\npin in float scale2 = 1.0;\npin in float scale3 = 1.0;\npin out s32 out_s;\npin out float out_f "out-s = out-f = (in0 * scale0) + (in1 * scale1) + (in2 * scale2) + (in3 * scale3)";\nfunction _;\nlicense "GPL";\nauthor "Chris S Morley";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:scaled-s32-sums:scaled-s32-sums",
        name: "scaled_s32_sums",
        halComponentName: "scaled_s32_sums",
        source: "comp",
        sourcePath: "src/hal/components/scaled_s32_sums.comp",
        docs: {
          component: "Sum of four inputs (each with a scale)",
          seeAlso: "sum2(9), weighted_sum(9)",
          license: "GPL",
          author: "Chris S Morley",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "s32",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "s32",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "s32",
            direction: "in",
          },
          {
            key: "in3",
            name: "in3",
            type: "s32",
            direction: "in",
          },
          {
            key: "scale0",
            name: "scale0",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "scale1",
            name: "scale1",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "scale2",
            name: "scale2",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "scale3",
            name: "scale3",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "out_s",
            name: "out-s",
            type: "s32",
            direction: "out",
          },
          {
            key: "out_f",
            name: "out-f",
            type: "float",
            doc: "out-s = out-f = (in0 * scale0) + (in1 * scale1) + (in2 * scale2) + (in3 * scale3)",
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
            'component scaled_s32_sums "Sum of four inputs (each with a scale)";\nsee_also "sum2(9), weighted_sum(9)";\npin in s32 in0;\npin in s32 in1;\npin in s32 in2;\npin in s32 in3;\npin in float scale0 = 1.0;\npin in float scale1 = 1.0;\npin in float scale2 = 1.0;\npin in float scale3 = 1.0;\npin out s32 out_s;\npin out float out_f "out-s = out-f = (in0 * scale0) + (in1 * scale1) + (in2 * scale2) + (in3 * scale3)";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Chris S Morley";\n',
        },
      },
    },
  ],
};

export default history;
