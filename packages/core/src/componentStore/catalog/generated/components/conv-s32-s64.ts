import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_s32_s64",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-s32-s64:conv-s32-s64",
        name: "conv_s32_s64",
        halComponentName: "conv_s32_s64",
        source: "comp",
        sourcePath: "src/hal/components/conv_s32_s64.comp",
        docs: {
          component: "Convert a value from s32 to s64",
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
            type: "s64",
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
            'component conv_s32_s64 "Convert a value from s32 to s64";\npin in s32 in;\npin out s64 out;\n//pin out bit out_of_range "TRUE when \'in\' is not in the range of s64";\n//param rw bit clamp """If TRUE, then clamp to the range of s64.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
