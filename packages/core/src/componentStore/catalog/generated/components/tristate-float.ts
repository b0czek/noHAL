import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "tristate_float",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:tristate-float:tristate-float",
        name: "tristate_float",
        halComponentName: "tristate_float",
        source: "comp",
        sourcePath: "src/hal/components/tristate_float.comp",
        docs: {
          component:
            "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value",
            direction: "io",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "When TRUE, copy in to out",
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
            doc: "If \\fBenable\\fR is TRUE, copy \\fBin\\fR to \\fBout\\fR.",
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
            'component tristate_float "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics";\n\npin in float in_ "Input value";\npin io float out "Output value";\npin in bit enable "When TRUE, copy in to out";\n\nfunction _  "If \\\\fBenable\\\\fR is TRUE, copy \\\\fBin\\\\fR to \\\\fBout\\\\fR.";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:tristate-float:tristate-float",
        name: "tristate_float",
        halComponentName: "tristate_float",
        source: "comp",
        sourcePath: "src/hal/components/tristate_float.comp",
        docs: {
          component:
            "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value",
            direction: "io",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "When TRUE, copy in to out",
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
            doc: "If \\fBenable\\fR is TRUE, copy \\fBin\\fR to \\fBout\\fR.",
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
            'component tristate_float "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics";\n\npin in float in_ "Input value";\npin io float out "Output value";\npin in bit enable "When TRUE, copy in to out";\n\nfunction _  "If \\\\fBenable\\\\fR is TRUE, copy \\\\fBin\\\\fR to \\\\fBout\\\\fR.";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:tristate-float:tristate-float",
        name: "tristate_float",
        halComponentName: "tristate_float",
        source: "comp",
        sourcePath: "src/hal/components/tristate_float.comp",
        docs: {
          component:
            "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            doc: "Input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "Output value",
            direction: "io",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "When TRUE, copy in to out",
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
            doc: "If *enable* is TRUE, copy *in* to *out*.",
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
            'component tristate_float "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics";\n\npin in float in_ "Input value";\npin io float out "Output value";\npin in bit enable "When TRUE, copy in to out";\n\noption period no;\nfunction _  "If *enable* is TRUE, copy *in* to *out*.";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
