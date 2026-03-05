import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_u32_u64",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-u32-u64:conv-u32-u64",
        name: "conv_u32_u64",
        halComponentName: "conv_u32_u64",
        source: "comp",
        sourcePath: "src/hal/components/conv_u32_u64.comp",
        docs: {
          component: "Convert a value from u32 to u64",
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
            type: "u64",
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
            'component conv_u32_u64 "Convert a value from u32 to u64";\npin in u32 in;\npin out u64 out;\n//pin out bit out_of_range "TRUE when \'in\' is not in the range of u64";\n//param rw bit clamp """If TRUE, then clamp to the range of u64.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
