import type { GeneratedCatalogComponentHistory } from "../../generatedTypes.ts";

const history: GeneratedCatalogComponentHistory = {
  halComponentName: "limit3",
  variants: [
    {
      fromVersion: "2.7",
      component: {
        id: "comp:limit3:limit3",
        name: "limit3",
        halComponentName: "limit3",
        source: "comp",
        sourcePath: "src/hal/components/limit3.comp",
        docs: {
          component:
            "Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.",
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
            doc: "When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv\nand maxa",
            defaultValue: "0",
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
          {
            key: "maxa",
            name: "maxa",
            type: "float",
            defaultValue: "1e20",
            direction: "in",
          },
          {
            key: "smooth_steps",
            name: "smooth-steps",
            type: "u32",
            doc: "Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.",
            defaultValue: "2",
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
            'component limit3 """Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.""";\npin in float in;\npin out float out;\npin in bit load=0\n    """When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv\nand maxa""";\npin in float min_=-1e20;\npin in float max_=1e20;\npin in float maxv=1e20;\npin in float maxa=1e20;\npin in u32 smooth_steps=2\n    """Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.""";\nvariable double in_pos_old;\nvariable double out_old;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.8",
      component: {
        id: "comp:limit3:limit3",
        name: "limit3",
        halComponentName: "limit3",
        source: "comp",
        sourcePath: "src/hal/components/limit3.comp",
        docs: {
          component:
            "Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.",
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
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "1: out follows in, 0: out returns to 0 (always per constraints)",
            defaultValue: "1",
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
            doc: "When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv\nand maxa",
            defaultValue: "0",
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
          {
            key: "maxa",
            name: "maxa",
            type: "float",
            defaultValue: "1e20",
            direction: "in",
          },
          {
            key: "smooth_steps",
            name: "smooth-steps",
            type: "u32",
            doc: "Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.",
            defaultValue: "2",
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
            'component limit3 """Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.""";\npin in float in;\npin in bit enable = 1 "1: out follows in, 0: out returns to 0 (always per constraints)";\npin out float out;\npin in bit load=0\n    """When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv\nand maxa""";\npin in float min_=-1e20;\npin in float max_=1e20;\npin in float maxv=1e20;\npin in float maxa=1e20;\npin in u32 smooth_steps=2\n    """Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.""";\nvariable double in_pos_old;\nvariable double out_old;\nfunction _;\nlicense "GPL";\n',
        },
      },
    },
    {
      fromVersion: "2.9",
      component: {
        id: "comp:limit3:limit3",
        name: "limit3",
        halComponentName: "limit3",
        source: "comp",
        sourcePath: "src/hal/components/limit3.comp",
        docs: {
          component:
            "Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "1: out follows in, 0: out returns to 0 (always per constraints)",
            defaultValue: "1",
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
            doc: "When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv\nand maxa",
            defaultValue: "0",
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
          {
            key: "maxa",
            name: "maxa",
            type: "float",
            doc: "Max Acceleration. Note that the component becomes\nunstable with maxa greater than about 1e7 in a 1kHz thread",
            defaultValue: "1e7",
            direction: "in",
          },
          {
            key: "smooth_steps",
            name: "smooth-steps",
            type: "u32",
            doc: "Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.",
            defaultValue: "2",
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
            'component limit3 """Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.""";\npin in float in;\npin in bit enable = 1 "1: out follows in, 0: out returns to 0 (always per constraints)";\npin out float out;\npin in bit load=0\n    """When TRUE, immediately set \\\\fBout\\\\fB to \\\\fBin\\\\fR, ignoring maxv\nand maxa""";\npin in float min_=-1e20;\npin in float max_=1e20;\npin in float maxv=1e20;\npin in float maxa=1e7 """Max Acceleration. Note that the component becomes\nunstable with maxa greater than about 1e7 in a 1kHz thread""";\npin in u32 smooth_steps=2\n    """Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.""";\nvariable double in_pos_old;\nvariable double out_old;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
    {
      fromVersion: "2.10",
      component: {
        id: "comp:limit3:limit3",
        name: "limit3",
        halComponentName: "limit3",
        source: "comp",
        sourcePath: "src/hal/components/limit3.comp",
        docs: {
          component:
            "Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.",
          license: "GPL",
          author: "John Kasunich",
        },
        pins: [
          {
            key: "in",
            name: "in",
            type: "float",
            direction: "in",
          },
          {
            key: "enable",
            name: "enable",
            type: "bit",
            doc: "1: out follows in, 0: out returns to 0 (always per constraints)",
            defaultValue: "1",
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
            doc: "When TRUE, immediately set *out* to *in*, ignoring maxv\nand maxa",
            defaultValue: "0",
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
          {
            key: "maxa",
            name: "maxa",
            type: "float",
            doc: "Max Acceleration. Note that the component becomes\nunstable with maxa greater than about 1e7 in a 1kHz thread",
            defaultValue: "1e7",
            direction: "in",
          },
          {
            key: "smooth_steps",
            name: "smooth-steps",
            type: "u32",
            doc: "Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.",
            defaultValue: "2",
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
            'component limit3 """Follow input signal while obeying limits\nLimit the output signal to fall between min and max, limit its slew\nrate to less than maxv per second, and limit its second derivative to\nless than maxa per second squared.  When the signal is a position,\nthis means that the position, velocity, and acceleration are limited.""";\npin in float in;\npin in bit enable = 1 "1: out follows in, 0: out returns to 0 (always per constraints)";\npin out float out;\npin in bit load=0\n    """When TRUE, immediately set *out* to *in*, ignoring maxv\nand maxa""";\npin in float min_=-1e20;\npin in float max_=1e20;\npin in float maxv=1e20;\npin in float maxa=1e7 """Max Acceleration. Note that the component becomes\nunstable with maxa greater than about 1e7 in a 1kHz thread""";\npin in u32 smooth_steps=2\n    """Smooth out acceleration this many periods before reaching input or\nmax/min limit.  Higher values avoid oscillation, but will accelerate\nslightly more slowly.""";\nvariable double in_pos_old;\nvariable double out_old;\nfunction _;\nlicense "GPL";\nauthor "John Kasunich";\n',
        },
      },
    },
  ],
};

export default history;
