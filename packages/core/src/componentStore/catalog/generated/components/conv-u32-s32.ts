import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_u32_s32",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:conv-u32-s32:conv-u32-s32",
        name: "conv_u32_s32",
        halComponentName: "conv_u32_s32",
        source: "comp",
        sourcePath: "src/hal/components/conv_u32_s32.comp",
        docs: {
          component: "Convert a value from u32 to s32",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            direction: "out",
          },
          {
            key: "out_of_range",
            name: "out-of-range",
            type: "bit",
            doc: "TRUE when 'in' is not in the range of s32",
            direction: "out",
          },
        ],
        params: [
          {
            key: "clamp",
            name: "clamp",
            type: "bit",
            doc: 'If TRUE, then clamp to the range of s32.  If FALSE, then allow the value to "wrap around".',
            direction: "rw",
          },
        ],
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
            'component conv_u32_s32 "Convert a value from u32 to s32";\npin in u32 in_;\npin out s32 out;\n pin out bit out_of_range "TRUE when \'in\' is not in the range of s32";\n param rw bit clamp """If TRUE, then clamp to the range of s32.  If FALSE, then allow the value to "wrap around".""";\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:conv-u32-s32:conv-u32-s32",
        name: "conv_u32_s32",
        halComponentName: "conv_u32_s32",
        source: "comp",
        sourcePath: "src/hal/components/conv_u32_s32.comp",
        docs: {
          component: "Convert a value from u32 to s32",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            direction: "out",
          },
          {
            key: "out_of_range",
            name: "out-of-range",
            type: "bit",
            doc: "TRUE when 'in' is not in the range of s32",
            direction: "out",
          },
        ],
        params: [
          {
            key: "clamp",
            name: "clamp",
            type: "bit",
            doc: 'If TRUE, then clamp to the range of s32.  If FALSE, then allow the value to "wrap around".',
            direction: "rw",
          },
        ],
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
            'component conv_u32_s32 "Convert a value from u32 to s32";\npin in u32 in_;\npin out s32 out;\n pin out bit out_of_range "TRUE when \'in\' is not in the range of s32";\n param rw bit clamp """If TRUE, then clamp to the range of s32.  If FALSE, then allow the value to "wrap around".""";\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-u32-s32:conv-u32-s32",
        name: "conv_u32_s32",
        halComponentName: "conv_u32_s32",
        source: "comp",
        sourcePath: "src/hal/components/conv_u32_s32.comp",
        docs: {
          component: "Convert a value from u32 to s32",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
            direction: "out",
          },
          {
            key: "out_of_range",
            name: "out-of-range",
            type: "bit",
            doc: "TRUE when 'in' is not in the range of s32",
            direction: "out",
          },
        ],
        params: [
          {
            key: "clamp",
            name: "clamp",
            type: "bit",
            doc: 'If TRUE, then clamp to the range of s32.  If FALSE, then allow the value to "wrap around".',
            direction: "rw",
          },
        ],
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
            'component conv_u32_s32 "Convert a value from u32 to s32";\npin in u32 in;\npin out s32 out;\npin out bit out_of_range "TRUE when \'in\' is not in the range of s32";\nparam rw bit clamp """If TRUE, then clamp to the range of s32.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
