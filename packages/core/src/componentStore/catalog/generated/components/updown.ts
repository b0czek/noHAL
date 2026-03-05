import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "updown",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:updown:updown",
        name: "updown",
        halComponentName: "updown",
        source: "comp",
        sourcePath: "src/hal/components/updown.comp",
        docs: {
          component:
            "Counts up or down, with optional limits and wraparound behavior",
          license: "GPL",
        },
        pins: [
          {
            key: "countup",
            name: "countup",
            type: "bit",
            doc: "Increment count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "countdown",
            name: "countdown",
            type: "bit",
            doc: "Decrement count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Reset count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "count",
            name: "count",
            type: "s32",
            doc: "The current count",
            direction: "out",
          },
        ],
        params: [
          {
            key: "clamp",
            name: "clamp",
            type: "bit",
            doc: "If TRUE, then clamp the output to the min and max parameters.",
            direction: "rw",
          },
          {
            key: "wrap",
            name: "wrap",
            type: "bit",
            doc: "If TRUE, then wrap around when the count goes above or below the min and max parameters.  Note that wrap implies (and overrides) clamp.",
            direction: "rw",
          },
          {
            key: "max",
            name: "max",
            type: "s32",
            doc: "If clamp or wrap is set, count will never exceed this number",
            defaultValue: "0x7FFFFFFF",
            direction: "rw",
          },
          {
            key: "min",
            name: "min",
            type: "s32",
            doc: "If clamp or wrap is set, count will never be less than this number",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Process inputs and update count if necessary",
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
            'component updown "Counts up or down, with optional limits and wraparound behavior";\npin in bit countup "Increment count when this pin goes from 0 to 1";\npin in bit countdown "Decrement count when this pin goes from 0 to 1";\npin in bit reset "Reset count when this pin goes from 0 to 1";\npin out s32 count "The current count";\nparam rw bit clamp "If TRUE, then clamp the output to the min and max parameters.";\nparam rw bit wrap "If TRUE, then wrap around when the count goes above or below the min and max parameters.  Note that wrap implies (and overrides) clamp.";\nparam rw s32 max = 0x7FFFFFFF "If clamp or wrap is set, count will never exceed this number";\nparam rw s32 min "If clamp or wrap is set, count will never be less than this number";\nvariable int oldup;\nvariable int olddown;\nvariable int first = 1;\nfunction _ nofp "Process inputs and update count if necessary";\nlicense "GPL";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:updown:updown",
        name: "updown",
        halComponentName: "updown",
        source: "comp",
        sourcePath: "src/hal/components/updown.comp",
        docs: {
          component:
            "Counts up or down, with optional limits and wraparound behavior",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "countup",
            name: "countup",
            type: "bit",
            doc: "Increment count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "countdown",
            name: "countdown",
            type: "bit",
            doc: "Decrement count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Reset count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "count",
            name: "count",
            type: "s32",
            doc: "The current count",
            direction: "out",
          },
        ],
        params: [
          {
            key: "clamp",
            name: "clamp",
            type: "bit",
            doc: "If TRUE, then clamp the output to the min and max parameters.",
            direction: "rw",
          },
          {
            key: "wrap",
            name: "wrap",
            type: "bit",
            doc: "If TRUE, then wrap around when the count goes above or below the min and max parameters.  Note that wrap implies (and overrides) clamp.",
            direction: "rw",
          },
          {
            key: "max",
            name: "max",
            type: "s32",
            doc: "If clamp or wrap is set, count will never exceed this number",
            defaultValue: "0x7FFFFFFF",
            direction: "rw",
          },
          {
            key: "min",
            name: "min",
            type: "s32",
            doc: "If clamp or wrap is set, count will never be less than this number",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Process inputs and update count if necessary",
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
            'component updown "Counts up or down, with optional limits and wraparound behavior";\npin in bit countup "Increment count when this pin goes from 0 to 1";\npin in bit countdown "Decrement count when this pin goes from 0 to 1";\npin in bit reset "Reset count when this pin goes from 0 to 1";\npin out s32 count "The current count";\nparam rw bit clamp "If TRUE, then clamp the output to the min and max parameters.";\nparam rw bit wrap "If TRUE, then wrap around when the count goes above or below the min and max parameters.  Note that wrap implies (and overrides) clamp.";\nparam rw s32 max = 0x7FFFFFFF "If clamp or wrap is set, count will never exceed this number";\nparam rw s32 min "If clamp or wrap is set, count will never be less than this number";\nvariable int oldup;\nvariable int olddown;\nvariable int first = 1;\nfunction _ nofp "Process inputs and update count if necessary";\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:updown:updown",
        name: "updown",
        halComponentName: "updown",
        source: "comp",
        sourcePath: "src/hal/components/updown.comp",
        docs: {
          component:
            "Counts up or down, with optional limits and wraparound behavior",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "countup",
            name: "countup",
            type: "bit",
            doc: "Increment count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "countdown",
            name: "countdown",
            type: "bit",
            doc: "Decrement count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "reset",
            name: "reset",
            type: "bit",
            doc: "Reset count when this pin goes from 0 to 1",
            direction: "in",
          },
          {
            key: "count",
            name: "count",
            type: "s32",
            doc: "The current count",
            direction: "out",
          },
        ],
        params: [
          {
            key: "clamp",
            name: "clamp",
            type: "bit",
            doc: "If TRUE, then clamp the output to the min and max parameters.",
            direction: "rw",
          },
          {
            key: "wrap",
            name: "wrap",
            type: "bit",
            doc: "If TRUE, then wrap around when the count goes above or below the min and max parameters.  Note that wrap implies (and overrides) clamp.",
            direction: "rw",
          },
          {
            key: "max",
            name: "max",
            type: "s32",
            doc: "If clamp or wrap is set, count will never exceed this number",
            defaultValue: "0x7FFFFFFF",
            direction: "rw",
          },
          {
            key: "min",
            name: "min",
            type: "s32",
            doc: "If clamp or wrap is set, count will never be less than this number",
            direction: "rw",
          },
        ],
        functions: [
          {
            key: "default",
            declaredName: "_",
            halSuffix: "",
            floatMode: "nofp",
            doc: "Process inputs and update count if necessary",
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
            'component updown "Counts up or down, with optional limits and wraparound behavior";\npin in bit countup "Increment count when this pin goes from 0 to 1";\npin in bit countdown "Decrement count when this pin goes from 0 to 1";\npin in bit reset "Reset count when this pin goes from 0 to 1";\npin out s32 count "The current count";\nparam rw bit clamp "If TRUE, then clamp the output to the min and max parameters.";\nparam rw bit wrap "If TRUE, then wrap around when the count goes above or below the min and max parameters.  Note that wrap implies (and overrides) clamp.";\nparam rw s32 max = 0x7FFFFFFF "If clamp or wrap is set, count will never exceed this number";\nparam rw s32 min "If clamp or wrap is set, count will never be less than this number";\nvariable int oldup;\nvariable int olddown;\nvariable int first = 1;\noption period no;\nfunction _ nofp "Process inputs and update count if necessary";\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n\n',
        },
      },
    },
  ],
};

export default history;
