import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "bitslice",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:bitslice:bitslice",
        name: "bitslice",
        halComponentName: "bitslice",
        source: "comp",
        sourcePath: "src/hal/components/bitslice.comp",
        docs: {
          component: "Converts an unsigned-32 input into individual bits",
          description:
            'This component creates individual bit-outputs for each bit of an\nunsigned-32 input. The number of bits can be limited by the "personality"\nmodparam.\nThe inverse process can be performed by the weighted_sum HAL component.',
          author: "Andy Pugh",
          license: "GPL2+",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "The input value",
            direction: "in",
          },
          {
            key: "out_idxidx",
            name: "out-##",
            type: "bit",
            arrayLen: 32,
            arrayExpr: "personality",
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
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            personality: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component bitslice "Converts an unsigned-32 input into individual bits";\ndescription """This component creates individual bit-outputs for each bit of an\nunsigned-32 input. The number of bits can be limited by the "personality"\nmodparam.\nThe inverse process can be performed by the weighted_sum HAL component.""";\npin in u32 in "The input value";\npin out bit out-##[32:personality];\nauthor "Andy Pugh";\nlicense "GPL2+";\nfunction _ nofp;\noption personality yes;\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:bitslice:bitslice",
        name: "bitslice",
        halComponentName: "bitslice",
        source: "comp",
        sourcePath: "src/hal/components/bitslice.comp",
        docs: {
          component: "Converts an unsigned-32 input into individual bits",
          description:
            'This component creates individual bit-outputs for each bit of an\nunsigned-32 input. The number of bits can be limited by the "personality"\nmodparam.\nThe inverse process can be performed by the bitmerge HAL component.',
          author: "Andy Pugh",
          license: "GPL2+",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "The input value",
            direction: "in",
          },
          {
            key: "out_idxidx",
            name: "out-##",
            type: "bit",
            arrayLen: 32,
            arrayExpr: "personality",
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
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            personality: true,
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component bitslice "Converts an unsigned-32 input into individual bits";\ndescription """This component creates individual bit-outputs for each bit of an\nunsigned-32 input. The number of bits can be limited by the "personality"\nmodparam.\nThe inverse process can be performed by the bitmerge HAL component.""";\npin in u32 in "The input value";\npin out bit out-##[32:personality];\nauthor "Andy Pugh";\nlicense "GPL2+";\nfunction _ nofp;\noption personality yes;\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
