import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "bin2gray",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:bin2gray:bin2gray",
        name: "bin2gray",
        halComponentName: "bin2gray",
        source: "comp",
        sourcePath: "src/hal/components/bin2gray.comp",
        docs: {
          component: "convert a number to the gray-code representation",
          description: "Converts a number into gray-code",
          license: "GPL",
          author: "andy pugh",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "binary code in",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            doc: "gray code out",
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
            'component bin2gray "convert a number to the gray-code representation";\ndescription """Converts a number into gray-code""";\npin in unsigned in "binary code in";\npin out unsigned out "gray code out";\nlicense "GPL";\nauthor "andy pugh";\nfunction _ nofp;\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:bin2gray:bin2gray",
        name: "bin2gray",
        halComponentName: "bin2gray",
        source: "comp",
        sourcePath: "src/hal/components/bin2gray.comp",
        docs: {
          component: "convert a number to the gray-code representation",
          description: "Converts a number into gray-code",
          license: "GPL",
          author: "Andy Pugh",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "binary code in",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            doc: "gray code out",
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
            'component bin2gray "convert a number to the gray-code representation";\ndescription """Converts a number into gray-code""";\npin in unsigned in "binary code in";\npin out unsigned out "gray code out";\nlicense "GPL";\nauthor "Andy Pugh";\nfunction _ nofp;\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:bin2gray:bin2gray",
        name: "bin2gray",
        halComponentName: "bin2gray",
        source: "comp",
        sourcePath: "src/hal/components/bin2gray.comp",
        docs: {
          component: "convert a number to the gray-code representation",
          description: "Converts a number into gray-code",
          license: "GPL",
          author: "Andy Pugh",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "u32",
            doc: "binary code in",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "u32",
            doc: "gray code out",
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
            'component bin2gray "convert a number to the gray-code representation";\ndescription """Converts a number into gray-code""";\npin in unsigned in "binary code in";\npin out unsigned out "gray code out";\nlicense "GPL";\nauthor "Andy Pugh";\noption period no;\nfunction _ nofp;\n',
        },
      },
    },
  ],
};

export default history;
