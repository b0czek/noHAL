import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "near",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:near:near",
        name: "near",
        halComponentName: "near",
        source: "comp",
        sourcePath: "src/hal/components/near.comp",
        docs: {
          component: "Determine whether two values are roughly equal.",
          license: "GPL",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "\n\\\\fBout\\\\fR is true if \\\\fBin1\\\\fR and \\\\fBin2\\\\fR are within a factor of\n\\\\fBscale\\\\fR (i.e., for in1 positive, in1/scale <= in2 <= in1*scale), OR\nif their absolute difference is no greater than \\\\fBdifference\\\\fR (i.e.,\n|in1-in2| <= difference).  \\\\fBout\\\\fR is false otherwise.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            defaultValue: "1",
            direction: "rw",
          },
          {
            key: "difference",
            name: "difference",
            type: "float",
            defaultValue: "0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
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
            'component near "Determine whether two values are roughly equal.";\npin in float in1_;\npin in float in2_;\nparam rw float scale=1;\nparam rw float difference=0;\npin out bit out """\n\\\\fBout\\\\fR is true if \\\\fBin1\\\\fR and \\\\fBin2\\\\fR are within a factor of\n\\\\fBscale\\\\fR (i.e., for in1 positive, in1/scale <= in2 <= in1*scale), OR\nif their absolute difference is no greater than \\\\fBdifference\\\\fR (i.e.,\n|in1-in2| <= difference).  \\\\fBout\\\\fR is false otherwise.""";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:near:near",
        name: "near",
        halComponentName: "near",
        source: "comp",
        sourcePath: "src/hal/components/near.comp",
        docs: {
          component: "Determine whether two values are roughly equal.",
          license: "GPL",
          author: "Chris Radek",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "\n\\\\fBout\\\\fR is true if \\\\fBin1\\\\fR and \\\\fBin2\\\\fR are within a factor of\n\\\\fBscale\\\\fR (i.e., for in1 positive, in1/scale <= in2 <= in1*scale), OR\nif their absolute difference is no greater than \\\\fBdifference\\\\fR (i.e.,\n|in1-in2| <= difference).  \\\\fBout\\\\fR is false otherwise.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            defaultValue: "1",
            direction: "rw",
          },
          {
            key: "difference",
            name: "difference",
            type: "float",
            defaultValue: "0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
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
            'component near "Determine whether two values are roughly equal.";\npin in float in1_;\npin in float in2_;\nparam rw float scale=1;\nparam rw float difference=0;\npin out bit out """\n\\\\fBout\\\\fR is true if \\\\fBin1\\\\fR and \\\\fBin2\\\\fR are within a factor of\n\\\\fBscale\\\\fR (i.e., for in1 positive, in1/scale <= in2 <= in1*scale), OR\nif their absolute difference is no greater than \\\\fBdifference\\\\fR (i.e.,\n|in1-in2| <= difference).  \\\\fBout\\\\fR is false otherwise.""";\nfunction _;\nlicense "GPL";\nauthor "Chris Radek";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:near:near",
        name: "near",
        halComponentName: "near",
        source: "comp",
        sourcePath: "src/hal/components/near.comp",
        docs: {
          component: "Determine whether two values are roughly equal.",
          license: "GPL",
          author: "Chris Radek",
        },
        pins: [
          {
            key: "in1",
            name: "in1",
            type: "float",
            direction: "in",
          },
          {
            key: "in2",
            name: "in2",
            type: "float",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "\n*out* is true if *in1* and *in2* are within a factor of\n*scale* (i.e., for in1 positive, in1/scale ≤ in2 ≤ in1*scale), OR\nif their absolute difference is no greater than *difference* (i.e.,\n|in1-in2| ≤ difference).  *out* is false otherwise.",
            direction: "out",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            defaultValue: "1",
            direction: "rw",
          },
          {
            key: "difference",
            name: "difference",
            type: "float",
            defaultValue: "0",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "fp",
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
            'component near "Determine whether two values are roughly equal.";\npin in float in1_;\npin in float in2_;\nparam rw float scale=1;\nparam rw float difference=0;\npin out bit out """\n*out* is true if *in1* and *in2* are within a factor of\n*scale* (i.e., for in1 positive, in1/scale ≤ in2 ≤ in1*scale), OR\nif their absolute difference is no greater than *difference* (i.e.,\n|in1-in2| ≤ difference).  *out* is false otherwise.""";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Chris Radek";\n',
        },
      },
    },
  ],
};

export default history;
