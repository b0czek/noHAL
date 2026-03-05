import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "sim_spindle",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:sim-spindle:sim-spindle",
        name: "sim_spindle",
        halComponentName: "sim_spindle",
        source: "comp",
        sourcePath: "src/hal/components/sim_spindle.comp",
        docs: {
          component: "Simulated spindle with index pulse",
          license: "GPL",
        },
        pins: [
          {
            key: "velocity_cmd",
            name: "velocity-cmd",
            type: "float",
            doc: "Commanded speed",
            direction: "in",
          },
          {
            key: "position_fb",
            name: "position-fb",
            type: "float",
            doc: "Feedback position, in revolutions",
            direction: "out",
          },
          {
            key: "index_enable",
            name: "index-enable",
            type: "bit",
            doc: "Reset \\fBposition-fb\\fP to 0 at the next full rotation",
            direction: "io",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "factor applied to \\\\fBvelocity-cmd\\\\fP.\n\nThe result of '\\\\fBvelocity-cmd\\\\fP * \\\\fBscale\\\\fP' be in revolutions per second.\nFor example, if \\\\fBvelocity-cmd\\\\fP is in revolutions/minute, \\\\fBscale\\\\fP should be set to 1/60 or 0.016666667.\n",
            defaultValue: "1.0",
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
            'component sim_spindle "Simulated spindle with index pulse";\n\npin in float velocity-cmd "Commanded speed";\npin out float position-fb "Feedback position, in revolutions";\npin io bit index-enable "Reset \\\\fBposition-fb\\\\fP to 0 at the next full rotation";\nparam rw float scale = 1.0 \n"""factor applied to \\\\fBvelocity-cmd\\\\fP.\n\nThe result of \'\\\\fBvelocity-cmd\\\\fP * \\\\fBscale\\\\fP\' be in revolutions per second.\nFor example, if \\\\fBvelocity-cmd\\\\fP is in revolutions/minute, \\\\fBscale\\\\fP should be set to 1/60 or 0.016666667.\n""";\n\nlicense "GPL";\n\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:sim-spindle:sim-spindle",
        name: "sim_spindle",
        halComponentName: "sim_spindle",
        source: "comp",
        sourcePath: "src/hal/components/sim_spindle.comp",
        docs: {
          component: "Simulated spindle with index pulse",
          license: "GPL",
          author: "Michael Haberler",
        },
        pins: [
          {
            key: "velocity_cmd",
            name: "velocity-cmd",
            type: "float",
            doc: "Commanded speed",
            direction: "in",
          },
          {
            key: "position_fb",
            name: "position-fb",
            type: "float",
            doc: "Feedback position, in revolutions",
            direction: "out",
          },
          {
            key: "index_enable",
            name: "index-enable",
            type: "bit",
            doc: "Reset \\fBposition-fb\\fP to 0 at the next full rotation",
            direction: "io",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "factor applied to \\\\fBvelocity-cmd\\\\fP.\n\nThe result of '\\\\fBvelocity-cmd\\\\fP * \\\\fBscale\\\\fP' be in revolutions per second.\nFor example, if \\\\fBvelocity-cmd\\\\fP is in revolutions/minute, \\\\fBscale\\\\fP should be set to 1/60 or 0.016666667.\n",
            defaultValue: "1.0",
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
            'component sim_spindle "Simulated spindle with index pulse";\n\npin in float velocity-cmd "Commanded speed";\npin out float position-fb "Feedback position, in revolutions";\npin io bit index-enable "Reset \\\\fBposition-fb\\\\fP to 0 at the next full rotation";\nparam rw float scale = 1.0 \n"""factor applied to \\\\fBvelocity-cmd\\\\fP.\n\nThe result of \'\\\\fBvelocity-cmd\\\\fP * \\\\fBscale\\\\fP\' be in revolutions per second.\nFor example, if \\\\fBvelocity-cmd\\\\fP is in revolutions/minute, \\\\fBscale\\\\fP should be set to 1/60 or 0.016666667.\n""";\n\nlicense "GPL";\nauthor "Michael Haberler";\n\nfunction _;\n\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:sim-spindle:sim-spindle",
        name: "sim_spindle",
        halComponentName: "sim_spindle",
        source: "comp",
        sourcePath: "src/hal/components/sim_spindle.comp",
        docs: {
          component: "Simulated spindle with index pulse",
          license: "GPL",
          author: "Michael Haberler",
        },
        pins: [
          {
            key: "velocity_cmd",
            name: "velocity-cmd",
            type: "float",
            doc: "Commanded speed",
            direction: "in",
          },
          {
            key: "position_fb",
            name: "position-fb",
            type: "float",
            doc: "Feedback position, in revolutions",
            direction: "out",
          },
          {
            key: "index_enable",
            name: "index-enable",
            type: "bit",
            doc: "Reset *position-fb* to 0 at the next full rotation",
            direction: "io",
          },
        ],
        params: [
          {
            key: "scale",
            name: "scale",
            type: "float",
            doc: "factor applied to *velocity-cmd*.\n\nThe result of '*velocity-cmd* * *scale*' be in revolutions per second.\nFor example, if *velocity-cmd* is in revolutions/minute, *scale* should be set to 1/60 or 0.016666667.\n",
            defaultValue: "1.0",
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
            'component sim_spindle "Simulated spindle with index pulse";\n\npin in float velocity-cmd "Commanded speed";\npin out float position-fb "Feedback position, in revolutions";\npin io bit index-enable "Reset *position-fb* to 0 at the next full rotation";\nparam rw float scale = 1.0 \n"""factor applied to *velocity-cmd*.\n\nThe result of \'*velocity-cmd* * *scale*\' be in revolutions per second.\nFor example, if *velocity-cmd* is in revolutions/minute, *scale* should be set to 1/60 or 0.016666667.\n""";\n\nlicense "GPL";\nauthor "Michael Haberler";\n\nfunction _;\n\n',
        },
      },
    },
  ],
};

export default history;
