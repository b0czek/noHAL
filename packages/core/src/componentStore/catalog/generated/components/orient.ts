import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "orient",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:orient:orient",
        name: "orient",
        halComponentName: "orient",
        source: "comp",
        sourcePath: "src/hal/components/orient.comp",
        docs: {
          component:
            "Provide a PID command input for orientation mode based on current spindle position, target angle and orient mode",
          author: "Michael Haberler",
          description:
            "\nThis component is designed to support a spindle orientation PID loop by providing a \ncommand value, and fit with the motion spindle-orient support pins to support the M19 code.\n\nThe spindle is assumed to have stopped in an arbitrary position. The spindle\nencoder position is linked to the  \\\\fBposition\\\\fR pin.\nThe  current value of the position pin is sampled on a positive edge on the \\\\fBenable\\\\fR pin, and \n\\\\fBcommand\\\\fR is computed and set as follows: floor(number of \nfull spindle revolutions \nin the \\\\fBposition\\\\fR sampled on positive edge) \nplus \\\\fBangle\\\\fR/360 (the fractional revolution) +1/-1/0 depending on \\\\fBmode\\\\fR.\n\nThe \\\\fBmode\\\\fR pin is interpreted as follows:\n\n0: the spindle rotates in the direction with the lesser angle, \nwhich may be clockwise or counterclockwise.\n\n1: the spindle rotates always rotates clockwise to the new angle.\n\n2: the spindle rotates always rotates counterclockwise to the new angle.\n \n\n.SH HAL USAGE\n\nOn \\\\fBmotion.spindle-orient\\\\fR disconnect the spindle control and connect to the orient-pid \nloop:\n\nloadrt orient names=orient\n.br\nloadrt pid names=orient-pid\n.br\nnet orient-angle motion.spindle-orient-angle orient.angle\n.br\nnet orient-mode motion.spindle-orient-mode orient.mode\n.br\nnet orient-enable motion.spindle-orient orient.enable orient-pid.enable\n.br\nnet spindle-pos encoder.position orient.position orient-pid.feedback\n.br\nnet orient-command orient.command orient-pid.command\n.br\n\n",
          license: "GPL",
        },
        pins: [
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "enable angular output for orientation mode",
            direction: "in",
          },
          {
            key: "mode",
            name: "mode",
            type: "s32",
            doc: "0: rotate - shortest move; 1: always rotate clockwise; 2: always rotate counterclockwise",
            direction: "in",
          },
          {
            key: "position",
            name: "position",
            type: "float",
            doc: "spindle position input, unit 1 rev",
            direction: "in",
          },
          {
            key: "angle",
            name: "angle",
            type: "float",
            doc: "orient target position in degrees, 0 <= angle < 360",
            direction: "in",
          },
          {
            key: "command",
            name: "command",
            type: "float",
            doc: "target spindle position, input to PID command",
            direction: "out",
          },
          {
            key: "poserr",
            name: "poserr",
            type: "float",
            doc: "in degrees - aid for PID tuning",
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
            doc: "Update \\fBcommand\\fR based on \\fBenable\\fR, \\fBposition\\fR, \\fBmode\\fR and \\fBangle\\fR.",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            fp: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component orient "Provide a PID command input for orientation mode based on current spindle position, target angle and orient mode";\n\npin in  bit   enable      "enable angular output for orientation mode";\npin in  s32   mode        "0: rotate - shortest move; 1: always rotate clockwise; 2: always rotate counterclockwise";\npin in  float position    "spindle position input, unit 1 rev";\npin in  float angle       "orient target position in degrees, 0 <= angle < 360";\npin out float command     "target spindle position, input to PID command";\npin out float poserr      "in degrees - aid for PID tuning";\n\nvariable int   last_enable = 0;\n\noption fp yes;\n\nfunction _ "Update \\\\fBcommand\\\\fR based on \\\\fBenable\\\\fR, \\\\fBposition\\\\fR, \\\\fBmode\\\\fR and \\\\fBangle\\\\fR.";\nauthor "Michael Haberler";\n\n\ndescription """\nThis component is designed to support a spindle orientation PID loop by providing a \ncommand value, and fit with the motion spindle-orient support pins to support the M19 code.\n\nThe spindle is assumed to have stopped in an arbitrary position. The spindle\nencoder position is linked to the  \\\\fBposition\\\\fR pin.\nThe  current value of the position pin is sampled on a positive edge on the \\\\fBenable\\\\fR pin, and \n\\\\fBcommand\\\\fR is computed and set as follows: floor(number of \nfull spindle revolutions \nin the \\\\fBposition\\\\fR sampled on positive edge) \nplus \\\\fBangle\\\\fR/360 (the fractional revolution) +1/-1/0 depending on \\\\fBmode\\\\fR.\n\nThe \\\\fBmode\\\\fR pin is interpreted as follows:\n\n0: the spindle rotates in the direction with the lesser angle, \nwhich may be clockwise or counterclockwise.\n\n1: the spindle rotates always rotates clockwise to the new angle.\n\n2: the spindle rotates always rotates counterclockwise to the new angle.\n \n\n.SH HAL USAGE\n\nOn \\\\fBmotion.spindle-orient\\\\fR disconnect the spindle control and connect to the orient-pid \nloop:\n\nloadrt orient names=orient\n.br\nloadrt pid names=orient-pid\n.br\nnet orient-angle motion.spindle-orient-angle orient.angle\n.br\nnet orient-mode motion.spindle-orient-mode orient.mode\n.br\nnet orient-enable motion.spindle-orient orient.enable orient-pid.enable\n.br\nnet spindle-pos encoder.position orient.position orient-pid.feedback\n.br\nnet orient-command orient.command orient-pid.command\n.br\n\n""";\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:orient:orient",
        name: "orient",
        halComponentName: "orient",
        source: "comp",
        sourcePath: "src/hal/components/orient.comp",
        docs: {
          component:
            "Provide a PID command input for orientation mode based on current spindle position, target angle and orient mode",
          author: "Michael Haberler",
          description:
            "\nThis component is designed to support a spindle orientation PID loop by providing a \ncommand value, and fit with the motion spindle-orient support pins to support the M19 code.\n\nThe spindle is assumed to have stopped in an arbitrary position. The spindle\nencoder position is linked to the  \\\\fBposition\\\\fR pin.\nThe  current value of the position pin is sampled on a positive edge on the \\\\fBenable\\\\fR pin, and \n\\\\fBcommand\\\\fR is computed and set as follows: floor(number of \nfull spindle revolutions \nin the \\\\fBposition\\\\fR sampled on positive edge) \nplus \\\\fBangle\\\\fR/360 (the fractional revolution) +1/-1/0 depending on \\\\fBmode\\\\fR.\n\nThe \\\\fBmode\\\\fR pin is interpreted as follows:\n\n0: the spindle rotates in the direction with the lesser angle, \nwhich may be clockwise or counterclockwise.\n\n1: the spindle rotates always rotates clockwise to the new angle.\n\n2: the spindle rotates always rotates counterclockwise to the new angle.\n \n\n.SH HAL USAGE\n\nOn \\\\fBspindle.N.orient\\\\fR disconnect the spindle control and connect to the orient-pid \nloop:\n\nloadrt orient names=orient\n.br\nloadrt pid names=orient-pid\n.br\nnet orient-angle spindle.N.orient-angle orient.angle\n.br\nnet orient-mode spindle.N.orient-mode orient.mode\n.br\nnet orient-enable spindle.N.orient orient.enable orient-pid.enable\n.br\nnet spindle-in-pos orient.is-oriented spindle.N.is-oriented\n.br\nnet spindle-pos encoder.position orient.position orient-pid.feedback\n.br\nnet orient-command orient.command orient-pid.command\n.br\n",
          license: "GPL",
        },
        pins: [
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "enable angular output for orientation mode",
            direction: "in",
          },
          {
            key: "mode",
            name: "mode",
            type: "s32",
            doc: "0: rotate - shortest move; 1: always rotate clockwise; 2: always rotate counterclockwise",
            direction: "in",
          },
          {
            key: "position",
            name: "position",
            type: "float",
            doc: "spindle position input, unit 1 rev",
            direction: "in",
          },
          {
            key: "angle",
            name: "angle",
            type: "float",
            doc: "orient target position in degrees, 0 <= angle < 360",
            direction: "in",
          },
          {
            key: "command",
            name: "command",
            type: "float",
            doc: "target spindle position, input to PID command",
            direction: "out",
          },
          {
            key: "poserr",
            name: "poserr",
            type: "float",
            doc: "in degrees - aid for PID tuning",
            direction: "out",
          },
          {
            key: "is_oriented",
            name: "is-oriented",
            type: "bit",
            doc: "This pin goes high when poserr < tolerance. Use to drive spindle.N.is-oriented",
            direction: "out",
          },
          {
            key: "tolerance",
            name: "tolerance",
            type: "float",
            doc: "The tolerance in degrees for considering the align completed",
            defaultValue: "0.5",
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
            doc: "Update \\fBcommand\\fR based on \\fBenable\\fR, \\fBposition\\fR, \\fBmode\\fR and \\fBangle\\fR.",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            fp: true,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component orient "Provide a PID command input for orientation mode based on current spindle position, target angle and orient mode";\n\npin in  bit   enable      "enable angular output for orientation mode";\npin in  s32   mode        "0: rotate - shortest move; 1: always rotate clockwise; 2: always rotate counterclockwise";\npin in  float position    "spindle position input, unit 1 rev";\npin in  float angle       "orient target position in degrees, 0 <= angle < 360";\npin out float command     "target spindle position, input to PID command";\npin out float poserr      "in degrees - aid for PID tuning";\npin out bit is-oriented   "This pin goes high when poserr < tolerance. Use to drive spindle.N.is-oriented";\npin in float tolerance = 0.5  "The tolerance in degrees for considering the align completed";\n\nvariable int   last_enable = 0;\nvariable int    debounce = 0; // to prevent the in-position triggering with the spindle moving\n\noption fp yes;\n\nfunction _ "Update \\\\fBcommand\\\\fR based on \\\\fBenable\\\\fR, \\\\fBposition\\\\fR, \\\\fBmode\\\\fR and \\\\fBangle\\\\fR.";\nauthor "Michael Haberler";\n\n\ndescription """\nThis component is designed to support a spindle orientation PID loop by providing a \ncommand value, and fit with the motion spindle-orient support pins to support the M19 code.\n\nThe spindle is assumed to have stopped in an arbitrary position. The spindle\nencoder position is linked to the  \\\\fBposition\\\\fR pin.\nThe  current value of the position pin is sampled on a positive edge on the \\\\fBenable\\\\fR pin, and \n\\\\fBcommand\\\\fR is computed and set as follows: floor(number of \nfull spindle revolutions \nin the \\\\fBposition\\\\fR sampled on positive edge) \nplus \\\\fBangle\\\\fR/360 (the fractional revolution) +1/-1/0 depending on \\\\fBmode\\\\fR.\n\nThe \\\\fBmode\\\\fR pin is interpreted as follows:\n\n0: the spindle rotates in the direction with the lesser angle, \nwhich may be clockwise or counterclockwise.\n\n1: the spindle rotates always rotates clockwise to the new angle.\n\n2: the spindle rotates always rotates counterclockwise to the new angle.\n \n\n.SH HAL USAGE\n\nOn \\\\fBspindle.N.orient\\\\fR disconnect the spindle control and connect to the orient-pid \nloop:\n\nloadrt orient names=orient\n.br\nloadrt pid names=orient-pid\n.br\nnet orient-angle spindle.N.orient-angle orient.angle\n.br\nnet orient-mode spindle.N.orient-mode orient.mode\n.br\nnet orient-enable spindle.N.orient orient.enable orient-pid.enable\n.br\nnet spindle-in-pos orient.is-oriented spindle.N.is-oriented\n.br\nnet spindle-pos encoder.position orient.position orient-pid.feedback\n.br\nnet orient-command orient.command orient-pid.command\n.br\n""";\n\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:orient:orient",
        name: "orient",
        halComponentName: "orient",
        source: "comp",
        sourcePath: "src/hal/components/orient.comp",
        docs: {
          component:
            "Provide a PID command input for orientation mode based on current spindle position, target angle and orient mode",
          author: "Michael Haberler",
          description:
            "\nThis component is designed to support a spindle orientation PID loop by\nproviding a command value, and fit with the motion spindle-orient support pins\nto support the M19 code.\n\nThe spindle is assumed to have stopped in an arbitrary position. The spindle\nencoder position is linked to the *position* pin.  The current value of the\nposition pin is sampled on a positive edge on the *enable* pin, and *command*\nis computed and set as follows: +\nfloor(number of full spindle revolutions in the *position* sampled on positive\nedge) plus *angle*/360 (the fractional revolution) +1/-1/0 depending on *mode*.\n\nThe *mode* pin is interpreted as follows:\n\n* 0: the spindle rotates in the direction with the lesser angle,\nwhich may be clockwise or counterclockwise.\n* 1: the spindle rotates always rotates clockwise to the new angle.\n* 2: the spindle rotates always rotates counterclockwise to the new angle.\n\n=== HAL USAGE\n\nOn *spindle.N.orient* disconnect the spindle control and connect to the orient-pid\nloop:\n\n[source,hal]\n----\nloadrt orient names=orient\nloadrt pid names=orient-pid\nnet orient-angle spindle.N.orient-angle orient.angle\nnet orient-mode spindle.N.orient-mode orient.mode\nnet orient-enable spindle.N.orient orient.enable orient-pid.enable\nnet spindle-in-pos orient.is-oriented spindle.N.is-oriented\nnet spindle-pos encoder.position orient.position orient-pid.feedback\nnet orient-command orient.command orient-pid.command\n----\n\n",
          license: "GPL",
        },
        pins: [
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "enable angular output for orientation mode",
            direction: "in",
          },
          {
            key: "mode",
            name: "mode",
            type: "s32",
            doc: "0: rotate - shortest move; 1: always rotate clockwise; 2: always rotate counterclockwise",
            direction: "in",
          },
          {
            key: "position",
            name: "position",
            type: "float",
            doc: "spindle position input, unit 1 rev",
            direction: "in",
          },
          {
            key: "angle",
            name: "angle",
            type: "float",
            doc: "orient target position in degrees, 0 ≤ angle < 360",
            direction: "in",
          },
          {
            key: "command",
            name: "command",
            type: "float",
            doc: "target spindle position, input to PID command",
            direction: "out",
          },
          {
            key: "poserr",
            name: "poserr",
            type: "float",
            doc: "in degrees - aid for PID tuning",
            direction: "out",
          },
          {
            key: "is_oriented",
            name: "is-oriented",
            type: "bit",
            doc: "This pin goes high when poserr < tolerance. Use to drive spindle.N.is-oriented",
            direction: "out",
          },
          {
            key: "tolerance",
            name: "tolerance",
            type: "float",
            doc: "The tolerance in degrees for considering the align completed",
            defaultValue: "0.5",
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
            doc: "Update *command* based on *enable*, *position*, *mode* and *angle*.",
          },
        ],
        runtime: {
          kind: "rt",
          options: {
            fp: true,
            period: false,
          },
        },
        parseMeta: {
          parser: "nohal-comp-v1",
          warnings: [],
          rawHeader:
            'component orient "Provide a PID command input for orientation mode based on current spindle position, target angle and orient mode";\n\npin in  bit   enable      "enable angular output for orientation mode";\npin in  s32   mode        "0: rotate - shortest move; 1: always rotate clockwise; 2: always rotate counterclockwise";\npin in  float position    "spindle position input, unit 1 rev";\npin in  float angle       "orient target position in degrees, 0 ≤ angle < 360";\npin out float command     "target spindle position, input to PID command";\npin out float poserr      "in degrees - aid for PID tuning";\npin out bit is-oriented   "This pin goes high when poserr < tolerance. Use to drive spindle.N.is-oriented";\npin in float tolerance = 0.5  "The tolerance in degrees for considering the align completed";\n\nvariable int   last_enable = 0;\nvariable int    debounce = 0; // to prevent the in-position triggering with the spindle moving\n\noption fp yes;\noption period no;\n\nfunction _ "Update *command* based on *enable*, *position*, *mode* and *angle*.";\nauthor "Michael Haberler";\n\n\ndescription """\nThis component is designed to support a spindle orientation PID loop by\nproviding a command value, and fit with the motion spindle-orient support pins\nto support the M19 code.\n\nThe spindle is assumed to have stopped in an arbitrary position. The spindle\nencoder position is linked to the *position* pin.  The current value of the\nposition pin is sampled on a positive edge on the *enable* pin, and *command*\nis computed and set as follows: +\nfloor(number of full spindle revolutions in the *position* sampled on positive\nedge) plus *angle*/360 (the fractional revolution) +1/-1/0 depending on *mode*.\n\nThe *mode* pin is interpreted as follows:\n\n* 0: the spindle rotates in the direction with the lesser angle,\nwhich may be clockwise or counterclockwise.\n* 1: the spindle rotates always rotates clockwise to the new angle.\n* 2: the spindle rotates always rotates counterclockwise to the new angle.\n\n=== HAL USAGE\n\nOn *spindle.N.orient* disconnect the spindle control and connect to the orient-pid\nloop:\n\n[source,hal]\n----\nloadrt orient names=orient\nloadrt pid names=orient-pid\nnet orient-angle spindle.N.orient-angle orient.angle\nnet orient-mode spindle.N.orient-mode orient.mode\nnet orient-enable spindle.N.orient orient.enable orient-pid.enable\nnet spindle-in-pos orient.is-oriented spindle.N.is-oriented\nnet spindle-pos encoder.position orient.position orient-pid.feedback\nnet orient-command orient.command orient-pid.command\n----\n\n""";\n\nlicense "GPL";\n',
        },
      },
    },
  ],
};

export default history;
