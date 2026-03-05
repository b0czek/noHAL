import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "select8",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:select8:select8",
        name: "select8",
        halComponentName: "select8",
        source: "comp",
        sourcePath: "src/hal/components/select8.comp",
        docs: {
          component: "8-bit binary match detector",
          license: "GPL",
        },
        pins: [
          {
            key: "sel",
            name: "sel",
            type: "s32",
            doc: "The number of the output to set TRUE.  All other outputs well be set FALSE",
            direction: "in",
          },
          {
            key: "outidx",
            name: "out#",
            type: "bit",
            doc: "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true",
            arrayLen: 8,
            direction: "out",
          },
        ],
        params: [
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Set enable to FALSE to cause all outputs to be set FALSE",
            defaultValue: "TRUE",
            direction: "rw",
          },
        ],
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
            'component select8 "8-bit binary match detector";\nparam rw bit enable = TRUE "Set enable to FALSE to cause all outputs to be set FALSE";\npin in s32 sel "The number of the output to set TRUE.  All other outputs well be set FALSE";\npin out bit out#[8] "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true";\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:select8:select8",
        name: "select8",
        halComponentName: "select8",
        source: "comp",
        sourcePath: "src/hal/components/select8.comp",
        docs: {
          component: "8-bit binary match detector",
          license: "GPL",
        },
        pins: [
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Set enable to FALSE to cause all outputs to be set FALSE",
            defaultValue: "TRUE",
            direction: "in",
          },
          {
            key: "sel",
            name: "sel",
            type: "s32",
            doc: "The number of the output to set TRUE.  All other outputs well be set FALSE",
            direction: "in",
          },
          {
            key: "outidx",
            name: "out#",
            type: "bit",
            doc: "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true",
            arrayLen: 8,
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
            'component select8 "8-bit binary match detector";\npin in bit enable = TRUE "Set enable to FALSE to cause all outputs to be set FALSE";\npin in s32 sel "The number of the output to set TRUE.  All other outputs well be set FALSE";\npin out bit out#[8] "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true";\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:select8:select8",
        name: "select8",
        halComponentName: "select8",
        source: "comp",
        sourcePath: "src/hal/components/select8.comp",
        docs: {
          component: "8-bit binary match detector",
          seeAlso: "\\fBdemux\\fR(9)",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Set enable to FALSE to cause all outputs to be set FALSE.",
            defaultValue: "TRUE",
            direction: "in",
          },
          {
            key: "sel",
            name: "sel",
            type: "s32",
            doc: "The number of the output to set TRUE.  All other outputs well be set FALSE.",
            direction: "in",
          },
          {
            key: "outidx",
            name: "out#",
            type: "bit",
            doc: "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true.",
            arrayLen: 8,
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
            'component select8 "8-bit binary match detector";\npin in bit enable = TRUE "Set enable to FALSE to cause all outputs to be set FALSE.";\npin in s32 sel "The number of the output to set TRUE.  All other outputs well be set FALSE.";\npin out bit out#[8] "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true.";\nfunction _ nofp;\nsee_also "\\\\fBdemux\\\\fR(9)";\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:select8:select8",
        name: "select8",
        halComponentName: "select8",
        source: "comp",
        sourcePath: "src/hal/components/select8.comp",
        docs: {
          component: "8-bit binary match detector",
          seeAlso: "*demux*(9)",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "Set enable to FALSE to cause all outputs to be set FALSE.",
            defaultValue: "TRUE",
            direction: "in",
          },
          {
            key: "sel",
            name: "sel",
            type: "s32",
            doc: "The number of the output to set TRUE.  All other outputs well be set FALSE.",
            direction: "in",
          },
          {
            key: "outidx",
            name: "out#",
            type: "bit",
            doc: "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true.",
            arrayLen: 8,
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
            'component select8 "8-bit binary match detector";\npin in bit enable = TRUE "Set enable to FALSE to cause all outputs to be set FALSE.";\npin in s32 sel "The number of the output to set TRUE.  All other outputs well be set FALSE.";\npin out bit out#[8] "Output bits.  If enable is set and the sel input is between 0 and 7, then the corresponding output bit will be set true.";\noption period no;\nfunction _ nofp;\nsee_also "*demux*(9)";\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n',
        },
      },
    },
  ],
};

export default history;
