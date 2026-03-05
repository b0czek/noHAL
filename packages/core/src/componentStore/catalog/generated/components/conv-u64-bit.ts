import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "conv_u64_bit",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:conv-u64-bit:conv-u64-bit",
        name: "conv_u64_bit",
        halComponentName: "conv_u64_bit",
        source: "comp",
        sourcePath: "src/hal/components/conv_u64_bit.comp",
        docs: {
          component: "Convert a value from u64 to bit",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u64",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            direction: "out",
          },
          {
            key: "out_of_range",
            name: "out-of-range",
            type: "bit",
            doc: "TRUE when 'in' is not in the range of bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "clamp",
            name: "clamp",
            type: "bit",
            doc: 'If TRUE, then clamp to the range of bit.  If FALSE, then allow the value to "wrap around".',
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
            'component conv_u64_bit "Convert a value from u64 to bit";\npin in u64 in;\npin out bit out;\npin out bit out_of_range "TRUE when \'in\' is not in the range of bit";\nparam rw bit clamp """If TRUE, then clamp to the range of bit.  If FALSE, then allow the value to "wrap around".""";\noption period no;\nfunction _ nofp "Update \'out\' based on \'in\'";\nlicense "GPL";\nauthor "Jeff Epler";\n\n',
        },
      },
    },
  ],
};

export default history;
