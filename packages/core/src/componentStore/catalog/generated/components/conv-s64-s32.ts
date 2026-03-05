import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_s64_s32",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-s64-s32:conv-s64-s32",
        name: "conv_s64_s32",
        halComponentName: "conv_s64_s32",
        source: "comp",
        sourcePath: "src/hal/components/conv_s64_s32.comp",
        docs: {
          component: "Convert a value from s64 to s32",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s64",
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
            'component conv_s64_s32 "Convert a value from s64 to s32";\npin in s64 in;\npin out s32 out;\npin out bit out_of_range "TRUE when \'in\' is not in the range of s32";\nparam rw bit clamp """If TRUE, then clamp to the range of s32.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
