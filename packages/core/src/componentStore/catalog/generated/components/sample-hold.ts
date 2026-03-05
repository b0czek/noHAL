import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "sample_hold",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:sample-hold:sample-hold",
        name: "sample_hold",
        halComponentName: "sample_hold",
        source: "comp",
        sourcePath: "src/hal/components/sample_hold.comp",
        docs: {
          component: "Sample and Hold",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "hold",
            name: "hold",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
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
            'component sample_hold "Sample and Hold";\npin in s32 in;\npin in bit hold;\npin out s32 out;\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:sample-hold:sample-hold",
        name: "sample_hold",
        halComponentName: "sample_hold",
        source: "comp",
        sourcePath: "src/hal/components/sample_hold.comp",
        docs: {
          component: "Sample and Hold",
          seeAlso: "\\fBtristate\\fR(9)",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "hold",
            name: "hold",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
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
            'component sample_hold "Sample and Hold";\npin in s32 in;\npin in bit hold;\npin out s32 out;\nfunction _ nofp;\nsee_also "\\\\fBtristate\\\\fR(9)";\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:sample-hold:sample-hold",
        name: "sample_hold",
        halComponentName: "sample_hold",
        source: "comp",
        sourcePath: "src/hal/components/sample_hold.comp",
        docs: {
          component: "Sample and Hold",
          seeAlso: "*tristate*(9)",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "s32",
            direction: "in",
          },
          {
            key: "hold",
            name: "hold",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "s32",
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
            'component sample_hold "Sample and Hold";\npin in s32 in;\npin in bit hold;\npin out s32 out;\noption period no;\nfunction _ nofp;\nsee_also "*tristate*(9)";\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n',
        },
      },
    },
  ],
};

export default history;
