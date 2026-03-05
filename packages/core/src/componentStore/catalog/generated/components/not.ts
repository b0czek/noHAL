import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "not",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:not:not",
        name: "not",
        halComponentName: "not",
        source: "comp",
        sourcePath: "src/hal/components/not.comp",
        docs: {
          component: "Inverter",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
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
            'component not "Inverter";\npin in bit in;\npin out bit out;\nfunction _ nofp;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:not:not",
        name: "not",
        halComponentName: "not",
        source: "comp",
        sourcePath: "src/hal/components/not.comp",
        docs: {
          component: "Inverter",
          seeAlso:
            "\n\\\\fBand2\\\\fR(9),\n\\\\fBlogic\\\\fR(9),\n\\\\fBlut5\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9).\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
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
            'component not "Inverter";\npin in bit in;\npin out bit out;\nfunction _ nofp;\nsee_also """\n\\\\fBand2\\\\fR(9),\n\\\\fBlogic\\\\fR(9),\n\\\\fBlut5\\\\fR(9),\n\\\\fBor2\\\\fR(9),\n\\\\fBxor2\\\\fR(9).\n""";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:not:not",
        name: "not",
        halComponentName: "not",
        source: "comp",
        sourcePath: "src/hal/components/not.comp",
        docs: {
          component: "Inverter",
          description:
            "\nThe *out* output pin is set to the inverted logic level of the *in* input pin.\n",
          seeAlso:
            "\n*and2*(9),\n*logic*(9),\n*lut5*(9),\n*or2*(9),\n*xor2*(9).\n",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
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
            'component not "Inverter";\npin in bit in;\npin out bit out;\ndescription """\nThe *out* output pin is set to the inverted logic level of the *in* input pin.\n""";\nfunction _ nofp;\nsee_also """\n*and2*(9),\n*logic*(9),\n*lut5*(9),\n*or2*(9),\n*xor2*(9).\n""";\nlicense "GPL";\nauthor "Jeff Epler";\noption period no;\n',
        },
      },
    },
  ],
};

export default history;
