import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "bitmerge",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:bitmerge:bitmerge",
        name: "bitmerge",
        halComponentName: "bitmerge",
        source: "comp",
        sourcePath: "src/hal/components/bitmerge.comp",
        docs: {
          component: "Converts individual bits into an unsigned-32",
          description:
            'This component creates a compound unsigned-32 from individual\nbit-inputs for each bit of an unsigned-32 output. The number of bits can be\nlimited by the "personality" modparam.\nThe inverse process can be performed by the bitslice HAL component.',
          author: "Andy Pugh",
          license: "GPL2+",
        },
        pins: [
          {
            key: "out",
            name: "out",
            type: "u32",
            doc: "The output value",
            direction: "out",
          },
          {
            key: "in_idxidx",
            name: "in-##",
            type: "bit",
            arrayLen: 32,
            arrayExpr: "personality",
            direction: "in",
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
            'component bitmerge "Converts individual bits into an unsigned-32";\ndescription """This component creates a compound unsigned-32 from individual\nbit-inputs for each bit of an unsigned-32 output. The number of bits can be\nlimited by the "personality" modparam.\nThe inverse process can be performed by the bitslice HAL component.""";\npin out u32 out "The output value";\npin in  bit in-##[32:personality];\nauthor "Andy Pugh";\nlicense "GPL2+";\nfunction _ nofp;\noption personality yes;\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
