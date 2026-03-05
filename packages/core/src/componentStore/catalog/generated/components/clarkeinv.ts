import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "clarkeinv",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:clarkeinv:clarkeinv",
        name: "clarkeinv",
        halComponentName: "clarkeinv",
        source: "comp",
        sourcePath: "src/hal/components/clarkeinv.comp",
        docs: {
          component: "Inverse Clarke transform",
          description:
            "The inverse Clarke transform can be used rotate a \nvector quantity and then translate it from Cartesian coordinate\nsystem to a three phase system (three components 120 degrees apart).",
          seeAlso:
            "\\\\fBclarke2\\\\fR and \\\\fBclarke3\\\\fR for the forward transform.",
          license: "GPL",
        },
        pins: [
          {
            key: "x",
            name: "x",
            type: "float",
            direction: "in",
          },
          {
            key: "y",
            name: "y",
            type: "float",
            doc: "cartesian components of input",
            direction: "in",
          },
          {
            key: "h",
            name: "h",
            type: "float",
            doc: "homopolar component of input (usually zero)",
            direction: "in",
          },
          {
            key: "theta",
            name: "theta",
            type: "float",
            doc: "rotation angle: 0.00 to 1.00 = 0 to 360 degrees",
            direction: "in",
          },
          {
            key: "a",
            name: "a",
            type: "float",
            direction: "out",
          },
          {
            key: "b",
            name: "b",
            type: "float",
            direction: "out",
          },
          {
            key: "c",
            name: "c",
            type: "float",
            doc: "three phase output vector",
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
            'component clarkeinv "Inverse Clarke transform";\ndescription """The inverse Clarke transform can be used rotate a \nvector quantity and then translate it from Cartesian coordinate\nsystem to a three phase system (three components 120 degrees apart).""";\nsee_also """\\\\fBclarke2\\\\fR and \\\\fBclarke3\\\\fR for the forward transform.""";\npin in float x;\npin in float y "cartesian components of input";\npin in float h "homopolar component of input (usually zero)";\npin in float theta "rotation angle: 0.00 to 1.00 = 0 to 360 degrees";\npin out float a;\npin out float b;\npin out float c "three phase output vector";\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:clarkeinv:clarkeinv",
        name: "clarkeinv",
        halComponentName: "clarkeinv",
        source: "comp",
        sourcePath: "src/hal/components/clarkeinv.comp",
        docs: {
          component: "Inverse Clarke transform",
          description:
            "The inverse Clarke transform can be used rotate a \nvector quantity and then translate it from Cartesian coordinate\nsystem to a three phase system (three components 120 degrees apart).",
          seeAlso:
            "\\\\fBclarke2\\\\fR(9) and \\\\fBclarke3\\\\fR(9) for the forward transform.",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "x",
            name: "x",
            type: "float",
            direction: "in",
          },
          {
            key: "y",
            name: "y",
            type: "float",
            doc: "cartesian components of input",
            direction: "in",
          },
          {
            key: "h",
            name: "h",
            type: "float",
            doc: "homopolar component of input (usually zero)",
            direction: "in",
          },
          {
            key: "theta",
            name: "theta",
            type: "float",
            doc: "rotation angle: 0.00 to 1.00 = 0 to 360 degrees",
            direction: "in",
          },
          {
            key: "a",
            name: "a",
            type: "float",
            direction: "out",
          },
          {
            key: "b",
            name: "b",
            type: "float",
            direction: "out",
          },
          {
            key: "c",
            name: "c",
            type: "float",
            doc: "three phase output vector",
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
            'component clarkeinv "Inverse Clarke transform";\ndescription """The inverse Clarke transform can be used rotate a \nvector quantity and then translate it from Cartesian coordinate\nsystem to a three phase system (three components 120 degrees apart).""";\nsee_also """\\\\fBclarke2\\\\fR(9) and \\\\fBclarke3\\\\fR(9) for the forward transform.""";\npin in float x;\npin in float y "cartesian components of input";\npin in float h "homopolar component of input (usually zero)";\npin in float theta "rotation angle: 0.00 to 1.00 = 0 to 360 degrees";\npin out float a;\npin out float b;\npin out float c "three phase output vector";\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:clarkeinv:clarkeinv",
        name: "clarkeinv",
        halComponentName: "clarkeinv",
        source: "comp",
        sourcePath: "src/hal/components/clarkeinv.comp",
        docs: {
          component: "Inverse Clarke transform",
          description:
            "The inverse Clarke transform can be used rotate a \nvector quantity and then translate it from Cartesian coordinate\nsystem to a three phase system (three components 120 degrees apart).",
          seeAlso: "*clarke2*(9) and *clarke3*(9) for the forward transform.",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "x",
            name: "x",
            type: "float",
            direction: "in",
          },
          {
            key: "y",
            name: "y",
            type: "float",
            doc: "cartesian components of input",
            direction: "in",
          },
          {
            key: "h",
            name: "h",
            type: "float",
            doc: "homopolar component of input (usually zero)",
            direction: "in",
          },
          {
            key: "theta",
            name: "theta",
            type: "float",
            doc: "rotation angle: 0.00 to 1.00 = 0 to 360 degrees",
            direction: "in",
          },
          {
            key: "a",
            name: "a",
            type: "float",
            direction: "out",
          },
          {
            key: "b",
            name: "b",
            type: "float",
            direction: "out",
          },
          {
            key: "c",
            name: "c",
            type: "float",
            doc: "three phase output vector",
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
            'component clarkeinv "Inverse Clarke transform";\ndescription """The inverse Clarke transform can be used rotate a \nvector quantity and then translate it from Cartesian coordinate\nsystem to a three phase system (three components 120 degrees apart).""";\nsee_also """*clarke2*(9) and *clarke3*(9) for the forward transform.""";\npin in float x;\npin in float y "cartesian components of input";\npin in float h "homopolar component of input (usually zero)";\npin in float theta "rotation angle: 0.00 to 1.00 = 0 to 360 degrees";\npin out float a;\npin out float b;\npin out float c "three phase output vector";\noption period no;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
