import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "bitwise",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:bitwise:bitwise",
        name: "bitwise",
        halComponentName: "bitwise",
        source: "comp",
        sourcePath: "src/hal/components/bitwise.comp",
        docs: {
          component:
            "Computes various bitwise operations on the two input values",
          author: "Andy Pugh",
          license: "GPL 2+",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "u32",
            doc: "First input value",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "u32",
            doc: "Second input value",
            direction: "in",
          },
          {
            key: "out_and",
            name: "out-and",
            type: "u32",
            doc: "The bitwise AND of the two inputs",
            direction: "out",
          },
          {
            key: "out_or",
            name: "out-or",
            type: "u32",
            doc: "The bitwise OR of the two inputs",
            direction: "out",
          },
          {
            key: "out_xor",
            name: "out-xor",
            type: "u32",
            doc: "The bitwise XOR of the two inputs",
            direction: "out",
          },
          {
            key: "out_nand",
            name: "out-nand",
            type: "u32",
            doc: "The inverse of the bitwise AND",
            direction: "out",
          },
          {
            key: "out_nor",
            name: "out-nor",
            type: "u32",
            doc: "The inverse of the bitwise OR",
            direction: "out",
          },
          {
            key: "out_xnor",
            name: "out-xnor",
            type: "u32",
            doc: "The inverse of the bitwise XOR",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component bitwise "Computes various bitwise operations on the two input values";\npin in u32 in0 "First input value";\npin in u32 in1 "Second input value";\npin out u32 out-and "The bitwise AND of the two inputs";\npin out u32 out-or "The bitwise OR of the two inputs";\npin out u32 out-xor "The bitwise XOR of the two inputs";\npin out u32 out-nand "The inverse of the bitwise AND";\npin out u32 out-nor "The inverse of the bitwise OR";\npin out u32 out-xnor "The inverse of the bitwise XOR";\n\nauthor "Andy Pugh";\nlicense "GPL 2+";\nfunction _ nofp;\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:bitwise:bitwise",
        name: "bitwise",
        halComponentName: "bitwise",
        source: "comp",
        sourcePath: "src/hal/components/bitwise.comp",
        docs: {
          component:
            "Computes various bitwise operations on the two input values",
          author: "Andy Pugh",
          license: "GPL 2+",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "u32",
            doc: "First input value",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "u32",
            doc: "Second input value",
            direction: "in",
          },
          {
            key: "out_and",
            name: "out-and",
            type: "u32",
            doc: "The bitwise AND of the two inputs",
            direction: "out",
          },
          {
            key: "out_or",
            name: "out-or",
            type: "u32",
            doc: "The bitwise OR of the two inputs",
            direction: "out",
          },
          {
            key: "out_xor",
            name: "out-xor",
            type: "u32",
            doc: "The bitwise XOR of the two inputs",
            direction: "out",
          },
          {
            key: "out_nand",
            name: "out-nand",
            type: "u32",
            doc: "The inverse of the bitwise AND",
            direction: "out",
          },
          {
            key: "out_nor",
            name: "out-nor",
            type: "u32",
            doc: "The inverse of the bitwise OR",
            direction: "out",
          },
          {
            key: "out_xnor",
            name: "out-xnor",
            type: "u32",
            doc: "The inverse of the bitwise XOR",
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
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component bitwise "Computes various bitwise operations on the two input values";\npin in u32 in0 "First input value";\npin in u32 in1 "Second input value";\npin out u32 out-and "The bitwise AND of the two inputs";\npin out u32 out-or "The bitwise OR of the two inputs";\npin out u32 out-xor "The bitwise XOR of the two inputs";\npin out u32 out-nand "The inverse of the bitwise AND";\npin out u32 out-nor "The inverse of the bitwise OR";\npin out u32 out-xnor "The inverse of the bitwise XOR";\n\nauthor "Andy Pugh";\nlicense "GPL 2+";\nfunction _ nofp;\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
