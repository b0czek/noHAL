import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "gearchange",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:gearchange:gearchange",
        name: "gearchange",
        halComponentName: "gearchange",
        source: "comp",
        sourcePath: "src/hal/components/gearchange.comp",
        docs: {
          component:
            "Select from one two speed ranges\nThe output will be a value scaled for the selected gear, and clamped to\nthe min/max values for that gear.\nThe scale of gear 1 is assumed to be 1, so the output device scale\nshould be chosen accordingly.\nThe scale of gear 2 is relative to gear 1, so if gear 2 runs the spindle\n2.5 times as fast as gear 1, scale2 should be set to 2.5.",
          license: "GPL",
        },
        pins: [
          {
            key: "sel",
            name: "sel",
            type: "bit",
            doc: "Gear selection input",
            direction: "in",
          },
          {
            key: "speed_in",
            name: "speed-in",
            type: "float",
            doc: "Speed command input",
            direction: "in",
          },
          {
            key: "speed_out",
            name: "speed-out",
            type: "float",
            doc: "Speed command to DAC/PWM",
            direction: "out",
          },
          {
            key: "dir_in",
            name: "dir-in",
            type: "bit",
            doc: "Direction command input",
            direction: "in",
          },
          {
            key: "dir_out",
            name: "dir-out",
            type: "bit",
            doc: "Direction output - possibly inverted for second gear",
            direction: "out",
          },
        ],
        params: [
          {
            key: "min1",
            name: "min1",
            type: "float",
            doc: "Minimum allowed speed in gear range 1",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "max1",
            name: "max1",
            type: "float",
            doc: "Maximum allowed speed in gear range 1",
            defaultValue: "100000",
            direction: "rw",
          },
          {
            key: "min2",
            name: "min2",
            type: "float",
            doc: "Minimum allowed speed in gear range 2",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "max2",
            name: "max2",
            type: "float",
            doc: "Maximum allowed speed in gear range 2",
            defaultValue: "100000",
            direction: "rw",
          },
          {
            key: "scale2",
            name: "scale2",
            type: "float",
            doc: 'Relative scale of gear 2 vs. gear 1\nSince it is assumed that gear 2 is "high gear", \\\\fBscale2\\\\fR must be\ngreater than 1, and will be reset to 1 if set lower.',
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "reverse",
            name: "reverse",
            type: "bit",
            doc: "Set to 1 to reverse the spindle in second gear",
            defaultValue: "0",
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
            'component gearchange """Select from one two speed ranges\nThe output will be a value scaled for the selected gear, and clamped to\nthe min/max values for that gear.\nThe scale of gear 1 is assumed to be 1, so the output device scale\nshould be chosen accordingly.\nThe scale of gear 2 is relative to gear 1, so if gear 2 runs the spindle\n2.5 times as fast as gear 1, scale2 should be set to 2.5.""";\npin in bit sel "Gear selection input";\npin in float speed_in "Speed command input";\npin out float speed_out "Speed command to DAC/PWM";\npin in bit dir_in "Direction command input";\npin out bit dir_out "Direction output - possibly inverted for second gear";\nparam rw float min1 = 0 "Minimum allowed speed in gear range 1";\nparam rw float max1 = 100000 "Maximum allowed speed in gear range 1";\nparam rw float min2 = 0 "Minimum allowed speed in gear range 2";\nparam rw float max2 = 100000 "Maximum allowed speed in gear range 2";\nparam rw float scale2 = 1.0 """Relative scale of gear 2 vs. gear 1\nSince it is assumed that gear 2 is "high gear", \\\\fBscale2\\\\fR must be\ngreater than 1, and will be reset to 1 if set lower.""";\nparam rw bit reverse = 0 "Set to 1 to reverse the spindle in second gear";\n\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:gearchange:gearchange",
        name: "gearchange",
        halComponentName: "gearchange",
        source: "comp",
        sourcePath: "src/hal/components/gearchange.comp",
        docs: {
          component:
            "Select from one two speed ranges\nThe output will be a value scaled for the selected gear, and clamped to\nthe min/max values for that gear.\nThe scale of gear 1 is assumed to be 1, so the output device scale\nshould be chosen accordingly.\nThe scale of gear 2 is relative to gear 1, so if gear 2 runs the spindle\n2.5 times as fast as gear 1, scale2 should be set to 2.5.",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "sel",
            name: "sel",
            type: "bit",
            doc: "Gear selection input",
            direction: "in",
          },
          {
            key: "speed_in",
            name: "speed-in",
            type: "float",
            doc: "Speed command input",
            direction: "in",
          },
          {
            key: "speed_out",
            name: "speed-out",
            type: "float",
            doc: "Speed command to DAC/PWM",
            direction: "out",
          },
          {
            key: "dir_in",
            name: "dir-in",
            type: "bit",
            doc: "Direction command input",
            direction: "in",
          },
          {
            key: "dir_out",
            name: "dir-out",
            type: "bit",
            doc: "Direction output - possibly inverted for second gear",
            direction: "out",
          },
        ],
        params: [
          {
            key: "min1",
            name: "min1",
            type: "float",
            doc: "Minimum allowed speed in gear range 1",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "max1",
            name: "max1",
            type: "float",
            doc: "Maximum allowed speed in gear range 1",
            defaultValue: "100000",
            direction: "rw",
          },
          {
            key: "min2",
            name: "min2",
            type: "float",
            doc: "Minimum allowed speed in gear range 2",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "max2",
            name: "max2",
            type: "float",
            doc: "Maximum allowed speed in gear range 2",
            defaultValue: "100000",
            direction: "rw",
          },
          {
            key: "scale2",
            name: "scale2",
            type: "float",
            doc: 'Relative scale of gear 2 vs. gear 1.\nSince it is assumed that gear 2 is "high gear", \\\\fBscale2\\\\fR must be\ngreater than 1, and will be reset to 1 if set lower.',
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "reverse",
            name: "reverse",
            type: "bit",
            doc: "Set to 1 to reverse the spindle in second gear.",
            defaultValue: "0",
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
            'component gearchange """Select from one two speed ranges\nThe output will be a value scaled for the selected gear, and clamped to\nthe min/max values for that gear.\nThe scale of gear 1 is assumed to be 1, so the output device scale\nshould be chosen accordingly.\nThe scale of gear 2 is relative to gear 1, so if gear 2 runs the spindle\n2.5 times as fast as gear 1, scale2 should be set to 2.5.""";\npin in bit sel "Gear selection input";\npin in float speed_in "Speed command input";\npin out float speed_out "Speed command to DAC/PWM";\npin in bit dir_in "Direction command input";\npin out bit dir_out "Direction output - possibly inverted for second gear";\nparam rw float min1 = 0 "Minimum allowed speed in gear range 1";\nparam rw float max1 = 100000 "Maximum allowed speed in gear range 1";\nparam rw float min2 = 0 "Minimum allowed speed in gear range 2";\nparam rw float max2 = 100000 "Maximum allowed speed in gear range 2";\nparam rw float scale2 = 1.0 """Relative scale of gear 2 vs. gear 1.\nSince it is assumed that gear 2 is "high gear", \\\\fBscale2\\\\fR must be\ngreater than 1, and will be reset to 1 if set lower.""";\nparam rw bit reverse = 0 "Set to 1 to reverse the spindle in second gear.";\n\nfunction _;\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:gearchange:gearchange",
        name: "gearchange",
        halComponentName: "gearchange",
        source: "comp",
        sourcePath: "src/hal/components/gearchange.comp",
        docs: {
          component:
            "Select from one two speed ranges\nThe output will be a value scaled for the selected gear, and clamped to\nthe min/max values for that gear.\nThe scale of gear 1 is assumed to be 1, so the output device scale\nshould be chosen accordingly.\nThe scale of gear 2 is relative to gear 1, so if gear 2 runs the spindle\n2.5 times as fast as gear 1, scale2 should be set to 2.5.",
          license: "GPL",
          author: "Stephen Wille Padnos",
        },
        pins: [
          {
            key: "sel",
            name: "sel",
            type: "bit",
            doc: "Gear selection input",
            direction: "in",
          },
          {
            key: "speed_in",
            name: "speed-in",
            type: "float",
            doc: "Speed command input",
            direction: "in",
          },
          {
            key: "speed_out",
            name: "speed-out",
            type: "float",
            doc: "Speed command to DAC/PWM",
            direction: "out",
          },
          {
            key: "dir_in",
            name: "dir-in",
            type: "bit",
            doc: "Direction command input",
            direction: "in",
          },
          {
            key: "dir_out",
            name: "dir-out",
            type: "bit",
            doc: "Direction output - possibly inverted for second gear",
            direction: "out",
          },
        ],
        params: [
          {
            key: "min1",
            name: "min1",
            type: "float",
            doc: "Minimum allowed speed in gear range 1",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "max1",
            name: "max1",
            type: "float",
            doc: "Maximum allowed speed in gear range 1",
            defaultValue: "100000",
            direction: "rw",
          },
          {
            key: "min2",
            name: "min2",
            type: "float",
            doc: "Minimum allowed speed in gear range 2",
            defaultValue: "0",
            direction: "rw",
          },
          {
            key: "max2",
            name: "max2",
            type: "float",
            doc: "Maximum allowed speed in gear range 2",
            defaultValue: "100000",
            direction: "rw",
          },
          {
            key: "scale2",
            name: "scale2",
            type: "float",
            doc: 'Relative scale of gear 2 vs. gear 1.\nSince it is assumed that gear 2 is "high gear", *scale2* must be\ngreater than 1, and will be reset to 1 if set lower.',
            defaultValue: "1.0",
            direction: "rw",
          },
          {
            key: "reverse",
            name: "reverse",
            type: "bit",
            doc: "Set to 1 to reverse the spindle in second gear.",
            defaultValue: "0",
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
            'component gearchange """Select from one two speed ranges\nThe output will be a value scaled for the selected gear, and clamped to\nthe min/max values for that gear.\nThe scale of gear 1 is assumed to be 1, so the output device scale\nshould be chosen accordingly.\nThe scale of gear 2 is relative to gear 1, so if gear 2 runs the spindle\n2.5 times as fast as gear 1, scale2 should be set to 2.5.""";\npin in bit sel "Gear selection input";\npin in float speed_in "Speed command input";\npin out float speed_out "Speed command to DAC/PWM";\npin in bit dir_in "Direction command input";\npin out bit dir_out "Direction output - possibly inverted for second gear";\nparam rw float min1 = 0 "Minimum allowed speed in gear range 1";\nparam rw float max1 = 100000 "Maximum allowed speed in gear range 1";\nparam rw float min2 = 0 "Minimum allowed speed in gear range 2";\nparam rw float max2 = 100000 "Maximum allowed speed in gear range 2";\nparam rw float scale2 = 1.0 """Relative scale of gear 2 vs. gear 1.\nSince it is assumed that gear 2 is "high gear", *scale2* must be\ngreater than 1, and will be reset to 1 if set lower.""";\nparam rw bit reverse = 0 "Set to 1 to reverse the spindle in second gear.";\n\noption period no;\nfunction _;\nlicense "GPL";\nauthor "Stephen Wille Padnos";\n',
        },
      },
    },
  ],
};

export default history;
