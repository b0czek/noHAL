import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "and2",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:and2:and2",
        name: "and2",
        halComponentName: "and2",
        source: "comp",
        sourcePath: "src/hal/components/and2.comp",
        docs: {
          component: "Two-input AND gate",
          license: "GPL",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "bit",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "\\\n\\\\fBout\\\\fR is computed from the value of \\\\fBin0\\\\fR and \\\\fBin1\\\\fR according to the following rule:\n.RS\n.TP\n\\\\fBin0=TRUE in1=TRUE\\\\fB\n\\\\fBout=TRUE\\\\fR\n.TP\nOtherwise,\n\\\\fBout=FALSE\\\\fR\n.RE",
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
            'component and2 "Two-input AND gate";\npin in bit in0;\npin in bit in1;\npin out bit out """\\\n\\\\fBout\\\\fR is computed from the value of \\\\fBin0\\\\fR and \\\\fBin1\\\\fR according to the following rule:\n.RS\n.TP\n\\\\fBin0=TRUE in1=TRUE\\\\fB\n\\\\fBout=TRUE\\\\fR\n.TP\nOtherwise,\n\\\\fBout=FALSE\\\\fR\n.RE"""\n;\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:and2:and2",
        name: "and2",
        halComponentName: "and2",
        source: "comp",
        sourcePath: "src/hal/components/and2.comp",
        docs: {
          component: "Two-input AND gate",
          seeAlso:
            "\n.ie '\\\\*[.T]'html' \\\\{\\\\\n.UR logic.9.html\n\\\\fBlogic\\\\fR(9)\n.UE\n\\\\}\n.el \\\\{\\\\\n\\\\fBlogic\\\\fR(9)\n\\\\}\n",
          license: "GPL",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "bit",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "\\\n\\\\fBout\\\\fR is computed from the value of \\\\fBin0\\\\fR and \\\\fBin1\\\\fR according to the following rule:\n.RS\n.TP\n\\\\fBin0=TRUE in1=TRUE\\\\fB\n\\\\fBout=TRUE\\\\fR\n.TP\nOtherwise,\n\\\\fBout=FALSE\\\\fR\n.RE",
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
            'component and2 "Two-input AND gate";\npin in bit in0;\npin in bit in1;\npin out bit out """\\\n\\\\fBout\\\\fR is computed from the value of \\\\fBin0\\\\fR and \\\\fBin1\\\\fR according to the following rule:\n.RS\n.TP\n\\\\fBin0=TRUE in1=TRUE\\\\fB\n\\\\fBout=TRUE\\\\fR\n.TP\nOtherwise,\n\\\\fBout=FALSE\\\\fR\n.RE"""\n;\nfunction _ nofp;\nsee_also """\n.ie \'\\\\*[.T]\'html\' \\\\{\\\\\n.UR logic.9.html\n\\\\fBlogic\\\\fR(9)\n.UE\n\\\\}\n.el \\\\{\\\\\n\\\\fBlogic\\\\fR(9)\n\\\\}\n""";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:and2:and2",
        name: "and2",
        halComponentName: "and2",
        source: "comp",
        sourcePath: "src/hal/components/and2.comp",
        docs: {
          component: "Two-input AND gate",
          seeAlso:
            "\n\\\\fBlogic\\\\fR(9),\n\\\\fBlut5\\\\fR(9),\n\\\\fBnot\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9).\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "bit",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "\n.P\nThe \\\\fBout\\\\fR pin is computed from the value of the \\\\fBin0\\\\fR and\n\\\\fBin1\\\\fR pins according to the following rule:\n.RS\n.TP\n\\\\fBin0=TRUE in1=TRUE\\\\fB\n\\\\fBout=TRUE\\\\fR\n.TP\nOtherwise,\n\\\\fBout=FALSE\\\\fR\n.RE",
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
            'component and2 "Two-input AND gate";\npin in bit in0;\npin in bit in1;\npin out bit out """\n.P\nThe \\\\fBout\\\\fR pin is computed from the value of the \\\\fBin0\\\\fR and\n\\\\fBin1\\\\fR pins according to the following rule:\n.RS\n.TP\n\\\\fBin0=TRUE in1=TRUE\\\\fB\n\\\\fBout=TRUE\\\\fR\n.TP\nOtherwise,\n\\\\fBout=FALSE\\\\fR\n.RE"""\n;\nfunction _ nofp;\nsee_also """\n\\\\fBlogic\\\\fR(9),\n\\\\fBlut5\\\\fR(9),\n\\\\fBnot\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9).\n""";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:and2:and2",
        name: "and2",
        halComponentName: "and2",
        source: "comp",
        sourcePath: "src/hal/components/and2.comp",
        docs: {
          component: "Two-input AND gate",
          description:
            '\nThe *out* pin is computed from the value of the *in0* and *in1* pins according\nto the following truth table:\n\n[options="header",cols="^1,^1,^1"]\n|===\n^h|in1\n^h|in0\n^h|out\n\n|0|0|0\n|0|1|0\n|1|0|0\n|1|1|1\n|===\n\n',
          seeAlso:
            "\n*logic*(9),\n*lut5*(9),\n*not*(9),\n*or2*(9),\n*xor2*(9).\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in0",
            name: "in0",
            type: "bit",
            doc: "First input",
            direction: "in",
          },
          {
            key: "in1",
            name: "in1",
            type: "bit",
            doc: "Second input",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
            doc: "Output",
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
            'component and2 "Two-input AND gate";\npin in bit in0 "First input";\npin in bit in1 "Second input";\npin out bit out "Output";\n\ndescription """\nThe *out* pin is computed from the value of the *in0* and *in1* pins according\nto the following truth table:\n\n[options="header",cols="^1,^1,^1"]\n|===\n^h|in1\n^h|in0\n^h|out\n\n|0|0|0\n|0|1|0\n|1|0|0\n|1|1|1\n|===\n\n"""\n;\noption period no;\nfunction _ nofp;\nsee_also """\n*logic*(9),\n*lut5*(9),\n*not*(9),\n*or2*(9),\n*xor2*(9).\n""";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
