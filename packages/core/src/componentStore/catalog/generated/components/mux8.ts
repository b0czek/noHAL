import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "mux8",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:mux8:mux8",
        name: "mux8",
        halComponentName: "mux8",
        source: "comp",
        sourcePath: "src/hal/components/mux8.comp",
        docs: {
          component: "Select from one of eight input values",
          license: "GPL",
        },
        pins: [
          {
            key: "sel0",
            name: "sel0",
            type: "bit",
            direction: "in",
          },
          {
            key: "sel1",
            name: "sel1",
            type: "bit",
            direction: "in",
          },
          {
            key: "sel2",
            name: "sel2",
            type: "bit",
            doc: "\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the three \\\\fBsel\\\\fR values\n.RS\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin2\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin3\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin4\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin5\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin6\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin7\\\\fR\n.RE\n",
            direction: "out",
          },
          {
            key: "in0",
            name: "in0",
            type: "float",
            direction: "in",
          },
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
            key: "in3",
            name: "in3",
            type: "float",
            direction: "in",
          },
          {
            key: "in4",
            name: "in4",
            type: "float",
            direction: "in",
          },
          {
            key: "in5",
            name: "in5",
            type: "float",
            direction: "in",
          },
          {
            key: "in6",
            name: "in6",
            type: "float",
            direction: "in",
          },
          {
            key: "in7",
            name: "in7",
            type: "float",
            direction: "in",
          },
        ],
        params: [],
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
            'component mux8 "Select from one of eight input values";\npin in bit sel0;\npin in bit sel1;\npin in bit sel2 """\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n""";\npin out float out """\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the three \\\\fBsel\\\\fR values\n.RS\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin2\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin3\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin4\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin5\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin6\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin7\\\\fR\n.RE\n""";\npin in float in0;\npin in float in1;\npin in float in2;\npin in float in3;\npin in float in4;\npin in float in5;\npin in float in6;\npin in float in7;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:mux8:mux8",
        name: "mux8",
        halComponentName: "mux8",
        source: "comp",
        sourcePath: "src/hal/components/mux8.comp",
        docs: {
          component: "Select from one of eight input values",
          license: "GPL",
          author: "Stuart Stevenson",
          seeAlso: "mux2(9), mux4(9), mux16(9), mux_generic(9).",
        },
        pins: [
          {
            key: "sel0",
            name: "sel0",
            type: "bit",
            direction: "in",
          },
          {
            key: "sel1",
            name: "sel1",
            type: "bit",
            direction: "in",
          },
          {
            key: "sel2",
            name: "sel2",
            type: "bit",
            doc: "\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the three \\\\fBsel\\\\fR values\n.RS\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin2\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin3\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin4\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin5\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin6\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin7\\\\fR\n.RE\n",
            direction: "out",
          },
          {
            key: "in0",
            name: "in0",
            type: "float",
            direction: "in",
          },
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
            key: "in3",
            name: "in3",
            type: "float",
            direction: "in",
          },
          {
            key: "in4",
            name: "in4",
            type: "float",
            direction: "in",
          },
          {
            key: "in5",
            name: "in5",
            type: "float",
            direction: "in",
          },
          {
            key: "in6",
            name: "in6",
            type: "float",
            direction: "in",
          },
          {
            key: "in7",
            name: "in7",
            type: "float",
            direction: "in",
          },
        ],
        params: [],
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
            'component mux8 "Select from one of eight input values";\npin in bit sel0;\npin in bit sel1;\npin in bit sel2 """\\\nTogether, these determine which \\\\fBin\\\\fIN\\\\fR value is copied to \\\\fBout\\\\fR.\n""";\npin out float out """\\\nFollows the value of one of the \\\\fBin\\\\fIN\\\\fR values according to the three \\\\fBsel\\\\fR values\n.RS\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin0\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin1\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin2\\\\fR\n.TP\n\\\\fBsel2=FALSE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin3\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin4\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=FALSE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin5\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=FALSE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin6\\\\fR\n.TP\n\\\\fBsel2=TRUE\\\\fR, \\\\fBsel1=TRUE\\\\fR, \\\\fBsel0=TRUE\\\\fR\n\\\\fBout\\\\fR follows \\\\fBin7\\\\fR\n.RE\n""";\npin in float in0;\npin in float in1;\npin in float in2;\npin in float in3;\npin in float in4;\npin in float in5;\npin in float in6;\npin in float in7;\nfunction _;\nlicense "GPL";\nauthor "Stuart Stevenson";\nsee_also "mux2(9), mux4(9), mux16(9), mux_generic(9).";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:mux8:mux8",
        name: "mux8",
        halComponentName: "mux8",
        source: "comp",
        sourcePath: "src/hal/components/mux8.comp",
        docs: {
          component: "Select from one of eight input values",
          license: "GPL",
          author: "Stuart Stevenson",
          seeAlso: "mux2(9), mux4(9), mux16(9), mux_generic(9).",
        },
        pins: [
          {
            key: "sel0",
            name: "sel0",
            type: "bit",
            direction: "in",
          },
          {
            key: "sel1",
            name: "sel1",
            type: "bit",
            direction: "in",
          },
          {
            key: "sel2",
            name: "sel2",
            type: "bit",
            doc: "\\\nTogether, these determine which **in**__N__ value is copied to *out*.\n",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: '\\\nFollows the value of one of the **in**__N__ values according to the three *sel* values\n\n[cols="^1,^1,^1,1"]\n|===\n^h|sel2\n^h|sel1\n^h|sel0\n^h|out follows\n\n|0|0|0|*in0*\n|0|0|1|*in1*\n|0|1|0|*in2*\n|0|1|1|*in3*\n|1|0|0|*in4*\n|1|0|1|*in5*\n|1|1|0|*in6*\n|1|1|1|*in7*\n|===\n\n',
            direction: "out",
          },
          {
            key: "in0",
            name: "in0",
            type: "float",
            direction: "in",
          },
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
            key: "in3",
            name: "in3",
            type: "float",
            direction: "in",
          },
          {
            key: "in4",
            name: "in4",
            type: "float",
            direction: "in",
          },
          {
            key: "in5",
            name: "in5",
            type: "float",
            direction: "in",
          },
          {
            key: "in6",
            name: "in6",
            type: "float",
            direction: "in",
          },
          {
            key: "in7",
            name: "in7",
            type: "float",
            direction: "in",
          },
        ],
        params: [],
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
            'component mux8 "Select from one of eight input values";\npin in bit sel0;\npin in bit sel1;\npin in bit sel2 """\\\nTogether, these determine which **in**__N__ value is copied to *out*.\n""";\npin out float out """\\\nFollows the value of one of the **in**__N__ values according to the three *sel* values\n\n[cols="^1,^1,^1,1"]\n|===\n^h|sel2\n^h|sel1\n^h|sel0\n^h|out follows\n\n|0|0|0|*in0*\n|0|0|1|*in1*\n|0|1|0|*in2*\n|0|1|1|*in3*\n|1|0|0|*in4*\n|1|0|1|*in5*\n|1|1|0|*in6*\n|1|1|1|*in7*\n|===\n\n""";\npin in float in0;\npin in float in1;\npin in float in2;\npin in float in3;\npin in float in4;\npin in float in5;\npin in float in6;\npin in float in7;\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Stuart Stevenson";\nsee_also "mux2(9), mux4(9), mux16(9), mux_generic(9).";\n',
        },
      },
    },
  ],
};

export default history;
