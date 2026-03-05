import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "gray2bin",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:gray2bin:gray2bin",
        name: "gray2bin",
        halComponentName: "gray2bin",
        source: "comp",
        sourcePath: "src/hal/components/gray2bin.comp",
        docs: {
          component: "convert a gray-code input to binary",
          description:
            "Converts a gray-coded number into the corresponding binary value",
          license: "GPL",
          author: "andy pugh",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "gray code in",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            doc: "binary code out",
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
            'component gray2bin "convert a gray-code input to binary";\ndescription """Converts a gray-coded number into the corresponding binary value""";\npin in unsigned in "gray code in";\npin out unsigned out "binary code out";\nlicense "GPL";\nauthor "andy pugh";\nfunction _ nofp;\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:gray2bin:gray2bin",
        name: "gray2bin",
        halComponentName: "gray2bin",
        source: "comp",
        sourcePath: "src/hal/components/gray2bin.comp",
        docs: {
          component: "convert a gray-code input to binary",
          description:
            "Converts a gray-coded number into the corresponding binary value",
          license: "GPL",
          author: "Andy Pugh",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "gray code in",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            doc: "binary code out",
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
            'component gray2bin "convert a gray-code input to binary";\ndescription """Converts a gray-coded number into the corresponding binary value""";\npin in unsigned in "gray code in";\npin out unsigned out "binary code out";\nlicense "GPL";\nauthor "Andy Pugh";\nfunction _ nofp;\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:gray2bin:gray2bin",
        name: "gray2bin",
        halComponentName: "gray2bin",
        source: "comp",
        sourcePath: "src/hal/components/gray2bin.comp",
        docs: {
          component: "convert a gray-code input to binary",
          description:
            "Converts a gray-coded number into the corresponding binary value",
          license: "GPL",
          author: "Andy Pugh",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "gray code in",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            doc: "binary code out",
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
            'component gray2bin "convert a gray-code input to binary";\ndescription """Converts a gray-coded number into the corresponding binary value""";\npin in unsigned in "gray code in";\npin out unsigned out "binary code out";\nlicense "GPL";\nauthor "Andy Pugh";\nfunction _ nofp;\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
