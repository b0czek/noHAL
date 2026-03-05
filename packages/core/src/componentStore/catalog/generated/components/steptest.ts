import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "steptest",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:steptest:steptest",
        name: "steptest",
        halComponentName: "steptest",
        source: "comp",
        sourcePath: "src/hal/components/steptest.comp",
        docs: {
          component:
            "\\\nUsed by Stepconf to allow testing of acceleration and velocity values for an axis.",
          license: "GPL",
        },
        pins: [
          {
            key: "jog_minus",
            name: "jog-minus",
            type: "bit",
            doc: "Drive TRUE to jog the axis in its minus direction",
            direction: "in",
          },
          {
            key: "jog_plus",
            name: "jog-plus",
            type: "bit",
            doc: "Drive TRUE to jog the axis in its positive direction",
            direction: "in",
          },
          {
            key: "run",
            name: "run",
            type: "bit",
            doc: "Drive TRUE to run the axis near its current position_fb with a trapezoidal velocity profile",
            direction: "in",
          },
          {
            key: "maxvel",
            name: "maxvel",
            type: "float",
            doc: "Maximum velocity",
            direction: "in",
          },
          {
            key: "maxaccel",
            name: "maxaccel",
            type: "float",
            doc: "Permitted Acceleration",
            direction: "in",
          },
          {
            key: "amplitude",
            name: "amplitude",
            type: "float",
            doc: "Approximate amplitude of positions to command during 'run'",
            direction: "in",
          },
          {
            key: "dir",
            name: "dir",
            type: "s32",
            doc: "Direction from central point to test: 0 = both, 1 = positive, 2 = negative",
            direction: "in",
          },
          {
            key: "position_cmd",
            name: "position-cmd",
            type: "float",
            direction: "out",
          },
          {
            key: "position_fb",
            name: "position-fb",
            type: "float",
            direction: "in",
          },
          {
            key: "running",
            name: "running",
            type: "bit",
            direction: "out",
          },
          {
            key: "run_target",
            name: "run-target",
            type: "float",
            direction: "out",
          },
          {
            key: "run_start",
            name: "run-start",
            type: "float",
            direction: "out",
          },
          {
            key: "run_low",
            name: "run-low",
            type: "float",
            direction: "out",
          },
          {
            key: "run_high",
            name: "run-high",
            type: "float",
            direction: "out",
          },
          {
            key: "pause",
            name: "pause",
            type: "s32",
            doc: "pause time for each end of run in seconds",
            defaultValue: "0",
            direction: "in",
          },
        ],
        params: [
          {
            key: "epsilon",
            name: "epsilon",
            type: "float",
            defaultValue: ".001",
            direction: "rw",
          },
          {
            key: "elapsed",
            name: "elapsed",
            type: "float",
            doc: "Current value of the internal timer",
            direction: "r",
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
            'component steptest """\\\nUsed by Stepconf to allow testing of acceleration and velocity values for an axis.""";\npin in bit jog-minus "Drive TRUE to jog the axis in its minus direction";\npin in bit jog-plus "Drive TRUE to jog the axis in its positive direction";\npin in bit run "Drive TRUE to run the axis near its current position_fb with a trapezoidal velocity profile";\npin in float maxvel "Maximum velocity";\npin in float maxaccel "Permitted Acceleration";\npin in float amplitude "Approximate amplitude of positions to command during \'run\'";\npin in s32 dir "Direction from central point to test: 0 = both, 1 = positive, 2 = negative";\npin out float position-cmd;\npin in float position-fb;\npin out bit running;\npin out float run-target;\npin out float run-start;\npin out float run-low;\npin out float run-high;\npin in s32 pause = 0 "pause time for each end of run in seconds";\nparam rw float epsilon = .001;\nvariable double timer;\nparam r float elapsed "Current value of the internal timer";\nvariable int timer_on;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:steptest:steptest",
        name: "steptest",
        halComponentName: "steptest",
        source: "comp",
        sourcePath: "src/hal/components/steptest.comp",
        docs: {
          component:
            "\\\nUsed by Stepconf to allow testing of acceleration and velocity values for an axis.",
          license: "GPL",
          author: "Jeff Epler",
        },
        pins: [
          {
            key: "jog_minus",
            name: "jog-minus",
            type: "bit",
            doc: "Drive TRUE to jog the axis in its minus direction",
            direction: "in",
          },
          {
            key: "jog_plus",
            name: "jog-plus",
            type: "bit",
            doc: "Drive TRUE to jog the axis in its positive direction",
            direction: "in",
          },
          {
            key: "run",
            name: "run",
            type: "bit",
            doc: "Drive TRUE to run the axis near its current position_fb with a trapezoidal velocity profile",
            direction: "in",
          },
          {
            key: "maxvel",
            name: "maxvel",
            type: "float",
            doc: "Maximum velocity",
            direction: "in",
          },
          {
            key: "maxaccel",
            name: "maxaccel",
            type: "float",
            doc: "Permitted Acceleration",
            direction: "in",
          },
          {
            key: "amplitude",
            name: "amplitude",
            type: "float",
            doc: "Approximate amplitude of positions to command during 'run'",
            direction: "in",
          },
          {
            key: "dir",
            name: "dir",
            type: "s32",
            doc: "Direction from central point to test: 0 = both, 1 = positive, 2 = negative",
            direction: "in",
          },
          {
            key: "position_cmd",
            name: "position-cmd",
            type: "float",
            direction: "out",
          },
          {
            key: "position_fb",
            name: "position-fb",
            type: "float",
            direction: "in",
          },
          {
            key: "running",
            name: "running",
            type: "bit",
            direction: "out",
          },
          {
            key: "run_target",
            name: "run-target",
            type: "float",
            direction: "out",
          },
          {
            key: "run_start",
            name: "run-start",
            type: "float",
            direction: "out",
          },
          {
            key: "run_low",
            name: "run-low",
            type: "float",
            direction: "out",
          },
          {
            key: "run_high",
            name: "run-high",
            type: "float",
            direction: "out",
          },
          {
            key: "pause",
            name: "pause",
            type: "s32",
            doc: "pause time for each end of run in seconds",
            defaultValue: "0",
            direction: "in",
          },
        ],
        params: [
          {
            key: "epsilon",
            name: "epsilon",
            type: "float",
            defaultValue: ".001",
            direction: "rw",
          },
          {
            key: "elapsed",
            name: "elapsed",
            type: "float",
            doc: "Current value of the internal timer",
            direction: "r",
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
            'component steptest """\\\nUsed by Stepconf to allow testing of acceleration and velocity values for an axis.""";\npin in bit jog-minus "Drive TRUE to jog the axis in its minus direction";\npin in bit jog-plus "Drive TRUE to jog the axis in its positive direction";\npin in bit run "Drive TRUE to run the axis near its current position_fb with a trapezoidal velocity profile";\npin in float maxvel "Maximum velocity";\npin in float maxaccel "Permitted Acceleration";\npin in float amplitude "Approximate amplitude of positions to command during \'run\'";\npin in s32 dir "Direction from central point to test: 0 = both, 1 = positive, 2 = negative";\npin out float position-cmd;\npin in float position-fb;\npin out bit running;\npin out float run-target;\npin out float run-start;\npin out float run-low;\npin out float run-high;\npin in s32 pause = 0 "pause time for each end of run in seconds";\nparam rw float epsilon = .001;\nvariable double timer;\nparam r float elapsed "Current value of the internal timer";\nvariable int timer_on;\nfunction _;\nlicense "GPL";\nauthor "Jeff Epler";\n',
        },
      },
    },
  ],
};

export default history;
