import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "integ",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:integ:integ",
        name: "integ",
        halComponentName: "integ",
        source: "comp",
        sourcePath: "src/hal/components/integ.comp",
        docs: {
          component: "Integrator with gain pin and windup limits",
          license: "GPL",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "The discrete integral of 'gain * in' since 'reset' was deasserted",
            direction: "out",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "When asserted, set out to 0",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            defaultValue: "1e20",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
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
            'component integ "Integrator with gain pin and windup limits";\npin in float in;\npin in float gain = 1.0;\npin out float out "The discrete integral of \'gain * in\' since \'reset\' was deasserted";\npin in bit reset "When asserted, set out to 0";\npin in float max_ =  1e20;\n\npin in float min_ = -1e20;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:integ:integ",
        name: "integ",
        halComponentName: "integ",
        source: "comp",
        sourcePath: "src/hal/components/integ.comp",
        docs: {
          component: "Integrator with gain pin and windup limits",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "gain",
            name: "gain",
            type: "float",
            defaultValue: "1.0",
            direction: "in",
          },
          {
            key: "out",
            name: "out",
            type: "float",
            doc: "The discrete integral of 'gain * in' since 'reset' was deasserted",
            direction: "out",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "When asserted, set out to 0",
            direction: "in",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            defaultValue: "1e20",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
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
            'component integ "Integrator with gain pin and windup limits";\npin in float in;\npin in float gain = 1.0;\npin out float out "The discrete integral of \'gain * in\' since \'reset\' was deasserted";\npin in bit reset "When asserted, set out to 0";\npin in float max_ =  1e20;\n\npin in float min_ = -1e20;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
