import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_s32_float",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:conv-s32-float:conv-s32-float",
        name: "conv_s32_float",
        halComponentName: "conv_s32_float",
        source: "comp",
        sourcePath: "src/hal/components/conv_s32_float.comp",
        docs: {
          component: "Convert a value from s32 to float",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
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
            doc: "Update 'out' based on 'in'",
          },
        ],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [
            "Synthesized from conv.comp.in + Submakefile target list.",
          ],
          rawHeader:
            'component conv_s32_float "Convert a value from s32 to float";\npin in s32 in_;\npin out float out;\n// pin out bit out_of_range "TRUE when \'in\' is not in the range of float";\n// param rw bit clamp """If TRUE, then clamp to the range of float.  If FALSE, then allow the value to "wrap around".""";\nfunction _  "Update \'out\' based on \'in\'";\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:conv-s32-float:conv-s32-float",
        name: "conv_s32_float",
        halComponentName: "conv_s32_float",
        source: "comp",
        sourcePath: "src/hal/components/conv_s32_float.comp",
        docs: {
          component: "Convert a value from s32 to float",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
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
            doc: "Update 'out' based on 'in'",
          },
        ],
        runtime: {
          kind: "rt",
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [
            "Synthesized from conv.comp.in + Submakefile target list.",
          ],
          rawHeader:
            'component conv_s32_float "Convert a value from s32 to float";\npin in s32 in_;\npin out float out;\n// pin out bit out_of_range "TRUE when \'in\' is not in the range of float";\n// param rw bit clamp """If TRUE, then clamp to the range of float.  If FALSE, then allow the value to "wrap around".""";\nfunction _  "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-s32-float:conv-s32-float",
        name: "conv_s32_float",
        halComponentName: "conv_s32_float",
        source: "comp",
        sourcePath: "src/hal/components/conv_s32_float.comp",
        docs: {
          component: "Convert a value from s32 to float",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
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
            doc: "Update 'out' based on 'in'",
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
          warnings: [
            "Synthesized from conv.comp.in + Submakefile target list.",
          ],
          rawHeader:
            'component conv_s32_float "Convert a value from s32 to float";\npin in s32 in;\npin out float out;\n//pin out bit out_of_range "TRUE when \'in\' is not in the range of float";\n//param rw bit clamp """If TRUE, then clamp to the range of float.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _  "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
