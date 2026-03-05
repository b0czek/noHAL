import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_bit_u32",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:conv-bit-u32:conv-bit-u32",
        name: "conv_bit_u32",
        halComponentName: "conv_bit_u32",
        source: "comp",
        sourcePath: "src/hal/components/conv_bit_u32.comp",
        docs: {
          component: "Convert a value from bit to u32",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
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
            'component conv_bit_u32 "Convert a value from bit to u32";\npin in bit in_;\npin out u32 out;\n// pin out bit out_of_range "TRUE when \'in\' is not in the range of u32";\n// param rw bit clamp """If TRUE, then clamp to the range of u32.  If FALSE, then allow the value to "wrap around".""";\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:conv-bit-u32:conv-bit-u32",
        name: "conv_bit_u32",
        halComponentName: "conv_bit_u32",
        source: "comp",
        sourcePath: "src/hal/components/conv_bit_u32.comp",
        docs: {
          component: "Convert a value from bit to u32",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
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
            'component conv_bit_u32 "Convert a value from bit to u32";\npin in bit in_;\npin out u32 out;\n// pin out bit out_of_range "TRUE when \'in\' is not in the range of u32";\n// param rw bit clamp """If TRUE, then clamp to the range of u32.  If FALSE, then allow the value to "wrap around".""";\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-bit-u32:conv-bit-u32",
        name: "conv_bit_u32",
        halComponentName: "conv_bit_u32",
        source: "comp",
        sourcePath: "src/hal/components/conv_bit_u32.comp",
        docs: {
          component: "Convert a value from bit to u32",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            direction: "out",
          },
        ],
        params: [],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
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
            'component conv_bit_u32 "Convert a value from bit to u32";\npin in bit in;\npin out u32 out;\n//pin out bit out_of_range "TRUE when \'in\' is not in the range of u32";\n//param rw bit clamp """If TRUE, then clamp to the range of u32.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
