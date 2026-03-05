import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "clarke3",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:clarke3:clarke3",
        name: "clarke3",
        halComponentName: "clarke3",
        source: "comp",
        sourcePath: "src/hal/components/clarke3.comp",
        docs: {
          component: "Clarke (3 phase to cartesian) transform",
          description:
            "The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system (plus a homopolar component\nif the three phases don't sum to zero).\\n.P\\n\\\\fBclarke3\\\\fR implements\nthe general case of the transform, using all three phases.  If the\nthree phases are known to sum to zero, see \\\\fBclarke2\\\\fR for a\nsimpler version.",
          seeAlso:
            "\\\\fBclarke2\\\\fR for the 'a+b+c=0' case, \\\\fBclarkeinv\\\\fR for\nthe inverse transform.",
          license: "GPL",
        },
        pins: [
          {
            key: "a",
            name: "a",
            type: "float",
            direction: "in",
          },
          {
            key: "b",
            name: "b",
            type: "float",
            direction: "in",
          },
          {
            key: "c",
            name: "c",
            type: "float",
            doc: "three phase input vector",
            direction: "in",
          },
          {
            key: "x",
            name: "x",
            type: "float",
            direction: "out",
          },
          {
            key: "y",
            name: "y",
            type: "float",
            doc: "cartesian components of output",
            direction: "out",
          },
          {
            key: "h",
            name: "h",
            type: "float",
            doc: "homopolar component of output",
            direction: "out",
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
            'component clarke3 "Clarke (3 phase to cartesian) transform";\ndescription """The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system (plus a homopolar component\nif the three phases don\'t sum to zero).\\n.P\\n\\\\fBclarke3\\\\fR implements\nthe general case of the transform, using all three phases.  If the\nthree phases are known to sum to zero, see \\\\fBclarke2\\\\fR for a\nsimpler version.""";\nsee_also """\\\\fBclarke2\\\\fR for the \'a+b+c=0\' case, \\\\fBclarkeinv\\\\fR for\nthe inverse transform.""";\npin in float a;\npin in float b;\npin in float c "three phase input vector";\npin out float x;\npin out float y "cartesian components of output";\npin out float h "homopolar component of output";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:clarke3:clarke3",
        name: "clarke3",
        halComponentName: "clarke3",
        source: "comp",
        sourcePath: "src/hal/components/clarke3.comp",
        docs: {
          component: "Clarke (3 phase to cartesian) transform",
          description:
            "The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system (plus a homopolar component\nif the three phases don't sum to zero).\\n.P\\n\\\\fBclarke3\\\\fR implements\nthe general case of the transform, using all three phases.  If the\nthree phases are known to sum to zero, see \\\\fBclarke2\\\\fR for a\nsimpler version.",
          seeAlso:
            "\\\\fBclarke2\\\\fR(9) for the 'a+b+c=0' case, \\\\fBclarkeinv\\\\fR(9) for\nthe inverse transform.",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "a",
            name: "a",
            type: "float",
            direction: "in",
          },
          {
            key: "b",
            name: "b",
            type: "float",
            direction: "in",
          },
          {
            key: "c",
            name: "c",
            type: "float",
            doc: "three phase input vector",
            direction: "in",
          },
          {
            key: "x",
            name: "x",
            type: "float",
            direction: "out",
          },
          {
            key: "y",
            name: "y",
            type: "float",
            doc: "cartesian components of output",
            direction: "out",
          },
          {
            key: "h",
            name: "h",
            type: "float",
            doc: "homopolar component of output",
            direction: "out",
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
            'component clarke3 "Clarke (3 phase to cartesian) transform";\ndescription """The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system (plus a homopolar component\nif the three phases don\'t sum to zero).\\n.P\\n\\\\fBclarke3\\\\fR implements\nthe general case of the transform, using all three phases.  If the\nthree phases are known to sum to zero, see \\\\fBclarke2\\\\fR for a\nsimpler version.""";\nsee_also """\\\\fBclarke2\\\\fR(9) for the \'a+b+c=0\' case, \\\\fBclarkeinv\\\\fR(9) for\nthe inverse transform.""";\npin in float a;\npin in float b;\npin in float c "three phase input vector";\npin out float x;\npin out float y "cartesian components of output";\npin out float h "homopolar component of output";\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:clarke3:clarke3",
        name: "clarke3",
        halComponentName: "clarke3",
        source: "comp",
        sourcePath: "src/hal/components/clarke3.comp",
        docs: {
          component: "Clarke (3 phase to cartesian) transform",
          description:
            "The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system (plus a homopolar component\nif the three phases don't sum to zero). +\n*clarke3* implements\nthe general case of the transform, using all three phases.  If the\nthree phases are known to sum to zero, see *clarke2* for a\nsimpler version.",
          seeAlso:
            "*clarke2*(9) for the 'a+b+c=0' case, *clarkeinv*(9) for\nthe inverse transform.",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "a",
            name: "a",
            type: "float",
            direction: "in",
          },
          {
            key: "b",
            name: "b",
            type: "float",
            direction: "in",
          },
          {
            key: "c",
            name: "c",
            type: "float",
            doc: "three phase input vector",
            direction: "in",
          },
          {
            key: "x",
            name: "x",
            type: "float",
            direction: "out",
          },
          {
            key: "y",
            name: "y",
            type: "float",
            doc: "cartesian components of output",
            direction: "out",
          },
          {
            key: "h",
            name: "h",
            type: "float",
            doc: "homopolar component of output",
            direction: "out",
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
            'component clarke3 "Clarke (3 phase to cartesian) transform";\ndescription """The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system (plus a homopolar component\nif the three phases don\'t sum to zero). +\n*clarke3* implements\nthe general case of the transform, using all three phases.  If the\nthree phases are known to sum to zero, see *clarke2* for a\nsimpler version.""";\nsee_also """*clarke2*(9) for the \'a+b+c=0\' case, *clarkeinv*(9) for\nthe inverse transform.""";\npin in float a;\npin in float b;\npin in float c "three phase input vector";\npin out float x;\npin out float y "cartesian components of output";\npin out float h "homopolar component of output";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
