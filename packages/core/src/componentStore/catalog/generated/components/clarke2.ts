import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "clarke2",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:clarke2:clarke2",
        name: "clarke2",
        halComponentName: "clarke2",
        source: "comp",
        sourcePath: "src/hal/components/clarke2.comp",
        docs: {
          component: "Two input version of Clarke transform",
          description:
            "The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system.\\n.P\\n\\\\fBclarke2\\\\fR implements\na special case of the Clarke transform, which only needs two of the\nthree input phases.  In a three wire three phase system, the sum of the\nthree phase currents or voltages must always be zero.  As a result only\ntwo of the three are needed to completely define the current or voltage.\n\\\\fBclarke2\\\\fR assumes that the sum is zero, so it only uses phases A and\nB of the input.  Since the H (homopolar) output will always be zero in\nthis case, it is not generated.",
          seeAlso:
            "\\\\fBclarke3\\\\fR for the general case, \\\\fBclarkeinv\\\\fR for\nthe inverse transform.",
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
            doc: "first two phases of three phase input",
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
            'component clarke2 "Two input version of Clarke transform";\ndescription """The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system.\\n.P\\n\\\\fBclarke2\\\\fR implements\na special case of the Clarke transform, which only needs two of the\nthree input phases.  In a three wire three phase system, the sum of the\nthree phase currents or voltages must always be zero.  As a result only\ntwo of the three are needed to completely define the current or voltage.\n\\\\fBclarke2\\\\fR assumes that the sum is zero, so it only uses phases A and\nB of the input.  Since the H (homopolar) output will always be zero in\nthis case, it is not generated.""";\nsee_also """\\\\fBclarke3\\\\fR for the general case, \\\\fBclarkeinv\\\\fR for\nthe inverse transform.""";\npin in float a;\npin in float b "first two phases of three phase input";\npin out float x;\npin out float y "cartesian components of output";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:clarke2:clarke2",
        name: "clarke2",
        halComponentName: "clarke2",
        source: "comp",
        sourcePath: "src/hal/components/clarke2.comp",
        docs: {
          component: "Two input version of Clarke transform",
          description:
            "The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system.\\n.P\\n\\\\fBclarke2\\\\fR implements\na special case of the Clarke transform, which only needs two of the\nthree input phases.  In a three wire three phase system, the sum of the\nthree phase currents or voltages must always be zero.  As a result only\ntwo of the three are needed to completely define the current or voltage.\n\\\\fBclarke2\\\\fR assumes that the sum is zero, so it only uses phases A and\nB of the input.  Since the H (homopolar) output will always be zero in\nthis case, it is not generated.",
          seeAlso:
            "\\\\fBclarke3\\\\fR(9) for the general case, \\\\fBclarkeinv\\\\fR(9) for\nthe inverse transform.",
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
            doc: "first two phases of three phase input",
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
            'component clarke2 "Two input version of Clarke transform";\ndescription """The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system.\\n.P\\n\\\\fBclarke2\\\\fR implements\na special case of the Clarke transform, which only needs two of the\nthree input phases.  In a three wire three phase system, the sum of the\nthree phase currents or voltages must always be zero.  As a result only\ntwo of the three are needed to completely define the current or voltage.\n\\\\fBclarke2\\\\fR assumes that the sum is zero, so it only uses phases A and\nB of the input.  Since the H (homopolar) output will always be zero in\nthis case, it is not generated.""";\nsee_also """\\\\fBclarke3\\\\fR(9) for the general case, \\\\fBclarkeinv\\\\fR(9) for\nthe inverse transform.""";\npin in float a;\npin in float b "first two phases of three phase input";\npin out float x;\npin out float y "cartesian components of output";\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:clarke2:clarke2",
        name: "clarke2",
        halComponentName: "clarke2",
        source: "comp",
        sourcePath: "src/hal/components/clarke2.comp",
        docs: {
          component: "Two input version of Clarke transform",
          description:
            "The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system. +\n*clarke2* implements\na special case of the Clarke transform, which only needs two of the\nthree input phases.  In a three wire three phase system, the sum of the\nthree phase currents or voltages must always be zero.  As a result only\ntwo of the three are needed to completely define the current or voltage.\n*clarke2* assumes that the sum is zero, so it only uses phases A and\nB of the input.  Since the H (homopolar) output will always be zero in\nthis case, it is not generated.",
          seeAlso:
            "*clarke3*(9) for the general case, *clarkeinv*(9) for\nthe inverse transform.",
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
            doc: "first two phases of three phase input",
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
            'component clarke2 "Two input version of Clarke transform";\ndescription """The Clarke transform can be used to translate a vector\nquantity from a three phase system (three components 120 degrees\napart) to a two phase Cartesian system. +\n*clarke2* implements\na special case of the Clarke transform, which only needs two of the\nthree input phases.  In a three wire three phase system, the sum of the\nthree phase currents or voltages must always be zero.  As a result only\ntwo of the three are needed to completely define the current or voltage.\n*clarke2* assumes that the sum is zero, so it only uses phases A and\nB of the input.  Since the H (homopolar) output will always be zero in\nthis case, it is not generated.""";\nsee_also """*clarke3*(9) for the general case, *clarkeinv*(9) for\nthe inverse transform.""";\npin in float a;\npin in float b "first two phases of three phase input";\npin out float x;\npin out float y "cartesian components of output";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
