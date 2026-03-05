import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "spindle_monitor",
  variants: [
    {
      fromVersion: "2.7",
      component: null,
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:spindle-monitor:spindle-monitor",
        name: "spindle_monitor",
        halComponentName: "spindle_monitor",
        source: "comp",
        sourcePath: "src/hal/components/spindle_monitor.comp",
        docs: {
          component: "spindle at-speed and underspeed detection",
          license: "gpl v2 or higher",
        },
        pins: [
          {
            key: "spindle_is_on",
            name: "spindle-is-on",
            type: "bit",
            direction: "in",
          },
          {
            key: "spindle_command",
            name: "spindle-command",
            type: "float",
            direction: "in",
          },
          {
            key: "spindle_feedback",
            name: "spindle-feedback",
            type: "float",
            direction: "in",
          },
          {
            key: "spindle_at_speed",
            name: "spindle-at-speed",
            type: "bit",
            direction: "out",
          },
          {
            key: "spindle_underspeed",
            name: "spindle-underspeed",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "level",
            name: "level",
            type: "u32",
            doc: "state machine state",
            direction: "rw",
          },
          {
            key: "threshold",
            name: "threshold",
            type: "float",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component spindle_monitor "spindle at-speed and underspeed detection";\npin in bit spindle-is-on;\npin in float spindle-command;\npin in float spindle-feedback;\n\npin out bit spindle-at-speed;\npin out bit spindle-underspeed;\n\nparam rw unsigned level "state machine state";\nparam rw float threshold;\n\nfunction _;\nlicense "gpl v2 or higher";\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:spindle-monitor:spindle-monitor",
        name: "spindle_monitor",
        halComponentName: "spindle_monitor",
        source: "comp",
        sourcePath: "src/hal/components/spindle_monitor.comp",
        docs: {
          component: "spindle at-speed and underspeed detection",
          license: "gpl v2 or higher",
          author: "Sebastian Kuzminsky",
        },
        pins: [
          {
            key: "spindle_is_on",
            name: "spindle-is-on",
            type: "bit",
            direction: "in",
          },
          {
            key: "spindle_command",
            name: "spindle-command",
            type: "float",
            direction: "in",
          },
          {
            key: "spindle_feedback",
            name: "spindle-feedback",
            type: "float",
            direction: "in",
          },
          {
            key: "spindle_at_speed",
            name: "spindle-at-speed",
            type: "bit",
            direction: "out",
          },
          {
            key: "spindle_underspeed",
            name: "spindle-underspeed",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "level",
            name: "level",
            type: "u32",
            doc: "state machine state",
            direction: "rw",
          },
          {
            key: "threshold",
            name: "threshold",
            type: "float",
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
          options: {},
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component spindle_monitor "spindle at-speed and underspeed detection";\npin in bit spindle-is-on;\npin in float spindle-command;\npin in float spindle-feedback;\n\npin out bit spindle-at-speed;\npin out bit spindle-underspeed;\n\nparam rw unsigned level "state machine state";\nparam rw float threshold;\n\nfunction _;\nlicense "gpl v2 or higher";\nauthor "Sebastian Kuzminsky";\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:spindle-monitor:spindle-monitor",
        name: "spindle_monitor",
        halComponentName: "spindle_monitor",
        source: "comp",
        sourcePath: "src/hal/components/spindle_monitor.comp",
        docs: {
          component: "spindle at-speed and underspeed detection",
          license: "gpl v2 or higher",
          author: "Sebastian Kuzminsky",
        },
        pins: [
          {
            key: "spindle_is_on",
            name: "spindle-is-on",
            type: "bit",
            direction: "in",
          },
          {
            key: "spindle_command",
            name: "spindle-command",
            type: "float",
            direction: "in",
          },
          {
            key: "spindle_feedback",
            name: "spindle-feedback",
            type: "float",
            direction: "in",
          },
          {
            key: "spindle_at_speed",
            name: "spindle-at-speed",
            type: "bit",
            direction: "out",
          },
          {
            key: "spindle_underspeed",
            name: "spindle-underspeed",
            type: "bit",
            direction: "out",
          },
        ],
        params: [
          {
            key: "level",
            name: "level",
            type: "u32",
            doc: "state machine state",
            direction: "rw",
          },
          {
            key: "threshold",
            name: "threshold",
            type: "float",
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
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component spindle_monitor "spindle at-speed and underspeed detection";\npin in bit spindle-is-on;\npin in float spindle-command;\npin in float spindle-feedback;\n\npin out bit spindle-at-speed;\npin out bit spindle-underspeed;\n\nparam rw unsigned level "state machine state";\nparam rw float threshold;\n\noption period no;\nfunction _;\nlicense "gpl v2 or higher";\nauthor "Sebastian Kuzminsky";\n\n',
        },
      },
    },
  ],
};

export default history;
