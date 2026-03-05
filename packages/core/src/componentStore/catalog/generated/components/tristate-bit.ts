import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "tristate_bit",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:tristate-bit:tristate-bit",
        name: "tristate_bit",
        halComponentName: "tristate_bit",
        source: "comp",
        sourcePath: "src/hal/components/tristate_bit.comp",
        docs: {
          component:
            "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "bit",
            doc: "Input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
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
            floatMode: "nofp",
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
            'component tristate_bit "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics";\n\npin in bit in_ "Input value";\npin io bit out "Output value";\npin in bit enable "When TRUE, copy in to out";\n\nfunction _ nofp "If \\\\fBenable\\\\fR is TRUE, copy \\\\fBin\\\\fR to \\\\fBout\\\\fR.";\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:tristate-bit:tristate-bit",
        name: "tristate_bit",
        halComponentName: "tristate_bit",
        source: "comp",
        sourcePath: "src/hal/components/tristate_bit.comp",
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
            type: "bit",
            doc: "Input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
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
            floatMode: "nofp",
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
            'component tristate_bit "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics";\n\npin in bit in_ "Input value";\npin io bit out "Output value";\npin in bit enable "When TRUE, copy in to out";\n\nfunction _ nofp "If \\\\fBenable\\\\fR is TRUE, copy \\\\fBin\\\\fR to \\\\fBout\\\\fR.";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:tristate-bit:tristate-bit",
        name: "tristate_bit",
        halComponentName: "tristate_bit",
        source: "comp",
        sourcePath: "src/hal/components/tristate_bit.comp",
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
            type: "bit",
            doc: "Input value",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "bit",
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
            floatMode: "nofp",
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
            'component tristate_bit "Place a signal on an I/O pin only when enabled, similar to a tristate buffer in electronics";\n\npin in bit in_ "Input value";\npin io bit out "Output value";\npin in bit enable "When TRUE, copy in to out";\n\noption period no;\nfunction _ nofp "If *enable* is TRUE, copy *in* to *out*.";\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
