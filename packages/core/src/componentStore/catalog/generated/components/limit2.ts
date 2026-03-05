import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "limit2",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:limit2:limit2",
        name: "limit2",
        halComponentName: "limit2",
        source: "comp",
        sourcePath: "src/hal/components/limit2.comp",
        docs: {
          component:
            "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.",
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
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, immediately set \\fBout\\fB to \\fBin\\fR, ignoring maxv",
            direction: "in",
          },
        ],
        params: [
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
            direction: "rw",
          },
          {
            key: "max",
            name: "max",
            type: "float",
            defaultValue: "1e20",
            direction: "rw",
          },
          {
            key: "maxv",
            name: "maxv",
            type: "float",
            defaultValue: "1e20",
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
            data: "limit2_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component limit2 "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.";\npin in float in;\npin out float out;\npin in bit load "When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv";\nparam rw float min_=-1e20;\nparam rw float max_=1e20;\nparam rw float maxv=1e20;\noption data limit2_data;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:limit2:limit2",
        name: "limit2",
        halComponentName: "limit2",
        source: "comp",
        sourcePath: "src/hal/components/limit2.comp",
        docs: {
          component:
            "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.",
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
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, immediately set \\fBout\\fB to \\fBin\\fR, ignoring maxv",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
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
            key: "maxv",
            name: "maxv",
            type: "float",
            defaultValue: "1e20",
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
            data: "limit2_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component limit2 "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.";\npin in float in;\npin out float out;\npin in bit load "When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv";\npin in float min_=-1e20;\npin in float max_=1e20;\npin in float maxv=1e20;\noption data limit2_data;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:limit2:limit2",
        name: "limit2",
        halComponentName: "limit2",
        source: "comp",
        sourcePath: "src/hal/components/limit2.comp",
        docs: {
          component:
            "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.",
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
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, immediately set \\fBout\\fB to \\fBin\\fR, ignoring maxv",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
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
            key: "maxv",
            name: "maxv",
            type: "float",
            defaultValue: "1e20",
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
            data: "limit2_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component limit2 "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.";\npin in float in;\npin out float out;\npin in bit load "When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv";\npin in float min_=-1e20;\npin in float max_=1e20;\npin in float maxv=1e20;\noption data limit2_data;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:limit2:limit2",
        name: "limit2",
        halComponentName: "limit2",
        source: "comp",
        sourcePath: "src/hal/components/limit2.comp",
        docs: {
          component:
            "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.",
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
            key: "out",
            name: "out",
            type: "float",
            direction: "out",
          },
          {
            key: "load",
            name: "load",
            type: "bit",
            doc: "When TRUE, immediately set *out* to *in*, ignoring maxv",
            direction: "in",
          },
          {
            key: "min",
            name: "min",
            type: "float",
            defaultValue: "-1e20",
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
            key: "maxv",
            name: "maxv",
            type: "float",
            defaultValue: "1e20",
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
            data: "limit2_data",
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component limit2 "Limit the output signal to fall between min and max and limit its slew rate to less than maxv per second.  When the signal is a position, this means that position and velocity are limited.";\npin in float in;\npin out float out;\npin in bit load "When TRUE, immediately set *out* to *in*, ignoring maxv";\npin in float min_=-1e20;\npin in float max_=1e20;\npin in float maxv=1e20;\noption data limit2_data;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
