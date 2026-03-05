import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_bit_s64",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-bit-s64:conv-bit-s64",
        name: "conv_bit_s64",
        halComponentName: "conv_bit_s64",
        source: "comp",
        sourcePath: "src/hal/components/conv_bit_s64.comp",
        docs: {
          component: "Convert a value from bit to s64",
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
            'component conv_bit_s64 "Convert a value from bit to s64";\npin in bit in;\npin out s64 out;\n//pin out bit out_of_range "TRUE when \'in\' is not in the range of s64";\n//param rw bit clamp """If TRUE, then clamp to the range of s64.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
